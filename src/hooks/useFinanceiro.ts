import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ParcelaFinanceira, ParcelaStatus, ParcelaTipo } from '@/types/database';

const KEY = ['parcelas'];

export interface FiltroParcelas {
  tipo?: ParcelaTipo;
  status?: ParcelaStatus;
  dataInicio?: string;
  dataFim?: string;
}

export function useParcelas(filtro: FiltroParcelas = {}) {
  return useQuery({
    queryKey: [...KEY, filtro],
    queryFn: async () => {
      let q = supabase
        .from('parcelas_financeiras')
        .select('*, cliente:clientes(id,nome), fornecedor:fornecedores(id,razao_social)')
        .order('data_vencimento', { ascending: true })
        .limit(500);
      if (filtro.tipo) q = q.eq('tipo', filtro.tipo);
      if (filtro.status) q = q.eq('status', filtro.status);
      if (filtro.dataInicio) q = q.gte('data_vencimento', filtro.dataInicio);
      if (filtro.dataFim) q = q.lte('data_vencimento', filtro.dataFim);
      const { data, error } = await q;
      if (error) throw error;
      return data as (ParcelaFinanceira & {
        cliente: { id: string; nome: string } | null;
        fornecedor: { id: string; razao_social: string } | null;
      })[];
    },
  });
}

export function useUpsertParcela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<ParcelaFinanceira> & { descricao: string; valor: number; tipo: ParcelaTipo }) => {
      if (p.id) {
        const { error } = await supabase.from('parcelas_financeiras').update(p).eq('id', p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('parcelas_financeiras').insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useBaixarParcela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valor_pago, data_pagamento, valor }: {
      id: string; valor_pago: number; data_pagamento: string; valor: number;
    }) => {
      const status: ParcelaStatus = valor_pago >= valor ? 'PAGA' : valor_pago > 0 ? 'PARCIAL' : 'ABERTA';
      const { error } = await supabase
        .from('parcelas_financeiras')
        .update({ valor_pago, data_pagamento, status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteParcela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parcelas_financeiras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
