import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { construirRecebiveis, isoDate, type BandeiraCartao } from '@/lib/recebiveis';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import type { FormaPagamento, ParcelaFinanceira, ParcelaStatus } from '@/types/database';

const KEY = ['fluxo-caixa'];
const STATUS_EM_ABERTO: ParcelaStatus[] = ['ABERTA', 'PARCIAL', 'ATRASADA'];

export interface LancamentoAgenda {
  id: string;
  tipo: 'RECEBER' | 'PAGAR';
  descricao: string;
  data_vencimento: string;
  valor: number;
  valor_pago: number;
  saldo: number;
  status: ParcelaStatus;
  forma_pagamento: FormaPagamento | null;
  numero_parcela: number | null;
  total_parcelas: number | null;
  cliente_nome: string | null;
}

export interface DiaAgenda {
  data: string;
  receber: number;
  pagar: number;
  saldo: number;
  lancamentos: LancamentoAgenda[];
}

/**
 * Parcelas com vencimento no intervalo, agrupadas por dia — alimenta o
 * calendário de entradas/saídas previstas.
 */
export function useAgendaFinanceira(inicio: string, fim: string) {
  return useQuery({
    queryKey: [...KEY, 'agenda', inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas_financeiras')
        .select('*, cliente:clientes(id,nome)')
        .gte('data_vencimento', inicio)
        .lte('data_vencimento', fim)
        .neq('status', 'CANCELADA')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;

      const linhas = (data ?? []) as (ParcelaFinanceira & { cliente: { id: string; nome: string } | null })[];
      const porDia = new Map<string, DiaAgenda>();

      for (const p of linhas) {
        const saldo = Math.max(Number(p.valor) - Number(p.valor_pago ?? 0), 0);
        const dia = porDia.get(p.data_vencimento) ?? {
          data: p.data_vencimento,
          receber: 0,
          pagar: 0,
          saldo: 0,
          lancamentos: [],
        };
        if (p.tipo === 'RECEBER') dia.receber += saldo;
        else dia.pagar += saldo;
        dia.saldo = dia.receber - dia.pagar;
        dia.lancamentos.push({
          id: p.id,
          tipo: p.tipo,
          descricao: p.descricao,
          data_vencimento: p.data_vencimento,
          valor: Number(p.valor),
          valor_pago: Number(p.valor_pago ?? 0),
          saldo,
          status: p.status,
          forma_pagamento: p.forma_pagamento ?? null,
          numero_parcela: p.numero_parcela ?? null,
          total_parcelas: p.total_parcelas ?? null,
          cliente_nome: p.cliente?.nome ?? null,
        });
        porDia.set(p.data_vencimento, dia);
      }

      return Array.from(porDia.values()).sort((a, b) => a.data.localeCompare(b.data));
    },
  });
}

export interface RecebivelPorForma {
  forma: FormaPagamento | 'OUTROS';
  valor: number;
}

export interface MesProjecao {
  /** yyyy-mm */
  mes: string;
  /** yyyy-mm-01 — usado para navegar o calendário até o mês */
  inicio: string;
  label: string;
  receber: number;
  pagar: number;
  liquido: number;
  acumulado: number;
  vencido: boolean;
  porForma: RecebivelPorForma[];
}

/**
 * Recebíveis e contas a pagar agrupados por mês, a partir do mês corrente.
 * Diferente do calendário (um mês por vez), aqui o horizonte inteiro fica
 * visível — é onde as parcelas de cartão em 30/60/90 dias aparecem.
 */
