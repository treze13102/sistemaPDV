import { useMemo, useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, CalendarDays, Check, Filter, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useBaixarParcela, useDeleteParcela, useParcelas, useUpsertParcela, type FiltroParcelas,
} from '@/hooks/useFinanceiro';
import { useClientes } from '@/hooks/useClientes';
import { useFornecedores } from '@/hooks/useFornecedores';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { CentroCusto, ParcelaFinanceira, ParcelaOrigem, ParcelaStatus, ParcelaTipo } from '@/types/database';

const ORIGENS: ParcelaOrigem[] = ['COMPRA', 'VENDA', 'DESPESA_FIXA', 'DESPESA_VARIAVEL', 'IMPOSTO', 'COMISSAO'];
const CENTROS: CentroCusto[] = ['Loja', 'Producao3D', 'Administrativo', 'Marketing'];
const STATUS_LABEL: Record<ParcelaStatus, string> = {
  ABERTA: 'Aberta',
  PAGA: 'Paga',
  PARCIAL: 'Parcial',
  ATRASADA: 'Atrasada',
  CANCELADA: 'Cancelada',
};

type ParcelaComRelacoes = ParcelaFinanceira & {
  cliente: { id: string; nome: string } | null;
  fornecedor: { id: string; razao_social: string } | null;
};

const schema = z.object({
  tipo: z.enum(['PAGAR', 'RECEBER']),
  origem_tipo: z.enum(['COMPRA', 'VENDA', 'DESPESA_FIXA', 'DESPESA_VARIAVEL', 'IMPOSTO', 'COMISSAO']),
  descricao: z.string().min(1, 'Obrigatorio'),
  data_emissao: z.string().min(1),
  data_vencimento: z.string().min(1),
  valor: z.coerce.number().min(0.01),
  centro_custo: z.enum(['Loja', 'Producao3D', 'Administrativo', 'Marketing']).nullable().optional(),
  cliente_id: z.string().nullable().optional(),
  fornecedor_id: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return d.toISOString().slice(0, 7);
}

function monthLabel(key: string) {
  const [ano, mes] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1, 1));
}

