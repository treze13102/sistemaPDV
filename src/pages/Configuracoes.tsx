import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Building2,
  Check,
  CreditCard,
  ImageIcon,
  MessageCircle,
  MonitorCog,
  Printer,
  ReceiptText,
  RotateCcw,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { useGerarRecebiveisRetroativos, useVendasSemRecebiveis } from '@/hooks/useFluxoCaixa';
import { BANDEIRAS, FORMA_LABEL, type TaxaBandeira } from '@/lib/recebiveis';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  CONFIGURACOES_DEFAULT,
  carregarConfiguracoes,
  carregarConfiguracoesSupabase,
  restaurarConfiguracoesPadraoSupabase,
  salvarConfiguracoesSupabase,
  type ConfiguracoesSistema,
  type ModoImpressao,
  type TamanhoPapelCupom,
} from '@/lib/configuracoes';
import { buildComprovanteHtml, type ComprovanteData } from '@/lib/comprovante';
import { formatCurrency } from '@/lib/utils';
import type { FormaPagamento, LocalizacaoEstoque, VendaCanal } from '@/types/database';

type AbaConfig = 'loja' | 'cupom' | 'impressao' | 'pdv' | 'recebiveis' | 'whatsapp';

const ABAS: { id: AbaConfig; label: string; icon: typeof Building2 }[] = [
  { id: 'loja', label: 'Loja', icon: Building2 },
  { id: 'cupom', label: 'Cupom', icon: ReceiptText },
  { id: 'impressao', label: 'Impressão', icon: Printer },
  { id: 'pdv', label: 'PDV', icon: MonitorCog },
  { id: 'recebiveis', label: 'Taxas de cartão', icon: CreditCard },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const CANAIS: VendaCanal[] = ['Loja', 'WhatsApp', 'Instagram', 'Marketplace', 'Site'];
const LOCAIS: LocalizacaoEstoque[] = ['Loja', 'Deposito', 'Fabrica3D', 'Consignado'];
const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_DEBITO', label: 'Cartão Débito' },
  { value: 'CARTAO_CREDITO', label: 'Cartão Crédito' },
  { value: 'PIX', label: 'PIX' },
  { value: 'FIADO', label: 'Fiado/Crediário' },
  { value: 'VALE_PRESENTE', label: 'Vale Presente' },
];

function updateNested<T extends keyof ConfiguracoesSistema>(
  config: ConfiguracoesSistema,
  secao: T,
  patch: Partial<ConfiguracoesSistema[T]>
): ConfiguracoesSistema {
  return { ...config, [secao]: { ...config[secao], ...patch } };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function BoolField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-10 items-center gap-2 rounded border px-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      {label}
    </label>
  );
}

/**
 * Vendas a prazo antigas ficaram sem parcelas porque, quando foram feitas, só
 * FIADO gerava recebível. Sem lançamento, elas não aparecem no calendário nem
 * na projeção — este painel corrige isso de uma vez.
 */
