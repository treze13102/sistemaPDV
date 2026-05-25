import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';

const KEY = ['pedidos_compra'];

export type PedidoStatus = 'ABERTO' | 'PARCIAL' | 'RECEBIDO' | 'CANCELADO';

export interface PedidoCompra {
  id: string;
  numero: number;
  fornecedor_id: string;
  data_pedido: string;
  previsao_entrega: string | null;
  status: PedidoStatus;
  total: number;
  observacao: string | null;
  created_at: string;
  fornecedor?: { id: string; razao_social: string } | null;
}

export interface ItemPedidoCompra {
  id: string;
  pedido_id: string;
  produto_id: string;
  variacao_id: string | null;
  quantidade: number;
  quantidade_recebida: number;
  custo_unitario: number;
  total: number;
  produto?: { id: string; nome: string; sku: string | null; imagem_url: string | null } | null;
}

export interface ItemPedidoInput {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  custo_unitario: number;
}

export function usePedidosCompra() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_compra')
        .select('*, fornecedor:fornecedores(id,razao_social)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as PedidoCompra[];
    },
  });
}

export function useItensPedido(pedidoId: string | null) {
  return useQuery({
    queryKey: [...KEY, pedidoId, 'itens'],
    enabled: !!pedidoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('itens_pedido_compra')
        .select('*, produto:produtos(id,nome,sku,imagem_url)')
        .eq('pedido_id', pedidoId!);
      if (error) throw error;
      return data as ItemPedidoCompra[];
    },
  });
}

export function useCriarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      fornecedor_id: string;
      previsao_entrega: string | null;
      observacao: string | null;
      itens: ItemPedidoInput[];
    }) => {
      const total = input.itens.reduce((s, i) => s + i.quantidade * i.custo_unitario, 0);

      const { data: pedido, error: e1 } = await supabase
        .from('pedidos_compra')
        .insert({
          fornecedor_id: input.fornecedor_id,
          previsao_entrega: input.previsao_entrega,
          observacao: input.observacao,
          total,
          status: 'ABERTO',
        })
        .select('id')
        .single();
      if (e1) throw e1;

      const itensPayload = input.itens.map((i) => ({
        pedido_id: pedido.id,
        produto_id: i.produto_id,
        quantidade: i.quantidade,
        custo_unitario: i.custo_unitario,
        total: i.quantidade * i.custo_unitario,
      }));
      const { error: e2 } = await supabase.from('itens_pedido_compra').insert(itensPayload);
      if (e2) throw e2;

      return { id: pedido.id };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReceberPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pedido: PedidoCompra;
      recebimentos: { item_id: string; produto_id: string; quantidade: number; custo_unitario: number; total_anterior: number; quantidade_pedida: number }[];
      data_vencimento: string | null;
    }) => {
      const userId = await getUsuarioAtualId();

      // 1) gera movimentos ENTRADA_COMPRA
      const movs = input.recebimentos
        .filter((r) => r.quantidade > 0)
        .map((r) => ({
          produto_id: r.produto_id,
          tipo: 'ENTRADA_COMPRA' as const,
          quantidade: r.quantidade,
          localizacao: 'Loja' as const,
          custo_unitario: r.custo_unitario,
          usuario_id: userId,
          origem_tipo: 'PEDIDO_COMPRA',
          origem_id: input.pedido.id,
        }));
      if (movs.length === 0) throw new Error('Informe ao menos uma quantidade > 0');
      const { error: eMov } = await supabase.from('movimentos_estoque').insert(movs);
      if (eMov) throw eMov;

      // 2) atualiza quantidade_recebida nos itens
      for (const r of input.recebimentos) {
        if (r.quantidade <= 0) continue;
        const novaQtd = r.total_anterior + r.quantidade;
        const { error } = await supabase
          .from('itens_pedido_compra')
          .update({ quantidade_recebida: novaQtd })
          .eq('id', r.item_id);
        if (error) throw error;
      }

      // 3) determina status do pedido
      const totalPedido = input.recebimentos.reduce((s, r) => s + r.quantidade_pedida, 0);
      const totalRecebidoNovo = input.recebimentos.reduce((s, r) => s + r.total_anterior + r.quantidade, 0);
      const novoStatus: PedidoStatus = totalRecebidoNovo >= totalPedido ? 'RECEBIDO' : 'PARCIAL';
      const { error: eUpd } = await supabase
        .from('pedidos_compra')
        .update({ status: novoStatus })
        .eq('id', input.pedido.id);
      if (eUpd) throw eUpd;

      // 4) se totalmente recebido e não havia parcela ainda, gera parcela PAGAR
      if (novoStatus === 'RECEBIDO' && input.data_vencimento) {
        const valorRecebido = input.recebimentos.reduce((s, r) => s + (r.total_anterior + r.quantidade) * r.custo_unitario, 0);
        const { error: eParc } = await supabase.from('parcelas_financeiras').insert({
          tipo: 'PAGAR',
          origem_tipo: 'COMPRA',
          origem_id: input.pedido.id,
          descricao: `Pedido compra #${input.pedido.numero}`,
          data_emissao: new Date().toISOString().slice(0, 10),
          data_vencimento: input.data_vencimento,
          valor: valorRecebido,
          centro_custo: 'Loja',
          fornecedor_id: input.pedido.fornecedor_id,
        });
        if (eParc) throw eParc;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
    },
  });
}

export function useCancelarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pedidos_compra').update({ status: 'CANCELADO' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
