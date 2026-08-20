import { useState } from 'react';
import { Eye, Pencil, X, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCancelarVenda, useItensVenda, useVendas, type FiltroVendas, type VendaListagem } from '@/hooks/useVendas';
import { useParcelasDaVenda } from '@/hooks/useFluxoCaixa';
import { EditarVendaDialog } from '@/components/EditarVendaDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { imprimirComprovante } from '@/lib/comprovante';
import { BANDEIRAS, FORMA_LABEL } from '@/lib/recebiveis';
import type { ParcelaStatus, VendaStatus } from '@/types/database';

const STATUS_LABEL: Record<VendaStatus, string> = {
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada', ORCAMENTO: 'Orçamento',
};

const PARCELA_STATUS_CLASS: Record<ParcelaStatus, string> = {
  ABERTA: 'text-blue-400',
  PARCIAL: 'text-amber-400',
  PAGA: 'text-green-400',
  ATRASADA: 'text-destructive',
  CANCELADA: 'text-muted-foreground line-through',
};

export default function Vendas() {
  const [filtro, setFiltro] = useState<FiltroVendas>({});
  const { data, isLoading } = useVendas(filtro);
  const cancelar = useCancelarVenda();
  const [verVenda, setVerVenda] = useState<VendaListagem | null>(null);
  const [editarVenda, setEditarVenda] = useState<VendaListagem | null>(null);
  const [cancelarTarget, setCancelarTarget] = useState<VendaListagem | null>(null);
  const [motivo, setMotivo] = useState('');

  async function confirmarCancelamento() {
    if (!cancelarTarget) return;
    if (!motivo.trim()) { toast.error('Informe o motivo'); return; }
    try {
      await cancelar.mutateAsync({ venda: cancelarTarget, motivo });
      toast.success('Venda cancelada');
      setCancelarTarget(null);
      setMotivo('');
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader title="Vendas" description="Histórico de vendas e orçamentos" />
      <div className="p-4 sm:p-6 space-y-4">
        <Card>
          <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filtro.status ?? '__all__'}
                onValueChange={(v) => setFiltro((f) => ({ ...f, status: v === '__all__' ? undefined : (v as VendaStatus) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="ORCAMENTO">Orçamento</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>De</Label>
              <Input type="date" value={filtro.dataInicio ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataInicio: e.target.value || undefined }))} />
            </div>
            <div className="space-y-2">
              <Label>Até</Label>
              <Input type="date" value={filtro.dataFim ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, dataFim: e.target.value || undefined }))} />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Nenhuma venda</TableCell></TableRow>
              )}
              {data?.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">#{v.numero}</TableCell>
                  <TableCell>{formatDate(v.data_hora)}</TableCell>
                  <TableCell>{v.cliente?.nome ?? '—'}</TableCell>
                  <TableCell className="text-xs">{v.canal}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(v.total_liquido))}</TableCell>
                  <TableCell className="text-xs">{v.forma_pagamento_principal ?? '—'}</TableCell>
                  <TableCell>
                    <span className={
                      v.status === 'CONCLUIDA' ? 'text-green-700' :
                      v.status === 'CANCELADA' ? 'text-muted-foreground line-through' :
                      'text-blue-600'
                    }>
                      {STATUS_LABEL[v.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" title="Ver" onClick={() => setVerVenda(v)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(v.status === 'CONCLUIDA' || v.status === 'ORCAMENTO') && (
                      <>
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => setEditarVenda(v)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Cancelar" onClick={() => { setCancelarTarget(v); setMotivo(''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DialogDetalhes venda={verVenda} onClose={() => setVerVenda(null)} />

      <EditarVendaDialog venda={editarVenda} onClose={() => setEditarVenda(null)} />

      <Dialog open={!!cancelarTarget} onOpenChange={(o) => !o && setCancelarTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar venda</DialogTitle></DialogHeader>
          {cancelarTarget && (
            <div className="space-y-3">
              <div className="text-sm">
                <div>Venda <strong>#{cancelarTarget.numero}</strong> — {formatCurrency(Number(cancelarTarget.total_liquido))}</div>
                <div className="text-muted-foreground">
                  {cancelarTarget.status === 'CONCLUIDA'
                    ? 'Estoque será estornado e parcelas RECEBER abertas serão canceladas.'
                    : 'Orçamento será apenas marcado como cancelado.'}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo *</Label>
                <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva o motivo do cancelamento" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelarTarget(null)}>Voltar</Button>
            <Button variant="destructive" onClick={confirmarCancelamento} disabled={cancelar.isPending}>
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DialogDetalhes({ venda, onClose }: { venda: VendaListagem | null; onClose: () => void }) {
  const { data: itens, isLoading } = useItensVenda(venda?.id ?? null);
  const { data: parcelas } = useParcelasDaVenda(venda?.id ?? null);
  if (!venda) return null;

  const parcelasAtivas = (parcelas ?? []).filter((p) => p.status !== 'CANCELADA');
  const totalParcelas = parcelasAtivas.reduce((s, p) => s + Number(p.valor), 0);
  const totalRecebido = parcelasAtivas.reduce((s, p) => s + Number(p.valor_pago ?? 0), 0);

  function handleImprimir() {
    if (!venda || !itens) return;
    imprimirComprovante({
      venda,
      cliente_nome: venda.cliente?.nome,
      itens: itens.map((i) => ({
        produto_nome: i.produto?.nome ?? '—',
        quantidade: Number(i.quantidade),
        preco_unitario: Number(i.preco_unitario),
        desconto: Number(i.desconto),
        total: Number(i.total),
      })),
      pagamentos: venda.forma_pagamento_principal
        ? [{ forma: venda.forma_pagamento_principal, valor: Number(venda.total_liquido) }]
        : [],
      entrada: Number(venda.entrada_valor ?? 0) || null,
      parcelas: parcelasAtivas.length
        ? parcelasAtivas.map((p) => ({
            numero: p.numero_parcela ?? 0,
            valor: Number(p.valor),
            data_vencimento: p.data_vencimento,
          }))
        : undefined,
    });
  }

  return (
    <Dialog open={!!venda} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Venda #{venda.numero}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div>Data: <span className="text-foreground">{formatDate(venda.data_hora)}</span></div>
            <div>Cliente: <span className="text-foreground">{venda.cliente?.nome ?? '—'}</span></div>
            <div>Canal: <span className="text-foreground">{venda.canal}</span></div>
            <div>Status: <span className="text-foreground">{STATUS_LABEL[venda.status]}</span></div>
          </div>
          <div className="rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Desc.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">...</TableCell></TableRow>}
                {itens?.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>{i.produto?.nome ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">{Number(i.quantidade)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(i.preco_unitario))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(i.desconto))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(i.total))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap justify-end gap-6 text-sm">
            <div>Bruto: <strong>{formatCurrency(Number(venda.total_bruto))}</strong></div>
            <div>Desconto: <strong>{formatCurrency(Number(venda.desconto_total))}</strong></div>
            {Number(venda.entrada_valor ?? 0) > 0 && (
              <div>Entrada: <strong>{formatCurrency(Number(venda.entrada_valor))}</strong></div>
            )}
            <div>Líquido: <strong className="text-base">{formatCurrency(Number(venda.total_liquido))}</strong></div>
          </div>

          {parcelasAtivas.length > 0 && (
            <div className="space-y-2 rounded border border-primary/25 bg-primary/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm">
                  Recebíveis gerados
                  {parcelasAtivas[0].forma_pagamento && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {FORMA_LABEL[parcelasAtivas[0].forma_pagamento]}
                      {parcelasAtivas[0].bandeira ? ` · ${BANDEIRAS.find((b) => b.value === parcelasAtivas[0].bandeira)?.label}` : ''}
                    </span>
                  )}
                </strong>
                <span className="text-xs text-muted-foreground">
                  recebido <strong className="font-mono text-green-400">{formatCurrency(totalRecebido)}</strong>
                  {' · '}a receber{' '}
                  <strong className="font-mono text-primary">{formatCurrency(totalParcelas - totalRecebido)}</strong>
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead className="text-right">Pago</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelasAtivas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">
                        {p.numero_parcela ?? '—'}/{p.total_parcelas ?? parcelasAtivas.length}
                      </TableCell>
                      <TableCell>{formatDate(p.data_vencimento)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(p.valor_bruto ?? p.valor))}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">
                        {Number(p.taxa_valor) > 0 ? `−${formatCurrency(Number(p.taxa_valor))}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(p.valor))}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(p.valor_pago ?? 0))}</TableCell>
                      <TableCell className={`text-xs ${PARCELA_STATUS_CLASS[p.status]}`}>{p.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {venda.observacao && (
            <div className="rounded border bg-muted/30 p-2 text-xs">
              <strong>Observação:</strong> {venda.observacao}
            </div>
          )}
          {venda.cancelada_motivo && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              <strong>Cancelada:</strong> {venda.cancelada_motivo}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleImprimir} disabled={!itens}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir comprovante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