function BackfillRecebiveis() {
  const pendentes = useVendasSemRecebiveis();
  const gerar = useGerarRecebiveisRetroativos();
  const lista = pendentes.data ?? [];
  const totalPendente = lista.reduce((s, v) => s + v.total_liquido, 0);

  async function executar() {
    try {
      const r = await gerar.mutateAsync(lista);
      toast.success(`${r.parcelas} parcela(s) geradas em ${r.vendas} venda(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Vendas a prazo sem recebível lançado</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {pendentes.isLoading && <p className="text-sm text-muted-foreground">Verificando vendas...</p>}

        {!pendentes.isLoading && lista.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma pendência: todas as vendas no crédito, crediário e fiado já têm parcelas lançadas.
          </p>
        )}

        {lista.length > 0 && (
          <>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <strong>{lista.length} venda(s)</strong> somando{' '}
              <strong className="font-mono">{formatCurrency(totalPendente)}</strong> foram concluídas a prazo
              mas nunca geraram contas a receber — por isso não aparecem no calendário nem na projeção de caixa.
              Gerar agora lança as parcelas contando os vencimentos a partir da data original de cada venda.
            </div>

            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {lista.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--royal-line)] bg-background/45 p-2 text-xs"
                >
                  <span className="font-mono">#{v.numero}</span>
                  <span className="text-muted-foreground">{formatDate(v.data_hora)}</span>
                  <span className="text-muted-foreground">
                    {FORMA_LABEL[v.forma]}{v.parcelas > 1 ? ` ${v.parcelas}x` : ''}
                    {v.bandeira ? ` · ${BANDEIRAS.find((b) => b.value === v.bandeira)?.label}` : ''}
                  </span>
                  <span className="font-mono">{formatCurrency(v.total_liquido)}</span>
                </div>
              ))}
            </div>

            <Button onClick={executar} disabled={gerar.isPending}>
              Gerar recebíveis das {lista.length} venda(s)
            </Button>
            <p className="text-xs text-muted-foreground">
              As taxas configuradas acima serão aplicadas. Rode uma vez só — executar de novo criaria parcelas duplicadas
              para vendas que já foram corrigidas (elas somem desta lista após a geração).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const [aba, setAba] = useState<AbaConfig>('loja');
  const [config, setConfig] = useState<ConfiguracoesSistema>(() => carregarConfiguracoes());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    carregarConfiguracoesSupabase()
      .then((cfg) => {
        if (active) setConfig(cfg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const previewData = useMemo<ComprovanteData>(
    () => ({
      venda: {
        numero: 128,
        data_hora: new Date().toISOString(),
        total_bruto: 189.8,
        desconto_total: 10,
        total_liquido: 179.8,
        canal: config.pdv.canal_padrao,
        observacao: 'Prévia de configuração do cupom',
        status: 'CONCLUIDA',
      },
      cliente_nome: 'Cliente Exemplo',
      cliente_telefone: '(11) 99999-0000',
      vendedor_nome: 'Operador',
      itens: [
        { produto_nome: 'Perfume Royal Garden 100ml', quantidade: 1, preco_unitario: 129.9, desconto: 10, total: 119.9 },
        { produto_nome: 'Brinco Argola Dourada', quantidade: 2, preco_unitario: 29.95, desconto: 0, total: 59.9 },
      ],
      pagamentos: [{ forma: config.pdv.forma_pagamento_padrao, valor: 200, parcelas: 1 }],
      troco: 20.2,
    }),
    [config.pdv.canal_padrao, config.pdv.forma_pagamento_padrao]
  );

  const previewHtml = useMemo(
    () => buildComprovanteHtml(previewData, { autoPrint: false, tituloAcao: config.cupom.titulo }, config),
    [config, previewData]
  );

  function setSecao<T extends keyof ConfiguracoesSistema>(secao: T, patch: Partial<ConfiguracoesSistema[T]>) {
    setConfig((atual) => updateNested(atual, secao, patch));
  }

  function handleLogoArquivo(file: File | null) {
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('Use uma logo em PNG ou JPG');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('Logo muito grande. Use ate 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSecao('loja', { logo_url: String(reader.result) });
      toast.success('Logo carregada');
    };
    reader.onerror = () => toast.error('Nao foi possivel ler a logo');
    reader.readAsDataURL(file);
  }

  async function salvarSupabase() {
    try {
      setSaving(true);
      await salvarConfiguracoesSupabase(config);
      toast.success('Configurações salvas no Supabase');
    } catch (e) {
      toast.error(`Não foi possível salvar no Supabase: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function restaurarSupabase() {
    if (!confirm('Restaurar configurações padrão?')) return;
    try {
      setSaving(true);
      const cfg = await restaurarConfiguracoesPadraoSupabase();
      setConfig(cfg);
      toast.success('Configurações restauradas no Supabase');
    } catch (e) {
      toast.error(`Não foi possível restaurar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function salvar() {
    return salvarSupabase();
  }

  async function restaurar() {
    return restaurarSupabase();
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Dados da loja, impressão de cupom, PDV e envio de comprovantes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={restaurar} disabled={saving}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar
            </Button>
            <Button onClick={salvar} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-[1fr_360px]">
        {loading && (
          <div className="xl:col-span-2 rounded border bg-background px-4 py-3 text-sm text-muted-foreground">
            Carregando configurações do Supabase...
          </div>
        )}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-md border bg-background p-2">
            {ABAS.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={aba === item.id ? 'default' : 'ghost'}
                className="gap-2"
                onClick={() => setAba(item.id)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>

          {aba === 'loja' && (
            <Card>
              <CardHeader><CardTitle>Dados da loja</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Nome fantasia"><Input value={config.loja.nome_fantasia} onChange={(e) => setSecao('loja', { nome_fantasia: e.target.value })} /></Field>
                <Field label="Razão social"><Input value={config.loja.razao_social} onChange={(e) => setSecao('loja', { razao_social: e.target.value })} /></Field>
                <Field label="CNPJ"><Input value={config.loja.cnpj} onChange={(e) => setSecao('loja', { cnpj: e.target.value })} /></Field>
                <Field label="Inscrição estadual"><Input value={config.loja.inscricao_estadual} onChange={(e) => setSecao('loja', { inscricao_estadual: e.target.value })} /></Field>
                <Field label="Telefone"><Input value={config.loja.telefone} onChange={(e) => setSecao('loja', { telefone: e.target.value })} /></Field>
                <Field label="WhatsApp da loja"><Input value={config.loja.whatsapp} onChange={(e) => setSecao('loja', { whatsapp: e.target.value })} /></Field>
                <Field label="E-mail"><Input value={config.loja.email} onChange={(e) => setSecao('loja', { email: e.target.value })} /></Field>
                <Field label="Site / Instagram"><Input value={config.loja.site} onChange={(e) => setSecao('loja', { site: e.target.value })} /></Field>
                <div className="md:col-span-2"><Field label="Endereço"><Input value={config.loja.endereco} onChange={(e) => setSecao('loja', { endereco: e.target.value })} /></Field></div>
                <Field label="Cidade"><Input value={config.loja.cidade} onChange={(e) => setSecao('loja', { cidade: e.target.value })} /></Field>
                <Field label="UF"><Input maxLength={2} value={config.loja.uf} onChange={(e) => setSecao('loja', { uf: e.target.value.toUpperCase() })} /></Field>
                <div className="md:col-span-2 space-y-3">
                  <Label>Logo</Label>
                  <div className="grid gap-3 sm:grid-cols-[112px_1fr]">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded border bg-muted">
                      {config.loja.logo_url ? (
                        <img src={config.loja.logo_url} alt="Logo da loja" className="h-full w-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="https://... ou PNG/JPG enviado" value={config.loja.logo_url} onChange={(e) => setSecao('loja', { logo_url: e.target.value })} />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" asChild>
                          <label className="cursor-pointer">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Enviar PNG/JPG
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={(e) => handleLogoArquivo(e.target.files?.[0] ?? null)}
                            />
                          </label>
                        </Button>
                        {config.loja.logo_url && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => setSecao('loja', { logo_url: '' })}>
                            Remover logo
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Arquivos PNG ou JPG de até 1 MB. A imagem será salva nas configurações do Supabase.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {aba === 'cupom' && (
            <Card>
              <CardHeader><CardTitle>Conteúdo do cupom</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Título"><Input value={config.cupom.titulo} onChange={(e) => setSecao('cupom', { titulo: e.target.value })} /></Field>
                <Field label="Subtítulo"><Input value={config.cupom.subtitulo} onChange={(e) => setSecao('cupom', { subtitulo: e.target.value })} /></Field>
                <div className="md:col-span-2"><Field label="Mensagem de rodapé"><Textarea value={config.cupom.mensagem_rodape} onChange={(e) => setSecao('cupom', { mensagem_rodape: e.target.value })} /></Field></div>
                <Field label="Texto fiscal"><Input value={config.cupom.texto_sem_valor_fiscal} onChange={(e) => setSecao('cupom', { texto_sem_valor_fiscal: e.target.value })} /></Field>
                <div className="grid gap-2 md:col-span-2 md:grid-cols-3">
                  <BoolField label="Exibir logo" checked={config.cupom.exibir_logo} onChange={(v) => setSecao('cupom', { exibir_logo: v })} />
                  <BoolField label="Exibir CNPJ" checked={config.cupom.exibir_cnpj} onChange={(v) => setSecao('cupom', { exibir_cnpj: v })} />
                  <BoolField label="Exibir endereço" checked={config.cupom.exibir_endereco} onChange={(v) => setSecao('cupom', { exibir_endereco: v })} />
                  <BoolField label="Exibir telefone" checked={config.cupom.exibir_telefone} onChange={(v) => setSecao('cupom', { exibir_telefone: v })} />
                  <BoolField label="Exibir cliente" checked={config.cupom.exibir_cliente} onChange={(v) => setSecao('cupom', { exibir_cliente: v })} />
                  <BoolField label="Exibir vendedor" checked={config.cupom.exibir_vendedor} onChange={(v) => setSecao('cupom', { exibir_vendedor: v })} />
                  <BoolField label="Exibir desconto" checked={config.cupom.exibir_desconto} onChange={(v) => setSecao('cupom', { exibir_desconto: v })} />
                  <BoolField label="Exibir troco" checked={config.cupom.exibir_troco} onChange={(v) => setSecao('cupom', { exibir_troco: v })} />
                  <BoolField label="Exibir SKU" checked={config.cupom.exibir_sku} onChange={(v) => setSecao('cupom', { exibir_sku: v })} />
                </div>
              </CardContent>
            </Card>
          )}

          {aba === 'impressao' && (
            <Card>
              <CardHeader><CardTitle>Impressão</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Modo de impressão">
                  <Select value={config.impressao.modo} onValueChange={(v) => setSecao('impressao', { modo: v as ModoImpressao })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="termica_texto">Térmica/fiscal — texto (linha a linha)</SelectItem>
                      <SelectItem value="grafico">Gráfico — com logo e imagens</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Térmica/fiscal imprime texto puro (sem imagem) — saída limpa em bobina. Use Gráfico só para
                    impressora comum/PDF.
                  </p>
                </Field>
                <Field label="Tamanho do papel">
                  <Select value={config.impressao.tamanho_papel} onValueChange={(v) => setSecao('impressao', { tamanho_papel: v as TamanhoPapelCupom })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">Bobina 58mm</SelectItem>
                      <SelectItem value="80mm">Bobina 80mm</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Largura personalizada (mm)"><Input type="number" value={config.impressao.largura_personalizada_mm} onChange={(e) => setSecao('impressao', { largura_personalizada_mm: Number(e.target.value) || 58 })} /></Field>
                {config.impressao.modo === 'termica_texto' && (
                  <Field label="Colunas de texto (0 = automático)">
                    <Input type="number" min={0} max={64} value={config.impressao.colunas_texto} onChange={(e) => setSecao('impressao', { colunas_texto: Number(e.target.value) || 0 })} />
                    <p className="text-xs text-muted-foreground">58mm ≈ 32 colunas · 80mm ≈ 48 colunas. Ajuste se o texto cortar ou sobrar.</p>
                  </Field>
                )}
                <Field label="Margem (mm)"><Input type="number" value={config.impressao.margem_mm} onChange={(e) => setSecao('impressao', { margem_mm: Number(e.target.value) || 0 })} /></Field>
                <Field label="Fonte do cupom (px)"><Input type="number" value={config.impressao.fonte_px} onChange={(e) => setSecao('impressao', { fonte_px: Number(e.target.value) || 12 })} /></Field>
                <Field label="Cópias"><Input type="number" min={1} max={5} value={config.impressao.copias} onChange={(e) => setSecao('impressao', { copias: Number(e.target.value) || 1 })} /></Field>
                <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                  <BoolField label="Abrir impressão automaticamente" checked={config.impressao.auto_abrir_impressao} onChange={(v) => setSecao('impressao', { auto_abrir_impressao: v })} />
                  <BoolField label="Gerar PDF em formato A4" checked={config.impressao.abrir_pdf_em_a4} onChange={(v) => setSecao('impressao', { abrir_pdf_em_a4: v })} />
                </div>

                <div className="md:col-span-2 space-y-3 rounded-md border border-[var(--royal-line)] bg-background/40 p-4">
                  <BoolField
                    label="Impressão silenciosa (sem pop-up) — modo kiosk"
                    checked={config.impressao.impressao_silenciosa}
                    onChange={(v) => setSecao('impressao', { impressao_silenciosa: v })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Imprime direto na <strong>impressora padrão do Windows</strong> sem abrir janela. Para pular
                    também o diálogo de impressão, inicie o Chrome com a flag <code className="rounded bg-muted px-1">--kiosk-printing</code>:
                  </p>
                  <pre className="overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing --app=https://SEU-SITE.vercel.app
                  </pre>
                  <p className="text-xs text-muted-foreground">
                    Defina a impressora térmica como <strong>padrão</strong> no Windows. Dica: crie um atalho na área
                    de trabalho com essa linha para o caixa abrir o sistema já em modo de impressão direta.
                  </p>
                </div>

              </CardContent>
            </Card>
          )}

          {aba === 'pdv' && (
            <Card>
              <CardHeader><CardTitle>Padrões do PDV</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Canal padrão">
                  <Select value={config.pdv.canal_padrao} onValueChange={(v) => setSecao('pdv', { canal_padrao: v as VendaCanal })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Local de estoque padrão">
                  <Select value={config.pdv.local_estoque_padrao} onValueChange={(v) => setSecao('pdv', { local_estoque_padrao: v as LocalizacaoEstoque })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{LOCAIS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Forma de pagamento padrão">
                  <Select value={config.pdv.forma_pagamento_padrao} onValueChange={(v) => setSecao('pdv', { forma_pagamento_padrao: v as FormaPagamento })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FORMAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                  <BoolField label="Exigir cliente para fiado" checked={config.pdv.exigir_cliente_fiado} onChange={(v) => setSecao('pdv', { exigir_cliente_fiado: v })} />
                  <BoolField label="Troco somente em dinheiro" checked={config.pdv.permitir_troco_apenas_dinheiro} onChange={(v) => setSecao('pdv', { permitir_troco_apenas_dinheiro: v })} />
                </div>
              </CardContent>
            </Card>
          )}

          {aba === 'recebiveis' && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Taxas por bandeira</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md border border-[var(--royal-line)] bg-background/45 p-3 text-sm text-muted-foreground">
                    O percentual retido é descontado ao gerar o recebível: o calendário e a projeção passam a
                    mostrar o <strong className="text-foreground">líquido</strong> que cai na conta, e a taxa
                    entra como custo no lucro líquido do mês. No PDV, a bandeira usada na venda define qual
                    linha abaixo é aplicada. Vale para vendas novas — as já lançadas mantêm o valor original.
                  </div>

                  <div className="overflow-x-auto rounded-md border border-[var(--royal-line)]">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead>
                        <tr className="border-b border-[var(--royal-line)] bg-background/45 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Bandeira</th>
                          <th className="px-3 py-2 font-medium">Débito %</th>
                          <th className="px-3 py-2 font-medium">Crédito à vista %</th>
                          <th className="px-3 py-2 font-medium">Parcelado 2x–6x %</th>
                          <th className="px-3 py-2 font-medium">Parcelado 7x+ %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {BANDEIRAS.map((b) => {
                          const linha = config.recebiveis.bandeiras[b.value];
                          function setCampo(campo: keyof TaxaBandeira, v: number) {
                            setSecao('recebiveis', {
                              bandeiras: {
                                ...config.recebiveis.bandeiras,
                                [b.value]: { ...linha, [campo]: Math.min(Math.max(v, 0), 100) },
                              },
                            });
                          }
                          return (
                            <tr key={b.value} className="border-b border-[var(--royal-line)] last:border-b-0">
                              <td className="px-3 py-2 font-medium">{b.label}</td>
                              <td className="px-3 py-1.5">
                                <Input type="number" step="0.01" min={0} max={100} className="h-8 w-24"
                                  value={linha.debito_pct}
                                  onChange={(e) => setCampo('debito_pct', Number(e.target.value) || 0)} />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input type="number" step="0.01" min={0} max={100} className="h-8 w-24"
                                  value={linha.credito_vista_pct}
                                  onChange={(e) => setCampo('credito_vista_pct', Number(e.target.value) || 0)} />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input type="number" step="0.01" min={0} max={100} className="h-8 w-24"
                                  value={linha.parcelado_2a6_pct}
                                  onChange={(e) => setCampo('parcelado_2a6_pct', Number(e.target.value) || 0)} />
                              </td>
                              <td className="px-3 py-1.5">
                                <Input type="number" step="0.01" min={0} max={100} className="h-8 w-24"
                                  value={linha.parcelado_7mais_pct}
                                  onChange={(e) => setCampo('parcelado_7mais_pct', Number(e.target.value) || 0)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Prazos de recebimento</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field label="Intervalo entre repasses do crédito (dias)">
                    <Input
                      type="number" min={1} max={120}
                      value={config.recebiveis.dias_recebimento_credito}
                      onChange={(e) => setSecao('recebiveis', { dias_recebimento_credito: Math.min(Math.max(Number(e.target.value) || 30, 1), 120) })}
                    />
                  </Field>
                  <div className="md:col-span-2 space-y-3 rounded-md border border-[var(--royal-line)] p-3">
                    <BoolField
                      label="Gerar recebível para o débito (D+N)"
                      checked={config.recebiveis.gerar_recebivel_debito}
                      onChange={(v) => setSecao('recebiveis', { gerar_recebivel_debito: v })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Desligado, o débito conta como recebido no ato e a taxa da tabela acima não é aplicada.
                      Ligado, ele vira uma parcela líquida no prazo abaixo e passa a aparecer no calendário.
                    </p>
                    {config.recebiveis.gerar_recebivel_debito && (
                      <Field label="Prazo do débito (dias)">
                        <Input
                          type="number" min={0} max={30}
                          value={config.recebiveis.dias_recebimento_debito}
                          onChange={(e) => setSecao('recebiveis', { dias_recebimento_debito: Math.min(Math.max(Number(e.target.value) || 1, 0), 30) })}
                        />
                      </Field>
                    )}
                  </div>
                </CardContent>
              </Card>

              <BackfillRecebiveis />
            </div>
          )}

          {aba === 'whatsapp' && (
            <Card>
              <CardHeader><CardTitle>Envio por WhatsApp</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <BoolField label="Habilitar envio por WhatsApp" checked={config.whatsapp.ativo} onChange={(v) => setSecao('whatsapp', { ativo: v })} />
                <Field label="DDI padrão"><Input value={config.whatsapp.ddi_padrao} onChange={(e) => setSecao('whatsapp', { ddi_padrao: e.target.value.replace(/\D/g, '') || '55' })} /></Field>
                <div className="md:col-span-2"><Field label="Mensagem antes do comprovante"><Textarea value={config.whatsapp.mensagem_prefixo} onChange={(e) => setSecao('whatsapp', { mensagem_prefixo: e.target.value })} /></Field></div>
                <div className="md:col-span-2"><Field label="Mensagem após o comprovante"><Textarea value={config.whatsapp.mensagem_sufixo} onChange={(e) => setSecao('whatsapp', { mensagem_sufixo: e.target.value })} /></Field></div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Check className="h-4 w-4" /> Prévia</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {config.loja.logo_url && config.cupom.exibir_logo && (
                <img src={config.loja.logo_url} alt="Logo" className="max-h-20 rounded border object-contain p-2" />
              )}
              <div className="rounded border bg-muted/30 p-2">
                <iframe title="Prévia do cupom" srcDoc={previewHtml} className="h-[520px] w-full rounded bg-white" />
              </div>
              <div className="rounded border p-3 text-sm">
                <div className="flex justify-between"><span>Total exemplo</span><strong>{formatCurrency(previewData.venda.total_liquido)}</strong></div>
                <div className="flex justify-between text-muted-foreground"><span>Troco</span><span>{formatCurrency(previewData.troco ?? 0)}</span></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Atalhos</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>O cupom impresso, PDF e WhatsApp usam estas configurações imediatamente após salvar.</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setConfig(CONFIGURACOES_DEFAULT);
                  toast.info('Prévia voltou ao padrão. Clique em salvar para persistir.');
                }}
              >
                Carregar padrão na tela
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
