import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  DollarSign,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useResumoFinanceiro } from '@/hooks/useFluxoCaixa';
import { formatCurrency } from '@/lib/utils';

function Kpi({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  cor = 'text-foreground',
  carregando,
}: {
  titulo: string;
  valor: number;
  detalhe?: string;
  icone: typeof DollarSign;
  cor?: string;
  carregando: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        <Icone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`font-mono text-2xl font-bold ${cor}`}>
          {carregando ? '...' : formatCurrency(valor)}
        </div>
        {detalhe && <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useResumoFinanceiro();

  const maiorBarra = Math.max(
    1,
    ...(data?.projecaoMeses ?? []).flatMap((m) => [m.receber, m.pagar]),
  );

  return (
    <>
      <PageHeader title="Dashboard" description="Situação financeira real, alimentada pelas vendas e recebíveis" />
      <div className="space-y-6 p-4 sm:p-6">
        {/* Vendas realizadas */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Vendas realizadas — mês corrente
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi
              titulo="Faturamento"
              valor={data?.faturamentoMes ?? 0}
              detalhe={`${data?.vendasCount ?? 0} vendas concluídas`}
              icone={Receipt}
              carregando={isLoading}
            />
            <Kpi
              titulo="Ticket médio"
              valor={data?.ticketMedio ?? 0}
              icone={TrendingUp}
              carregando={isLoading}
            />
            <Kpi
              titulo="Lucro bruto"
              valor={data?.lucroBrutoMes ?? 0}
              detalhe={`CMV ${formatCurrency(data?.cmvMes ?? 0)}`}
              icone={DollarSign}
              cor={(data?.lucroBrutoMes ?? 0) >= 0 ? 'text-green-500' : 'text-destructive'}
              carregando={isLoading}
            />
            <Kpi
              titulo="Lucro líquido"
              valor={data?.lucroLiquidoMes ?? 0}
              detalhe={`despesas ${formatCurrency(data?.despesasPagasMes ?? 0)} · taxas cartão ${formatCurrency(data?.taxasCartaoMes ?? 0)}`}
              icone={Wallet}
              cor={(data?.lucroLiquidoMes ?? 0) >= 0 ? 'text-green-500' : 'text-destructive'}
              carregando={isLoading}
            />
          </div>
        </section>

        {/* Caixa: recebido x a receber x projetado */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recebimentos
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi
              titulo="Já recebido no mês"
              valor={data?.recebidoMes ?? 0}
              detalhe="à vista + parcelas baixadas"
              icone={ArrowDownCircle}
              cor="text-green-500"
              carregando={isLoading}
            />
            <Kpi
              titulo="A receber (total)"
              valor={data?.totalAReceber ?? 0}
              detalhe={
                (data?.totalAReceberVencido ?? 0) > 0
                  ? `${formatCurrency(data!.totalAReceberVencido)} vencido`
                  : 'nenhuma parcela vencida'
              }
              icone={CalendarDays}
              cor="text-primary"
              carregando={isLoading}
            />
            <Kpi
              titulo="Faturamento projetado"
              valor={data?.faturamentoProjetadoMes ?? 0}
              detalhe="recebido + a vencer neste mês"
              icone={TrendingUp}
              carregando={isLoading}
            />
            <Kpi
              titulo="A pagar (total)"
              valor={data?.totalAPagar ?? 0}
              icone={ArrowUpCircle}
              cor="text-destructive"
              carregando={isLoading}
            />
          </div>
        </section>

        {/* Entradas previstas */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Entradas previstas
            </h2>
            <Link to="/calendario" className="text-xs text-primary underline underline-offset-2">
              ver calendário
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Kpi titulo="Hoje" valor={data?.entradasHoje ?? 0} icone={CalendarDays} carregando={isLoading} />
            <Kpi titulo="Próximos 7 dias" valor={data?.entradasSemana ?? 0} icone={CalendarDays} carregando={isLoading} />
            <Kpi titulo="Restante do mês" valor={data?.entradasMes ?? 0} icone={CalendarDays} carregando={isLoading} />
            <Kpi
              titulo="Saldo projetado 30d"
              valor={data?.saldoProjetado30 ?? 0}
              detalhe={`90 dias: ${formatCurrency(data?.saldoProjetado90 ?? 0)}`}
              icone={Wallet}
              cor={(data?.saldoProjetado30 ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}
              carregando={isLoading}
            />
          </div>
        </section>

        {/* Projeção de caixa mês a mês */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Projeção de caixa — próximos meses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando projeção...</p>}
            {!isLoading && (data?.projecaoMeses.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">Sem recebíveis ou contas lançadas.</p>
            )}
            <div className="space-y-3">
              {data?.projecaoMeses.map((m) => (
                <div key={m.mes} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium capitalize">{m.label}</span>
                    <span className="flex items-center gap-3 font-mono">
                      <span className="text-green-500">+{formatCurrency(m.receber)}</span>
                      <span className="text-destructive">−{formatCurrency(m.pagar)}</span>
                      <span className={m.acumulado >= 0 ? 'text-primary' : 'text-destructive'}>
                        acum. {formatCurrency(m.acumulado)}
                      </span>
                    </span>
                  </div>
                  <div className="flex h-2 gap-1">
                    <div className="flex flex-1 justify-end overflow-hidden rounded-l bg-muted/30">
                      <div
                        className="h-full rounded-l bg-green-500/70"
                        style={{ width: `${(m.receber / maiorBarra) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-1 overflow-hidden rounded-r bg-muted/30">
                      <div
                        className="h-full rounded-r bg-destructive/70"
                        style={{ width: `${(m.pagar / maiorBarra) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(data?.totalAReceberVencido ?? 0) > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {formatCurrency(data!.totalAReceberVencido)} em parcelas vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link to="/financeiro" className="text-sm text-primary underline underline-offset-2">
                Ver contas a receber
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