export function useProjecaoRecebiveis(meses = 12) {
  return useQuery({
    queryKey: [...KEY, 'projecao', meses],
    queryFn: async (): Promise<MesProjecao[]> => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + meses, 0);

      const { data, error } = await supabase
        .from('parcelas_financeiras')
        .select('tipo, valor, valor_pago, status, data_vencimento, forma_pagamento')
        .in('status', STATUS_EM_ABERTO)
        .gte('data_vencimento', isoDate(inicio))
        .lte('data_vencimento', isoDate(fim))
        .limit(5000);
      if (error) throw error;

      const linhas = data ?? [];
      const hojeIso = isoDate(hoje);
      const saldoDe = (p: { valor: number; valor_pago: number }) =>
        Math.max(Number(p.valor) - Number(p.valor_pago ?? 0), 0);

      const buckets = new Map<string, MesProjecao>();
      for (let i = 0; i < meses; i += 1) {
        const ref = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
        const chave = isoDate(ref).slice(0, 7);
        buckets.set(chave, {
          mes: chave,
          inicio: isoDate(ref),
          label: ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          receber: 0,
          pagar: 0,
          liquido: 0,
          acumulado: 0,
          vencido: false,
          porForma: [],
        });
      }

      const formasPorMes = new Map<string, Map<string, number>>();

      for (const p of linhas) {
        const chave = p.data_vencimento.slice(0, 7);
        const bucket = buckets.get(chave);
        if (!bucket) continue;
        const saldo = saldoDe(p);
        if (p.tipo === 'RECEBER') {
          bucket.receber += saldo;
          if (p.data_vencimento < hojeIso) bucket.vencido = true;
          const forma = (p.forma_pagamento ?? 'OUTROS') as string;
          const mapa = formasPorMes.get(chave) ?? new Map<string, number>();
          mapa.set(forma, (mapa.get(forma) ?? 0) + saldo);
          formasPorMes.set(chave, mapa);
        } else {
          bucket.pagar += saldo;
        }
      }

      let acumulado = 0;
      const resultado: MesProjecao[] = [];
      for (const bucket of buckets.values()) {
        bucket.liquido = bucket.receber - bucket.pagar;
        acumulado += bucket.liquido;
        bucket.acumulado = acumulado;
        bucket.porForma = Array.from(formasPorMes.get(bucket.mes)?.entries() ?? [])
          .map(([forma, valor]) => ({ forma: forma as FormaPagamento | 'OUTROS', valor }))
          .sort((a, b) => b.valor - a.valor);
        resultado.push(bucket);
      }
      return resultado;
    },
  });
}

export interface ProjecaoMes {
  /** yyyy-mm */
  mes: string;
  label: string;
  receber: number;
  pagar: number;
  liquido: number;
  acumulado: number;
}

export interface ResumoFinanceiro {
  // Vendas realizadas no mês
  faturamentoMes: number;
  vendasCount: number;
  ticketMedio: number;
  // Dinheiro que efetivamente entrou no mês
  recebidoMes: number;
  // Recebíveis futuros (todo o horizonte)
  totalAReceber: number;
  totalAReceberVencido: number;
  // Faturamento projetado do mês = recebido + recebíveis que vencem até o fim do mês
  faturamentoProjetadoMes: number;
  // Custos e resultado
  cmvMes: number;
  /** Retido pelas adquirentes nas vendas do mês. */
  taxasCartaoMes: number;
  despesasPagasMes: number;
  lucroBrutoMes: number;
  lucroLiquidoMes: number;
  // Contas a pagar
  totalAPagar: number;
  // Saldo/projeção
  saldoProjetado30: number;
  saldoProjetado90: number;
  entradasHoje: number;
  entradasSemana: number;
  entradasMes: number;
  projecaoMeses: ProjecaoMes[];
}

/**
 * KPIs financeiros derivados dos dados reais de vendas e parcelas.
 * Nada aqui é estimado: tudo vem de vendas concluídas e recebíveis emitidos.
 */
