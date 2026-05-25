import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import type { ItemVenda, Venda } from '@/types/database';

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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
