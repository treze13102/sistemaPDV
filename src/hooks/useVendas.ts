import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import { construirRecebiveis } from '@/lib/recebiveis';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import type { ItemCarrinho, PagamentoCarrinho } from '@/hooks/usePDV';
import type { ItemVenda, LocalizacaoEstoque, Venda, VendaCanal } from '@/types/database';

const KEY = ['vendas'];

export interface VendaListagem extends Venda {
  cliente: { id: string; nome: string } | null;
}

export interface FiltroVendas {
  status?: Venda['status'];
  dataInicio?: string;
  dataFim?: string;
}

export function useVendas(filtro: FiltroVendas = {}) {
  return useQuery({
    queryKey: [...KEY, filtro],
    queryFn: async () => {
      let q = supabase
        .from('vendas')
        .select('*, cliente:clientes(id,nome)')
        .order('data_hora', { ascending: false })
        .limit(200);
      if (filtro.status) q = q.eq('status', filtro.status);
      if (filtro.dataInicio) q = q.gte('data_hora', filtro.dataInicio);
      if (filtro.dataFim) q = q.lte('data_hora', `${filtro.dataFim}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      return data as VendaListagem[];
    },
  });
}

export function useItensVenda(vendaId: string | null) {
  return useQuery({
    queryKey: [...KEY, vendaId, 'itens'],
    enabled: !!vendaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_venda')
        .select('*, produto:produtos(id,nome,sku)')
        .eq('venda_id', vendaId!);
      if (error) throw error;
      return data as (ItemVenda & { produto: { id: string; nome: string; sku: string | null } | null })[];
    },
  });
}

export interface EditarVendaInput {
  venda: Venda;
  cliente_id: string | null;
  canal: VendaCanal;
  itens: ItemCarrinho[];
  pagamentos: PagamentoCarrinho[];
  /** Desconto extra (fora dos descontos por item). */
  desconto_total: number;
  observacao?: string | null;
  localizacao_estoque: LocalizacaoEstoque;
}

/**
 * Reescreve uma venda por completo: itens, estoque, pagamentos e recebíveis.
 *
 * Em vez de lançar ajustes compensatórios, apaga os registros que a própria
 * venda gerou (identificados por origem_tipo/origem_id) e recria a partir do
 * novo conteúdo — assim o histórico continua espelhando a venda atual.
 *
 * Bloqueia a edição se algum recebível já foi baixado: mexer no total depois
 * que o dinheiro entrou desalinharia o caixa silenciosamente.
 */
export function useEditarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditarVendaInput) => {
      const { venda } = input;
      if (venda.status === 'CANCELADA') {
        throw new Error('Venda cancelada não pode ser editada');
      }
      if (input.itens.length === 0) {
        throw new Error('A venda precisa ter ao menos um item');
      }

      const usuarioId = await getUsuarioAtualId();

      // 1) Recebíveis já baixados travam a edição.
      const { data: parcelasExistentes, error: e0 } = await supabase
        .from('parcelas_financeiras')
        .select('id, status, valor_pago')
        .eq('origem_tipo', 'VENDA')
        .eq('origem_id', venda.id)
        .neq('status', 'CANCELADA');
      if (e0) throw e0;

      const temRecebimento = (parcelasExistentes ?? []).some(
        (p) => Number(p.valor_pago ?? 0) > 0 || p.status === 'PAGA' || p.status === 'PARCIAL',
      );
      if (temRecebimento) {
        throw new Error(
          'Esta venda já possui parcelas recebidas. Estorne os recebimentos no Financeiro ou cancele a venda antes de editar.',
        );
      }

      // 2) Novos totais.
      const total_bruto = input.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
      const desconto_itens = input.itens.reduce((s, i) => s + i.desconto, 0);
      const desconto_total = desconto_itens + input.desconto_total;
      const total_liquido = total_bruto - desconto_total;
      const entrada_valor = input.pagamentos.reduce((s, p) => s + (p.entrada ?? 0), 0);

      const { error: e1 } = await supabase
        .from('vendas')
        .update({
          cliente_id: input.cliente_id,
          canal: input.canal,
          total_bruto,
          desconto_total,
          total_liquido,
          forma_pagamento_principal: input.pagamentos[0]?.forma ?? null,
          entrada_valor,
          observacao: input.observacao ?? null,
        })
        .eq('id', venda.id);
      if (e1) throw e1;

      // 3) Itens: substitui o conjunto inteiro.
      const { error: e2 } = await supabase.from('itens_venda').delete().eq('venda_id', venda.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from('itens_venda').insert(
        input.itens.map((i) => ({
          venda_id: venda.id,
          produto_id: i.produto_id,
          variacao_id: i.variacao_id ?? null,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto: i.desconto,
          total: i.quantidade * i.preco_unitario - i.desconto,
        })),
      );
      if (e3) throw e3;

      if (venda.status === 'CONCLUIDA') {
        // 4) Estoque: remove as saídas antigas desta venda e regrava as novas.
        const { error: e4 } = await supabase
          .from('movimentos_estoque')
          .delete()
          .eq('origem_tipo', 'VENDA')
          .eq('origem_id', venda.id);
        if (e4) throw e4;

        const { error: e5 } = await supabase.from('movimentos_estoque').insert(
          input.itens.map((i) => ({
            produto_id: i.produto_id,
            variacao_id: i.variacao_id ?? null,
            tipo: 'SAIDA_VENDA' as const,
            quantidade: i.quantidade,
            localizacao: input.localizacao_estoque,
            usuario_id: usuarioId,
            origem_tipo: 'VENDA',
            origem_id: venda.id,
          })),
        );
        if (e5) throw e5;

        // 5) Pagamentos registrados.
        const { error: e6 } = await supabase.from('pagamentos_venda').delete().eq('venda_id', venda.id);
        if (e6) throw e6;
        if (input.pagamentos.length) {
          const { error: e7 } = await supabase.from('pagamentos_venda').insert(
            input.pagamentos.map((p) => ({
              venda_id: venda.id,
              forma: p.forma,
              valor: p.valor,
              parcelas: p.parcelas ?? 1,
              bandeira: p.bandeira ?? null,
            })),
          );
          if (e7) throw e7;
        }

        // 6) Recebíveis: descarta os em aberto e regera pelo novo pagamento.
        const { error: e8 } = await supabase
          .from('parcelas_financeiras')
          .delete()
          .eq('origem_tipo', 'VENDA')
          .eq('origem_id', venda.id)
          .in('status', ['ABERTA', 'ATRASADA']);
        if (e8) throw e8;

        const recebiveis = construirRecebiveis({
          vendaId: venda.id,
          numeroVenda: venda.numero,
          clienteId: input.cliente_id,
          pagamentos: input.pagamentos,
          taxas: carregarConfiguracoes().recebiveis,
        });
        if (recebiveis.length > 0) {
          const { error: e9 } = await supabase.from('parcelas_financeiras').insert(recebiveis);
          if (e9) throw e9;
        }
      }

      return { total_liquido };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['relatorios'] });
    },
  });
}

export function useCancelarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ venda, motivo }: { venda: Venda; motivo: string }) => {
      if (venda.status !== 'CONCLUIDA' && venda.status !== 'ORCAMENTO') {
        throw new Error('Apenas vendas concluídas ou orçamentos podem ser cancelados');
      }
      const usuarioId = await getUsuarioAtualId();

      // Buscar itens para gerar estorno
      const { data: itens, error: e1 } = await supabase
        .from('itens_venda')
        .select('*')
        .eq('venda_id', venda.id);
      if (e1) throw e1;

      // Se era CONCLUIDA, gerar movimentos inversos (AJUSTE_INVENTARIO positivo)
      if (venda.status === 'CONCLUIDA' && itens && itens.length > 0) {
        const movs = itens.map((it: ItemVenda) => ({
          produto_id: it.produto_id,
          variacao_id: it.variacao_id,
          tipo: 'AJUSTE_INVENTARIO' as const,
          quantidade: Number(it.quantidade),
          localizacao: 'Loja' as const,
          usuario_id: usuarioId,
          origem_tipo: 'CANCELAMENTO_VENDA',
          origem_id: venda.id,
          observacao: `Estorno de venda cancelada — motivo: ${motivo}`,
        }));
        const { error: e2 } = await supabase.from('movimentos_estoque').insert(movs);
        if (e2) throw e2;

        // Cancelar parcelas RECEBER abertas vinculadas
        const { error: e3 } = await supabase
          .from('parcelas_financeiras')
          .update({ status: 'CANCELADA' })
          .eq('origem_id', venda.id)
          .eq('origem_tipo', 'VENDA')
          .in('status', ['ABERTA', 'PARCIAL', 'ATRASADA']);
        if (e3) throw e3;
      }

      // Marcar venda cancelada
      const { error: e4 } = await supabase
        .from('vendas')
        .update({
          status: 'CANCELADA',
          cancelada_em: new Date().toISOString(),
          cancelada_motivo: motivo,
        })
        .eq('id', venda.id);
      if (e4) throw e4;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
