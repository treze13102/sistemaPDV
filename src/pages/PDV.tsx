import { useMemo, useState } from 'react';
import { CheckCircle2, FileText, ImageIcon, MessageCircle, Minus, Plus, Printer, Search, Trash2, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarcodeInput } from '@/components/BarcodeInput';
import { lookupProdutoByBarcode, lookupVariacaoByBarcode, useProdutosComVariacoes } from '@/hooks/useProdutos';
import {
  enviarComprovanteWhatsApp,
  gerarPdfComprovante,
  imprimirComprovante,
  type ComprovanteData,
} from '@/lib/comprovante';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import type { Produto } from '@/types/database';

interface VariacaoLite {
  id: string;
  nome: string;
  custo_adicional: number;
  preco_adicional: number;
  cor?: string | null;
  tamanho?: string | null;
  fragrancia?: string | null;
  voltagem?: string | null;
}
import { useClientes } from '@/hooks/useClientes';
import { useFinalizarVenda, type ItemCarrinho, type PagamentoCarrinho } from '@/hooks/usePDV';
import { formatCurrency } from '@/lib/utils';
import type { FormaPagamento, LocalizacaoEstoque, VendaCanal } from '@/types/database';

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'FIADO', label: 'Fiado/Crediário' },
  { value: 'VALE_PRESENTE', label: 'Vale Presente' },
];

const CANAIS: VendaCanal[] = ['Loja', 'WhatsApp', 'Instagram', 'Marketplace', 'Site'];
const LOCAIS: LocalizacaoEstoque[] = ['Loja', 'Deposito', 'Fabrica3D', 'Consignado'];

