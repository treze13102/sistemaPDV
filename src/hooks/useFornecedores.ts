import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buscarTodos } from '@/lib/buscarTodos';
import type { Fornecedor } from '@/types/database';

const KEY = ['fornecedores'];

export function useFornecedores() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const data = await buscarTodos(() => supabase.from('fornecedores').select('*').order('razao_social').order('id'));
      return data as Fornecedor[];
    },
  });
}

export function useUpsertFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Fornecedor> & { razao_social: string }) => {
      if (payload.id) {
        const { error } = await supabase.from('fornecedores').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('fornecedores').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: KEY }),
      qc.invalidateQueries({ queryKey: ['produtos'] }),
      qc.invalidateQueries({ queryKey: ['parcelas'] }),
      qc.invalidateQueries({ queryKey: ['pedidos_compra'] }),
    ]),
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fornecedores').delete().eq('id', id);
      if (error?.code === '23503') throw new Error('Este fornecedor está vinculado a produtos, compras ou lançamentos e não pode ser excluído.');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
