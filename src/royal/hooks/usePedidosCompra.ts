import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import { buscarTodos } from '@/lib/buscarTodos';
import type { LocalizacaoEstoque } from '@/types/database';

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
  variacao_id?: string | null;
}

function erroCompra(error: { code?: string; message?: string }): Error {
  if (error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? '')) {
    return new Error('É necessário atualizar o banco para registrar compras com segurança. Execute o SQL 20261115000002_compras_transacionais.sql no Supabase.');
  }
  if (error.code === '22003') return new Error('A quantidade ou o valor informado ultrapassa o limite permitido.');
  if (error.code === '23503') return new Error('Um produto ou fornecedor não está mais disponível. Atualize o cadastro antes de continuar.');
  return new Error(error.message ?? 'Não foi possível registrar a compra.');
}

export function usePedidosCompra() {
  return useQuery({ queryKey: KEY, queryFn: async () => await buscarTodos(() => supabase.from('pedidos_compra')
    .select('*, fornecedor:fornecedores(id,razao_social)').order('created_at', { ascending: false }).order('id')) as PedidoCompra[] });
}

export function useItensPedido(pedidoId: string | null) {
  return useQuery({ queryKey: [...KEY, pedidoId, 'itens'], enabled: !!pedidoId, queryFn: async () => await buscarTodos(() => supabase.from('itens_pedido_compra')
    .select('*, produto:produtos(id,nome,sku,imagem_url)').eq('pedido_id', pedidoId!).order('id')) as ItemPedidoCompra[] });
}

export function useCriarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; fornecedor_id: string; previsao_entrega: string | null; observacao: string | null; itens: ItemPedidoInput[] }) => {
      if (!input.fornecedor_id || !input.itens.length) throw new Error('Selecione o fornecedor e adicione produtos.');
      if (input.itens.some(item => !Number.isFinite(item.quantidade) || item.quantidade <= 0 || !Number.isFinite(item.custo_unitario) || item.custo_unitario < 0)) throw new Error('Informe quantidades positivas e custos válidos.');
      const { data, error } = await supabase.rpc('criar_pedido_compra', {
        p_pedido: { id: input.id ?? crypto.randomUUID(), fornecedor_id: input.fornecedor_id, previsao_entrega: input.previsao_entrega, observacao: input.observacao },
        p_itens: input.itens.map(item => ({ produto_id: item.produto_id, variacao_id: item.variacao_id ?? null, quantidade: item.quantidade, custo_unitario: item.custo_unitario })),
      });
      if (error) throw erroCompra(error);
      return data as { id: string; numero: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export interface ReceberPedidoInput {
  pedido: PedidoCompra;
  recebimentos: { item_id: string; produto_id: string; quantidade: number; custo_unitario: number; total_anterior: number; quantidade_pedida: number; data_validade?: string | null }[];
  data_vencimento: string | null;
  localizacao?: LocalizacaoEstoque;
}

export function useReceberPedido() {
  const qc = useQueryClient();
  const refresh = () => Promise.all([KEY, ['estoque'], ['parcelas'], ['fluxo-caixa'], ['loja'], ['dashboard'], ['relatorios']].map(queryKey => qc.invalidateQueries({ queryKey })));
  return useMutation({
    mutationFn: async (input: ReceberPedidoInput) => {
      if (!['ABERTO','PARCIAL'].includes(input.pedido.status)) throw new Error('Este pedido não pode receber mercadorias.');
      if (input.recebimentos.some(item => !Number.isFinite(item.quantidade) || item.quantidade < 0 || item.quantidade > item.quantidade_pedida - item.total_anterior + 0.000001)) throw new Error('Confira as quantidades a receber; elas não podem ultrapassar o saldo pendente.');
      const positive = input.recebimentos.filter(item => item.quantidade > 0);
      if (!positive.length) throw new Error('Informe ao menos uma quantidade maior que zero.');
      const usuario = await getUsuarioAtualId();
      const { data, error } = await supabase.rpc('receber_pedido_compra', {
        p_pedido_id: input.pedido.id,
        p_recebimentos: positive.map(item => ({ item_id: item.item_id, quantidade: item.quantidade, total_anterior: item.total_anterior, data_validade: item.data_validade ?? null })),
        p_data_vencimento: input.data_vencimento,
        p_localizacao: input.localizacao ?? 'Loja',
        p_usuario_id: usuario,
      });
      if (error) throw erroCompra(error);
      return data as { id: string; status: PedidoStatus; parcela_criada: boolean; valor_recebido: number };
    },
    onSuccess: refresh,
    onError: refresh,
  });
}

export function useCancelarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: string | { id: string; motivo: string; data_vencimento?: string | null; valor_recebido_esperado?: number }) => {
      const values = typeof input === 'string' ? { id: input, motivo: 'Cancelamento solicitado pela loja', data_vencimento: null, valor_recebido_esperado: null } : input;
      const { data, error } = await supabase.rpc('cancelar_pedido_compra', { p_pedido_id: values.id, p_motivo: values.motivo, p_data_vencimento: values.data_vencimento ?? null, p_valor_recebido_esperado: values.valor_recebido_esperado ?? null });
      if (error) throw erroCompra(error);
      return data as { id: string; parcela_criada: boolean; valor_recebido: number };
    },
    onSuccess: () => Promise.all([KEY, ['parcelas'], ['fluxo-caixa'], ['loja'], ['dashboard']].map(queryKey => qc.invalidateQueries({ queryKey }))),
    onError: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
