import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const KEY = ['relatorios'];

export interface RangeFiltro {
  inicio: string; // YYYY-MM-DD
  fim: string;
}

export interface TopProduto {
  produto_id: string;
  produto_nome: string;
  quantidade_total: number;
  faturamento: number;
  custo_total: number;
  margem_pct: number;
  lucro: number;
}

export interface VendaPorCanal {
  canal: string;
  total: number;
  qtd: number;
}

export interface VendaPorDia {
  dia: string; // YYYY-MM-DD
  total: number;
  qtd: number;
}

export interface RelatoriosData {
  topFaturamento: TopProduto[];
  topMargem: TopProduto[];
  porCanal: VendaPorCanal[];
  porDia: VendaPorDia[];
  totalGeral: number;
  totalQtd: number;
}

export function useRelatorios(filtro: RangeFiltro) {
  return useQuery({
    queryKey: [...KEY, filtro],
    queryFn: async (): Promise<RelatoriosData> => {
      // Busca vendas concluídas no range
      const { data: vendas, error: e1 } = await supabase
        .from('vendas')
        .select('id,canal,total_liquido,data_hora')
        .eq('status', 'CONCLUIDA')
        .gte('data_hora', `${filtro.inicio}T00:00:00`)
        .lte('data_hora', `${filtro.fim}T23:59:59`);
      if (e1) throw e1;

      const vendaIds = (vendas ?? []).map((v) => v.id);

      // Itens das vendas + produto p/ obter custo
      let itens: {
        produto_id: string;
        quantidade: number;
        preco_unitario: number;
        total: number;
        produto: { id: string; nome: string; custo_aquisicao: number } | null;
      }[] = [];

      if (vendaIds.length > 0) {
        const { data: rows, error: e2 } = await supabase
          .from('itens_venda')
          .select('produto_id,quantidade,preco_unitario,total,produto:produtos(id,nome,custo_aquisicao)')
          .in('venda_id', vendaIds);
        if (e2) throw e2;
        itens = (rows ?? []) as unknown as typeof itens;
      }

      // Agregar por produto
      const agg = new Map<string, TopProduto>();
      for (const it of itens) {
        const pid = it.produto_id;
        const nome = it.produto?.nome ?? '—';
        const custoUnit = Number(it.produto?.custo_aquisicao ?? 0);
        const qtd = Number(it.quantidade);
        const fat = Number(it.total);
        const custoTotal = custoUnit * qtd;
        const cur = agg.get(pid);
        if (cur) {
          cur.quantidade_total += qtd;
          cur.faturamento += fat;
          cur.custo_total += custoTotal;
        } else {
          agg.set(pid, {
            produto_id: pid,
            produto_nome: nome,
            quantidade_total: qtd,
            faturamento: fat,
            custo_total: custoTotal,
            margem_pct: 0,
            lucro: 0,
          });
        }
      }
      for (const p of agg.values()) {
        p.lucro = p.faturamento - p.custo_total;
        p.margem_pct = p.faturamento > 0 ? (p.lucro / p.faturamento) * 100 : 0;
      }
      const todos = Array.from(agg.values());
      const topFaturamento = [...todos].sort((a, b) => b.faturamento - a.faturamento).slice(0, 10);
      const topMargem = [...todos]
        .filter((p) => p.faturamento >= 1) // ignora ruído
        .sort((a, b) => b.margem_pct - a.margem_pct)
        .slice(0, 10);

      // Por canal
      const canalAgg = new Map<string, VendaPorCanal>();
      for (const v of vendas ?? []) {
        const c = v.canal as string;
        const cur = canalAgg.get(c);
        if (cur) {
          cur.total += Number(v.total_liquido);
          cur.qtd += 1;
        } else {
          canalAgg.set(c, { canal: c, total: Number(v.total_liquido), qtd: 1 });
        }
      }
      const porCanal = Array.from(canalAgg.values()).sort((a, b) => b.total - a.total);

      // Por dia (preenche dias vazios)
      const diaAgg = new Map<string, VendaPorDia>();
      for (const v of vendas ?? []) {
        const dia = (v.data_hora as string).slice(0, 10);
        const cur = diaAgg.get(dia);
        if (cur) {
          cur.total += Number(v.total_liquido);
          cur.qtd += 1;
        } else {
          diaAgg.set(dia, { dia, total: Number(v.total_liquido), qtd: 1 });
        }
      }
      const porDia: VendaPorDia[] = [];
      const ini = new Date(filtro.inicio);
      const fim = new Date(filtro.fim);
      for (let d = new Date(ini); d <= fim; d.setDate(d.getDate() + 1)) {
        const k = d.toISOString().slice(0, 10);
        porDia.push(diaAgg.get(k) ?? { dia: k, total: 0, qtd: 0 });
      }

      const totalGeral = (vendas ?? []).reduce((s, v) => s + Number(v.total_liquido), 0);
      const totalQtd = (vendas ?? []).length;

      return { topFaturamento, topMargem, porCanal, porDia, totalGeral, totalQtd };
    },
  });
}
