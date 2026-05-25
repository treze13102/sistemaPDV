import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
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

      if (status === 'CONCLUIDA') {
        // Pagamentos
        if (input.pagamentos.length) {
          const pagPayload = input.pagamentos.map((p) => ({
            venda_id: vendaId,
            forma: p.forma,
            valor: p.valor,
            parcelas: p.parcelas ?? 1,
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

        // Parcelas RECEBER para FIADO
        const fiado = input.pagamentos.filter((p) => p.forma === 'FIADO');
        if (fiado.length > 0 && input.cliente_id) {
          const totalFiado = fiado.reduce((s, p) => s + p.valor, 0);
          const numParcelas = fiado[0].parcelas ?? 1;
          const valorParcela = +(totalFiado / numParcelas).toFixed(2);
          const hoje = new Date();
          const parcelas = Array.from({ length: numParcelas }, (_, idx) => {
            const venc = new Date(hoje);
            venc.setMonth(venc.getMonth() + idx + 1);
            return {
              tipo: 'RECEBER' as const,
              origem_tipo: 'VENDA' as const,
              origem_id: vendaId,
              descricao: `Venda #${vendaId.slice(0, 8)} — parcela ${idx + 1}/${numParcelas}`,
              data_emissao: hoje.toISOString().slice(0, 10),
              data_vencimento: venc.toISOString().slice(0, 10),
              valor: valorParcela,
              centro_custo: 'Loja' as const,
              cliente_id: input.cliente_id,
            };
          });
          const { error: e5 } = await supabase.from('parcelas_financeiras').insert(parcelas);
          if (e5) throw e5;
        }
      }

      return { id: vendaId, numero: venda.numero as number, data_hora: venda.data_hora as string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['vendas'] });
      qc.invalidateQueries({ queryKey: ['estoque'] });
      qc.invalidateQueries({ queryKey: ['parcelas'] });
      qc.invalidateQueries({ queryKey: ['relatorios'] });
    },
  });
}
