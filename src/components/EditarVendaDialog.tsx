import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEditarVenda, useItensVenda, type VendaListagem } from '@/hooks/useVendas';
import { useParcelasDaVenda } from '@/hooks/useFluxoCaixa';
import type { ItemCarrinho, PagamentoCarrinho } from '@/hooks/usePDV';
import { useProdutos } from '@/hooks/useProdutos';
import { useClientes, useUpsertCliente } from '@/hooks/useClientes';
import { BANDEIRAS, gerarPlanoCartao, gerarPlanoCrediario, type BandeiraCartao, type ParcelaPlano } from '@/lib/recebiveis';
import { formatCurrency } from '@/lib/utils';
import type { FormaPagamento, LocalizacaoEstoque, VendaCanal } from '@/types/database';

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIARIO', label: 'Crediário' },
  { value: 'FIADO', label: 'Fiado' },
  { value: 'VALE_PRESENTE', label: 'Vale Presente' },
];
const FORMAS_PARCELADAS: FormaPagamento[] = ['CARTAO_CREDITO', 'CREDIARIO', 'FIADO'];
const FORMAS_CREDIARIO: FormaPagamento[] = ['CREDIARIO', 'FIADO'];
const FORMAS_CARTAO: FormaPagamento[] = ['CARTAO_CREDITO', 'CARTAO_DEBITO'];
const CANAIS: VendaCanal[] = ['Loja', 'WhatsApp', 'Instagram', 'Marketplace', 'Site'];
const LOCAIS: LocalizacaoEstoque[] = ['Loja', 'Deposito', 'Fabrica3D', 'Consignado'];

