import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import type { LocalizacaoEstoque, MovimentoEstoque, MovimentoTipo, Produto } from '@/types/database';

const KEY_SALDO = ['estoque', 'saldo'];
const KEY_MOV = ['estoque', 'movimentos'];
const KEY_VALIDADE = ['estoque', 'proximos_validade'];
const DIAS_ALERTA_VALIDADE = 30;

export interface SaldoLinha {
  produto_id: string;
  variacao_id: string | null;
  localizacao: LocalizacaoEstoque;
  saldo: number;
  produto: Pick<Produto, 'id' | 'nome' | 'sku' | 'estoque_minimo' | 'ponto_reposicao' | 'status' | 'imagem_url' | 'custo_aquisicao' | 'preco_venda_padrao'> & {
    categoria: { nome: string } | null;
    custo_medio_compra: number;
  };
}

export function useEstoqueSaldo() {
  return useQuery({
    queryKey: KEY_SALDO,
    queryFn: async () => {
      // join saldo + produto
      const { data: prods, error: e1 } = await supabase
        .from('produtos')
        .select('id, nome, sku, estoque_minimo, ponto_reposicao, status, imagem_url, custo_aquisicao, preco_venda_padrao, categoria:categorias(nome)')
        .order('nome');
      if (e1) throw e1;

      const { data: saldos, error: e2 } = await supabase.from('v_estoque_saldo').select('*');
      if (e2) throw e2;

      const { data: compras, error: e3 } = await supabase
        .from('movimentos_estoque')
        .select('produto_id, quantidade, custo_unitario')
        .eq('tipo', 'ENTRADA_COMPRA')
        .gt('quantidade', 0)
        .not('custo_unitario', 'is', null);
      if (e3) throw e3;

      const custos = new Map<string, { qtd: number; total: number }>();
      for (const c of compras ?? []) {
        const qtd = Number(c.quantidade ?? 0);
        const custo = Number(c.custo_unitario ?? 0);
        if (qtd <= 0 || custo <= 0) continue;
        const atual = custos.get(c.produto_id) ?? { qtd: 0, total: 0 };
        atual.qtd += qtd;
        atual.total += qtd * custo;
        custos.set(c.produto_id, atual);
      }

      const mapSaldo = new Map<string, SaldoLinha>();
      for (const raw of prods ?? []) {
        // PostgREST retorna categoria como array (to-one) — normaliza p/ objeto
        const cat = Array.isArray(raw.categoria) ? raw.categoria[0] ?? null : raw.categoria ?? null;
        const custoCompra = custos.get(raw.id);
        const custo_medio_compra = custoCompra && custoCompra.qtd > 0
          ? +(custoCompra.total / custoCompra.qtd).toFixed(2)
          : Number(raw.custo_aquisicao ?? 0);
        const p = { ...raw, categoria: cat, custo_medio_compra } as unknown as SaldoLinha['produto'];
        const linhas = (saldos ?? []).filter((s) => s.produto_id === p.id);
        if (linhas.length === 0) {
          mapSaldo.set(`${p.id}::Loja`, {
            produto_id: p.id,
            variacao_id: null,
            localizacao: 'Loja',
            saldo: 0,
            produto: p,
          });
        } else {
          for (const l of linhas) {
            mapSaldo.set(`${p.id}::${l.localizacao}::${l.variacao_id ?? 'none'}`, {
              produto_id: p.id,
              variacao_id: l.variacao_id,
              localizacao: l.localizacao,
              saldo: Number(l.saldo),
              produto: p,
            });
          }
        }
      }
      return Array.from(mapSaldo.values()) as SaldoLinha[];
    },
  });
}

export function useMovimentosEstoque(produtoId?: string) {
  return useQuery({
    queryKey: [...KEY_MOV, produtoId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('movimentos_estoque')
        .select('*, produto:produtos(id,nome,sku)')
        .order('data_hora', { ascending: false })
        .limit(200);
      if (produtoId) q = q.eq('produto_id', produtoId);
      const { data, error } = await q;
      if (error) throw error;
      return data as (MovimentoEstoque & { produto: { id: string; nome: string; sku: string | null } | null })[];
    },
  });
}

export interface CriarMovimentoInput {
  produto_id: string;
  variacao_id?: string | null;
  tipo: MovimentoTipo;
  quantidade: number;
  localizacao: LocalizacaoEstoque;
  custo_unitario?: number | null;
  data_validade?: string | null;
  observacao?: string | null;
}

