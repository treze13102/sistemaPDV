import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react';

function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date();
      const inicioMes = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [vendasMes, totalProdutos, parcelasAbertas] = await Promise.all([
        supabase
          .from('vendas')
          .select('total_liquido')
          .gte('data_hora', inicioMes)
          .eq('status', 'CONCLUIDA'),
        supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase
          .from('parcelas_financeiras')
          .select('valor, valor_pago, tipo')
          .in('status', ['ABERTA', 'PARCIAL', 'ATRASADA']),
      ]);

      const faturamentoMes = (vendasMes.data ?? []).reduce((acc, v) => acc + Number(v.total_liquido ?? 0), 0);
      const totalAReceber = (parcelasAbertas.data ?? [])
        .filter((p) => p.tipo === 'RECEBER')
        .reduce((acc, p) => acc + (Number(p.valor) - Number(p.valor_pago)), 0);
      const totalAPagar = (parcelasAbertas.data ?? [])
        .filter((p) => p.tipo === 'PAGAR')
        .reduce((acc, p) => acc + (Number(p.valor) - Number(p.valor_pago)), 0);

      return {
        faturamentoMes,
        totalProdutos: totalProdutos.count ?? 0,
        vendasCount: vendasMes.data?.length ?? 0,
        totalAReceber,
        totalAPagar,
      };
    },
  });
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();

  return (
    <>
      <PageHeader title="Dashboard" description="Visão geral do negócio" />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento do mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(data?.faturamentoMes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">{data?.vendasCount ?? 0} vendas concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : data?.totalProdutos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A receber</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(data?.totalAReceber ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A pagar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : formatCurrency(data?.totalAPagar ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
