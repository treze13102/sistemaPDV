import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgendaFinanceira, useProjecaoRecebiveis, type DiaAgenda } from '@/hooks/useFluxoCaixa';
import { FORMA_LABEL, isoDate } from '@/lib/recebiveis';
import { formatCurrency, formatDate } from '@/lib/utils';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Calendario() {
  const [ref, setRef] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const inicioMes = useMemo(() => new Date(ref.getFullYear(), ref.getMonth(), 1), [ref]);
  const fimMes = useMemo(() => new Date(ref.getFullYear(), ref.getMonth() + 1, 0), [ref]);
  const { data, isLoading } = useAgendaFinanceira(isoDate(inicioMes), isoDate(fimMes));
  const projecao = useProjecaoRecebiveis(12);

  const mesAtualChave = isoDate(inicioMes).slice(0, 7);
  const maiorMes = Math.max(1, ...(projecao.data ?? []).map((m) => Math.max(m.receber, m.pagar)));
  const totalHorizonte = (projecao.data ?? []).reduce((s, m) => s + m.receber, 0);

  const porDia = useMemo(() => {
    const map = new Map<string, DiaAgenda>();
    for (const d of data ?? []) map.set(d.data, d);
    return map;
  }, [data]);

  // Grade do mês: preenche os dias vazios antes do dia 1 para alinhar a semana.
  const celulas = useMemo(() => {
    const total = fimMes.getDate();
    const offset = inicioMes.getDay();
    const lista: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let dia = 1; dia <= total; dia += 1) {
      lista.push(isoDate(new Date(ref.getFullYear(), ref.getMonth(), dia)));
    }
    return lista;
  }, [ref, inicioMes, fimMes]);

  const totais = useMemo(() => {
    const receber = (data ?? []).reduce((s, d) => s + d.receber, 0);
    const pagar = (data ?? []).reduce((s, d) => s + d.pagar, 0);
    return { receber, pagar, liquido: receber - pagar };
  }, [data]);

  const detalhe = diaSelecionado ? porDia.get(diaSelecionado) : null;
  const hojeIso = isoDate(new Date());

  return (
    <>
      <PageHeader title="Calendário financeiro" description="Entradas e saídas previstas por dia" />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A receber no mês</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-bold text-green-500">{formatCurrency(totais.receber)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A pagar no mês</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="font-mono text-2xl font-bold text-destructive">{formatCurrency(totais.pagar)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Saldo previsto do mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-mono text-2xl font-bold ${totais.liquido >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(totais.liquido)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base capitalize">
              {ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Mês anterior"
                onClick={() => setRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const h = new Date();
                  setRef(new Date(h.getFullYear(), h.getMonth(), 1));
                }}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Próximo mês"
                onClick={() => setRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Carregando lançamentos...</p>}
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="pb-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
                  {d}
                </div>
              ))}
              {celulas.map((iso, idx) => {
                if (!iso) return <div key={`vazio-${idx}`} />;
                const dia = porDia.get(iso);
                const numero = Number(iso.slice(8, 10));
                const ehHoje = iso === hojeIso;
                const selecionado = iso === diaSelecionado;
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setDiaSelecionado(selecionado ? null : iso)}
                    className={`min-h-[64px] rounded-md border p-1.5 text-left transition-colors sm:min-h-[80px] ${
                      selecionado
                        ? 'border-primary bg-primary/10'
                        : ehHoje
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-[var(--royal-line)] bg-background/45 hover:bg-accent'
                    }`}
                  >
                    <div className={`text-xs font-medium ${ehHoje ? 'text-primary' : 'text-muted-foreground'}`}>
                      {numero}
                    </div>
                    {dia && (
                      <div className="mt-1 space-y-0.5">
                        {dia.receber > 0 && (
                          <div className="truncate font-mono text-[10px] text-green-500">
                            +{formatCurrency(dia.receber)}
                          </div>
                        )}
                        {dia.pagar > 0 && (
                          <div className="truncate font-mono text-[10px] text-destructive">
                            −{formatCurrency(dia.pagar)}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Projeção de recebíveis — próximos 12 meses</CardTitle>
              <span className="text-xs text-muted-foreground">
                total a receber no horizonte{' '}
                <strong className="font-mono text-green-500">{formatCurrency(totalHorizonte)}</strong>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {projecao.isLoading && <p className="text-sm text-muted-foreground">Carregando projeção...</p>}
            {!projecao.isLoading && totalHorizonte === 0 && (projecao.data?.every((m) => m.pagar === 0) ?? true) && (
              <p className="text-sm text-muted-foreground">
                Nenhum recebível ou conta em aberto nos próximos 12 meses. Vendas no cartão de crédito e no
                crediário aparecem aqui automaticamente assim que forem registradas no PDV.
              </p>
            )}
            <div className="space-y-2.5">
              {projecao.data
                ?.filter((m) => m.receber > 0 || m.pagar > 0)
                .map((m) => {
                  const ehMesVisivel = m.mes === mesAtualChave;
                  return (
                    <button
                      key={m.mes}
                      type="button"
                      onClick={() => {
                        setRef(new Date(`${m.inicio}T00:00:00`));
                        setDiaSelecionado(null);
                      }}
                      className={`w-full space-y-1.5 rounded-md border p-2.5 text-left transition-colors ${
                        ehMesVisivel
                          ? 'border-primary bg-primary/10'
                          : 'border-[var(--royal-line)] bg-background/45 hover:bg-accent'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                        <span className="flex items-center gap-2">
                          <span className="font-medium capitalize">{m.label}</span>
                          {m.vencido && (
                            <span className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                              vencido
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-3 font-mono">
                          <span className="text-green-500">+{formatCurrency(m.receber)}</span>
                          {m.pagar > 0 && <span className="text-destructive">−{formatCurrency(m.pagar)}</span>}
                          <span className={m.acumulado >= 0 ? 'text-primary' : 'text-destructive'}>
                            acum. {formatCurrency(m.acumulado)}
                          </span>
                        </span>
                      </div>

                      <div className="flex h-1.5 gap-1">
                        <div className="flex flex-1 justify-end overflow-hidden rounded-l bg-muted/30">
                          <div
                            className="h-full rounded-l bg-green-500/70"
                            style={{ width: `${(m.receber / maiorMes) * 100}%` }}
                          />
                        </div>
                        <div className="flex flex-1 overflow-hidden rounded-r bg-muted/30">
                          <div
                            className="h-full rounded-r bg-destructive/70"
                            style={{ width: `${(m.pagar / maiorMes) * 100}%` }}
                          />
                        </div>
                      </div>

                      {m.porForma.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.porForma.map((f) => (
                            <span
                              key={f.forma}
                              className="rounded border border-[var(--royal-line)] bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {f.forma === 'OUTROS' ? 'Outros' : FORMA_LABEL[f.forma]}{' '}
                              <strong className="font-mono text-foreground">{formatCurrency(f.valor)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {diaSelecionado && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lançamentos de {formatDate(diaSelecionado)}</CardTitle>
            </CardHeader>
            <CardContent>
              {!detalhe || detalhe.lancamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento previsto para este dia.</p>
              ) : (
                <div className="space-y-2">
                  {detalhe.lancamentos.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--royal-line)] bg-background/45 p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{l.descricao}</div>
                        <div className="text-xs text-muted-foreground">
                          {[
                            l.cliente_nome,
                            l.forma_pagamento ? FORMA_LABEL[l.forma_pagamento] : null,
                            l.numero_parcela ? `parcela ${l.numero_parcela}/${l.total_parcelas ?? '?'}` : null,
                            l.status,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 font-mono font-semibold ${
                          l.tipo === 'RECEBER' ? 'text-green-500' : 'text-destructive'
                        }`}
                      >
                        {l.tipo === 'RECEBER' ? '+' : '−'}
                        {formatCurrency(l.saldo)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
