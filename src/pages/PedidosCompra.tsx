import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Truck, PackageCheck, X, Search, Eye, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useProdutos } from '@/hooks/useProdutos';
import {
  useCancelarPedido, useCriarPedido, useItensPedido, usePedidosCompra, useReceberPedido,
  type ItemPedidoInput, type PedidoCompra,
} from '@/hooks/usePedidosCompra';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  ABERTO: 'Aberto', PARCIAL: 'Parcial', RECEBIDO: 'Recebido', CANCELADO: 'Cancelado',
};

export default function PedidosCompra() {
  const { data: pedidos, isLoading } = usePedidosCompra();
  const fornecedores = useFornecedores();
  const produtos = useProdutos();
  const criar = useCriarPedido();
  const cancelar = useCancelarPedido();

  const [openNew, setOpenNew] = useState(false);
  const [receberTarget, setReceberTarget] = useState<PedidoCompra | null>(null);
  const [detalhesTarget, setDetalhesTarget] = useState<PedidoCompra | null>(null);

  // form novo pedido
  const [fornecedorId, setFornecedorId] = useState<string>('');
  const [previsao, setPrevisao] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itensNovos, setItensNovos] = useState<ItemPedidoInput[]>([]);
  const [searchProd, setSearchProd] = useState('');

  function resetForm() {
    setFornecedorId(''); setPrevisao(''); setObservacao(''); setItensNovos([]); setSearchProd('');
  }

  function addItemPedido(produtoId: string) {
    const p = produtos.data?.find((x) => x.id === produtoId);
    if (!p) return;
    setItensNovos((prev) => [
      ...prev,
      { produto_id: p.id, produto_nome: p.nome, quantidade: 1, custo_unitario: Number(p.custo_aquisicao) || 0 },
    ]);
    setSearchProd('');
  }
  function updateItemNovo(idx: number, patch: Partial<ItemPedidoInput>) {
    setItensNovos((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItemNovo(idx: number) {
    setItensNovos((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalNovo = useMemo(() => itensNovos.reduce((s, i) => s + i.quantidade * i.custo_unitario, 0), [itensNovos]);

  async function salvarPedido() {
    if (!fornecedorId) { toast.error('Selecione fornecedor'); return; }
    if (itensNovos.length === 0) { toast.error('Adicione itens'); return; }
    if (itensNovos.some((i) => i.quantidade <= 0 || i.custo_unitario < 0)) {
      toast.error('Quantidades > 0 e custos >= 0'); return;
    }
    try {
      await criar.mutateAsync({
        fornecedor_id: fornecedorId,
        previsao_entrega: previsao || null,
        observacao: observacao || null,
        itens: itensNovos,
      });
      toast.success('Pedido criado');
      setOpenNew(false);
      resetForm();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onCancelar(p: PedidoCompra) {
    if (!confirm(`Cancelar pedido #${p.numero}?`)) return;
    try { await cancelar.mutateAsync(p.id); toast.success('Cancelado'); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title="Pedidos de Compra"
        description="Compras a fornecedores e recebimentos"
        actions={<Button onClick={() => { resetForm(); setOpenNew(true); }}><Plus className="mr-2 h-4 w-4" /> Novo pedido</Button>}
      />
      <div className="p-6">
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data pedido</TableHead>
                <TableHead>Previsão</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (pedidos?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum pedido</TableCell></TableRow>
              )}
              {pedidos?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">#{p.numero}</TableCell>
                  <TableCell className="font-medium">{p.fornecedor?.razao_social ?? '—'}</TableCell>
                  <TableCell>{formatDate(p.data_pedido)}</TableCell>
                  <TableCell>{p.previsao_entrega ? formatDate(p.previsao_entrega) : '—'}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(Number(p.total))}</TableCell>
                  <TableCell>
                    <span className={
                      p.status === 'RECEBIDO' ? 'text-green-700' :
                      p.status === 'CANCELADO' ? 'text-muted-foreground' :
                      p.status === 'PARCIAL' ? 'text-orange-600' : ''
                    }>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" title="Ver detalhes" onClick={() => setDetalhesTarget(p)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(p.status === 'ABERTO' || p.status === 'PARCIAL') && (
                      <>
                        <Button size="icon" variant="ghost" title="Receber" onClick={() => setReceberTarget(p)}>
                          <PackageCheck className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Cancelar" onClick={() => onCancelar(p)}>
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

      <Dialog open={openNew} onOpenChange={(o) => { if (!o) resetForm(); setOpenNew(o); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo pedido de compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fornecedor *</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.data?.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Previsão entrega</Label>
                <Input type="date" value={previsao} onChange={(e) => setPrevisao(e.target.value)} />
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Adicionar produtos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar produto..." value={searchProd} onChange={(e) => setSearchProd(e.target.value)} />
                </div>
                {searchProd && (
                  <div className="max-h-48 overflow-auto rounded border">
                    {(produtos.data ?? [])
                      .filter((p) => p.nome.toLowerCase().includes(searchProd.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(searchProd.toLowerCase()))
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => addItemPedido(p.id)}
                        >
                          <span>{p.nome}{p.sku && <span className="ml-2 text-xs text-muted-foreground">{p.sku}</span>}</span>
                          <span className="font-mono text-xs">custo {formatCurrency(Number(p.custo_aquisicao))}</span>
                        </button>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {itensNovos.length > 0 && (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="w-28">Qtd</TableHead>
                      <TableHead className="w-32">Custo unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensNovos.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{it.produto_nome}</TableCell>
                        <TableCell>
                          <Input type="number" step="0.001" value={it.quantidade}
                            onChange={(e) => updateItemNovo(idx, { quantidade: Number(e.target.value) || 0 })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" step="0.01" value={it.custo_unitario}
                            onChange={(e) => updateItemNovo(idx, { custo_unitario: Number(e.target.value) || 0 })} />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(it.quantidade * it.custo_unitario)}
                        </TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => removeItemNovo(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end border-t bg-muted/30 px-4 py-3 text-sm font-semibold">
                  Total: <span className="ml-2 font-mono">{formatCurrency(totalNovo)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpenNew(false); }}>Cancelar</Button>
            <Button onClick={salvarPedido} disabled={criar.isPending}>
              <Truck className="mr-2 h-4 w-4" /> Salvar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogReceber pedido={receberTarget} onClose={() => setReceberTarget(null)} />
      <DialogDetalhesPedido pedido={detalhesTarget} onClose={() => setDetalhesTarget(null)} />
    </>
  );
}

function DialogDetalhesPedido({ pedido, onClose }: { pedido: PedidoCompra | null; onClose: () => void }) {
  const { data: itens, isLoading } = useItensPedido(pedido?.id ?? null);
  if (!pedido) return null;

  const totalItens = (itens ?? []).reduce((s, it) => s + Number(it.total), 0);
  const totalQtd = (itens ?? []).reduce((s, it) => s + Number(it.quantidade), 0);
  const totalRecebido = (itens ?? []).reduce((s, it) => s + Number(it.quantidade_recebida), 0);

  return (
    <Dialog open={!!pedido} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pedido de compra #{pedido.numero}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="text-muted-foreground">Fornecedor</div>
              <div className="font-medium">{pedido.fornecedor?.razao_social ?? '—'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="text-muted-foreground">Pedido</div>
              <div className="font-medium">{formatDate(pedido.data_pedido)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="text-muted-foreground">Previsão</div>
              <div className="font-medium">{pedido.previsao_entrega ? formatDate(pedido.previsao_entrega) : '—'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium">{STATUS_LABEL[pedido.status]}</div>
            </CardContent>
          </Card>
        </div>

        {pedido.observacao && (
          <Card>
            <CardContent className="pt-4 text-sm">
              <div className="mb-1 text-muted-foreground">Observação</div>
              <div>{pedido.observacao}</div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Recebido</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (itens?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sem itens</TableCell></TableRow>
              )}
              {itens?.map((it) => {
                const qtd = Number(it.quantidade);
                const recebido = Number(it.quantidade_recebida);
                const pendente = Math.max(qtd - recebido, 0);
                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                          {it.produto?.imagem_url ? (
                            <img src={it.produto.imagem_url} alt={it.produto.nome} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{it.produto?.nome ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{it.produto?.sku ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">{qtd}</TableCell>
                    <TableCell className="text-right font-mono">{recebido}</TableCell>
                    <TableCell className={pendente > 0 ? 'text-right font-mono text-orange-600' : 'text-right font-mono text-green-600'}>{pendente}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(it.custo_unitario))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(it.total))}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="grid gap-2 border-t bg-muted/30 p-4 text-sm sm:grid-cols-3">
            <div>Total pedido: <strong className="font-mono">{formatCurrency(Number(pedido.total || totalItens))}</strong></div>
            <div>Quantidade: <strong className="font-mono">{totalQtd}</strong></div>
            <div>Recebido: <strong className="font-mono">{totalRecebido}</strong></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogReceber({ pedido, onClose }: { pedido: PedidoCompra | null; onClose: () => void }) {
  const { data: itens, isLoading } = useItensPedido(pedido?.id ?? null);
  const receber = useReceberPedido();
  const [recs, setRecs] = useState<Record<string, number>>({});
  const [dataVenc, setDataVenc] = useState('');

  useEffect(() => {
    if (!itens) return;
    const init: Record<string, number> = {};
    for (const it of itens) {
      init[it.id] = Math.max(0, Number(it.quantidade) - Number(it.quantidade_recebida));
    }
    setRecs(init);
  }, [itens]);

  if (!pedido) return null;

  async function confirmar() {
    if (!itens) return;
    const recebimentos = itens.map((it) => ({
      item_id: it.id,
      produto_id: it.produto_id,
      quantidade: recs[it.id] ?? 0,
      custo_unitario: Number(it.custo_unitario),
      total_anterior: Number(it.quantidade_recebida),
      quantidade_pedida: Number(it.quantidade),
    }));
    if (recebimentos.every((r) => r.quantidade === 0)) {
      toast.error('Informe ao menos uma quantidade');
      return;
    }
    try {
      await receber.mutateAsync({ pedido: pedido!, recebimentos, data_vencimento: dataVenc || null });
      toast.success('Recebimento registrado');
      onClose();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <Dialog open={!!pedido} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Receber pedido #{pedido.numero}</DialogTitle></DialogHeader>
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">Carregando itens...</div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Pedido</TableHead>
                    <TableHead className="text-right">Já recebido</TableHead>
                    <TableHead className="w-32">Receber agora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens?.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.produto?.nome ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{Number(it.quantidade)}</TableCell>
                      <TableCell className="text-right font-mono">{Number(it.quantidade_recebida)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          value={recs[it.id] ?? 0}
                          onChange={(e) => setRecs((r) => ({ ...r, [it.id]: Number(e.target.value) || 0 }))}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-2">
              <Label>Vencimento parcela PAGAR (se totalizar recebimento)</Label>
              <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Ao receber tudo, será gerada uma parcela PAGAR neste vencimento. Deixe em branco para não gerar.
              </p>
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={confirmar} disabled={receber.isPending}>
            <PackageCheck className="mr-2 h-4 w-4" /> Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