export function useResumoFinanceiro(mesesProjecao = 6) {
  return useQuery({
    queryKey: [...KEY, 'resumo', mesesProjecao],
    queryFn: async (): Promise<ResumoFinanceiro> => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const inicioMesIso = isoDate(inicioMes);
      const fimMesIso = isoDate(fimMes);
      const hojeIso = isoDate(hoje);

      const [vendasRes, parcelasRes, itensRes] = await Promise.all([
        supabase
          .from('vendas')
          .select('id, total_liquido')
          .eq('status', 'CONCLUIDA')
          .gte('data_hora', inicioMes.toISOString())
          .lte('data_hora', `${fimMesIso}T23:59:59`),
        // Todas as parcelas relevantes: em aberto (qualquer data) + baixadas no mês
        supabase
          .from('parcelas_financeiras')
          .select('id, tipo, origem_id, origem_tipo, valor, valor_bruto, taxa_valor, valor_pago, status, data_vencimento, data_pagamento')
          .neq('status', 'CANCELADA')
          .limit(5000),
        supabase
          .from('itens_venda')
          .select('venda_id, quantidade, produto:produtos(custo_aquisicao)')
          .limit(5000),
      ]);
      if (vendasRes.error) throw vendasRes.error;
      if (parcelasRes.error) throw parcelasRes.error;
      if (itensRes.error) throw itensRes.error;

      const vendasMes = vendasRes.data ?? [];
      const idsVendasMes = new Set(vendasMes.map((v) => v.id));
      const faturamentoMes = vendasMes.reduce((s, v) => s + Number(v.total_liquido ?? 0), 0);
      const vendasCount = vendasMes.length;

      const parcelas = parcelasRes.data ?? [];
      const receber = parcelas.filter((p) => p.tipo === 'RECEBER');
      const pagar = parcelas.filter((p) => p.tipo === 'PAGAR');
      const saldoDe = (p: { valor: number; valor_pago: number }) =>
        Math.max(Number(p.valor) - Number(p.valor_pago ?? 0), 0);
      const emAberto = (p: { status: string }) => STATUS_EM_ABERTO.includes(p.status as ParcelaStatus);

      // Parte da venda recebida no ato = total da venda menos o que virou recebível.
      // Usa o BRUTO: a taxa da adquirente não fica no caixa da loja, então
      // contá-la como à vista inflaria o "já recebido".
      const recebiveisDasVendasDoMes = receber
        .filter((p) => p.origem_tipo === 'VENDA' && p.origem_id && idsVendasMes.has(p.origem_id))
        .reduce((s, p) => s + Number(p.valor_bruto ?? p.valor), 0);
      const aVistaMes = Math.max(faturamentoMes - recebiveisDasVendasDoMes, 0);

      // Quanto a adquirente retém das vendas do mês.
      const taxasDoMes = receber
        .filter((p) => p.origem_tipo === 'VENDA' && p.origem_id && idsVendasMes.has(p.origem_id))
        .reduce((s, p) => s + Number(p.taxa_valor ?? 0), 0);

      // Parcelas efetivamente baixadas dentro do mês corrente.
      const noMes = (data: string | null) => !!data && data >= inicioMesIso && data <= fimMesIso;
      const parcelasRecebidasMes = receber
        .filter((p) => noMes(p.data_pagamento))
        .reduce((s, p) => s + Number(p.valor_pago ?? 0), 0);
      const recebidoMes = aVistaMes + parcelasRecebidasMes;

      const aReceberAbertas = receber.filter(emAberto);
      const totalAReceber = aReceberAbertas.reduce((s, p) => s + saldoDe(p), 0);
      const totalAReceberVencido = aReceberAbertas
        .filter((p) => p.data_vencimento < hojeIso)
        .reduce((s, p) => s + saldoDe(p), 0);

      // Projetado do mês: o que já entrou + o que ainda vence dentro do mês.
      const aReceberAteFimDoMes = aReceberAbertas
        .filter((p) => p.data_vencimento >= hojeIso && p.data_vencimento <= fimMesIso)
        .reduce((s, p) => s + saldoDe(p), 0);
      const faturamentoProjetadoMes = recebidoMes + aReceberAteFimDoMes;

      // CMV do mês pelos itens das vendas do mês.
      const cmvMes = (itensRes.data ?? [])
        .filter((i) => idsVendasMes.has(i.venda_id))
        .reduce((s, i) => {
          const prod = Array.isArray(i.produto) ? i.produto[0] : i.produto;
          return s + Number(i.quantidade) * Number(prod?.custo_aquisicao ?? 0);
        }, 0);

      const despesasPagasMes = pagar
        .filter((p) => noMes(p.data_pagamento))
        .reduce((s, p) => s + Number(p.valor_pago ?? 0), 0);

      const lucroBrutoMes = faturamentoMes - cmvMes;
      // A taxa da adquirente é custo real da venda — entra no lucro líquido.
      const lucroLiquidoMes = lucroBrutoMes - despesasPagasMes - taxasDoMes;

      const aPagarAbertas = pagar.filter(emAberto);
      const totalAPagar = aPagarAbertas.reduce((s, p) => s + saldoDe(p), 0);

      // Janelas de projeção.
      const janela = (dias: number) => {
        const limite = isoDate(new Date(hoje.getTime() + dias * 86400000));
        const entra = aReceberAbertas
          .filter((p) => p.data_vencimento <= limite)
          .reduce((s, p) => s + saldoDe(p), 0);
        const sai = aPagarAbertas
          .filter((p) => p.data_vencimento <= limite)
          .reduce((s, p) => s + saldoDe(p), 0);
        return entra - sai;
      };

      const entradasHoje = aReceberAbertas
        .filter((p) => p.data_vencimento === hojeIso)
        .reduce((s, p) => s + saldoDe(p), 0);
      const fimSemana = isoDate(new Date(hoje.getTime() + 7 * 86400000));
      const entradasSemana = aReceberAbertas
        .filter((p) => p.data_vencimento >= hojeIso && p.data_vencimento <= fimSemana)
        .reduce((s, p) => s + saldoDe(p), 0);

      // Projeção mês a mês (inclui o mês corrente).
      const projecaoMeses: ProjecaoMes[] = [];
      let acumulado = 0;
      for (let i = 0; i < mesesProjecao; i += 1) {
        const ref = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + i, 1);
        const fimRef = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        const de = isoDate(ref);
        const ate = isoDate(fimRef);
        const r = aReceberAbertas
          .filter((p) => p.data_vencimento >= de && p.data_vencimento <= ate)
          .reduce((s, p) => s + saldoDe(p), 0);
        const g = aPagarAbertas
          .filter((p) => p.data_vencimento >= de && p.data_vencimento <= ate)
          .reduce((s, p) => s + saldoDe(p), 0);
        acumulado += r - g;
        projecaoMeses.push({
          mes: de.slice(0, 7),
          label: ref.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          receber: r,
          pagar: g,
          liquido: r - g,
          acumulado,
        });
      }

      return {
        faturamentoMes,
        vendasCount,
        ticketMedio: vendasCount > 0 ? faturamentoMes / vendasCount : 0,
        recebidoMes,
        totalAReceber,
        totalAReceberVencido,
        faturamentoProjetadoMes,
        cmvMes,
        taxasCartaoMes: taxasDoMes,
        despesasPagasMes,
        lucroBrutoMes,
        lucroLiquidoMes,
        totalAPagar,
        saldoProjetado30: janela(30),
        saldoProjetado90: janela(90),
        entradasHoje,
        entradasSemana,
        entradasMes: aReceberAteFimDoMes,
        projecaoMeses,
      };
    },
  });
}

