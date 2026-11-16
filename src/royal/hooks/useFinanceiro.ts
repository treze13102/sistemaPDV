import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ParcelaFinanceira, ParcelaStatus, ParcelaTipo } from '@/types/database';
import { isoDate } from '@/lib/recebiveis';

const KEY = ['parcelas'];

export interface FiltroParcelas {
  tipo?: ParcelaTipo;
  status?: ParcelaStatus;
  descricao?: string;
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
      if (filtro.descricao?.trim()) q = q.ilike('descricao', `%${filtro.descricao.trim()}%`);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Baixas e novos lançamentos mudam calendário, projeção e dashboard.
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    },
  });
}

export function useBaixarParcela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, valor_pago, data_pagamento, valor, valor_pago_anterior }: {
      id: string; valor_pago: number; data_pagamento: string | null; valor: number; valor_pago_anterior?: number;
    }) => {
      const cents = (value: number) => Math.round(Number(value) * 100);
      if (!Number.isFinite(valor_pago) || valor_pago < 0) throw new Error('Informe um valor de baixa válido.');
      const { data: atual, error: leitura } = await supabase.from('parcelas_financeiras')
        .select('id,valor,valor_pago,status').eq('id', id).single();
      if (leitura) throw leitura;
      if (atual.status === 'CANCELADA') throw new Error('Esta conta foi cancelada e não pode receber baixa.');
      if (cents(atual.valor) !== cents(valor) || (valor_pago_anterior != null && cents(atual.valor_pago) !== cents(valor_pago_anterior))) {
        throw new Error('Esta conta foi alterada. Feche a janela e abra novamente para conferir o saldo atualizado.');
      }
      if (cents(valor_pago) > cents(atual.valor)) throw new Error('O valor da baixa não pode ultrapassar o valor da conta.');
      if (valor_pago > 0 && (!data_pagamento || !/^\d{4}-\d{2}-\d{2}$/.test(data_pagamento) || !Number.isFinite(+new Date(`${data_pagamento}T00:00:00`)) || isoDate(new Date(`${data_pagamento}T00:00:00`)) !== data_pagamento)) {
        throw new Error('Informe uma data de pagamento válida.');
      }
      const pago = cents(valor_pago) / 100;
      const status: ParcelaStatus = cents(pago) >= cents(atual.valor) ? 'PAGA' : pago > 0 ? 'PARCIAL' : 'ABERTA';
      // A comparação na própria escrita evita sobrescrever uma baixa concorrente.
      const { data, error } = await supabase
        .from('parcelas_financeiras')
        .update({ valor_pago: pago, data_pagamento: pago > 0 ? data_pagamento : null, status })
        .eq('id', id).eq('valor', atual.valor).eq('valor_pago', atual.valor_pago).eq('status', atual.status)
        .select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Outra baixa foi registrada nesta conta. Feche a janela e confira o saldo atualizado.');
    },
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: KEY }),
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] }),
      qc.invalidateQueries({ queryKey: ['loja'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]),
    onError: () => { qc.invalidateQueries({ queryKey: KEY }); qc.invalidateQueries({ queryKey: ['fluxo-caixa'] }); },
  });
}

export function useDeleteParcela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parcelas_financeiras').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Baixas e novos lançamentos mudam calendário, projeção e dashboard.
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
    },
  });
}
