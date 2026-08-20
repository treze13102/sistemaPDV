import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import { construirRecebiveis, type BandeiraCartao, type ParcelaPlano } from '@/lib/recebiveis';
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
      const total_bruto = input.itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
      const desconto_itens = input.itens.reduce((s, i) => s + i.desconto, 0);
      const desconto_total = desconto_itens + input.desconto_total;
      const total_liquido = total_bruto - desconto_total;

      const usuarioId = await getUsuarioAtualId();
      const status: VendaStatus = input.status ?? 'CONCLUIDA';
      const forma_principal = input.pagamentos[0]?.forma ?? null;
      const entrada_valor = input.pagamentos.reduce((s, p) => s + (p.entrada ?? 0), 0);

      const { data: venda, error: e1 } = await supabase
        .from('vendas')
        .insert({
          usuario_id: usuarioId,
          cliente_id: input.cliente_id,
          canal: input.canal,
          total_bruto,
          desconto_total,
          total_liquido,
          forma_pagamento_principal: forma_principal,
          status,
          entrada_valor,
          observacao: input.observacao ?? null,
          validade_orcamento: input.validade_orcamento ?? null,
        })
        .select('id, numero, data_hora')
        .single();
      if (e1) throw e1;

      const vendaId = venda.id;

      // Itens
      const itensPayload = input.itens.map((i) => ({
        venda_id: vendaId,
        produto_id: i.produto_id,
        variacao_id: i.variacao_id ?? null,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        desconto: i.desconto,
        total: i.quantidade * i.preco_unitario - i.desconto,
      }));
      const { error: e2 } = await supabase.from('itens_venda').insert(itensPayload);
      if (e2) throw e2;

      // Guardado fora do bloco p/ alimentar o carnê/comprovante do crediário.
      let recebiveisGerados: ParcelaPlano[] = [];

      if (status === 'CONCLUIDA') {
        // Pagamentos
        if (input.pagamentos.length) {
          const pagPayload = input.pagamentos.map((p) => ({
            venda_id: vendaId,
            forma: p.forma,
            valor: p.valor,
            parcelas: p.parcelas ?? 1,
            bandeira: p.bandeira ?? null,
          }));
          const { error: e3 } = await supabase.from('pagamentos_venda').insert(pagPayload);
          if (e3) throw e3;
        }

        // Movimentos estoque
        const movPayload = input.itens.map((i) => ({
          produto_id: i.produto_id,
          variacao_id: i.variacao_id ?? null,
          tipo: 'SAIDA_VENDA' as const,
          quantidade: i.quantidade,
          localizacao: input.localizacao_estoque,
          usuario_id: usuarioId,
          origem_tipo: 'VENDA',
          origem_id: vendaId,
        }));
        const { error: e4 } = await supabase.from('movimentos_estoque').insert(movPayload);
        if (e4) throw e4;

        // Recebíveis: toda forma a prazo vira parcelas RECEBER em aberto.
        // É isso que alimenta o calendário, a projeção de caixa e o dashboard.
        const recebiveis = construirRecebiveis({
          vendaId,
          numeroVenda: venda.numero as number,
          clienteId: input.cliente_id,
          pagamentos: input.pagamentos,
          taxas: carregarConfiguracoes().recebiveis,
        });

        if (recebiveis.length > 0) {
          const { error: e5 } = await supabase.from('parcelas_financeiras').insert(recebiveis);
          if (e5) throw e5;
        }

        recebiveisGerados = recebiveis.map((r) => ({
          numero: r.numero_parcela,
          valor: r.valor,
          data_vencimento: r.data_vencimento,
        }));
      }

      return {
        id: vendaId,
        numero: venda.numero as number,
        data_hora: venda.data_hora as string,
        entrada_valor,
        parcelas: recebiveisGerados,
      };
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