export interface VendaSemRecebivel {
  id: string;
  numero: number;
  data_hora: string;
  cliente_id: string | null;
  total_liquido: number;
  entrada_valor: number;
  forma: FormaPagamento;
  parcelas: number;
  bandeira: BandeiraCartao | null;
}

/**
 * Vendas a prazo já concluídas que não possuem nenhuma parcela a receber.
 *
 * Vendas feitas antes da geração automática de recebíveis existir (quando só
 * FIADO gerava parcelas) ficaram sem lançamento financeiro — por isso não
 * aparecem no calendário nem na projeção. Este levantamento alimenta o
 * backfill que corrige isso.
 */
export function useVendasSemRecebiveis() {
  return useQuery({
    queryKey: [...KEY, 'sem-recebiveis'],
    queryFn: async (): Promise<VendaSemRecebivel[]> => {
      const { data: pagamentos, error: e1 } = await supabase
        .from('pagamentos_venda')
        .select('venda_id, forma, valor, parcelas, bandeira, venda:vendas(id,numero,data_hora,cliente_id,total_liquido,entrada_valor,status)')
        .in('forma', ['CARTAO_CREDITO', 'CREDIARIO', 'FIADO'])
        .limit(2000);
      if (e1) throw e1;

      const candidatas = (pagamentos ?? [])
        .map((p) => {
          const v = Array.isArray(p.venda) ? p.venda[0] : p.venda;
          return { pagamento: p, venda: v };
        })
        .filter((r) => r.venda && r.venda.status === 'CONCLUIDA');
      if (candidatas.length === 0) return [];

      // Quais dessas vendas já têm parcela lançada?
      const ids = Array.from(new Set(candidatas.map((c) => c.venda.id)));
      const { data: existentes, error: e2 } = await supabase
        .from('parcelas_financeiras')
        .select('origem_id')
        .eq('origem_tipo', 'VENDA')
        .in('origem_id', ids);
      if (e2) throw e2;
      const comParcela = new Set((existentes ?? []).map((p) => p.origem_id));

      return candidatas
        .filter((c) => !comParcela.has(c.venda.id))
        .map((c) => ({
          id: c.venda.id,
          numero: Number(c.venda.numero),
          data_hora: c.venda.data_hora,
          cliente_id: c.venda.cliente_id ?? null,
          total_liquido: Number(c.venda.total_liquido ?? 0),
          entrada_valor: Number(c.venda.entrada_valor ?? 0),
          forma: c.pagamento.forma as FormaPagamento,
          parcelas: Number(c.pagamento.parcelas ?? 1),
          bandeira: (c.pagamento.bandeira as BandeiraCartao | null) ?? null,
        }))
        .sort((a, b) => a.data_hora.localeCompare(b.data_hora));
    },
  });
}