function buildCalendarDays(key: string) {
  const [ano, mes] = key.split('-').map(Number);
  const first = new Date(ano, mes - 1, 1);
  const last = new Date(ano, mes, 0);
  const days: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let day = 1; day <= last.getDate(); day += 1) days.push(new Date(ano, mes - 1, day));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function Financeiro() {
  const [filtro, setFiltro] = useState<FiltroParcelas>({});
  const { data, isLoading } = useParcelas(filtro);
  const clientes = useClientes();
  const fornecedores = useFornecedores();
  const upsert = useUpsertParcela();
  const baixar = useBaixarParcela();
  const del = useDeleteParcela();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParcelaFinanceira | null>(null);
  const [baixaTarget, setBaixaTarget] = useState<ParcelaFinanceira | null>(null);
  const [valorBaixa, setValorBaixa] = useState(0);

  const hoje = new Date().toISOString().slice(0, 10);
  const [mesCalendario, setMesCalendario] = useState(monthKey(new Date()));
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(hoje);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'PAGAR',
      origem_tipo: 'DESPESA_VARIAVEL',
      descricao: '',
      data_emissao: hoje,
      data_vencimento: hoje,
      valor: 0,
      centro_custo: 'Loja',
      cliente_id: null,
      fornecedor_id: null,
      observacao: '',
    },
  });

  const parcelas = useMemo(() => (data ?? []) as ParcelaComRelacoes[], [data]);
  const pendentes = useMemo(
    () => parcelas.filter((p) => p.status !== 'PAGA' && p.status !== 'CANCELADA'),
    [parcelas],
  );
  const realizadas = useMemo(
    () => parcelas.filter((p) => p.status === 'PAGA').sort((a, b) => (b.data_pagamento ?? '').localeCompare(a.data_pagamento ?? '')),
    [parcelas],
  );

  const totais = useMemo(() => {
    let aReceber = 0;
    let aPagar = 0;
    let recebidoMes = 0;
    let pagoMes = 0;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const im = inicioMes.toISOString().slice(0, 10);

    for (const p of parcelas) {
      const pendente = Number(p.valor) - Number(p.valor_pago);
      if (p.status !== 'PAGA' && p.status !== 'CANCELADA') {
        if (p.tipo === 'RECEBER') aReceber += pendente;
        else aPagar += pendente;
      }
      if (p.data_pagamento && p.data_pagamento >= im) {
        if (p.tipo === 'RECEBER') recebidoMes += Number(p.valor_pago);
        else pagoMes += Number(p.valor_pago);
      }
    }
    return { aReceber, aPagar, recebidoMes, pagoMes, saldoProjetado: aReceber - aPagar };
  }, [parcelas]);

  const diasCalendario = useMemo(() => buildCalendarDays(mesCalendario), [mesCalendario]);
  const pendentesPorDia = useMemo(() => {
    const mapa = new Map<string, ParcelaComRelacoes[]>();
    for (const p of pendentes) {
      const arr = mapa.get(p.data_vencimento) ?? [];
      arr.push(p);
      mapa.set(p.data_vencimento, arr);
    }
    return mapa;
  }, [pendentes]);
  const pendentesSelecionadas = dataSelecionada
    ? pendentesPorDia.get(dataSelecionada) ?? []
    : pendentes.slice(0, 8);

  function mudarMes(delta: number) {
    const [ano, mes] = mesCalendario.split('-').map(Number);
    setMesCalendario(monthKey(new Date(ano, mes - 1 + delta, 1)));
    setDataSelecionada(null);
  }

  function abrirBaixa(p: ParcelaFinanceira) {
    setBaixaTarget(p);
    setValorBaixa(Number(p.valor));
  }

  function openNew() {
    setEditing(null);
    form.reset({
      tipo: 'PAGAR',
      origem_tipo: 'DESPESA_VARIAVEL',
      descricao: '',
      data_emissao: hoje,
      data_vencimento: hoje,
      valor: 0,
      centro_custo: 'Loja',
      cliente_id: null,
      fornecedor_id: null,
      observacao: '',
    });
    setOpen(true);
  }

  function openEdit(p: ParcelaFinanceira) {
    setEditing(p);
    form.reset({
      tipo: p.tipo,
      origem_tipo: p.origem_tipo,
      descricao: p.descricao,
      data_emissao: p.data_emissao,
      data_vencimento: p.data_vencimento,
      valor: Number(p.valor),
      centro_custo: p.centro_custo,
      cliente_id: p.cliente_id,
      fornecedor_id: p.fornecedor_id,
      observacao: p.observacao ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(v: FormOutput) {
    try {
      await upsert.mutateAsync({ ...v, id: editing?.id });
      toast.success(editing ? 'Atualizada' : 'Lancada');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onBaixar() {
    if (!baixaTarget) return;
    try {
      await baixar.mutateAsync({
        id: baixaTarget.id,
        valor_pago: valorBaixa,
        data_pagamento: hoje,
        valor: Number(baixaTarget.valor),
      });
      toast.success('Baixa registrada');
      setBaixaTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Excluir parcela?')) return;
    try {
      await del.mutateAsync(id);
      toast.success('Excluida');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Faturas em aberto no calendario e transacoes realizadas em lista"
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova transacao</Button>}
      />
      <div className="space-y-4 p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                Receitas abertas <ArrowUpCircle className="h-4 w-4 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-700">{formatCurrency(totais.aReceber)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                Despesas abertas <ArrowDownCircle className="h-4 w-4 text-red-600" />
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-700">{formatCurrency(totais.aPagar)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Wallet className="h-4 w-4" />Saldo projetado</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totais.saldoProjetado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(totais.saldoProjetado)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Realizado no mes</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Receb.: <strong className="text-green-700">{formatCurrency(totais.recebidoMes)}</strong></div>
              <div className="text-sm">Pago: <strong className="text-red-700">{formatCurrency(totais.pagoMes)}</strong></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4" />Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
              <div className="space-y-2">
                <Label>Buscar por descricao</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Digite para buscar..."
                    value={filtro.descricao ?? ''}
                    onChange={(e) => setFiltro((f) => ({ ...f, descricao: e.target.value || undefined }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filtro.tipo ?? '__all__'}
                  onValueChange={(v) => setFiltro((f) => ({ ...f, tipo: v === '__all__' ? undefined : (v as ParcelaTipo) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os tipos</SelectItem>
                    <SelectItem value="PAGAR">A pagar</SelectItem>
                    <SelectItem value="RECEBER">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filtro.status ?? '__all__'}
                  onValueChange={(v) => setFiltro((f) => ({ ...f, status: v === '__all__' ? undefined : (v as ParcelaStatus) }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os status</SelectItem>
                    {(Object.keys(STATUS_LABEL) as ParcelaStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" className="w-full" onClick={() => setFiltro({})}>
                  Limpar filtros
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 border-t pt-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Vencimento de</Label>
                <Input type="date" value={filtro.dataInicio ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataInicio: e.target.value || undefined }))} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento ate</Label>
                <Input type="date" value={filtro.dataFim ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataFim: e.target.value || undefined }))} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {parcelas.length} parcela(s) encontrada(s). {pendentes.length} em aberto no calendario, {realizadas.length} realizada(s) em lista.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4" /> Faturas em aberto
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => mudarMes(-1)}>Anterior</Button>
                  <div className="min-w-40 text-center text-sm font-medium capitalize">{monthLabel(mesCalendario)}</div>
                  <Button type="button" variant="outline" size="sm" onClick={() => mudarMes(1)}>Proximo</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => <div key={d} className="py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {diasCalendario.map((dia, idx) => {
                  const key = dia ? dateKey(dia) : `blank-${idx}`;
                  const itensDia = dia ? pendentesPorDia.get(key) ?? [] : [];
                  const totalDia = itensDia.reduce((s, p) => s + Number(p.valor) - Number(p.valor_pago), 0);
                  const selecionado = dataSelecionada === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!dia}
                      className={`min-h-24 rounded border p-2 text-left transition disabled:border-transparent disabled:bg-transparent ${
                        selecionado ? 'border-primary bg-primary/10' : 'bg-background hover:bg-muted/60'
                      }`}
                      onClick={() => dia && setDataSelecionada(key)}
                    >
                      {dia && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${key === hoje ? 'text-primary' : ''}`}>{dia.getDate()}</span>
                            {itensDia.length > 0 && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">{itensDia.length}</span>}
                          </div>
                          {itensDia.length > 0 && (
                            <div className={`mt-2 text-xs font-semibold ${itensDia.some((p) => p.tipo === 'PAGAR') ? 'text-red-700' : 'text-green-700'}`}>
                              {formatCurrency(totalDia)}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {dataSelecionada ? `Vencimentos de ${formatDate(dataSelecionada)}` : 'Proximas faturas'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <div className="py-6 text-center text-sm text-muted-foreground">Carregando...</div>}
              {!isLoading && pendentesSelecionadas.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">Nenhuma fatura aberta nesta data</div>
              )}
              {pendentesSelecionadas.map((p) => {
                const atrasada = p.data_vencimento < hoje;
                const pendente = Number(p.valor) - Number(p.valor_pago);
                return (
                  <div key={p.id} className="rounded border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.descricao}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.cliente?.nome ?? p.fornecedor?.razao_social ?? p.origem_tipo} - {formatDate(p.data_vencimento)}
                        </div>
                      </div>
                      <div className={`shrink-0 font-mono text-sm font-semibold ${p.tipo === 'RECEBER' ? 'text-green-700' : 'text-red-700'}`}>
                        {p.tipo === 'RECEBER' ? '+' : '-'}{formatCurrency(pendente)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`text-xs ${atrasada ? 'font-medium text-red-600' : 'text-muted-foreground'}`}>
                        {atrasada ? 'Atrasada' : STATUS_LABEL[p.status]}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" title="Baixar pagamento" onClick={() => abrirBaixa(p)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Editar">
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transacoes realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente/Fornecedor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
                  {!isLoading && realizadas.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Nenhuma transacao realizada</TableCell></TableRow>
                  )}
                  {realizadas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.descricao}</TableCell>
                      <TableCell>
                        <span className={p.tipo === 'RECEBER' ? 'text-green-700' : 'text-red-700'}>
                          {p.tipo === 'RECEBER' ? 'Receita' : 'Despesa'}
                        </span>
                      </TableCell>
                      <TableCell>{p.cliente?.nome ?? p.fornecedor?.razao_social ?? '-'}</TableCell>
                      <TableCell>{p.data_pagamento ? formatDate(p.data_pagamento) : '-'}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${p.tipo === 'RECEBER' ? 'text-green-700' : 'text-red-700'}`}>
                        {p.tipo === 'RECEBER' ? '+' : '-'}{formatCurrency(Number(p.valor_pago))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Editar">
                          <Plus className="h-4 w-4 rotate-45" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)} title="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar parcela' : 'Nova transacao'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.watch('tipo')} onValueChange={(v) => form.setValue('tipo', v as ParcelaTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGAR">A pagar</SelectItem>
                  <SelectItem value="RECEBER">A receber</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem *</Label>
              <Select value={form.watch('origem_tipo')} onValueChange={(v) => form.setValue('origem_tipo', v as ParcelaOrigem)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Descricao *</Label>
              <Input {...form.register('descricao')} />
              {form.formState.errors.descricao && <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>}
            </div>
            <div className="space-y-2"><Label>Emissao</Label><Input type="date" {...form.register('data_emissao')} /></div>
            <div className="space-y-2"><Label>Vencimento</Label><Input type="date" {...form.register('data_vencimento')} /></div>
            <div className="space-y-2"><Label>Valor *</Label><Input type="number" step="0.01" {...form.register('valor')} /></div>
            <div className="space-y-2">
              <Label>Centro de custo</Label>
              <Select
                value={form.watch('centro_custo') ?? '__none__'}
                onValueChange={(v) => form.setValue('centro_custo', v === '__none__' ? null : (v as CentroCusto))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-</SelectItem>
                  {CENTROS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.watch('tipo') === 'RECEBER' ? (
              <div className="col-span-2 space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={form.watch('cliente_id') ?? '__none__'}
                  onValueChange={(v) => form.setValue('cliente_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-</SelectItem>
                    {clientes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="col-span-2 space-y-2">
                <Label>Fornecedor</Label>
                <Select
                  value={form.watch('fornecedor_id') ?? '__none__'}
                  onValueChange={(v) => form.setValue('fornecedor_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-</SelectItem>
                    {fornecedores.data?.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 space-y-2"><Label>Observacao</Label><Textarea {...form.register('observacao')} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!baixaTarget} onOpenChange={(o) => !o && setBaixaTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Baixar pagamento</DialogTitle></DialogHeader>
          {baixaTarget && (
            <div className="space-y-3">
              <div className="text-sm">
                <div><strong>{baixaTarget.descricao}</strong></div>
                <div className="text-muted-foreground">
                  Valor: {formatCurrency(Number(baixaTarget.valor))} - Ja pago: {formatCurrency(Number(baixaTarget.valor_pago))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor pago acumulado</Label>
                <Input type="number" step="0.01" value={valorBaixa} onChange={(e) => setValorBaixa(Number(e.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">
                  Para quitar, use o valor total da parcela. Para baixa parcial, informe o total acumulado pago ate agora.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBaixaTarget(null)}>Cancelar</Button>
            <Button onClick={onBaixar} disabled={baixar.isPending}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