export function EditarVendaDialog({
  venda,
  onClose,
}: {
  venda: VendaListagem | null;
  onClose: () => void;
}) {
  const { data: itensOriginais, isLoading } = useItensVenda(venda?.id ?? null);
  const { data: parcelas } = useParcelasDaVenda(venda?.id ?? null);
  const produtos = useProdutos();
  const clientes = useClientes();
  const criarCliente = useUpsertCliente();
  const editar = useEditarVenda();

  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '' });

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [canal, setCanal] = useState<VendaCanal>('Loja');
  const [localizacao, setLocalizacao] = useState<LocalizacaoEstoque>('Loja');
  const [observacao, setObservacao] = useState('');
  const [descontoExtra, setDescontoExtra] = useState(0);
  const [buscaProduto, setBuscaProduto] = useState('');

  const [forma, setForma] = useState<FormaPagamento>('DINHEIRO');
  const [bandeira, setBandeira] = useState<BandeiraCartao>('mastercard');
  const [numParcelas, setNumParcelas] = useState(1);
  const [entrada, setEntrada] = useState(0);
  const [primeiroVenc, setPrimeiroVenc] = useState('');
  const [planoEditado, setPlanoEditado] = useState<ParcelaPlano[] | null>(null);

  // Carrega o estado do formulário a partir da venda aberta.
  useEffect(() => {
    if (!venda) return;
    setClienteId(venda.cliente_id ?? null);
    setCanal(venda.canal);
    setObservacao(venda.observacao ?? '');
    setForma(venda.forma_pagamento_principal ?? 'DINHEIRO');
    setEntrada(Number(venda.entrada_valor ?? 0));
    setPlanoEditado(null);
    setBuscaProduto('');
  }, [venda]);

  useEffect(() => {
    if (!itensOriginais) return;
    setItens(
      itensOriginais.map((i) => ({
        produto_id: i.produto_id,
        produto_nome: i.produto?.nome ?? '—',
        variacao_id: i.variacao_id ?? null,
        quantidade: Number(i.quantidade),
        preco_unitario: Number(i.preco_unitario),
        desconto: Number(i.desconto),
      })),
    );
  }, [itensOriginais]);

  // Desconto extra = desconto total da venda menos os descontos por item.
  useEffect(() => {
    if (!venda || !itensOriginais) return;
    const somaItens = itensOriginais.reduce((s, i) => s + Number(i.desconto), 0);
    setDescontoExtra(Math.max(Number(venda.desconto_total) - somaItens, 0));
  }, [venda, itensOriginais]);

  // Retoma parcelas e bandeira já existentes, se houver.
  useEffect(() => {
    const ativa = parcelas?.find((p) => p.status !== 'CANCELADA');
    setNumParcelas(ativa?.total_parcelas && ativa.total_parcelas > 0 ? ativa.total_parcelas : 1);
    if (ativa?.bandeira) setBandeira(ativa.bandeira as BandeiraCartao);
  }, [parcelas]);

  const totalBruto = useMemo(() => itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0), [itens]);
  const descontoItens = useMemo(() => itens.reduce((s, i) => s + i.desconto, 0), [itens]);
  const totalLiquido = +(totalBruto - descontoItens - descontoExtra).toFixed(2);

  const ehParcelada = FORMAS_PARCELADAS.includes(forma);
  const ehCrediario = FORMAS_CREDIARIO.includes(forma);
  const entradaEfetiva = ehCrediario ? Math.min(Math.max(entrada, 0), Math.max(totalLiquido, 0)) : 0;
  const valorFinanciado = +(Math.max(totalLiquido, 0) - entradaEfetiva).toFixed(2);

  const planoAutomatico = useMemo(() => {
    if (forma === 'CARTAO_CREDITO') return gerarPlanoCartao(Math.max(totalLiquido, 0), numParcelas);
    if (FORMAS_CREDIARIO.includes(forma)) {
      return valorFinanciado > 0 ? gerarPlanoCrediario(valorFinanciado, numParcelas, primeiroVenc || undefined) : [];
    }
    return [];
  }, [forma, totalLiquido, valorFinanciado, numParcelas, primeiroVenc]);

  useEffect(() => {
    setPlanoEditado(null);
  }, [forma, numParcelas, primeiroVenc, entrada, totalLiquido]);

  const plano = planoEditado ?? planoAutomatico;
  const somaPlano = useMemo(() => plano.reduce((s, p) => s + p.valor, 0), [plano]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    if (!termo) return [];
    return (produtos.data ?? [])
      .filter((p) =>
        [p.nome, p.sku, p.codigo_barras]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(termo)),
      )
      .slice(0, 8);
  }, [produtos.data, buscaProduto]);

  const clientesFiltrados = useMemo(() => (clientes.data ?? []).slice(0, 100), [clientes.data]);

  function patchItem(idx: number, patch: Partial<ItemCarrinho>) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removerItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }
  function patchParcela(idx: number, patch: Partial<ParcelaPlano>) {
    setPlanoEditado((prev) => (prev ?? planoAutomatico).map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  async function salvarNovoCliente() {
    const nome = novoCliente.nome.trim();
    if (!nome) {
      toast.error('Informe o nome do cliente');
      return;
    }
    try {
      const criado = await criarCliente.mutateAsync({
        nome,
        telefone: novoCliente.telefone.trim() || null,
      });
      setClienteId(criado.id);
      setNovoCliente({ nome: '', telefone: '' });
      setNovoClienteOpen(false);
      toast.success('Cliente cadastrado e selecionado');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function salvar() {
    if (!venda) return;
    if (itens.length === 0) {
      toast.error('A venda precisa ter ao menos um item');
      return;
    }
    if (totalLiquido < 0) {
      toast.error('O desconto não pode ser maior que o total');
      return;
    }
    if (FORMAS_CREDIARIO.includes(forma) && !clienteId) {
      toast.error('Crediário/fiado exige um cliente vinculado');
      return;
    }

    const pagamento: PagamentoCarrinho = {
      forma,
      valor: Math.max(totalLiquido, 0),
      parcelas: ehParcelada ? Math.max(numParcelas, 1) : 1,
      bandeira: FORMAS_CARTAO.includes(forma) ? bandeira : undefined,
      entrada: entradaEfetiva > 0 ? entradaEfetiva : undefined,
      plano: ehParcelada && plano.length > 0 ? plano : undefined,
    };

    try {
      await editar.mutateAsync({
        venda,
        cliente_id: clienteId,
        canal,
        itens,
        pagamentos: [pagamento],
        desconto_total: descontoExtra,
        observacao,
        localizacao_estoque: localizacao,
      });
      toast.success('Venda atualizada');
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!venda) return null;

  return (
    <Dialog open={!!venda} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar venda #{venda.numero}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando itens...</p>
        ) : (
          <div className="space-y-4">
            {/* Cliente / canal / local */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente</Label>
                <Select
                  value={clienteId ?? '__none__'}
                  onValueChange={(v) => {
                    if (v === '__novo__') {
                      setNovoClienteOpen(true);
                      return;
                    }
                    setClienteId(v === '__none__' ? null : v);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Sem cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sem cliente —</SelectItem>
                    <SelectItem value="__novo__" className="font-medium text-primary">
                      <span className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Novo cliente...</span>
                    </SelectItem>
                    {clientesFiltrados.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Canal</Label>
                <Select value={canal} onValueChange={(v) => setCanal(v as VendaCanal)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Local estoque</Label>
                <Select value={localizacao} onValueChange={(v) => setLocalizacao(v as LocalizacaoEstoque)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Itens */}
            <div className="space-y-2 rounded-md border border-[var(--royal-line)] bg-background/45 p-3">
              <Label className="mb-0 text-xs">Itens</Label>
              {itens.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item — adicione ao menos um produto.</p>
              )}
              <div className="space-y-2">
                {itens.map((it, idx) => (
                  <div key={`${it.produto_id}-${idx}`} className="space-y-1.5 rounded border border-[var(--royal-line)] p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.produto_nome}</span>
                      <span className="shrink-0 font-mono text-sm">
                        {formatCurrency(it.quantidade * it.preco_unitario - it.desconto)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removerItem(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Qtd</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min={0.001}
                          className="h-8 text-sm"
                          value={it.quantidade}
                          onChange={(e) => patchItem(idx, { quantidade: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Preço un.</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm"
                          value={it.preco_unitario}
                          onChange={(e) => patchItem(idx, { preco_unitario: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Desconto</Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 text-sm"
                          value={it.desconto}
                          onChange={(e) => patchItem(idx, { desconto: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar produto */}
              <div className="relative pt-1">
                <Search className="pointer-events-none absolute left-3 top-[1.125rem] h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar produto para adicionar..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                />
                {produtosFiltrados.length > 0 && (
                  <div className="mt-1 max-h-44 overflow-auto rounded border border-[var(--royal-line)] bg-background">
                    {produtosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--royal-line)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                        onClick={() => {
                          setItens((prev) => [
                            ...prev,
                            {
                              produto_id: p.id,
                              produto_nome: p.nome,
                              variacao_id: null,
                              quantidade: 1,
                              preco_unitario: Number(p.preco_venda_padrao ?? 0),
                              desconto: 0,
                            },
                          ]);
                          setBuscaProduto('');
                        }}
                      >
                        <span className="min-w-0 truncate">{p.nome}</span>
                        <span className="shrink-0 font-mono text-xs">
                          {formatCurrency(Number(p.preco_venda_padrao ?? 0))}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Totais */}
            <div className="space-y-2 rounded-md border border-[var(--royal-line)] bg-background/45 p-3 text-sm">
              <div className="flex justify-between"><span>Bruto</span><span className="font-mono">{formatCurrency(totalBruto)}</span></div>
              <div className="flex justify-between">
                <span>Desconto itens</span>
                <span className="font-mono">−{formatCurrency(descontoItens)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Desconto extra (R$)</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  className="h-8 w-28 text-right"
                  value={descontoExtra}
                  onChange={(e) => setDescontoExtra(Math.max(Number(e.target.value) || 0, 0))}
                />
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className={`font-mono ${totalLiquido < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(totalLiquido)}
                </span>
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Forma de pagamento</Label>
                <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {FORMAS_CARTAO.includes(forma) && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Bandeira</Label>
                  <Select value={bandeira} onValueChange={(v) => setBandeira(v as BandeiraCartao)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BANDEIRAS.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {ehParcelada && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Parcelas</Label>
                      <Input
                        type="number"
                        min={1}
                        max={36}
                        value={numParcelas}
                        onChange={(e) => setNumParcelas(Math.min(Math.max(Number(e.target.value) || 1, 1), 36))}
                      />
                    </div>
                    {ehCrediario ? (
                      <div className="space-y-1">
                        <Label className="text-xs">Entrada</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={entrada}
                          onChange={(e) => setEntrada(Math.max(Number(e.target.value) || 0, 0))}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs">1º recebimento</Label>
                        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground">
                          30 dias
                        </div>
                      </div>
                    )}
                  </div>

                  {ehCrediario && (
                    <div className="space-y-1">
                      <Label className="text-xs">1º vencimento</Label>
                      <Input type="date" value={primeiroVenc} onChange={(e) => setPrimeiroVenc(e.target.value)} />
                    </div>
                  )}

                  {plano.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="mb-0 text-xs">Parcelas previstas</Label>
                        {planoEditado && (
                          <button
                            type="button"
                            className="text-[11px] text-primary underline underline-offset-2"
                            onClick={() => setPlanoEditado(null)}
                          >
                            restaurar automático
                          </button>
                        )}
                      </div>
                      <div className="max-h-44 space-y-1.5 overflow-y-auto">
                        {plano.map((parcela, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-8 shrink-0 text-[11px] text-muted-foreground">
                              {parcela.numero}/{plano.length}
                            </span>
                            <Input
                              type="date"
                              className="h-8 min-w-0 flex-1 text-xs"
                              value={parcela.data_vencimento}
                              onChange={(e) => patchParcela(idx, { data_vencimento: e.target.value })}
                            />
                            <Input
                              type="number"
                              step="0.01"
                              className="h-8 w-24 shrink-0 text-right text-xs"
                              value={parcela.valor}
                              onChange={(e) => patchParcela(idx, { valor: Number(e.target.value) || 0 })}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t pt-1.5 text-xs">
                        <span className="text-muted-foreground">Soma das parcelas</span>
                        <span
                          className={`font-mono font-semibold ${
                            Math.abs(somaPlano - (ehCrediario ? valorFinanciado : Math.max(totalLiquido, 0))) > 0.01
                              ? 'text-orange-500'
                              : 'text-green-500'
                          }`}
                        >
                          {formatCurrency(somaPlano)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observação</Label>
              <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>

            <p className="text-xs text-muted-foreground">
              Salvar recria os itens, as saídas de estoque e os recebíveis em aberto desta venda.
              Parcelas já recebidas bloqueiam a edição.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={editar.isPending || isLoading}>
            <Plus className="mr-2 h-4 w-4" /> Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={novoClienteOpen} onOpenChange={setNovoClienteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cadastrar cliente rápido</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input
                value={novoCliente.nome}
                onChange={(e) => setNovoCliente((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome do cliente"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={novoCliente.telefone}
                onChange={(e) => setNovoCliente((p) => ({ ...p, telefone: e.target.value }))}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNovoClienteOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvarNovoCliente} disabled={criarCliente.isPending}>
              Cadastrar e selecionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
