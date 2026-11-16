import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import { conferirPlanos, construirRecebiveis } from '@/lib/recebiveis';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import { traduzirErroRpc } from '@/lib/erroRpc';
import type { ItemCarrinho, PagamentoCarrinho } from '@/hooks/usePDV';
import type { ItemVenda, LocalizacaoEstoque, Venda, VendaCanal } from '@/types/database';

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

export interface EditarVendaInput {
  venda: Venda;
  cliente_id: string | null;
  canal: VendaCanal;
  itens: ItemCarrinho[];
  pagamentos: PagamentoCarrinho[];
  /** Desconto extra (fora dos descontos por item). */
  desconto_total: number;
  observacao?: string | null;
  localizacao_estoque: LocalizacaoEstoque;
}

/**
 * Reescreve uma venda por completo: itens, estoque, pagamentos e recebíveis.
 *
 * Tudo acontece dentro da função `editar_venda` do banco, numa transação:
 * ela apaga só o que a própria venda gerou e regrava a partir do novo
 * conteúdo. Antes eram ~10 chamadas separadas — uma falha no meio deixava,
 * por exemplo, itens apagados sem os novos gravados.
 *
 * O banco também recusa a edição se alguma parcela já foi recebida.
 */
export function useEditarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditarVendaInput) => {
      const { venda } = input;
      if (venda.status === 'CANCELADA') throw new Error('Venda cancelada não pode ser editada');
      if (input.itens.length === 0) throw new Error('A venda precisa ter ao menos um item');

      const concluida = venda.status === 'CONCLUIDA';
      const pagamentos = concluida ? input.pagamentos : [];

      const erroPlano = conferirPlanos(pagamentos);
      if (erroPlano) throw new Error(erroPlano);

      const recebiveis = concluida
        ? construirRecebiveis({
            vendaId: venda.id,
            numeroVenda: venda.numero,
            clienteId: input.cliente_id,
            pagamentos,
            taxas: carregarConfiguracoes().recebiveis,
          })
        : [];

      const usuarioId = await getUsuarioAtualId();

      const { data, error } = await supabase.rpc('editar_venda', {
        p_venda_id: venda.id,
        p_venda: {
          cliente_id: input.cliente_id,
          usuario_id: usuarioId,
          canal: input.canal,
          desconto_extra: input.desconto_total,
          observacao: input.observacao ?? null,
          localizacao_estoque: input.localizacao_estoque,
        },
        p_itens: input.itens.map((i) => ({
          produto_id: i.produto_id,
          variacao_id: i.variacao_id ?? null,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto: i.desconto,
        })),
        p_pagamentos: pagamentos.map((p) => ({
          forma: p.forma,
          valor: p.valor,
          parcelas: p.parcelas ?? 1,
          bandeira: p.bandeira ?? null,
          entrada: p.entrada ?? 0,
        })),
        p_recebiveis: recebiveis,
      });
      if (error) throw traduzirErroRpc(error);

      return { total_liquido: Number((data as { total_liquido: number }).total_liquido) };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['relatorios'] });
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

      // Estorno de estoque, cancelamento das parcelas e status da venda numa
      // transação só. Antes, falhar entre o estorno e marcar CANCELADA deixava
      // a venda cancelável de novo — e o estoque era estornado em dobro.
      // O banco também estorna para o LOCAL de onde o item saiu (antes ia
      // sempre para 'Loja').
      const { error } = await supabase.rpc('cancelar_venda', {
        p_venda_id: venda.id,
        p_motivo: motivo,
        p_usuario_id: usuarioId,
      });
      if (error) throw traduzirErroRpc(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
