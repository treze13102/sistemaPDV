import { useMemo, useState } from 'react';
import { Plus, AlertTriangle, Search, ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEstoqueSaldo, useCriarMovimento } from '@/hooks/useEstoque';
import { lookupProdutoByBarcode, useProdutos } from '@/hooks/useProdutos';
import { BarcodeInput } from '@/components/BarcodeInput';
import type { LocalizacaoEstoque, MovimentoTipo } from '@/types/database';

type TipoMovimentoForm = Exclude<MovimentoTipo, 'SAIDA_VENDA'>;

const LOCAIS: LocalizacaoEstoque[] = ['Loja', 'Deposito', 'Fabrica3D', 'Consignado'];
const TIPOS: { value: TipoMovimentoForm; label: string; sign: 1 | -1 }[] = [
  { value: 'ENTRADA_COMPRA', label: 'Entrada — Compra', sign: 1 },
  { value: 'ENTRADA_PRODUCAO', label: 'Entrada — Produção', sign: 1 },
  { value: 'SAIDA_PERDA', label: 'Saída — Perda/Quebra', sign: -1 },
  { value: 'AJUSTE_INVENTARIO', label: 'Ajuste de Inventário', sign: 1 },
];

const schema = z.object({
  produto_id: z.string().min(1, 'Selecione um produto'),
  tipo: z.enum(['ENTRADA_COMPRA', 'ENTRADA_PRODUCAO', 'SAIDA_PERDA', 'AJUSTE_INVENTARIO']),
  quantidade: z.coerce.number().refine((n) => n !== 0, 'Quantidade não pode ser zero'),
  localizacao: z.enum(['Loja', 'Deposito', 'Fabrica3D', 'Consignado']),
  custo_unitario: z.coerce.number().nullable().optional(),
  observacao: z.string().nullable().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function Estoque() {
  const { data, isLoading } = useEstoqueSaldo();
  const produtos = useProdutos();
  const criar = useCriarMovimento();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      produto_id: '',
      tipo: 'ENTRADA_COMPRA',
      quantidade: 0,
      localizacao: 'Loja',
      custo_unitario: null,
      observacao: '',
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(
      (l) => l.produto.nome.toLowerCase().includes(s) || (l.produto.sku ?? '').toLowerCase().includes(s)
    );
  }, [data, search]);

  const alertas = useMemo(() => {
    return (data ?? []).filter((l) => {
      const minimo = Number(l.produto.estoque_minimo ?? 0);
      return minimo > 0 && l.saldo <= minimo && l.produto.status === 'ativo';
    });
  }, [data]);

  async function onSubmit(v: FormOutput) {
    try {
      const tipoInfo = TIPOS.find((t) => t.value === v.tipo);
      // Para ajuste, quantidade pode ser positiva (entrada) ou negativa (saída) conforme valor digitado
      // Para entrada, força positivo; para saída, força negativo
      let qtd = Math.abs(v.quantidade);
      if (tipoInfo?.sign === -1) qtd = -qtd;
      if (v.tipo === 'AJUSTE_INVENTARIO') qtd = v.quantidade;

      await criar.mutateAsync({
        produto_id: v.produto_id,
        tipo: v.tipo,
        quantidade: qtd,
        localizacao: v.localizacao,
        custo_unitario: v.custo_unitario ?? null,
        observacao: v.observacao ?? null,
      });
      toast.success('Movimento registrado');
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Saldo por produto e movimentos"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo movimento
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {alertas.length > 0 && (
          <Card className="border-primary/35 bg-[linear-gradient(135deg,rgba(212,180,111,0.14),rgba(127,29,29,0.16))]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </span>
                <span>
                  {alertas.length} produto(s) abaixo do estoque minimo
                  <span className="block text-xs font-normal text-muted-foreground">
                    Revise reposicao e transferencias para evitar ruptura no PDV.
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {alertas.slice(0, 6).map((a) => (
                  <div key={`${a.produto_id}-${a.localizacao}`} className="rounded-md border border-[var(--royal-line)] bg-background/45 p-3 text-sm">
                    <div className="truncate font-medium text-foreground">{a.produto.nome}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{a.localizacao}</span>
                      <span>saldo <strong className="text-primary">{a.saldo}</strong> / minimo {a.produto.estoque_minimo}</span>
                    </div>
                  </div>
                ))}
                {alertas.length > 6 && (
                  <div className="rounded-md border border-dashed border-[var(--royal-line)] bg-background/25 p-3 text-sm text-muted-foreground">
                    mais {alertas.length - 6} produto(s) em alerta
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
              {filtered.map((l) => {
                const minimo = Number(l.produto.estoque_minimo ?? 0);
                const baixo = minimo > 0 && l.saldo <= minimo;
                return (
                  <TableRow key={`${l.produto_id}-${l.localizacao}-${l.variacao_id ?? ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                          {l.produto.imagem_url ? (
                            <img src={l.produto.imagem_url} alt={l.produto.nome} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{l.produto.nome}</div>
                          <div className="text-xs text-muted-foreground">{l.produto.status}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{l.produto.sku ?? '—'}</TableCell>
                    <TableCell>{l.localizacao}</TableCell>
                    <TableCell className={`text-right font-mono ${baixo ? 'font-bold text-primary' : ''}`}>
                      {l.saldo}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{minimo || '—'}</TableCell>
                    <TableCell>
                      {baixo ? (
                        <span className="inline-flex items-center rounded border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Abaixo do minimo</span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-green-500/25 bg-green-500/10 px-2 py-1 text-xs text-green-400">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo movimento de estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Produto *</Label>
              <BarcodeInput
                placeholder="Escaneie código de barras ou SKU para selecionar"
                onScan={async (code) => {
                  try {
                    const p = await lookupProdutoByBarcode(code);
                    if (p) {
                      form.setValue('produto_id', p.id);
                      toast.success(`Selecionado: ${p.nome}`);
                    } else {
                      toast.error(`Sem produto para "${code}"`);
                    }
                  } catch (e) { toast.error((e as Error).message); }
                }}
                clearOnScan
              />
              <Select value={form.watch('produto_id')} onValueChange={(v) => form.setValue('produto_id', v)}>
                <SelectTrigger><SelectValue placeholder="Ou selecione na lista..." /></SelectTrigger>
                <SelectContent>
                  {produtos.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}{p.sku ? ` (${p.sku})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.produto_id && <p className="text-sm text-destructive">{form.formState.errors.produto_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.watch('tipo')} onValueChange={(v) => form.setValue('tipo', v as FormInput['tipo'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Localização *</Label>
              <Select value={form.watch('localizacao')} onValueChange={(v) => form.setValue('localizacao', v as LocalizacaoEstoque)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade *</Label>
              <Input type="number" step="0.001" {...form.register('quantidade')} />
              <p className="text-xs text-muted-foreground">
                Para ajuste de inventário use sinal: positivo para entrada, negativo para baixa.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Custo unitário</Label>
              <Input type="number" step="0.01" {...form.register('custo_unitario')} />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Observação</Label>
              <Textarea {...form.register('observacao')} placeholder="Motivo, NF, contagem, etc." />
            </div>

            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={criar.isPending}>Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
