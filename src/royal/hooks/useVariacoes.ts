import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buscarTodos } from '@/lib/buscarTodos';
import type { VariacaoProduto } from '@/types/database';

const KEY = ['variacoes'];

export function useVariacoes(produtoId: string | null) {
  return useQuery({
    queryKey: [...KEY, produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      return await buscarTodos(() => supabase.from('variacoes_produto').select('*').eq('produto_id', produtoId!).order('nome').order('id')) as VariacaoProduto[];
    },
  });
}

export function useUpsertVariacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<VariacaoProduto> & { produto_id: string; nome: string; request_id?: string }) => {
      const { request_id, ...v } = input;
      if (!v.nome.trim() || !Number.isFinite(Number(v.custo_adicional ?? 0)) || !Number.isFinite(Number(v.preco_adicional ?? 0)) || Number(v.custo_adicional ?? 0) < 0 || Number(v.preco_adicional ?? 0) < 0) throw new Error('Confira o nome e os valores adicionais.');
      if (v.id) {
        const { error } = await supabase.from('variacoes_produto').update(v).eq('id', v.id).eq('produto_id',v.produto_id).select('id').single();
        if (error) throw error;
      } else {
        const payload = {...v,id:request_id ?? crypto.randomUUID()};
        const { error } = await supabase.from('variacoes_produto').insert(payload);
        if (error?.code === '23505' && request_id) {
          const {data: existing,error: e} = await supabase.from('variacoes_produto').select('*').eq('id',request_id).single();
          if (e || !Object.entries(payload).every(([key,value]) => value == null ? existing[key] == null : typeof value === 'number' ? Number(existing[key]) === value : existing[key] === value)) throw new Error('Já existe uma variação com estes dados ou o cadastro mudou. Confira a lista antes de repetir.');
        } else if (error) throw error;
      }
    },
    onSuccess: () => Promise.all([KEY,['estoque'],['loja'],['relatorios']].map(queryKey=>qc.invalidateQueries({queryKey}))),
  });
}

export function useDeleteVariacao(_produtoId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('variacoes_produto').delete().eq('id', id);
      if (error?.code === '23503') throw new Error('Esta variação possui vínculos com estoque, compras ou vendas e não pode ser excluída.');
      if (error) throw error;
    },
    onSuccess: () => Promise.all([KEY,['estoque'],['loja'],['relatorios']].map(queryKey=>qc.invalidateQueries({queryKey}))),
  });
}