export function useCriarMovimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CriarMovimentoInput) => {
      const usuarioId = await getUsuarioAtualId();
      const { error } = await supabase.from('movimentos_estoque').insert({
        ...input,
        usuario_id: usuarioId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_SALDO });
      qc.invalidateQueries({ queryKey: KEY_MOV });
      qc.invalidateQueries({ queryKey: KEY_VALIDADE });
    },
  });
}

export interface LoteValidade {
  id: string;
  produto_id: string;
  quantidade: number;
  localizacao: LocalizacaoEstoque;
  data_validade: string;
  dias_restantes: number;
  vencido: boolean;
  produto: { id: string; nome: string; sku: string | null };
}

// Lotes com validade vencida ou vencendo nos próximos DIAS_ALERTA_VALIDADE dias.
// Considera apenas entradas com saldo (quantidade > 0) de produtos ativos.
export function useLotesProximosValidade() {
  return useQuery({
    queryKey: KEY_VALIDADE,
    queryFn: async () => {
      const limite = new Date();
      limite.setDate(limite.getDate() + DIAS_ALERTA_VALIDADE);
      const limiteStr = limite.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('movimentos_estoque')
        .select('id, produto_id, quantidade, localizacao, data_validade, produto:produtos(id,nome,sku,status)')
        .not('data_validade', 'is', null)
        .gt('quantidade', 0)
        .lte('data_validade', limiteStr)
        .order('data_validade', { ascending: true });
      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      return (data ?? [])
        .map((raw) => {
          const produto = Array.isArray(raw.produto) ? raw.produto[0] : raw.produto;
          const dataValidade = new Date(`${raw.data_validade}T00:00:00`);
          const dias_restantes = Math.round((dataValidade.getTime() - hoje.getTime()) / 86400000);
          return {
            id: raw.id,
            produto_id: raw.produto_id,
            quantidade: Number(raw.quantidade),
            localizacao: raw.localizacao,
            data_validade: raw.data_validade as string,
            dias_restantes,
            vencido: dias_restantes < 0,
            produto,
          } as LoteValidade & { produto: { status: string } };
        })
        .filter((l) => l.produto?.status === 'ativo');
    },
  });
}

export function useAtualizarValidadeMovimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data_validade }: { id: string; data_validade: string | null }) => {
      const { error } = await supabase.from('movimentos_estoque').update({ data_validade }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_MOV });
      qc.invalidateQueries({ queryKey: KEY_VALIDADE });
    },
  });
}

// Divide um lote com quantidade > 1 em N movimentos de quantidade 1, cada um com
// sua própria data de validade. O movimento original é reduzido para quantidade 1
// (com a primeira data) e os demais são criados como novas linhas.
export function useDividirLoteValidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      movimento,
      datas,
    }: {
      movimento: MovimentoEstoque;
      datas: (string | null)[];
    }) => {
      const usuarioId = await getUsuarioAtualId();
      const [primeira, ...resto] = datas;

      const { error: e1 } = await supabase
        .from('movimentos_estoque')
        .update({ quantidade: 1, data_validade: primeira ?? null })
        .eq('id', movimento.id);
      if (e1) throw e1;

      if (resto.length > 0) {
        const { error: e2 } = await supabase.from('movimentos_estoque').insert(
          resto.map((data_validade) => ({
            produto_id: movimento.produto_id,
            variacao_id: movimento.variacao_id,
            tipo: movimento.tipo,
            quantidade: 1,
            localizacao: movimento.localizacao,
            custo_unitario: movimento.custo_unitario,
            data_validade: data_validade ?? null,
            observacao: movimento.observacao,
            usuario_id: usuarioId,
          })),
        );
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_SALDO });
      qc.invalidateQueries({ queryKey: KEY_MOV });
      qc.invalidateQueries({ queryKey: KEY_VALIDADE });
    },
  });
}

// Registra vários movimentos de uma vez (ex.: uma linha por unidade, cada uma
// com sua própria data de validade). Todas as linhas compartilham os demais campos.
export function useCriarMovimentos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: CriarMovimentoInput[]) => {
      const usuarioId = await getUsuarioAtualId();
      const { error } = await supabase.from('movimentos_estoque').insert(
        inputs.map((input) => ({ ...input, usuario_id: usuarioId })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY_SALDO });
      qc.invalidateQueries({ queryKey: KEY_MOV });
      qc.invalidateQueries({ queryKey: KEY_VALIDADE });
    },
  });
}
