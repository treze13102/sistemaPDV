import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types/database';

const KEY = ['clientes'];

export function useClientes(search?: string) {
  return useQuery({
    queryKey: [...KEY, search ?? ''],
    queryFn: async () => {
      let q = supabase.from('clientes').select('*').order('nome');
      if (search) q = q.ilike('nome', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useUpsertCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Cliente> & { nome: string }) => {
      if (payload.id) {
        const { error } = await supabase.from('clientes').update(payload).eq('id', payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
