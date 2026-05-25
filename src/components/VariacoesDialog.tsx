import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarcodeInput } from '@/components/BarcodeInput';
import { useDeleteVariacao, useUpsertVariacao, useVariacoes } from '@/hooks/useVariacoes';
import { formatCurrency } from '@/lib/utils';
import type { Produto, VariacaoProduto } from '@/types/database';

interface VariacoesDialogProps {
  produto: Produto | null;
  onClose: () => void;
}

const EMPTY: Partial<VariacaoProduto> = {
  nome: '', sku: '', codigo_barras: '', cor: '', tamanho: '', fragrancia: '', voltagem: '',
  custo_adicional: 0, preco_adicional: 0,
};

export function VariacoesDialog({ produto, onClose }: VariacoesDialogProps) {
  const { data, isLoading } = useVariacoes(produto?.id ?? null);
  const upsert = useUpsertVariacao();
  const del = useDeleteVariacao(produto?.id ?? null);
  const [form, setForm] = useState<Partial<VariacaoProduto>>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!produto) { setForm(EMPTY); setEditingId(null); }
  }, [produto]);

  if (!produto) return null;

  function patch<K extends keyof VariacaoProduto>(k: K, v: VariacaoProduto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function startEdit(v: VariacaoProduto) {
    setEditingId(v.id);
    setForm({
      nome: v.nome,
      sku: v.sku,
      codigo_barras: v.codigo_barras,
      cor: v.cor,
      tamanho: v.tamanho,
      fragrancia: v.fragrancia,
      voltagem: v.voltagem,
      custo_adicional: v.custo_adicional,
      preco_adicional: v.preco_adicional,
    });
  }

  async function salvar() {
    if (!form.nome?.trim()) { toast.error('Nome da variação obrigatório'); return; }
    try {
      await upsert.mutateAsync({
        ...form,
        produto_id: produto!.id,
        nome: form.nome,
        sku: form.sku || null,
        codigo_barras: form.codigo_barras || null,
        cor: form.cor || null,
        tamanho: form.tamanho || null,
        fragrancia: form.fragrancia || null,
        voltagem: form.voltagem || null,
        custo_adicional: Number(form.custo_adicional) || 0,
        preco_adicional: Number(form.preco_adicional) || 0,
        id: editingId ?? undefined,
      });
      toast.success(editingId ? 'Variação atualizada' : 'Variação criada');
      resetForm();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function remover(id: string) {
    if (!confirm('Excluir variação?')) return;
    try { await del.mutateAsync(id); toast.success('Excluída'); if (editingId === id) resetForm(); }
    catch (e) { toast.error((e as Error).message); }
  }

  const precoBase = Number(produto.preco_venda_padrao);
  const custoBase = Number(produto.custo_aquisicao);

  return (
    <Dialog open={!!produto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Variações — {produto.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Atributos</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Preço final</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem variações</TableCell></TableRow>
                )}
                {data?.map((v) => {
                  const attrs = [v.cor, v.tamanho, v.fragrancia, v.voltagem].filter(Boolean).join(' · ');
                  const precoFinal = precoBase + Number(v.preco_adicional);
                  return (
                    <TableRow key={v.id} className={editingId === v.id ? 'bg-accent/40' : ''}>
                      <TableCell className="font-medium">{v.nome}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{attrs || '—'}</TableCell>
                      <TableCell>{v.sku ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(precoFinal)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => startEdit(v)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => remover(v.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="text-sm font-medium">{editingId ? 'Editar variação' : 'Nova variação'}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-3">
                <Label className="text-xs">Nome *</Label>
                <Input value={form.nome ?? ''} onChange={(e) => patch('nome', e.target.value)} placeholder="ex: Vermelho M, Frasco 50ml" />
              </div>
              <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={form.sku ?? ''} onChange={(e) => patch('sku', e.target.value)} /></div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Código de barras</Label>
                <BarcodeInput
                  value={form.codigo_barras ?? ''}
                  onChange={(v) => patch('codigo_barras', v)}
                  onScan={(code) => { patch('codigo_barras', code); toast.success(`Lido: ${code}`); }}
                  placeholder="Escaneie ou digite"
                />
              </div>
              <div className="space-y-1"><Label className="text-xs">Cor</Label><Input value={form.cor ?? ''} onChange={(e) => patch('cor', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Tamanho</Label><Input value={form.tamanho ?? ''} onChange={(e) => patch('tamanho', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Fragrância</Label><Input value={form.fragrancia ?? ''} onChange={(e) => patch('fragrancia', e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Voltagem</Label><Input value={form.voltagem ?? ''} onChange={(e) => patch('voltagem', e.target.value)} placeholder="110V / 220V / Bivolt" /></div>
              <div className="space-y-1">
                <Label className="text-xs">+ Custo</Label>
                <Input type="number" step="0.01" value={form.custo_adicional ?? 0}
                  onChange={(e) => patch('custo_adicional', Number(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Final: {formatCurrency(custoBase + Number(form.custo_adicional ?? 0))}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">+ Preço</Label>
                <Input type="number" step="0.01" value={form.preco_adicional ?? 0}
                  onChange={(e) => patch('preco_adicional', Number(e.target.value) || 0)} />
                <p className="text-[10px] text-muted-foreground">Final: {formatCurrency(precoBase + Number(form.preco_adicional ?? 0))}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              {editingId && <Button variant="outline" size="sm" onClick={resetForm}>Cancelar edição</Button>}
              <Button size="sm" onClick={salvar} disabled={upsert.isPending}>
                <Plus className="mr-2 h-4 w-4" /> {editingId ? 'Salvar alterações' : 'Adicionar variação'}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