/**
 * Gera retroativamente as parcelas das vendas listadas, usando a data original
 * da venda como base — assim os vencimentos caem onde teriam caído na época.
 */
export function useGerarRecebiveisRetroativos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vendas: VendaSemRecebivel[]) => {
      const taxas = carregarConfiguracoes().recebiveis;
      const linhas = vendas.flatMap((v) =>
        construirRecebiveis({
          vendaId: v.id,
          numeroVenda: v.numero,
          clienteId: v.cliente_id,
          taxas,
          // Vencimentos contados a partir da data real da venda.
          base: new Date(v.data_hora),
          pagamentos: [{
            forma: v.forma,
            valor: v.total_liquido,
            parcelas: v.parcelas,
            bandeira: v.bandeira ?? undefined,
            entrada: v.entrada_valor > 0 ? v.entrada_valor : undefined,
          }],
        }),
      );
      if (linhas.length === 0) return { vendas: 0, parcelas: 0 };

      const { error } = await supabase.from('parcelas_financeiras').insert(linhas);
      if (error) throw error;
      return { vendas: vendas.length, parcelas: linhas.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['vendas'] });
    },
  });
}

/** Parcelas geradas por uma venda — usado no detalhe da venda e no carnê. */
export function useParcelasDaVenda(vendaId: string | null) {
  return useQuery({
    queryKey: [...KEY, 'venda', vendaId],
    enabled: !!vendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas_financeiras')
        .select('*')
        .eq('origem_tipo', 'VENDA')
        .eq('origem_id', vendaId!)
        .order('numero_parcela', { ascending: true });
      if (error) throw error;
      return data as ParcelaFinanceira[];
    },
  });
}