export default function PDV() {
  const configuracoes = useMemo(() => carregarConfiguracoes(), []);
  const [search, setSearch] = useState('');
  const produtos = useProdutosComVariacoes(search);
  const clientes = useClientes();
  const finalizar = useFinalizarVenda();

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [clienteBusca, setClienteBusca] = useState('');
  const [canal, setCanal] = useState<VendaCanal>(configuracoes.pdv.canal_padrao);
  const [localizacao, setLocalizacao] = useState<LocalizacaoEstoque>(configuracoes.pdv.local_estoque_padrao);
  const [observacao, setObservacao] = useState('');
  const [pagamentos, setPagamentos] = useState<PagamentoCarrinho[]>([]);
  const [formaSelect, setFormaSelect] = useState<FormaPagamento>(configuracoes.pdv.forma_pagamento_padrao);
  const [valorPag, setValorPag] = useState<number>(0);
  const [parcelasFiado, setParcelasFiado] = useState<number>(1);
  const [comprovante, setComprovante] = useState<ComprovanteData | null>(null);
  const [posVendaOpen, setPosVendaOpen] = useState(false);
  const [imagemZoom, setImagemZoom] = useState<{ src: string; nome: string } | null>(null);

  const total_bruto = useMemo(() => itens.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0), [itens]);
  const desconto_itens = useMemo(() => itens.reduce((s, i) => s + i.desconto, 0), [itens]);
  const total_liquido = total_bruto - desconto_itens - descontoGlobal;
  const total_adicionado = pagamentos.reduce((s, p) => s + p.valor, 0);
  const valor_pagamento_unico = valorPag > 0 ? valorPag : Math.max(total_liquido, 0);
  const total_pago = pagamentos.length > 0 ? total_adicionado : valor_pagamento_unico;
  const restante = Math.max(total_liquido - total_pago, 0);
  const troco = Math.max(total_pago - total_liquido, 0);
  const clienteSelecionado = useMemo(
    () => clientes.data?.find((c) => c.id === clienteId) ?? null,
    [clientes.data, clienteId],
  );
  const clientesFiltrados = useMemo(() => {
    const termo = clienteBusca.trim().toLowerCase();
    if (!termo) return (clientes.data ?? []).slice(0, 8);
    return (clientes.data ?? [])
      .filter((c) =>
        [c.nome, c.telefone, c.cpf_cnpj]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo)),
      )
      .slice(0, 8);
  }, [clientes.data, clienteBusca]);

  function addProdutoObj(p: Produto, variacao?: VariacaoLite) {
    if (p.status !== 'ativo') {
      toast.error('Produto inativo');
      return;
    }
    const precoFinal = Number(p.preco_venda_padrao) + Number(variacao?.preco_adicional ?? 0);
    if (precoFinal <= 0) {
      toast.error('Item sem preço de venda');
      return;
    }
    const nomeFinal = variacao ? `${p.nome} — ${variacao.nome}` : p.nome;
    const variacaoId = variacao?.id ?? null;
    setItens((prev) => {
      const idx = prev.findIndex((it) => it.produto_id === p.id && (it.variacao_id ?? null) === variacaoId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          produto_id: p.id,
          produto_nome: nomeFinal,
          imagem_url: p.imagem_url ?? null,
          variacao_id: variacaoId,
          quantidade: 1,
          preco_unitario: precoFinal,
          desconto: 0,
        },
      ];
    });
  }

  async function handleScan(code: string) {
    // 1) tenta variação pelo código (mais específico) primeiro
    try {
      const v = await lookupVariacaoByBarcode(code);
      if (v) {
        addProdutoObj(v.produto, {
          id: v.id, nome: v.nome,
          custo_adicional: Number(v.custo_adicional),
          preco_adicional: Number(v.preco_adicional),
        });
        setSearch('');
        return;
      }
      // 2) match exato em produto (sem variação)
      const p = await lookupProdutoByBarcode(code);
      if (p) {
        addProdutoObj(p);
        setSearch('');
        return;
      }
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }
    // 3) fallback: 1º resultado lista local
    const first = produtos.data?.[0];
    if (first) {
      if ((first.variacoes?.length ?? 0) > 0) {
        toast.error('Produto tem variações. Selecione uma na lista.');
      } else {
        addProdutoObj(first);
        setSearch('');
      }
    } else {
      toast.error(`Sem produto para "${code}"`);
    }
  }

  function updateItem(idx: number, patch: Partial<ItemCarrinho>) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function addPagamento() {
    const restanteParaAdicionar = Math.max(total_liquido - total_adicionado, 0);
    const valor = valorPag > 0 ? valorPag : restanteParaAdicionar;
    if (valor <= 0) {
      toast.error('Valor inválido');
      return;
    }
    setPagamentos((p) => [
      ...p,
      { forma: formaSelect, valor: +valor.toFixed(2), parcelas: formaSelect === 'FIADO' ? parcelasFiado : 1 },
    ]);
    setValorPag(0);
  }
  function addPagamentoRapido(forma: FormaPagamento) {
    setFormaSelect(forma);
    setValorPag(Math.max(total_liquido - total_adicionado, 0));
  }
  function removePagamento(idx: number) {
    setPagamentos((p) => p.filter((_, i) => i !== idx));
  }
  function getPagamentosVenda(): PagamentoCarrinho[] {
    if (pagamentos.length > 0) return pagamentos;
    return [
      {
        forma: formaSelect,
        valor: +valor_pagamento_unico.toFixed(2),
        parcelas: formaSelect === 'FIADO' ? parcelasFiado : 1,
      },
    ];
  }

  async function finalizarVenda(status: 'CONCLUIDA' | 'ORCAMENTO') {
    if (itens.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }
    const pagamentosVenda = status === 'CONCLUIDA' ? getPagamentosVenda() : [];
    const totalPagoVenda = pagamentosVenda.reduce((s, p) => s + p.valor, 0);
    const trocoVenda = Math.max(totalPagoVenda - total_liquido, 0);
    if (status === 'CONCLUIDA') {
      if (totalPagoVenda + 0.01 < total_liquido) {
        toast.error(`Restante a pagar: ${formatCurrency(total_liquido - totalPagoVenda)}`);
        return;
      }
      if (configuracoes.pdv.permitir_troco_apenas_dinheiro && trocoVenda > 0.01 && !pagamentosVenda.some((p) => p.forma === 'DINHEIRO')) {
        toast.error('Troco permitido apenas quando houver pagamento em dinheiro');
        return;
      }
      const temFiado = pagamentosVenda.some((p) => p.forma === 'FIADO');
      if (configuracoes.pdv.exigir_cliente_fiado && temFiado && !clienteId) {
        toast.error('Venda fiada requer cliente selecionado');
        return;
      }
    }
    try {
      const cliente = clienteSelecionado ?? clientes.data?.find((c) => c.id === clienteId);
      const snapshot = {
        itens: itens.map((i) => ({
          produto_nome: i.produto_nome,
          imagem_url: i.imagem_url ?? null,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          desconto: i.desconto,
          total: i.quantidade * i.preco_unitario - i.desconto,
        })),
        pagamentos: pagamentosVenda.map((p) => ({ forma: p.forma, valor: p.valor, parcelas: p.parcelas })),
        cliente_nome: cliente?.nome ?? null,
        cliente_telefone: cliente?.telefone ?? null,
        total_bruto,
        desconto_total: desconto_itens + descontoGlobal,
        total_liquido,
        troco: trocoVenda,
        canal,
        observacao,
      };
      const vendaCriada = await finalizar.mutateAsync({
        cliente_id: clienteId,
        canal,
        itens,
        pagamentos: pagamentosVenda,
        desconto_total: descontoGlobal,
        observacao,
        localizacao_estoque: localizacao,
        status,
        validade_orcamento:
          status === 'ORCAMENTO'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : null,
      });
      const comprovanteVenda: ComprovanteData = {
        venda: {
          numero: vendaCriada.numero,
          data_hora: vendaCriada.data_hora,
          total_bruto: snapshot.total_bruto,
          desconto_total: snapshot.desconto_total,
          total_liquido: snapshot.total_liquido,
          canal: snapshot.canal,
          observacao: snapshot.observacao || null,
          status,
        },
        cliente_nome: snapshot.cliente_nome,
        cliente_telefone: snapshot.cliente_telefone,
        itens: snapshot.itens,
        pagamentos: snapshot.pagamentos.map((p) => ({ forma: p.forma, valor: p.valor, parcelas: p.parcelas ?? null })),
        troco: snapshot.troco,
      };
      toast.success(status === 'CONCLUIDA' ? 'Venda concluida' : 'Orcamento salvo');
      if (status === 'CONCLUIDA') {
        setComprovante(comprovanteVenda);
        setPosVendaOpen(true);
      }
      // reset
      setItens([]);
      setPagamentos([]);
      setValorPag(0);
      setDescontoGlobal(0);
      setObservacao('');
      setClienteId(null);
      setClienteBusca('');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="PDV" description="Ponto de venda" />
      <div className="grid gap-4 p-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Buscar produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BarcodeInput
                autoFocus
                placeholder="Escaneie código de barras ou digite nome/SKU..."
                value={search}
                onChange={setSearch}
                onScan={handleScan}
                clearOnScan
              />
              <p className="text-xs text-muted-foreground">
                Enter ou leitor adiciona automaticamente. Digite parte do nome para listar resultados.
              </p>
              {search && (
                <div className="max-h-64 overflow-auto rounded border">
                  {produtos.isLoading && <div className="p-3 text-sm text-muted-foreground">Buscando...</div>}
                  {!produtos.isLoading && (produtos.data?.length ?? 0) === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">Sem resultados</div>
                  )}
                  {produtos.data?.slice(0, 10).map((p) => {
                    const hasVar = (p.variacoes?.length ?? 0) > 0;
                    return (
                      <div key={p.id} className="border-b last:border-b-0">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={hasVar}
                          title={hasVar ? 'Selecione uma variação abaixo' : 'Adicionar'}
                          onClick={() => {
                            if (hasVar) return;
                            addProdutoObj(p);
                            setSearch('');
                          }}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                              {p.imagem_url ? (
                                <img src={p.imagem_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              )}
                            </span>
                            <span className="min-w-0">
                            <span className="block truncate font-medium">{p.nome}</span>
                            {p.sku && <span className="text-xs text-muted-foreground">{p.sku}</span>}
                            {hasVar && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px]">{p.variacoes.length} variações</span>}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-sm">{formatCurrency(Number(p.preco_venda_padrao))}</span>
                        </button>
                        {hasVar && (
                          <div className="bg-muted/30">
                            {p.variacoes.map((v) => {
                              const precoVar = Number(p.preco_venda_padrao) + Number(v.preco_adicional);
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  className="flex w-full items-center justify-between border-t border-muted px-6 py-1.5 text-left text-sm hover:bg-accent"
                                  onClick={() => {
                                    addProdutoObj(p, {
                                      id: v.id, nome: v.nome,
                                      custo_adicional: Number(v.custo_adicional),
                                      preco_adicional: Number(v.preco_adicional),
                                    });
                                    setSearch('');
                                  }}
                                >
                                  <span>
                                    <span className="text-xs text-muted-foreground">↳</span>{' '}
                                    {v.nome}
                                    {(v.cor || v.tamanho || v.fragrancia || v.voltagem) && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        {[v.cor, v.tamanho, v.fragrancia, v.voltagem].filter(Boolean).join(' · ')}
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono text-xs">{formatCurrency(precoVar)}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Carrinho ({itens.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {itens.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Adicione produtos</div>
              ) : (
                <div className="space-y-2">
                  {itens.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[minmax(180px,1fr)_auto_auto_auto_auto] items-center gap-2 rounded border p-2">
                      <div className="flex min-w-0 items-center gap-3">
                        {it.imagem_url ? (
                          <button
                            type="button"
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted transition hover:border-primary hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            title={`Ampliar imagem de ${it.produto_nome}`}
                            onClick={() => setImagemZoom({ src: it.imagem_url!, nome: it.produto_nome })}
                          >
                            <img src={it.imagem_url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{it.produto_nome}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(it.preco_unitario)} × {it.quantidade}
                          {it.desconto > 0 && ` − ${formatCurrency(it.desconto)}`}
                        </div>
                      </div>
                      </div>
                      <div className="flex items-center">
                        <Button size="icon" variant="ghost" onClick={() => updateItem(idx, { quantidade: Math.max(1, it.quantidade - 1) })}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          step="0.001"
                          className="h-8 w-16 text-center"
                          value={it.quantidade}
                          onChange={(e) => updateItem(idx, { quantidade: Number(e.target.value) || 0 })}
                        />
                        <Button size="icon" variant="ghost" onClick={() => updateItem(idx, { quantidade: it.quantidade + 1 })}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        className="h-8 w-24"
                        value={it.preco_unitario}
                        onChange={(e) => updateItem(idx, { preco_unitario: Number(e.target.value) || 0 })}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Desc."
                        className="h-8 w-20"
                        value={it.desconto}
                        onChange={(e) => updateItem(idx, { desconto: Number(e.target.value) || 0 })}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-24 text-right font-mono text-sm">
                          {formatCurrency(it.quantidade * it.preco_unitario - it.desconto)}
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Cliente e canal</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 pr-9"
                    placeholder="Digite o nome do cliente..."
                    value={clienteBusca}
                    onChange={(e) => {
                      setClienteBusca(e.target.value);
                      if (clienteId) setClienteId(null);
                    }}
                  />
                  {(clienteBusca || clienteId) && (
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Limpar cliente"
                      onClick={() => {
                        setClienteBusca('');
                        setClienteId(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {clienteSelecionado ? (
                  <div className="flex items-center justify-between rounded border bg-muted/40 p-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{clienteSelecionado.nome}</span>
                    </span>
                    {clienteSelecionado.telefone && (
                      <span className="shrink-0 text-xs text-muted-foreground">{clienteSelecionado.telefone}</span>
                    )}
                  </div>
                ) : (
                  clienteBusca.trim() && (
                    <div className="max-h-52 overflow-auto rounded border bg-background">
                      {clientes.isLoading && <div className="p-2 text-sm text-muted-foreground">Buscando clientes...</div>}
                      {!clientes.isLoading && clientesFiltrados.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado</div>
                      )}
                      {clientesFiltrados.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                          onClick={() => {
                            setClienteId(c.id);
                            setClienteBusca(c.nome);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{c.nome}</span>
                            {(c.cpf_cnpj || c.email) && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {[c.cpf_cnpj, c.email].filter(Boolean).join(' - ')}
                              </span>
                            )}
                          </span>
                          {c.telefone && <span className="shrink-0 text-xs text-muted-foreground">{c.telefone}</span>}
                        </button>
                      ))}
                    </div>
                  )
                )}
                <div className="hidden">
                <Select value={clienteId ?? '__none__'} onValueChange={(v) => setClienteId(v === '__none__' ? null : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sem cliente —</SelectItem>
                    {clientes.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select value={canal} onValueChange={(v) => setCanal(v as VendaCanal)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Local estoque</Label>
                  <Select value={localizacao} onValueChange={(v) => setLocalizacao(v as LocalizacaoEstoque)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Totais</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Bruto</span><span className="font-mono">{formatCurrency(total_bruto)}</span></div>
              <div className="flex justify-between"><span>Desconto itens</span><span className="font-mono">−{formatCurrency(desconto_itens)}</span></div>
              <div className="flex items-center justify-between gap-2">
                <span>Desconto extra</span>
                <Input type="number" step="0.01" className="h-8 w-32 text-right" value={descontoGlobal} onChange={(e) => setDescontoGlobal(Number(e.target.value) || 0)} />
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(total_liquido)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{pagamentos.length > 0 ? 'Pago' : 'Pagamento previsto'}</span>
                <span className="font-mono">{formatCurrency(total_pago)}</span>
              </div>
              <div className={`flex justify-between font-semibold ${restante > 0.01 ? 'text-orange-600' : 'text-green-600'}`}>
                <span>Restante</span>
                <span className="font-mono">{formatCurrency(restante)}</span>
              </div>
              {troco > 0.01 && (
                <div className="flex justify-between font-semibold text-blue-600">
                  <span>Troco</span>
                  <span className="font-mono">{formatCurrency(troco)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Pagamentos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={() => addPagamentoRapido('PIX')}>
                  Usar PIX
                </Button>
                <Button type="button" variant="secondary" onClick={() => addPagamentoRapido('DINHEIRO')}>
                  Usar dinheiro
                </Button>
                <Button type="button" variant="outline" onClick={() => addPagamentoRapido('CARTAO_DEBITO')}>
                  Usar debito
                </Button>
                <Button type="button" variant="outline" onClick={() => addPagamentoRapido('CARTAO_CREDITO')}>
                  Usar credito
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Para pagamento unico, selecione a forma e finalize. Informe valor recebido apenas quando precisar calcular troco.
              </p>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Select value={formaSelect} onValueChange={(v) => setFormaSelect(v as FormaPagamento)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" step="0.01" placeholder="Recebido" className="w-32" value={valorPag} onChange={(e) => setValorPag(Number(e.target.value) || 0)} />
              </div>
              {formaSelect === 'FIADO' && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Parcelas</Label>
                  <Input type="number" min={1} max={36} className="w-20" value={parcelasFiado} onChange={(e) => setParcelasFiado(Number(e.target.value) || 1)} />
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={addPagamento}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar forma de pagamento
              </Button>
              {pagamentos.length > 0 && (
                <div className="space-y-1 text-sm">
                  {pagamentos.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded border p-2">
                      <span>{FORMAS.find((f) => f.value === p.forma)?.label}{p.forma === 'FIADO' ? ` (${p.parcelas}x)` : ''}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{formatCurrency(p.valor)}</span>
                        <Button size="icon" variant="ghost" onClick={() => removePagamento(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <Textarea placeholder="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              <Button className="w-full" size="lg" disabled={finalizar.isPending} onClick={() => finalizarVenda('CONCLUIDA')}>
                Finalizar venda
              </Button>
              <Button variant="outline" className="w-full" disabled={finalizar.isPending} onClick={() => finalizarVenda('ORCAMENTO')}>
                Salvar como orçamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog open={posVendaOpen} onOpenChange={setPosVendaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Venda finalizada
            </DialogTitle>
            <DialogDescription>
              Escolha como entregar o comprovante da venda #{comprovante?.venda.numero}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              type="button"
              className="h-20 flex-col gap-2"
              disabled={!comprovante}
              onClick={() => comprovante && imprimirComprovante(comprovante)}
            >
              <Printer className="h-5 w-5" />
              Imprimir cupom
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-20 flex-col gap-2"
              disabled={!comprovante}
              onClick={() => comprovante && gerarPdfComprovante(comprovante)}
            >
              <FileText className="h-5 w-5" />
              Gerar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-20 flex-col gap-2"
              disabled={!comprovante?.cliente_telefone}
              title={comprovante?.cliente_telefone ? 'Enviar para o WhatsApp do cliente' : 'Cliente sem telefone cadastrado'}
              onClick={() => comprovante && enviarComprovanteWhatsApp(comprovante)}
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPosVendaOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!imagemZoom} onOpenChange={(open) => !open && setImagemZoom(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imagemZoom?.nome}</DialogTitle>
            <DialogDescription>Imagem do produto no carrinho</DialogDescription>
          </DialogHeader>
          {imagemZoom && (
            <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded border bg-muted">
              <img
                src={imagemZoom.src}
                alt={imagemZoom.nome}
                className="max-h-[70vh] w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
