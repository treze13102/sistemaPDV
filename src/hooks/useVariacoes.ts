import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { VariacaoProduto } from '@/types/database';

const KEY = ['variacoes'];

export function useVariacoes(produtoId: string | null) {
  return useQuery({
    queryKey: [...KEY, produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variacoes_produto')
        .select('*')
        .eq('produto_id', produtoId!)
        .order('nome');
      if (error) throw error;
      return data as VariacaoProduto[];
    },
  });
}

export function useUpsertVariacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: Partial<VariacaoProduto> & { produto_id: string; nome: string }) => {
      if (v.id) {
        const { error } = await supabase.from('variacoes_produto').update(v).eq('id', v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('variacoes_produto').insert(v);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: [...KEY, vars.produto_id] }),
  });
}

export function useDeleteVariacao(produtoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('variacoes_produto').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, produtoId] }),
  });
}
