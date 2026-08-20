import { useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, Clock, Search, ImageIcon, Pencil, Copy, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAtualizarValidadeMovimento, useDividirLoteValidade, useEstoqueSaldo, useCriarMovimento, useCriarMovimentos, useLotesProximosValidade, useMovimentosEstoque, type SaldoLinha } from '@/hooks/useEstoque';
import { lookupProdutoByBarcode, useDeleteProduto, useHistoricoPreco, useProdutos, useUpsertProduto } from '@/hooks/useProdutos';
import { useCategorias } from '@/hooks/useCategorias';
import { BarcodeInput } from '@/components/BarcodeInput';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { LocalizacaoEstoque, MovimentoTipo, Produto, ProdutoStatus } from '@/types/database';

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
  data_validade: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
});
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

// Tipos de entrada — únicos em que faz sentido registrar validade dos itens recebidos
const TIPOS_ENTRADA_VALIDADE: TipoMovimentoForm[] = ['ENTRADA_COMPRA', 'ENTRADA_PRODUCAO'];

export function EstoquePanel() {
  const { data, isLoading } = useEstoqueSaldo();
  const lotesValidade = useLotesProximosValidade();
  const produtos = useProdutos();
  const categorias = useCategorias();
  const criarProduto = useUpsertProduto();
  const deletarProduto = useDeleteProduto();
  const criar = useCriarMovimento();
  const criarLote = useCriarMovimentos();
  const atualizarValidade = useAtualizarValidadeMovimento();
  const dividirLote = useDividirLoteValidade();
  const [divisaoLote, setDivisaoLote] = useState<{ id: string; datas: string[] } | null>(null);
  const [search, setSearch] = useState('');
  const [produtoSearch, setProdutoSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [novoProdutoOpen, setNovoProdutoOpen] = useState(false);
  const [novoProduto, setNovoProduto] = useState({ nome: '', sku: '', custo: 0, preco: 0 });
  const [produtoDetalhe, setProdutoDetalhe] = useState<SaldoLinha | null>(null);
  const [editProduto, setEditProduto] = useState<Produto | null>(null);
  const [excluirProduto, setExcluirProduto] = useState<Produto | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    sku: '',
    codigo_barras: '',
    categoria_id: '',
    custo_aquisicao: 0,
    preco_venda_padrao: 0,
    estoque_minimo: 0,
    status: 'ativo' as ProdutoStatus,
  });
  const [validadeIndividual, setValidadeIndividual] = useState(false);
  const [validadesPorUnidade, setValidadesPorUnidade] = useState<string[]>([]);
  const movimentosProduto = useMovimentosEstoque(produtoDetalhe?.produto_id);
  const movimentosEdicao = useMovimentosEstoque(editProduto?.id);
  const lotesComValidade = useMemo(
    () => (movimentosEdicao.data ?? []).filter((m) => Number(m.quantidade) > 0),
    [movimentosEdicao.data],
  );
  const historicoPreco = useHistoricoPreco(produtoDetalhe?.produto_id ?? null);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      produto_id: '',
      tipo: 'ENTRADA_COMPRA',
      quantidade: 0,
      localizacao: 'Loja',
      custo_unitario: null,
      data_validade: null,
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

  const produtosMovimento = useMemo(() => {
    const lista = produtos.data ?? [];
    const termo = produtoSearch.trim().toLowerCase();
    if (!termo) return lista.slice(0, 25);
    return lista
      .filter((p) =>
        [p.nome, p.sku, p.codigo_barras]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo)),
      )
      .slice(0, 25);
  }, [produtos.data, produtoSearch]);

  const alertas = useMemo(() => {
    return (data ?? []).filter((l) => {
      const minimo = Number(l.produto.estoque_minimo ?? 0);
      return minimo > 0 && l.saldo <= minimo && l.produto.status === 'ativo';
    });
  }, [data]);

  const tipoAtual = form.watch('tipo');
  const quantidadeAtual = Number(form.watch('quantidade') ?? 0);
  const permiteValidade = TIPOS_ENTRADA_VALIDADE.includes(tipoAtual);
  const unidadesInteiras = Number.isInteger(quantidadeAtual) && quantidadeAtual > 1;

  useEffect(() => {
    if (!validadeIndividual) return;
    if (!unidadesInteiras) {
      setValidadeIndividual(false);
      return;
    }
    ajustarQuantidadeValidades(quantidadeAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantidadeAtual, unidadesInteiras, validadeIndividual]);

  function ajustarQuantidadeValidades(qtd: number) {
    setValidadesPorUnidade((prev) => {
      const alvo = Number.isInteger(qtd) && qtd > 0 ? qtd : 0;
      if (alvo === prev.length) return prev;
      if (alvo < prev.length) return prev.slice(0, alvo);
      return [...prev, ...Array(alvo - prev.length).fill('')];
    });
  }

  async function onSubmit(v: FormOutput) {
    try {
      const tipoInfo = TIPOS.find((t) => t.value === v.tipo);
      // Para ajuste, quantidade pode ser positiva (entrada) ou negativa (saída) conforme valor digitado
      // Para entrada, força positivo; para saída, força negativo
      let qtd = Math.abs(v.quantidade);
      if (tipoInfo?.sign === -1) qtd = -qtd;
      if (v.tipo === 'AJUSTE_INVENTARIO') qtd = v.quantidade;

      const usaValidadeIndividual = permiteValidade && validadeIndividual && Number.isInteger(qtd) && qtd > 1;

      if (usaValidadeIndividual) {
        const linhas = validadesPorUnidade.slice(0, qtd);
        await criarLote.mutateAsync(
          Array.from({ length: qtd }, (_, i) => ({
            produto_id: v.produto_id,
            tipo: v.tipo,
            quantidade: 1,
            localizacao: v.localizacao,
            custo_unitario: v.custo_unitario ?? null,
            data_validade: linhas[i] || null,
            observacao: v.observacao ?? null,
          })),
        );
      } else {
        await criar.mutateAsync({
          produto_id: v.produto_id,
          tipo: v.tipo,
          quantidade: qtd,
          localizacao: v.localizacao,
          custo_unitario: v.custo_unitario ?? null,
          data_validade: permiteValidade ? (v.data_validade || null) : null,
          observacao: v.observacao ?? null,
        });
      }
      toast.success('Movimento registrado');
      setOpen(false);
      form.reset();
      setValidadeIndividual(false);
      setValidadesPorUnidade([]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function criarNovoProdutoRapido() {
    const nome = novoProduto.nome.trim();
    if (!nome) {
      toast.error('Informe o nome do produto');
      return;
    }
    try {
      const criado = await criarProduto.mutateAsync({
        nome,
        sku: novoProduto.sku.trim() || null,
        custo_aquisicao: novoProduto.custo || 0,
        preco_venda_padrao: novoProduto.preco || 0,
        status: 'ativo',
      });
      form.setValue('produto_id', criado.id, { shouldDirty: true, shouldValidate: true });
      setProdutoSearch(criado.nome);
      setNovoProduto({ nome: '', sku: '', custo: 0, preco: 0 });
      setNovoProdutoOpen(false);
      toast.success('Produto cadastrado e selecionado');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function abrirEdicao(produtoId: string) {
    const full = produtos.data?.find((p) => p.id === produtoId);
    if (!full) {
      toast.error('Produto nao encontrado. Aguarde o carregamento.');
      return;
    }
    setEditForm({
      nome: full.nome ?? '',
      sku: full.sku ?? '',
      codigo_barras: full.codigo_barras ?? '',
      categoria_id: full.categoria_id ?? '',
      custo_aquisicao: Number(full.custo_aquisicao ?? 0),
      preco_venda_padrao: Number(full.preco_venda_padrao ?? 0),
      estoque_minimo: Number(full.estoque_minimo ?? 0),
      status: full.status ?? 'ativo',
    });
    setEditProduto(full);
  }

  async function salvarEdicao() {
    if (!editProduto) return;
    const nome = editForm.nome.trim();
    if (!nome) {
      toast.error('Informe o nome do produto');
      return;
    }
    try {
      await criarProduto.mutateAsync({
        id: editProduto.id,
        nome,
        sku: editForm.sku.trim() || null,
        codigo_barras: editForm.codigo_barras.trim() || null,
        categoria_id: editForm.categoria_id || null,
        custo_aquisicao: editForm.custo_aquisicao || 0,
        preco_venda_padrao: editForm.preco_venda_padrao || 0,
        estoque_minimo: editForm.estoque_minimo || 0,
        status: editForm.status,
      });
      toast.success('Produto atualizado');
      setEditProduto(null);
      setProdutoDetalhe(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function clonarProduto(produtoId: string) {
    const full = produtos.data?.find((p) => p.id === produtoId);
    if (!full) {
      toast.error('Produto nao encontrado. Aguarde o carregamento.');
      return;
    }
    try {
      const novo = await criarProduto.mutateAsync({
        nome: `${full.nome} (cópia)`,
        // SKU e código de barras são únicos — não copiar
        categoria_id: full.categoria_id ?? null,
        descricao_curta: full.descricao_curta ?? null,
        descricao_detalhada: full.descricao_detalhada ?? null,
        unidade_medida: full.unidade_medida,
        fornecedor_principal_id: full.fornecedor_principal_id ?? null,
        custo_aquisicao: Number(full.custo_aquisicao ?? 0),
        preco_venda_padrao: Number(full.preco_venda_padrao ?? 0),
        margem_desejada_percentual: full.margem_desejada_percentual ?? null,
        estoque_minimo: full.estoque_minimo ?? null,
        estoque_maximo: full.estoque_maximo ?? null,
        ponto_reposicao: full.ponto_reposicao ?? null,
        status: full.status,
        canal_loja_fisica: full.canal_loja_fisica,
        canal_ecommerce: full.canal_ecommerce,
        canal_marketplace_x: full.canal_marketplace_x,
        canal_marketplace_y: full.canal_marketplace_y,
        is_item_3d: full.is_item_3d,
        imagem_url: full.imagem_url ?? null,
      });
      toast.success('Produto clonado. Abrindo para edição...');
      setEditForm({
        nome: novo.nome ?? '',
        sku: novo.sku ?? '',
        codigo_barras: novo.codigo_barras ?? '',
        categoria_id: novo.categoria_id ?? '',
        custo_aquisicao: Number(novo.custo_aquisicao ?? 0),
        preco_venda_padrao: Number(novo.preco_venda_padrao ?? 0),
        estoque_minimo: Number(novo.estoque_minimo ?? 0),
        status: novo.status ?? 'ativo',
      });
      setEditProduto(novo);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function confirmarExclusao() {
    if (!excluirProduto) return;
    try {
      await deletarProduto.mutateAsync(excluirProduto.id);
      toast.success('Produto excluído');
      setExcluirProduto(null);
      setProdutoDetalhe(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <div className="space-y-4">
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

        {(lotesValidade.data?.length ?? 0) > 0 && (
          <Card className="border-amber-500/35 bg-[linear-gradient(135deg,rgba(217,119,6,0.14),rgba(127,29,29,0.10))]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </span>
                <span>
                  {lotesValidade.data!.length} lote(s) vencido(s) ou perto da validade
                  <span className="block text-xs font-normal text-muted-foreground">
                    Priorize a venda/uso desses itens para evitar perdas.
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {lotesValidade.data!.slice(0, 6).map((l) => (
                  <div key={l.id} className="rounded-md border border-[var(--royal-line)] bg-background/45 p-3 text-sm">
                    <div className="truncate font-medium text-foreground">{l.produto.nome}</div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{l.localizacao} · qtd {l.quantidade}</span>
                      <span className={l.vencido ? 'font-semibold text-destructive' : 'font-semibold text-amber-500'}>
                        {l.vencido
                          ? `vencido há ${Math.abs(l.dias_restantes)}d`
                          : l.dias_restantes === 0
                            ? 'vence hoje'
                            : `vence em ${l.dias_restantes}d`}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDate(l.data_validade)}</div>
                  </div>
                ))}
                {lotesValidade.data!.length > 6 && (
                  <div className="rounded-md border border-dashed border-[var(--royal-line)] bg-background/25 p-3 text-sm text-muted-foreground">
                    mais {lotesValidade.data!.length - 6} lote(s) em alerta
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 max-w-md flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo movimento
          </Button>
        </div>

        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Custo medio</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Qtd em estoque</TableHead>
                <TableHead>Local</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
              {filtered.map((l) => {
                const minimo = Number(l.produto.estoque_minimo ?? 0);
                const baixo = minimo > 0 && l.saldo <= minimo;
                const custo = Number(l.produto.custo_medio_compra ?? l.produto.custo_aquisicao ?? 0);
                const preco = Number(l.produto.preco_venda_padrao ?? 0);
                const lucro = preco - custo;
                return (
                  <TableRow
                    key={`${l.produto_id}-${l.localizacao}-${l.variacao_id ?? ''}`}
                    className="cursor-pointer"
                    onClick={() => setProdutoDetalhe(l)}
                  >
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
                          {minimo > 0 && (
                            <div className="text-xs text-muted-foreground">mín. {minimo}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{l.produto.sku ?? '—'}</TableCell>
                    <TableCell>{l.produto.categoria?.nome ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(custo)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(preco)}</TableCell>
                    <TableCell className={`text-right font-mono ${lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(lucro)}
                    </TableCell>
                    <TableCell>
                      {baixo ? (
                        <span className="inline-flex items-center rounded border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Abaixo do mínimo</span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-green-500/25 bg-green-500/10 px-2 py-1 text-xs text-green-400">OK</span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-mono ${baixo ? 'font-bold text-primary' : ''}`}>
                      {l.saldo}
                    </TableCell>
                    <TableCell>{l.localizacao}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirEdicao(l.produto_id);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar produto</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Clonar"
                          disabled={criarProduto.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            clonarProduto(l.produto_id);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Clonar produto</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={(e) => {
                            e.stopPropagation();
                            const full = produtos.data?.find((p) => p.id === l.produto_id);
                            if (full) setExcluirProduto(full);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir produto</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!produtoDetalhe} onOpenChange={(open) => !open && setProdutoDetalhe(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <DialogTitle>Registros do produto</DialogTitle>
              {produtoDetalhe && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => abrirEdicao(produtoDetalhe.produto_id)}>
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={criarProduto.isPending}
                    onClick={() => clonarProduto(produtoDetalhe.produto_id)}
                  >
                    <Copy className="mr-2 h-4 w-4" /> Clonar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      const full = produtos.data?.find((p) => p.id === produtoDetalhe.produto_id);
                      if (full) setExcluirProduto(full);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {produtoDetalhe && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-lg border border-[var(--royal-line)] bg-background/45 p-4 md:flex-row md:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--royal-line)] bg-muted">
                  {produtoDetalhe.produto.imagem_url ? (
                    <img src={produtoDetalhe.produto.imagem_url} alt={produtoDetalhe.produto.nome} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold text-primary">{produtoDetalhe.produto.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    SKU {produtoDetalhe.produto.sku ?? '-'} · {produtoDetalhe.produto.categoria?.nome ?? 'Sem categoria'} · {produtoDetalhe.localizacao}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Custo medio</div>
                    <div className="font-mono font-semibold">{formatCurrency(Number(produtoDetalhe.produto.custo_medio_compra ?? produtoDetalhe.produto.custo_aquisicao ?? 0))}</div>
                  </div>
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Preco venda</div>
                    <div className="font-mono font-semibold text-primary">{formatCurrency(Number(produtoDetalhe.produto.preco_venda_padrao ?? 0))}</div>
                  </div>
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Lucro unit.</div>
                    <div className="font-mono font-semibold text-green-400">
                      {formatCurrency(Number(produtoDetalhe.produto.preco_venda_padrao ?? 0) - Number(produtoDetalhe.produto.custo_medio_compra ?? produtoDetalhe.produto.custo_aquisicao ?? 0))}
                    </div>
                  </div>
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/40 p-3">
                    <div className="text-xs text-muted-foreground">Saldo local</div>
                    <div className="font-mono font-semibold">{produtoDetalhe.saldo}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Registros de estoque</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Custo</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Validade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimentosProduto.isLoading && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                        )}
                        {!movimentosProduto.isLoading && (movimentosProduto.data?.length ?? 0) === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem registros</TableCell></TableRow>
                        )}
                        {movimentosProduto.data?.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>{formatDate(m.data_hora)}</TableCell>
                            <TableCell>{m.tipo}</TableCell>
                            <TableCell className="text-right font-mono">{m.quantidade}</TableCell>
                            <TableCell className="text-right font-mono">
                              {m.custo_unitario == null ? '-' : formatCurrency(Number(m.custo_unitario))}
                            </TableCell>
                            <TableCell>{m.localizacao}</TableCell>
                            <TableCell>{m.data_validade ? formatDate(m.data_validade) : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Historico de precos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Anterior</TableHead>
                          <TableHead className="text-right">Novo</TableHead>
                          <TableHead className="text-right">Variacao</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicoPreco.isLoading && (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                        )}
                        {!historicoPreco.isLoading && (historicoPreco.data?.length ?? 0) === 0 && (
                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem alteracoes de preco</TableCell></TableRow>
                        )}
                        {historicoPreco.data?.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell>{formatDate(h.created_at)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(Number(h.preco_anterior))}</TableCell>
                            <TableCell className="text-right font-mono text-primary">{formatCurrency(Number(h.preco_novo))}</TableCell>
                            <TableCell className={`text-right font-mono ${Number(h.variacao_pct) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {Number(h.variacao_pct).toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={novoProdutoOpen} onOpenChange={setNovoProdutoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar produto rapido</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <BarcodeInput
                value={novoProduto.sku}
                onChange={(sku) => setNovoProduto((p) => ({ ...p, sku }))}
                onScan={(sku) => {
                  setNovoProduto((p) => ({ ...p, sku }));
                  toast.success(`Codigo vinculado ao SKU: ${sku}`);
                }}
                placeholder="Digite ou escaneie o codigo"
                clearOnScan={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.custo}
                onChange={(e) => setNovoProduto((p) => ({ ...p, custo: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Preco de venda</Label>
              <Input
                type="number"
                step="0.01"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto((p) => ({ ...p, preco: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNovoProdutoOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={criarNovoProdutoRapido} disabled={criarProduto.isPending}>
              Cadastrar e selecionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!excluirProduto} onOpenChange={(o) => !o && setExcluirProduto(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong className="text-foreground">{excluirProduto?.nome}</strong>?
            Esta ação não pode ser desfeita e pode falhar se houver movimentos ou vendas vinculados.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExcluirProduto(null)}>Cancelar</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={deletarProduto.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduto} onOpenChange={(o) => { if (!o) { setEditProduto(null); setDivisaoLote(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar produto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome *</Label>
              <Input
                value={editForm.nome}
                onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <BarcodeInput
                value={editForm.sku}
                onChange={(sku) => setEditForm((p) => ({ ...p, sku }))}
                onScan={(sku) => setEditForm((p) => ({ ...p, sku }))}
                placeholder="Digite ou escaneie"
                clearOnScan={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Código de barras</Label>
              <BarcodeInput
                value={editForm.codigo_barras}
                onChange={(codigo_barras) => setEditForm((p) => ({ ...p, codigo_barras }))}
                onScan={(codigo_barras) => setEditForm((p) => ({ ...p, codigo_barras }))}
                placeholder="Digite ou escaneie"
                clearOnScan={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={editForm.categoria_id || 'none'}
                onValueChange={(v) => setEditForm((p) => ({ ...p, categoria_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {(categorias.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm((p) => ({ ...p, status: v as ProdutoStatus }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custo de aquisição</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.custo_aquisicao}
                onChange={(e) => setEditForm((p) => ({ ...p, custo_aquisicao: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço de venda</Label>
              <Input
                type="number"
                step="0.01"
                value={editForm.preco_venda_padrao}
                onChange={(e) => setEditForm((p) => ({ ...p, preco_venda_padrao: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Estoque mínimo</Label>
              <Input
                type="number"
                step="1"
                value={editForm.estoque_minimo}
                onChange={(e) => setEditForm((p) => ({ ...p, estoque_minimo: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {editProduto && (
            <div className="space-y-2 rounded-md border border-[var(--royal-line)] bg-background/45 p-3">
              <Label className="mb-0">Datas de validade dos lotes em estoque</Label>
              {movimentosEdicao.isLoading && (
                <p className="text-sm text-muted-foreground">Carregando lotes...</p>
              )}
              {!movimentosEdicao.isLoading && lotesComValidade.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma entrada de estoque registrada para este produto.</p>
              )}
              {lotesComValidade.length > 0 && (
                <div className="grid max-h-72 gap-2 overflow-y-auto overflow-x-hidden">
                  {lotesComValidade.map((m) => {
                    const qtd = Number(m.quantidade);
                    const podeDividir = Number.isInteger(qtd) && qtd > 1;
                    const dividindo = divisaoLote?.id === m.id;
                    return (
                      <div key={m.id} className={`space-y-2 rounded-md p-2 ${dividindo ? 'border border-primary/30 bg-primary/5' : ''}`}>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            {formatDate(m.data_hora)} · qtd {m.quantidade} · {m.localizacao}
                          </span>
                          {!dividindo && (
                            <Input
                              type="date"
                              className="w-full max-w-[180px] shrink-0"
                              defaultValue={m.data_validade ?? ''}
                              onBlur={(e) => {
                                const novoValor = e.target.value || null;
                                if (novoValor === (m.data_validade ?? null)) return;
                                atualizarValidade.mutate(
                                  { id: m.id, data_validade: novoValor },
                                  {
                                    onSuccess: () => toast.success('Validade atualizada'),
                                    onError: (err) => toast.error((err as Error).message),
                                  },
                                );
                              }}
                            />
                          )}
                        </div>

                        {podeDividir && !dividindo && (
                          <button
                            type="button"
                            className="text-xs text-primary underline underline-offset-2"
                            onClick={() =>
                              setDivisaoLote({
                                id: m.id,
                                datas: Array.from({ length: qtd }, (_, i) => (i === 0 ? m.data_validade ?? '' : '')),
                              })
                            }
                          >
                            Definir validade individual para as {qtd} unidades deste lote
                          </button>
                        )}

                        {dividindo && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2">
                              {divisaoLote!.datas.map((val, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="w-16 shrink-0 text-xs text-muted-foreground">Unid. {idx + 1}</span>
                                  <Input
                                    type="date"
                                    className="min-w-0 flex-1"
                                    value={val}
                                    onChange={(e) => {
                                      const novoValor = e.target.value;
                                      setDivisaoLote((prev) =>
                                        prev ? { ...prev, datas: prev.datas.map((d, i) => (i === idx ? novoValor : d)) } : prev,
                                      );
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setDivisaoLote(null)}>
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={dividirLote.isPending}
                                onClick={() => {
                                  dividirLote.mutate(
                                    { movimento: m, datas: divisaoLote!.datas.map((d) => d || null) },
                                    {
                                      onSuccess: () => {
                                        toast.success('Lote dividido em unidades individuais');
                                        setDivisaoLote(null);
                                      },
                                      onError: (err) => toast.error((err as Error).message),
                                    },
                                  );
                                }}
                              >
                                Salvar divisão
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setEditProduto(null); setDivisaoLote(null); }}>Cancelar</Button>
            <Button type="button" onClick={salvarEdicao} disabled={criarProduto.isPending}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo movimento de estoque</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 col-span-2">
              <Label>Produto *</Label>
              <div className="overflow-hidden rounded-md border border-[var(--royal-line)] bg-background/45">
                <div className="grid sm:grid-cols-[1fr_auto]">
                  <BarcodeInput
                    containerClassName="border-b border-[var(--royal-line)] sm:border-b-0 sm:border-r"
                    className="rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Digite nome, SKU ou escaneie o codigo..."
                    value={produtoSearch}
                    onChange={setProdutoSearch}
                    onScan={async (code) => {
                      setProdutoSearch(code);
                      try {
                        const p = await lookupProdutoByBarcode(code);
                        if (p) {
                          form.setValue('produto_id', p.id, { shouldDirty: true, shouldValidate: true });
                          setProdutoSearch(p.nome);
                          toast.success(`Selecionado: ${p.nome}`);
                        } else {
                          toast.error(`Sem produto para "${code}"`);
                        }
                      } catch (e) { toast.error((e as Error).message); }
                    }}
                    clearOnScan={false}
                  />
                  <Button type="button" variant="ghost" className="h-10 rounded-none px-5" onClick={() => setNovoProdutoOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Novo produto
                  </Button>
                </div>
                <Select
                  value={form.watch('produto_id')}
                  onValueChange={(v) => {
                    form.setValue('produto_id', v, { shouldDirty: true, shouldValidate: true });
                    const selecionado = produtos.data?.find((p) => p.id === v);
                    if (selecionado) setProdutoSearch(selecionado.nome);
                  }}
                >
                  <SelectTrigger className="rounded-none border-0 border-t border-[var(--royal-line)] bg-transparent focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Selecione um produto filtrado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosMovimento.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto encontrado</div>
                    )}
                    {produtosMovimento.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}{p.sku ? ` (${p.sku})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            {permiteValidade && (
              <div className="space-y-3 col-span-2 rounded-md border border-[var(--royal-line)] bg-background/45 p-3">
                <Label className="mb-0">Data de validade</Label>

                {unidadesInteiras && (
                  <div className="flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5 text-sm sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-xs font-medium text-primary">
                      {quantidadeAtual} unidades — quer datas de validade diferentes para cada uma?
                    </span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="modo_validade"
                          checked={!validadeIndividual}
                          onChange={() => setValidadeIndividual(false)}
                        />
                        Mesma data p/ todas
                      </label>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="radio"
                          name="modo_validade"
                          checked={validadeIndividual}
                          onChange={() => {
                            setValidadeIndividual(true);
                            ajustarQuantidadeValidades(quantidadeAtual);
                          }}
                        />
                        Data individual por unidade
                      </label>
                    </div>
                  </div>
                )}

                {!(unidadesInteiras && validadeIndividual) ? (
                  <Input type="date" {...form.register('data_validade')} />
                ) : (
                  <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                    {validadesPorUnidade.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-xs text-muted-foreground">Unid. {idx + 1}</span>
                        <Input
                          type="date"
                          value={val}
                          onChange={(e) => {
                            const novoValor = e.target.value;
                            setValidadesPorUnidade((prev) => prev.map((v, i) => (i === idx ? novoValor : v)));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label>Observação</Label>
              <Textarea {...form.register('observacao')} placeholder="Motivo, NF, contagem, etc." />
            </div>

            <DialogFooter className="col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setValidadeIndividual(false);
                  setValidadesPorUnidade([]);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={criar.isPending || criarLote.isPending}>Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
