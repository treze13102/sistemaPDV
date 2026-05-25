import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Calculator, Layers, History, Camera, ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarcodeInput } from '@/components/BarcodeInput';
import { VariacoesDialog } from '@/components/VariacoesDialog';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteProduto, useHistoricoPreco, useProdutos, useUpsertProduto } from '@/hooks/useProdutos';
import { useCategorias } from '@/hooks/useCategorias';
import { useFornecedores } from '@/hooks/useFornecedores';
import { formatCurrency } from '@/lib/utils';
import type { Produto, ProdutoStatus } from '@/types/database';

const schema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  sku: z.string().nullable().optional(),
  codigo_barras: z.string().nullable().optional(),
  descricao_curta: z.string().nullable().optional(),
  descricao_detalhada: z.string().nullable().optional(),
  categoria_id: z.string().nullable().optional(),
  fornecedor_principal_id: z.string().nullable().optional(),
  unidade_medida: z.string().default('UN'),
  custo_aquisicao: z.coerce.number().min(0),
  preco_venda_padrao: z.coerce.number().min(0),
  margem_desejada_percentual: z.coerce.number().nullable().optional(),
  estoque_minimo: z.coerce.number().nullable().optional(),
  estoque_maximo: z.coerce.number().nullable().optional(),
  ponto_reposicao: z.coerce.number().nullable().optional(),
  status: z.enum(['ativo', 'inativo']),
  canal_loja_fisica: z.boolean(),
  canal_ecommerce: z.boolean(),
  canal_marketplace_x: z.boolean(),
  canal_marketplace_y: z.boolean(),
  is_item_3d: z.boolean(),
  imagem_url: z.string().nullable().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

function calcularPrecoPorMargemLucro(custo: number, margemPct: number): number | null {
  if (custo <= 0 || margemPct <= 0 || margemPct >= 100) return null;
  return +(custo / (1 - margemPct / 100)).toFixed(2);
}

function calcularMargemLucroPct(custo: number, preco: number): number | null {
  if (custo <= 0 || preco <= 0) return null;
  return ((preco - custo) / preco) * 100;
}

const DEFAULTS: FormInput = {
  nome: '',
  sku: '',
  codigo_barras: '',
  descricao_curta: '',
  descricao_detalhada: '',
  categoria_id: null,
  fornecedor_principal_id: null,
  unidade_medida: 'UN',
  custo_aquisicao: 0,
  preco_venda_padrao: 0,
  margem_desejada_percentual: null,
  estoque_minimo: null,
  estoque_maximo: null,
  ponto_reposicao: null,
  status: 'ativo',
  canal_loja_fisica: true,
  canal_ecommerce: false,
  canal_marketplace_x: false,
  canal_marketplace_y: false,
  is_item_3d: false,
  imagem_url: '',
};

