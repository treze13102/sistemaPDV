import { useMemo, useState } from 'react';
import { Plus, Check, Trash2, Wallet } from 'lucide-react';
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
  ABERTA: 'Aberta', PAGA: 'Paga', PARCIAL: 'Parcial', ATRASADA: 'Atrasada', CANCELADA: 'Cancelada',
};

const schema = z.object({
  tipo: z.enum(['PAGAR', 'RECEBER']),
  origem_tipo: z.enum(['COMPRA', 'VENDA', 'DESPESA_FIXA', 'DESPESA_VARIAVEL', 'IMPOSTO', 'COMISSAO']),
  descricao: z.string().min(1, 'Obrigatório'),
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

  const totais = useMemo(() => {
    const arr = data ?? [];
    let aReceber = 0, aPagar = 0, recebidoMes = 0, pagoMes = 0;
    const inicioMes = new Date();
    inicioMes.setDate(1);
    const im = inicioMes.toISOString().slice(0, 10);
    for (const p of arr) {
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
  }, [data]);

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
      toast.success(editing ? 'Atualizada' : 'Lançada');
      setOpen(false);
    } catch (e) { toast.error((e as Error).message); }
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
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onDelete(id: string) {
    if (!confirm('Excluir parcela?')) return;
    try { await del.mutateAsync(id); toast.success('Excluída'); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Contas a pagar/receber e fluxo de caixa"
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova parcela</Button>}
      />
      <div className="p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">A receber</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-green-700">{formatCurrency(totais.aReceber)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">A pagar</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-red-700">{formatCurrency(totais.aPagar)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="h-4 w-4" />Saldo projetado</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${totais.saldoProjetado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(totais.saldoProjetado)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Realizado no mês</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm">Receb.: <strong className="text-green-700">{formatCurrency(totais.recebidoMes)}</strong></div>
              <div className="text-sm">Pago: <strong className="text-red-700">{formatCurrency(totais.pagoMes)}</strong></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filtro.tipo ?? '__all__'}
                onValueChange={(v) => setFiltro((f) => ({ ...f, tipo: v === '__all__' ? undefined : (v as ParcelaTipo) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
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
                  <SelectItem value="__all__">Todos</SelectItem>
                  {(Object.keys(STATUS_LABEL) as ParcelaStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vencimento de</Label>
              <Input type="date" value={filtro.dataInicio ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataInicio: e.target.value || undefined }))} />
            </div>
            <div className="space-y-2">
              <Label>Vencimento até</Label>
              <Input type="date" value={filtro.dataFim ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataFim: e.target.value || undefined }))} />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Cliente/Fornecedor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Nenhuma parcela</TableCell></TableRow>
              )}
              {data?.map((p) => {
                const atrasada = p.status !== 'PAGA' && p.status !== 'CANCELADA' && p.data_vencimento < hoje;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell>
                      <span className={p.tipo === 'RECEBER' ? 'text-green-700' : 'text-red-700'}>
                        {p.tipo === 'RECEBER' ? 'A receber' : 'A pagar'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.origem_tipo}</TableCell>
                    <TableCell>{p.cliente?.nome ?? p.fornecedor?.razao_social ?? '—'}</TableCell>
                    <TableCell className={atrasada ? 'text-red-600 font-medium' : ''}>{formatDate(p.data_vencimento)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(p.valor))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(p.valor_pago))}</TableCell>
                    <TableCell>
                      <span className="text-xs">{atrasada ? 'ATRASADA' : STATUS_LABEL[p.status]}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status !== 'PAGA' && p.status !== 'CANCELADA' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Baixar pagamento"
                          onClick={() => { setBaixaTarget(p); setValorBaixa(Number(p.valor) - Number(p.valor_pago)); }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} title="Editar">
                        <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar parcela' : 'Nova parcela'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2 col-span-2">
              <Label>Descrição *</Label>
              <Input {...form.register('descricao')} />
              {form.formState.errors.descricao && <p className="text-sm text-destructive">{form.formState.errors.descricao.message}</p>}
            </div>
            <div className="space-y-2"><Label>Emissão</Label><Input type="date" {...form.register('data_emissao')} /></div>
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
                  <SelectItem value="__none__">—</SelectItem>
                  {CENTROS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.watch('tipo') === 'RECEBER' ? (
              <div className="space-y-2 col-span-2">
                <Label>Cliente</Label>
                <Select
                  value={form.watch('cliente_id') ?? '__none__'}
                  onValueChange={(v) => form.setValue('cliente_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {clientes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2 col-span-2">
                <Label>Fornecedor</Label>
                <Select
                  value={form.watch('fornecedor_id') ?? '__none__'}
                  onValueChange={(v) => form.setValue('fornecedor_id', v === '__none__' ? null : v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {fornecedores.data?.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2 col-span-2"><Label>Observação</Label><Textarea {...form.register('observacao')} /></div>
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
                  Valor: {formatCurrency(Number(baixaTarget.valor))} · Já pago: {formatCurrency(Number(baixaTarget.valor_pago))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor pago (acumulado)</Label>
                <Input type="number" step="0.01" value={valorBaixa} onChange={(e) => setValorBaixa(Number(e.target.value) || 0)} />
                <p className="text-xs text-muted-foreground">
                  Total = valor já pago + esta baixa. Para quitar, use o valor total da parcela.
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
