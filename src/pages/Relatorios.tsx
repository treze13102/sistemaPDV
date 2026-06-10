import { useMemo, useState } from 'react';
import { BarChart3, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRelatorios } from '@/hooks/useRelatorios';
import { formatCurrency, formatDate } from '@/lib/utils';

function defaultRange() {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 29);
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fim: fim.toISOString().slice(0, 10),
  };
}

export default function Relatorios() {
  const [range, setRange] = useState(defaultRange);
  const { data, isLoading } = useRelatorios(range);

  const maxDia = useMemo(() => {
    if (!data?.porDia.length) return 1;
    return Math.max(1, ...data.porDia.map((d) => d.total));
  }, [data]);

  return (
    <>
      <PageHeader title="Relatórios" description="Análise de vendas e produtos" />
      <div className="p-4 sm:p-6 space-y-4">
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label>De</Label>
              <Input type="date" value={range.inicio} onChange={(e) => setRange((r) => ({ ...r, inicio: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Até</Label>
              <Input type="date" value={range.fim} onChange={(e) => setRange((r) => ({ ...r, fim: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2 flex items-end gap-2">
              <button
                type="button"
                onClick={() => setRange(defaultRange())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Últimos 30 dias
              </button>
              <button
                type="button"
                onClick={() => {
                  const fim = new Date();
                  const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1);
                  setRange({ inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) });
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Mês atual
              </button>
              <button
                type="button"
                onClick={() => {
                  const fim = new Date();
                  const inicio = new Date(fim.getFullYear(), 0, 1);
                  setRange({ inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) });
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ano atual
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : formatCurrency(data?.totalGeral ?? 0)}</div>
              <p className="text-xs text-muted-foreground">{data?.totalQtd ?? 0} vendas concluídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency((data?.totalQtd ?? 0) > 0 ? (data?.totalGeral ?? 0) / (data?.totalQtd ?? 1) : 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" /> Top 10 produtos por faturamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">...</TableCell></TableRow>}
                  {!isLoading && (data?.topFaturamento.length ?? 0) === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados no período</TableCell></TableRow>
                  )}
                  {data?.topFaturamento.map((p) => (
                    <TableRow key={p.produto_id}>
                      <TableCell className="max-w-xs truncate" title={p.produto_nome}>{p.produto_nome}</TableCell>
                      <TableCell className="text-right font-mono">{p.quantidade_total}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p.faturamento)}</TableCell>
                      <TableCell className="text-right font-mono text-green-700">{formatCurrency(p.lucro)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" /> Top 10 produtos por margem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">...</TableCell></TableRow>}
                  {!isLoading && (data?.topMargem.length ?? 0) === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
                  )}
                  {data?.topMargem.map((p) => (
                    <TableRow key={p.produto_id}>
                      <TableCell className="max-w-xs truncate" title={p.produto_nome}>{p.produto_nome}</TableCell>
                      <TableCell className="text-right font-mono text-green-700">{p.margem_pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p.lucro)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(p.faturamento)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por canal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">% do total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">...</TableCell></TableRow>}
                {!isLoading && (data?.porCanal.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
                )}
                {data?.porCanal.map((c) => {
                  const pct = data.totalGeral > 0 ? (c.total / data.totalGeral) * 100 : 0;
                  return (
                    <TableRow key={c.canal}>
                      <TableCell className="font-medium">{c.canal}</TableCell>
                      <TableCell className="text-right font-mono">{c.qtd}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(c.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-12 text-right font-mono text-xs">{pct.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendas por dia ({range.inicio} → {range.fim})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoading && <div className="py-6 text-center text-muted-foreground">...</div>}
              {!isLoading && data?.porDia.map((d) => {
                const w = (d.total / maxDia) * 100;
                return (
                  <div key={d.dia} className="grid grid-cols-[100px_1fr_auto] items-center gap-3 text-xs">
                    <div className="text-muted-foreground">{formatDate(d.dia)}</div>
                    <div className="h-3 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${w}%` }}
                        title={`${formatCurrency(d.total)} · ${d.qtd} venda(s)`}
                      />
                    </div>
                    <div className="font-mono w-32 text-right">
                      {formatCurrency(d.total)}
                      {d.qtd > 0 && <span className="ml-2 text-muted-foreground">({d.qtd})</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