export default function Produtos() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useProdutos(search);
  const cats = useCategorias();
  const forns = useFornecedores();
  const upsert = useUpsertProduto();
  const del = useDeleteProduto();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [variacoesTarget, setVariacoesTarget] = useState<Produto | null>(null);
  const [historicoTarget, setHistoricoTarget] = useState<Produto | null>(null);

  const form = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema), defaultValues: DEFAULTS });

  // Auto-cálculo de preço: custo * (1 + margem/100). Toggle p/ não sobrescrever quando usuário edita preço manualmente
  const autoPrecoRef = useRef(true);
  const custoW = form.watch('custo_aquisicao');
  const margemW = form.watch('margem_desejada_percentual');
  const categoriaW = form.watch('categoria_id');

  useEffect(() => {
    if (!autoPrecoRef.current) return;
    const custo = Number(custoW) || 0;
    const margem = Number(margemW);
    if (!Number.isFinite(margem) || margem === 0) return;
    const novo = calcularPrecoPorMargemLucro(custo, margem);
    if (novo !== null && novo > 0) form.setValue('preco_venda_padrao', novo as never, { shouldDirty: true });
  }, [custoW, margemW, form]);

  // Quando muda categoria e margem está vazia, sugerir markup_minimo_pct
  useEffect(() => {
    if (!categoriaW) return;
    const cat = cats.data?.find((c) => c.id === categoriaW);
    if (!cat?.markup_minimo_pct) return;
    const atual = form.getValues('margem_desejada_percentual');
    if (atual === null || atual === undefined || Number(atual) === 0) {
      form.setValue('margem_desejada_percentual', cat.markup_minimo_pct as never, { shouldDirty: true });
    }
  }, [categoriaW, cats.data, form]);

  function openNew() {
    setEditing(null);
    autoPrecoRef.current = true;
    form.reset(DEFAULTS);
    setOpen(true);
  }
  function openEdit(p: Produto) {
    setEditing(p);
    autoPrecoRef.current = false; // não recalcular ao abrir produto existente
    form.reset({
      nome: p.nome,
      sku: p.sku ?? '',
      codigo_barras: p.codigo_barras ?? '',
      descricao_curta: p.descricao_curta ?? '',
      descricao_detalhada: p.descricao_detalhada ?? '',
      categoria_id: p.categoria_id,
      fornecedor_principal_id: p.fornecedor_principal_id,
      unidade_medida: p.unidade_medida || 'UN',
      custo_aquisicao: Number(p.custo_aquisicao),
      preco_venda_padrao: Number(p.preco_venda_padrao),
      margem_desejada_percentual: p.margem_desejada_percentual,
      estoque_minimo: p.estoque_minimo,
      estoque_maximo: p.estoque_maximo,
      ponto_reposicao: p.ponto_reposicao,
      status: p.status,
      canal_loja_fisica: p.canal_loja_fisica,
      canal_ecommerce: p.canal_ecommerce,
      canal_marketplace_x: p.canal_marketplace_x,
      canal_marketplace_y: p.canal_marketplace_y,
      is_item_3d: p.is_item_3d,
      imagem_url: p.imagem_url ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(v: FormOutput) {
    try {
      let justificativa: string | undefined;
      // Se editando e preço mudou, exige justificativa
      if (editing) {
        const precoAnterior = Number(editing.preco_venda_padrao);
        const precoNovo = Number(v.preco_venda_padrao);
        if (precoNovo !== precoAnterior && precoAnterior > 0) {
          const variacao = Math.abs(((precoNovo - precoAnterior) / precoAnterior) * 100);
          const msg = variacao > 20
            ? `Variação de ${variacao.toFixed(1)}% (>20%). Informe justificativa (auditoria + aprovação):`
            : `Alteração de preço de ${precoAnterior.toFixed(2)} para ${precoNovo.toFixed(2)}. Justificativa:`;
          const just = prompt(msg);
          if (just === null) return; // cancelado
          if (!just.trim()) { toast.error('Justificativa obrigatória'); return; }
          justificativa = just.trim();
        }
      }
      await upsert.mutateAsync({
        ...v,
        sku: v.sku || null,
        codigo_barras: v.codigo_barras || null,
        imagem_url: v.imagem_url || null,
        categoria_id: v.categoria_id || null,
        fornecedor_principal_id: v.fornecedor_principal_id || null,
        id: editing?.id,
        _justificativa: justificativa,
      });
      toast.success(editing ? 'Produto atualizado' : 'Produto criado');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  async function onDelete(id: string) {
    if (!confirm('Excluir produto? Movimentos vinculados podem ser bloqueados.')) return;
    try { await del.mutateAsync(id); toast.success('Excluído'); }
    catch (e) { toast.error((e as Error).message); }
  }

  function handleImagemArquivo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Use ate 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      form.setValue('imagem_url', String(reader.result), { shouldDirty: true });
      toast.success('Imagem adicionada');
    };
    reader.onerror = () => toast.error('Nao foi possivel ler a imagem');
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos"
        actions={<Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo produto</Button>}
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, SKU ou código de barras..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum produto</TableCell></TableRow>
              )}
              {data?.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    {p.nome}
                    {p.is_item_3d && <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-xs">3D</span>}
                  </TableCell>
                  <TableCell>{p.sku ?? '—'}</TableCell>
                  <TableCell>{p.categoria?.nome ?? '—'}</TableCell>
                  <TableCell>{formatCurrency(Number(p.custo_aquisicao))}</TableCell>
                  <TableCell>{formatCurrency(Number(p.preco_venda_padrao))}</TableCell>
                  <TableCell>
                    <span className={p.status === 'ativo' ? 'text-green-600' : 'text-muted-foreground'}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" title="Variações" onClick={() => setVariacoesTarget(p)}>
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Histórico preço" onClick={() => setHistoricoTarget(p)}>
                      <History className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" title="Excluir" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-3">
              <Label>Nome *</Label>
              <Input {...form.register('nome')} />
              {form.formState.errors.nome && <p className="text-sm text-destructive">{form.formState.errors.nome.message}</p>}
            </div>
            <div className="space-y-2"><Label>SKU</Label><Input {...form.register('sku')} /></div>
            <div className="space-y-2">
              <Label>Código de barras</Label>
              <BarcodeInput
                value={form.watch('codigo_barras') ?? ''}
                onChange={(v) => form.setValue('codigo_barras', v)}
                onScan={(code) => {
                  form.setValue('codigo_barras', code);
                  toast.success(`Código lido: ${code}`);
                }}
                placeholder="Escaneie ou digite"
              />
            </div>
            <div className="space-y-2"><Label>Unidade</Label><Input {...form.register('unidade_medida')} /></div>

            <div className="space-y-2 col-span-3">
              <Label>Descrição curta</Label>
              <Input {...form.register('descricao_curta')} />
            </div>
            <div className="space-y-2 col-span-3">
              <Label>Descrição detalhada</Label>
              <Textarea {...form.register('descricao_detalhada')} />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.watch('categoria_id') ?? '__none__'}
                onValueChange={(v) => form.setValue('categoria_id', v === '__none__' ? null : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem categoria —</SelectItem>
                  {cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Fornecedor principal</Label>
              <Select
                value={form.watch('fornecedor_principal_id') ?? '__none__'}
                onValueChange={(v) => form.setValue('fornecedor_principal_id', v === '__none__' ? null : v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Sem fornecedor —</SelectItem>
                  {forns.data?.map((f) => <SelectItem key={f.id} value={f.id}>{f.razao_social}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custo aquisição *</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('custo_aquisicao', {
                  onChange: () => { autoPrecoRef.current = true; },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem de lucro desejada (%)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="ex: 80"
                {...form.register('margem_desejada_percentual', {
                  onChange: () => { autoPrecoRef.current = true; },
                })}
              />
              <p className="text-xs text-muted-foreground">
                Margem sobre o preco de venda. Ex.: custo 60 e margem 40% resulta em preco 100.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preço venda *</Label>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const custo = Number(form.getValues('custo_aquisicao')) || 0;
                    const margem = Number(form.getValues('margem_desejada_percentual')) || 0;
                    if (margem === 0) {
                      toast.error('Defina margem antes');
                      return;
                    }
                    if (margem >= 100) {
                      toast.error('Margem de lucro deve ser menor que 100%');
                      return;
                    }
                    autoPrecoRef.current = true;
                    const novo = calcularPrecoPorMargemLucro(custo, margem);
                    if (novo) form.setValue('preco_venda_padrao', novo as never);
                  }}
                  title="Recalcular preço pela margem"
                >
                  <Calculator className="h-3 w-3" /> auto
                </button>
              </div>
              <Input
                type="number"
                step="0.01"
                {...form.register('preco_venda_padrao', {
                  onChange: () => { autoPrecoRef.current = false; },
                })}
              />
              {(() => {
                const custo = Number(form.watch('custo_aquisicao')) || 0;
                const preco = Number(form.watch('preco_venda_padrao')) || 0;
                if (custo > 0 && preco > 0) {
                  const margem = calcularMargemLucroPct(custo, preco);
                  return (
                    <p className="text-xs text-muted-foreground">
                      Margem de lucro: <strong>{(margem ?? 0).toFixed(1)}%</strong> · Lucro/un: {formatCurrency(preco - custo)}
                    </p>
                  );
                }
                return null;
              })()}
            </div>

            <div className="space-y-2"><Label>Estoque mín.</Label><Input type="number" step="0.001" {...form.register('estoque_minimo')} /></div>
            <div className="space-y-2"><Label>Estoque máx.</Label><Input type="number" step="0.001" {...form.register('estoque_maximo')} /></div>
            <div className="space-y-2"><Label>Ponto reposição</Label><Input type="number" step="0.001" {...form.register('ponto_reposicao')} /></div>

            <div className="space-y-3 col-span-2">
              <Label>Imagem do produto</Label>
              <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded border bg-muted">
                  {form.watch('imagem_url') ? (
                    <img src={form.watch('imagem_url') ?? ''} alt="Produto" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <Input {...form.register('imagem_url')} placeholder="https://... ou imagem capturada" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <Camera className="mr-2 h-4 w-4" />
                        Tirar foto
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleImagemArquivo(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <label className="cursor-pointer">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Enviar imagem
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImagemArquivo(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </Button>
                    {form.watch('imagem_url') && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => form.setValue('imagem_url', '', { shouldDirty: true })}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch('status')} onValueChange={(v) => form.setValue('status', v as ProdutoStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3 space-y-2 border-t pt-4">
              <Label className="text-base">Canais de venda</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {[
                  ['canal_loja_fisica', 'Loja física'],
                  ['canal_ecommerce', 'E-commerce'],
                  ['canal_marketplace_x', 'Marketplace X'],
                  ['canal_marketplace_y', 'Marketplace Y'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.watch(key as keyof FormInput) as boolean}
                      onCheckedChange={(v) => form.setValue(key as keyof FormInput, !!v as never)}
                    />
                    {label}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch('is_item_3d')}
                    onCheckedChange={(v) => form.setValue('is_item_3d', !!v)}
                  />
                  Item 3D
                </label>
              </div>
            </div>

            <DialogFooter className="col-span-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={upsert.isPending}>Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <VariacoesDialog produto={variacoesTarget} onClose={() => setVariacoesTarget(null)} />
      <HistoricoPrecoDialog produto={historicoTarget} onClose={() => setHistoricoTarget(null)} />
    </>
  );
}

function HistoricoPrecoDialog({ produto, onClose }: { produto: Produto | null; onClose: () => void }) {
  const { data, isLoading } = useHistoricoPreco(produto?.id ?? null);
  if (!produto) return null;
  return (
    <Dialog open={!!produto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de preço — {produto.nome}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">De</TableHead>
                <TableHead className="text-right">Para</TableHead>
                <TableHead className="text-right">Var.</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Justificativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">...</TableCell></TableRow>}
              {!isLoading && (data?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem alterações registradas</TableCell></TableRow>
              )}
              {data?.map((h) => {
                const subiu = h.variacao_pct > 0;
                return (
                  <TableRow key={h.id}>
                    <TableCell className="text-xs">{new Date(h.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(h.preco_anterior))}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(Number(h.preco_novo))}</TableCell>
                    <TableCell className={`text-right font-mono ${subiu ? 'text-green-700' : 'text-red-700'}`}>
                      {subiu ? '+' : ''}{Number(h.variacao_pct).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-xs">{h.usuario?.nome ?? '—'}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={h.justificativa ?? ''}>{h.justificativa ?? '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
