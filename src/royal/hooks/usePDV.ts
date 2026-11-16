import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import {
  conferirPlanos,
  construirRecebiveis,
  NUMERO_PLACEHOLDER,
  type BandeiraCartao,
  type ParcelaPlano,
} from '@/lib/recebiveis';
import { traduzirErroRpc } from '@/lib/erroRpc';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import type {
  FormaPagamento,
  LocalizacaoEstoque,
  VendaCanal,
  VendaStatus,
} from '@/types/database';

export interface ItemCarrinho {
  produto_id: string;
  produto_nome: string;
  imagem_url?: string | null;
  variacao_id?: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
}

export interface PagamentoCarrinho {
  forma: FormaPagamento;
  valor: number;
  parcelas?: number;
  /** Crédito/débito: define a taxa da adquirente aplicada. */
  bandeira?: BandeiraCartao;
  /** Crediário: valor pago no ato; o restante é financiado em parcelas. */
  entrada?: number;
  /** Datas/valores acordados. Quando ausente, o plano é gerado automaticamente. */
  plano?: ParcelaPlano[];
}

export interface FinalizarVendaInput {
  cliente_id: string | null;
  canal: VendaCanal;
  itens: ItemCarrinho[];
  pagamentos: PagamentoCarrinho[];
  desconto_total: number;
  observacao?: string;
  localizacao_estoque: LocalizacaoEstoque;
  status?: VendaStatus;
  validade_orcamento?: string | null;
}

export function useFinalizarVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FinalizarVendaInput) => {
      const status: VendaStatus = input.status ?? 'CONCLUIDA';
      const pagamentos = status === 'CONCLUIDA' ? input.pagamentos : [];

      // Aviso imediato se as parcelas não fecham (o banco confere de novo).
      const erroPlano = conferirPlanos(pagamentos);
      if (erroPlano) throw new Error(erroPlano);

      // Recebíveis montados antes da venda existir: id e número são
      // preenchidos pelo banco dentro da mesma transação.
      const recebiveis =
        status === 'CONCLUIDA'
          ? construirRecebiveis({
              vendaId: null,
              numeroVenda: NUMERO_PLACEHOLDER,
              clienteId: input.cliente_id,
              pagamentos,
              taxas: carregarConfiguracoes().recebiveis,
            })
          : [];

      const usuarioId = await getUsuarioAtualId();

      // UMA chamada, UMA transação: venda, itens, pagamentos, estoque e
      // parcelas entram juntos ou nenhum entra. Antes eram 5 chamadas
      // separadas e uma falha no meio deixava venda órfã gravada.
      const { data, error } = await supabase.rpc('finalizar_venda', {
        p_venda: {
          cliente_id: input.cliente_id,
          usuario_id: usuarioId,
          canal: input.canal,
          status,
          desconto_extra: input.desconto_total,
          observacao: input.observacao ?? null,
          validade_orcamento: input.validade_orcamento ?? null,
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

      const venda = data as { id: string; numero: number; data_hora: string };
      const entrada_valor = pagamentos.reduce((s, p) => s + (p.entrada ?? 0), 0);

      // Carnê do cliente mostra o BRUTO (o que ele paga), não o líquido
      // que sobra para a loja depois da taxa da maquininha.
      const parcelas: ParcelaPlano[] = recebiveis.map((r) => ({
        numero: r.numero_parcela,
        valor: r.valor_bruto,
        data_vencimento: r.data_vencimento,
      }));

      return { id: venda.id, numero: venda.numero, data_hora: venda.data_hora, entrada_valor, parcelas };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vendas'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['fluxo-caixa'] });
      qc.invalidateQueries({ queryKey: ['relatorios'] });
    },
  });
}
