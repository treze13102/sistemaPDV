import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import type { LocalizacaoEstoque, MovimentoEstoque, MovimentoTipo, Produto } from '@/types/database';

const KEY_SALDO = ['estoque', 'saldo'];
const KEY_MOV = ['estoque', 'movimentos'];

export interface SaldoLinha {
  produto_id: string;
  variacao_id: string | null;
  localizacao: LocalizacaoEstoque;
  saldo: number;
  produto: Pick<Produto, 'id' | 'nome' | 'sku' | 'estoque_minimo' | 'ponto_reposicao' | 'status' | 'imagem_url' | 'custo_aquisicao' | 'preco_venda_padrao'> & {
    categoria: { nome: string } | null;
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

      const mapSaldo = new Map<string, SaldoLinha>();
      for (const raw of prods ?? []) {
        // PostgREST retorna categoria como array (to-one) — normaliza p/ objeto
        const cat = Array.isArray(raw.categoria) ? raw.categoria[0] ?? null : raw.categoria ?? null;
        const p = { ...raw, categoria: cat } as unknown as SaldoLinha['produto'];
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
    },
  });
}
