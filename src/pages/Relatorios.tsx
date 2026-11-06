import { Fragment, useMemo, useState } from 'react';
import { BarChart3, CalendarClock, DollarSign, FileText, ShoppingCart, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRelatorios, useRelatorioValidade } from '@/hooks/useRelatorios';
import { FAIXAS, gerarRelatorioValidade, type FaixaValidade } from '@/lib/relatorioValidade';
import { formatCurrency, formatDate } from '@/lib/utils';

// Cor por urgência: vencido e "até 7 dias" precisam saltar aos olhos.
const COR_FAIXA: Record<FaixaValidade, string> = {
  vencido: 'text-destructive',
  ate7: 'text-orange-500',
  ate30: 'text-amber-500',
  ate90: 'text-muted-foreground',
  acima90: 'text-muted-foreground',
};

function rotuloPrazo(dias: number): string {
  if (dias < 0) return `vencido há ${Math.abs(dias)}d`;
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  return `${dias} dias`;
}

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
  const validade = useRelatorioValidade();
  const [gerandoValidade, setGerandoValidade] = useState(false);

  async function handleRelatorioValidade() {
    try {
      setGerandoValidade(true);
      await gerarRelatorioValidade();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGerandoValidade(false);
    }
  }

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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4" /> Produtos por validade
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRelatorioValidade}
                disabled={gerandoValidade || validade.isLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                {gerandoValidade ? 'Gerando...' : 'Imprimir relatório'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Do mais próximo de vencer ao mais distante. Não depende do período selecionado acima.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {validade.isLoading && <p className="text-sm text-muted-foreground">Carregando lotes...</p>}
            {validade.isError && (
              <p className="text-sm text-destructive">
                Não foi possível carregar: {(validade.error as Error).message}
              </p>
            )}

            {validade.data && validade.data.total_lotes === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum lote com data de validade registrada. Informe a validade ao dar entrada de estoque
                para acompanhar aqui.
              </p>
            )}

            {validade.data && validade.data.total_lotes > 0 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/45 p-3">
                    <div className="text-xs text-muted-foreground">Lotes com validade</div>
                    <div className="font-mono text-xl font-bold">{validade.data.total_lotes}</div>
                  </div>
                  <div
                    className={`rounded-md border p-3 ${
                      validade.data.qtd_vencidos > 0
                        ? 'border-destructive/40 bg-destructive/10'
                        : 'border-[var(--royal-line)] bg-background/45'
                    }`}
                  >
                    <div className="text-xs text-muted-foreground">Vencidos</div>
                    <div
                      className={`font-mono text-xl font-bold ${
                        validade.data.qtd_vencidos > 0 ? 'text-destructive' : ''
                      }`}
                    >
                      {validade.data.qtd_vencidos}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatCurrency(validade.data.valor_risco_vencido)} em perda
                    </div>
                  </div>
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                    <div className="text-xs text-muted-foreground">Vence em 30 dias</div>
                    <div className="font-mono text-xl font-bold text-amber-500">{validade.data.qtd_ate30}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatCurrency(validade.data.valor_risco_30d)} em risco
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/45 p-3">
                    <div className="text-xs text-muted-foreground">Custo total em validade</div>
                    <div className="font-mono text-xl font-bold">
                      {formatCurrency(validade.data.valor_risco_total)}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-md border border-[var(--royal-line)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Validade</TableHead>
                        <TableHead className="text-right">Prazo</TableHead>
                        <TableHead className="text-right">Valor em risco</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {FAIXAS.map((faixa) => {
                        const itens = validade.data!.lotes.filter((l) => l.faixa === faixa.id);
                        if (itens.length === 0) return null;
                        const subtotal = itens.reduce((s, l) => s + l.valor_risco, 0);
                        return (
                          <Fragment key={faixa.id}>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableCell colSpan={6} className="text-xs font-semibold uppercase tracking-wide">
                                <span className={COR_FAIXA[faixa.id]}>{faixa.label}</span>
                                <span className="ml-2 font-normal normal-case text-muted-foreground">
                                  {itens.length} lote(s)
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs font-semibold">
                                {formatCurrency(subtotal)}
                              </TableCell>
                            </TableRow>
                            {itens.map((l) => (
                              <TableRow key={l.movimento_id}>
                                <TableCell className="max-w-[220px]">
                                  <div className="truncate font-medium" title={l.produto_nome}>
                                    {l.produto_nome}
                                  </div>
                                  {l.sku && <div className="text-[11px] text-muted-foreground">{l.sku}</div>}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{l.categoria}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{l.localizacao}</TableCell>
                                <TableCell className="text-right font-mono">{l.quantidade}</TableCell>
                                <TableCell className="text-right font-mono">{formatDate(l.data_validade)}</TableCell>
                                <TableCell className={`text-right font-mono font-semibold ${COR_FAIXA[l.faixa]}`}>
                                  {rotuloPrazo(l.dias_restantes)}
                                </TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(l.valor_risco)}</TableCell>
                              </TableRow>
                            ))}
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Cada linha é um lote de entrada que registrou validade. A quantidade é a que entrou naquele
                  lote — como a venda baixa o saldo total do produto e não o lote específico, use estes números
                  para priorizar o giro, não como saldo exato por lote.
                </p>
              </>
            )}
          </CardContent>
        </Card>

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
