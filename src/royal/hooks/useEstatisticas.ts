import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { buscarTodos } from '@/lib/buscarTodos';
import type { PeriodoEstatistica, VendaEstatistica } from '@/lib/estatisticas';

export function useEstatisticas(periodo: PeriodoEstatistica) {
  const inicio = periodo.inicio?.toISOString() ?? null;
  const fim = periodo.fim?.toISOString() ?? null;
  return useQuery({
    queryKey: ['relatorios', 'estatisticas', inicio, fim],
    queryFn: async () => {
      const vendas = await buscarTodos(() => {
        let query = supabase.from('vendas')
          .select('id,data_hora,total_liquido,cliente_id,usuario_id,cliente:clientes(nome),usuario:usuarios(nome),itens:itens_venda(produto_id,quantidade,preco_unitario,desconto,total,produto:produtos(nome,custo_aquisicao)),pagamentos:pagamentos_venda(forma,valor)')
          .eq('status', 'CONCLUIDA').order('data_hora').order('id');
        if (inicio) query = query.gte('data_hora', inicio);
        if (fim) query = query.lt('data_hora', fim);
        return query;
      }, 10000) as unknown as VendaEstatistica[];
      const taxas = new Map<string, number>();
      // Lotes pequenos evitam URLs gigantes no filtro IN; cada lote também é paginado.
      for (let index = 0; index < vendas.length; index += 200) {
        const ids = vendas.slice(index, index + 200).map(venda => venda.id);
        const parcelas = await buscarTodos(() => supabase.from('parcelas_financeiras')
          .select('origem_id,taxa_valor').eq('origem_tipo', 'VENDA').neq('status', 'CANCELADA').in('origem_id', ids).order('id'), 10000);
        for (const parcela of parcelas) taxas.set(parcela.origem_id, (taxas.get(parcela.origem_id) ?? 0) + Number(parcela.taxa_valor ?? 0));
      }
      return vendas.map(venda => ({ ...venda, taxa: taxas.get(venda.id) ?? 0 }));
    },
  });
}
