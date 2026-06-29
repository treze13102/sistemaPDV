import { carregarConfiguracoes, type ConfiguracoesSistema } from '@/lib/configuracoes';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Venda } from '@/types/database';

export interface ComprovanteItem {
  produto_nome: string;
  imagem_url?: string | null;
  sku?: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
}

export interface ComprovantePagamento {
  forma: string;
  valor: number;
  parcelas?: number | null;
}

export interface ComprovanteData {
  venda: Pick<Venda, 'numero' | 'data_hora' | 'total_bruto' | 'desconto_total' | 'total_liquido' | 'canal' | 'observacao' | 'status'>;
  cliente_nome?: string | null;
  cliente_telefone?: string | null;
  vendedor_nome?: string | null;
  itens: ComprovanteItem[];
  pagamentos: ComprovantePagamento[];
  troco?: number | null;
  loja_nome?: string;
  loja_cnpj?: string;
}

interface BuildComprovanteOptions {
  autoPrint?: boolean;
  tituloAcao?: string;
}

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartao Credito',
  CARTAO_DEBITO: 'Cartao Debito',
  PIX: 'PIX',
  FIADO: 'Fiado',
  VALE_PRESENTE: 'Vale Presente',
};

function escape(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

function larguraPapelMm(config: ConfiguracoesSistema): number {
  if (config.impressao.tamanho_papel === 'A4') return 210;
  if (config.impressao.tamanho_papel === '80mm') return 80;
  if (config.impressao.tamanho_papel === 'personalizado') return config.impressao.largura_personalizada_mm;
  return 58;
}

// Quantas colunas de caracteres cabem na bobina (modo texto/termica).
// 0 = automatico, derivado da largura do papel.
function colunasPapel(config: ConfiguracoesSistema): number {
  const manual = Number(config.impressao.colunas_texto ?? 0);
  if (manual >= 16) return Math.floor(manual);
  const larguraMm = larguraPapelMm(config);
  if (larguraMm >= 210) return 80; // A4
  if (larguraMm >= 80) return 48; // bobina 80mm
  if (larguraMm <= 58) return 32; // bobina 58mm
  // personalizado: ~0.55 col/mm de area util
  return Math.max(24, Math.floor(larguraMm * 0.55));
}

// ---- helpers de layout texto monoespacado ----
function repetir(ch: string, n: number): string {
  return n > 0 ? ch.repeat(n) : '';
}

function centralizar(texto: string, cols: number): string {
  const t = texto.length > cols ? texto.slice(0, cols) : texto;
  const livre = cols - t.length;
  const esq = Math.floor(livre / 2);
  return repetir(' ', esq) + t;
}

// Linha com rotulo a esquerda e valor a direita, preenchendo a largura.
function linhaLR(esq: string, dir: string, cols: number): string {
  const e = esq ?? '';
  const d = dir ?? '';
  if (e.length + d.length >= cols) {
    const espacoEsq = Math.max(cols - d.length - 1, 0);
    return `${e.slice(0, espacoEsq)} ${d}`.slice(0, cols);
  }
  return e + repetir(' ', cols - e.length - d.length) + d;
}

// Quebra texto em linhas de no maximo `cols` caracteres (sem cortar no meio quando possivel).
function quebrar(texto: string, cols: number): string[] {
  const palavras = (texto ?? '').split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = '';
  for (const p of palavras) {
    if (p.length > cols) {
      if (atual) { linhas.push(atual); atual = ''; }
      for (let i = 0; i < p.length; i += cols) linhas.push(p.slice(i, i + cols));
      continue;
    }
    if (!atual) atual = p;
    else if (atual.length + 1 + p.length <= cols) atual += ` ${p}`;
    else { linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  return linhas.length ? linhas : [''];
}

// Gera o cupom como linhas de texto monoespacado. Reutilizado pelo modo HTML
// termico e pelo encoder ESC/POS (impressao USB direta).
export function buildComprovanteLinhas(
  d: ComprovanteData,
  options: BuildComprovanteOptions,
  config: ConfiguracoesSistema = carregarConfiguracoes()
): string[] {
  const cols = colunasPapel(config);
  const lojaNome = d.loja_nome ?? config.loja.nome_fantasia;
  const lojaCnpj = d.loja_cnpj ?? config.loja.cnpj;
  const endereco = [config.loja.endereco, config.loja.cidade, config.loja.uf].filter(Boolean).join(' - ');
  const troco = config.cupom.exibir_troco ? Number(d.troco ?? 0) : 0;
  const divisor = repetir('-', cols);

  const L: string[] = [];
  L.push(centralizar(lojaNome.toUpperCase(), cols));
  if (config.cupom.exibir_cnpj && lojaCnpj) L.push(centralizar(`CNPJ ${lojaCnpj}`, cols));
  if (config.cupom.exibir_endereco && endereco) quebrar(endereco, cols).forEach((l) => L.push(centralizar(l, cols)));
  if (config.cupom.exibir_telefone && config.loja.telefone) L.push(centralizar(config.loja.telefone, cols));
  const titulo = options.tituloAcao ?? config.cupom.titulo;
  if (titulo) L.push(centralizar(titulo, cols));
  if (config.cupom.subtitulo) L.push(centralizar(config.cupom.subtitulo, cols));
  if (d.venda.status === 'CANCELADA') { L.push(''); L.push(centralizar('*** VENDA CANCELADA ***', cols)); }
  if (d.venda.status === 'ORCAMENTO') { L.push(''); L.push(centralizar('*** ORCAMENTO ***', cols)); }

  L.push(divisor);
  L.push(linhaLR('No.', `#${d.venda.numero}`, cols));
  const dt = new Date(d.venda.data_hora);
  L.push(linhaLR('Data', `${formatDate(d.venda.data_hora)} ${dt.toLocaleTimeString('pt-BR')}`, cols));
  L.push(linhaLR('Canal', d.venda.canal, cols));
  if (config.cupom.exibir_cliente && d.cliente_nome) L.push(linhaLR('Cliente', d.cliente_nome, cols));
  if (config.cupom.exibir_vendedor && d.vendedor_nome) L.push(linhaLR('Vendedor', d.vendedor_nome, cols));

  L.push(divisor);
  L.push(centralizar('ITENS', cols));
  L.push(divisor);
  for (const it of d.itens) {
    quebrar(it.produto_nome, cols).forEach((l) => L.push(l));
    if (config.cupom.exibir_sku && it.sku) L.push(`  SKU ${it.sku}`.slice(0, cols));
    L.push(linhaLR(`  ${it.quantidade} x ${formatCurrency(it.preco_unitario)}`, formatCurrency(it.total), cols));
    if (config.cupom.exibir_desconto && it.desconto > 0) {
      L.push(linhaLR('  Desconto', `- ${formatCurrency(it.desconto)}`, cols));
    }
  }

  L.push(divisor);
  L.push(linhaLR('Bruto', formatCurrency(Number(d.venda.total_bruto)), cols));
  if (config.cupom.exibir_desconto) {
    L.push(linhaLR('Desconto', `- ${formatCurrency(Number(d.venda.desconto_total))}`, cols));
  }
  L.push(linhaLR('TOTAL', formatCurrency(Number(d.venda.total_liquido)), cols));

  if (d.pagamentos.length) {
    L.push(divisor);
    L.push(centralizar('PAGAMENTO', cols));
    for (const p of d.pagamentos) {
      const rotulo = `${FORMA_LABEL[p.forma] ?? p.forma}${p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}`;
      L.push(linhaLR(rotulo, formatCurrency(p.valor), cols));
    }
  }
  if (troco > 0) L.push(linhaLR('Troco', formatCurrency(troco), cols));

  if (d.venda.observacao) {
    L.push(divisor);
    quebrar(`Obs: ${d.venda.observacao}`, cols).forEach((l) => L.push(l));
  }

  L.push(divisor);
  if (config.cupom.mensagem_rodape) quebrar(config.cupom.mensagem_rodape, cols).forEach((l) => L.push(centralizar(l, cols)));
  if (config.cupom.texto_sem_valor_fiscal) quebrar(config.cupom.texto_sem_valor_fiscal, cols).forEach((l) => L.push(centralizar(l, cols)));
  L.push('');
  L.push('');
  L.push('');

  return L;
}

function buildComprovanteTextoHtml(
  d: ComprovanteData,
  options: BuildComprovanteOptions,
  config: ConfiguracoesSistema
): string {
  const autoPrint = options.autoPrint ?? config.impressao.auto_abrir_impressao;
  const larguraMm = larguraPapelMm(config);
  const margemMm = Math.max(config.impressao.margem_mm, 0);
  const fontePx = Math.max(config.impressao.fonte_px, 8);

  const texto = escape(buildComprovanteLinhas(d, options, config).join('\n'));
  const pageSize = config.impressao.tamanho_papel === 'A4' ? 'auto' : `${larguraMm}mm auto`;
  const mostrarLogo = config.cupom.exibir_logo && !!config.loja.logo_url;
  const logoHtml = mostrarLogo
    ? `<img class="logo" src="${escape(config.loja.logo_url)}" alt="Logo" />`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante #${d.venda.numero}</title>
<style>
  /* @page margin 0: a margem fica no padding do conteudo, assim vale
     igual na tela e no papel (impressora termica ignora margem de @page). */
  @page { size: ${pageSize}; margin: 0; }
  html { margin: 0; padding: 0; background: #fff; }
  body {
    margin: 0;
    padding: ${margemMm}mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .logo {
    display: block;
    max-width: ${Math.max(larguraMm - margemMm * 2 - 2, 30)}mm;
    max-height: 22mm;
    object-fit: contain;
    margin: 0 0 ${margemMm}mm;
    /* alto contraste: logo imprime limpa na termica */
    filter: grayscale(1) contrast(1.4);
  }
  pre {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: ${fontePx}px;
    line-height: 1.25;
    color: #000;
    margin: 0;
    padding: 0;
    white-space: pre;
    font-weight: 700;
    letter-spacing: 0;
  }
</style>
</head>
<body>
${logoHtml}
<pre>${texto}</pre>
${autoPrint ? `<script>
  window.addEventListener('load', () => {
    const copias = ${Math.max(config.impressao.copias, 1)};
    setTimeout(() => { for (let i = 0; i < copias; i += 1) window.print(); }, 200);
  });
</script>` : ''}
</body>
</html>`;
}

export function buildComprovanteHtml(
  d: ComprovanteData,
  options: BuildComprovanteOptions = {},
  config: ConfiguracoesSistema = carregarConfiguracoes()
): string {
  if (config.impressao.modo === 'termica_texto') {
    return buildComprovanteTextoHtml(d, options, config);
  }

  const lojaNome = d.loja_nome ?? config.loja.nome_fantasia;
  const lojaCnpj = d.loja_cnpj ?? config.loja.cnpj;
  const autoPrint = options.autoPrint ?? config.impressao.auto_abrir_impressao;
  const larguraMm = larguraPapelMm(config);
  const margemMm = Math.max(config.impressao.margem_mm, 0);
  const fontePx = Math.max(config.impressao.fonte_px, 8);
  const endereco = [config.loja.endereco, config.loja.cidade, config.loja.uf].filter(Boolean).join(' - ');
  const troco = config.cupom.exibir_troco ? Number(d.troco ?? 0) : 0;

  const itensHtml = d.itens
    .map(
      (it) => `
      <div class="item">
        <div class="item-body">
          ${it.imagem_url ? `<img class="item-img" src="${escape(it.imagem_url)}" alt="" />` : ''}
          <div class="item-info">
            <div class="item-name">${escape(it.produto_nome)}${config.cupom.exibir_sku && it.sku ? `<div class="meta">SKU ${escape(it.sku)}</div>` : ''}</div>
            <div class="item-line"><span>${it.quantidade} x ${formatCurrency(it.preco_unitario)}</span><strong>${formatCurrency(it.total)}</strong></div>
            ${config.cupom.exibir_desconto && it.desconto > 0 ? `<div class="item-line muted"><span>Desconto</span><span>- ${formatCurrency(it.desconto)}</span></div>` : ''}
          </div>
        </div>
      </div>`
    )
    .join('');

  const pags = d.pagamentos
    .map(
      (p) =>
        `<div class="row"><span>${escape(FORMA_LABEL[p.forma] ?? p.forma)}${p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}</span><strong>${formatCurrency(p.valor)}</strong></div>`
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Comprovante #${d.venda.numero}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-monospace, 'Courier New', monospace; color: #000; margin: 0; padding: 8px; font-size: ${fontePx}px; }
  .paper { width: ${larguraMm}mm; max-width: 100%; margin: 0 auto; overflow: hidden; }
  .paper, .paper * { overflow-wrap: anywhere; word-break: normal; }
  .logo { display: block; max-width: 35mm; max-height: 22mm; object-fit: contain; margin: 0 auto 6px; }
  h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
  h2 { font-size: 13px; margin: 12px 0 6px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
  .center { text-align: center; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; align-items: flex-start; }
  .row span:first-child { flex: 0 0 auto; }
  .row span:last-child, .row strong:last-child { min-width: 0; text-align: right; }
  .item { border-bottom: 1px dashed #ccc; padding: 6px 0; }
  .item-body { display: flex; gap: 6px; align-items: flex-start; }
  .item-img { width: 12mm; height: 12mm; object-fit: cover; border: 1px solid #ddd; flex: 0 0 auto; }
  .item-info { min-width: 0; flex: 1; }
  .item-name { font-weight: 600; line-height: 1.2; margin-bottom: 3px; }
  .item-line { display: flex; justify-content: space-between; gap: 8px; line-height: 1.2; }
  .item-line span:first-child { min-width: 0; }
  .item-line strong, .item-line span:last-child { flex: 0 0 auto; text-align: right; white-space: nowrap; }
  .muted { color: #444; font-size: 10px; }
  .total { font-size: 14px; padding: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 8px 0; }
  .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #555; white-space: pre-line; }
  .meta { font-size: 10px; color: #444; }
  .obs { margin-top: 8px; padding: 6px; background: #f5f5f5; font-size: 11px; }
  .cancelada { color: #c00; font-weight: bold; text-align: center; padding: 6px; border: 2px solid #c00; margin: 8px 0; }
  @page { size: ${config.impressao.tamanho_papel === 'A4' ? 'A4' : `${larguraMm}mm auto`}; margin: ${margemMm}mm; }
  @media print {
    body { padding: 0; width: ${larguraMm}mm; }
    .paper { width: ${larguraMm}mm; }
  }
  @media print and (max-width: 80mm) {
    body { font-size: ${Math.max(fontePx - 2, 8)}px; padding: ${margemMm}mm; }
    h1 { font-size: 12px; }
    h2 { font-size: 11px; }
    .total { font-size: 11px; }
    .item-line strong, .item-line span:last-child { white-space: normal; }
    .item-img { width: 10mm; height: 10mm; }
  }
</style>
</head>
<body>
<div class="paper">
  ${config.cupom.exibir_logo && config.loja.logo_url ? `<img class="logo" src="${escape(config.loja.logo_url)}" alt="Logo" />` : ''}
  <h1>${escape(lojaNome)}</h1>
  ${config.cupom.exibir_cnpj && lojaCnpj ? `<div class="center meta">CNPJ ${escape(lojaCnpj)}</div>` : ''}
  ${config.cupom.exibir_endereco && endereco ? `<div class="center meta">${escape(endereco)}</div>` : ''}
  ${config.cupom.exibir_telefone && config.loja.telefone ? `<div class="center meta">${escape(config.loja.telefone)}</div>` : ''}
  <div class="center meta">${escape(options.tituloAcao ?? config.cupom.titulo)}</div>
  ${config.cupom.subtitulo ? `<div class="center meta">${escape(config.cupom.subtitulo)}</div>` : ''}
  ${d.venda.status === 'CANCELADA' ? '<div class="cancelada">VENDA CANCELADA</div>' : ''}
  ${d.venda.status === 'ORCAMENTO' ? '<div class="center meta" style="margin-top:4px"><strong>ORCAMENTO</strong></div>' : ''}

  <h2>Dados</h2>
  <div class="row"><span>No.</span><strong>#${d.venda.numero}</strong></div>
  <div class="row"><span>Data</span><span>${formatDate(d.venda.data_hora)} ${new Date(d.venda.data_hora).toLocaleTimeString('pt-BR')}</span></div>
  <div class="row"><span>Canal</span><span>${escape(d.venda.canal)}</span></div>
  ${config.cupom.exibir_cliente && d.cliente_nome ? `<div class="row"><span>Cliente</span><span>${escape(d.cliente_nome)}</span></div>` : ''}
  ${config.cupom.exibir_vendedor && d.vendedor_nome ? `<div class="row"><span>Vendedor</span><span>${escape(d.vendedor_nome)}</span></div>` : ''}

  <h2>Itens</h2>
  <div class="items">${itensHtml}</div>

  <div class="row"><span>Bruto</span><span>${formatCurrency(Number(d.venda.total_bruto))}</span></div>
  ${config.cupom.exibir_desconto ? `<div class="row"><span>Desconto</span><span>- ${formatCurrency(Number(d.venda.desconto_total))}</span></div>` : ''}
  <div class="total row"><span>TOTAL</span><strong>${formatCurrency(Number(d.venda.total_liquido))}</strong></div>
  ${d.pagamentos.length ? `<h2>Pagamento</h2>${pags}` : ''}
  ${troco > 0 ? `<div class="row"><span>Troco</span><strong>${formatCurrency(troco)}</strong></div>` : ''}
  ${d.venda.observacao ? `<div class="obs"><strong>Obs:</strong> ${escape(d.venda.observacao)}</div>` : ''}

  <div class="footer">
    ${escape(config.cupom.mensagem_rodape)}<br>
    ${escape(config.cupom.texto_sem_valor_fiscal)}
  </div>

  ${autoPrint ? `<script>
    window.addEventListener('load', () => {
      const copias = ${Math.max(config.impressao.copias, 1)};
      setTimeout(() => {
        for (let i = 0; i < copias; i += 1) window.print();
      }, 200);
    });
  </script>` : ''}
</div>
</body>
</html>`;
}

function abrirComprovante(d: ComprovanteData, largura: number, altura: number, tituloAcao: string): void {
  const config = carregarConfiguracoes();
  const html = buildComprovanteHtml(d, { autoPrint: true, tituloAcao }, config);
  const w = window.open('', '_blank', `width=${largura},height=${altura}`);
  if (!w) {
    alert('Bloqueador de pop-up impediu a abertura do comprovante. Permita pop-ups para continuar.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// Impressao silenciosa: renderiza o cupom num iframe oculto e dispara print()
// sem abrir janela/popup. Com o Chrome iniciado em --kiosk-printing, imprime
// direto na impressora padrao do Windows, sem o dialogo (sem gerar PDF).
function imprimirViaIframe(d: ComprovanteData, tituloAcao: string): void {
  const config = carregarConfiguracoes();
  const html = buildComprovanteHtml(d, { autoPrint: false, tituloAcao }, config);
  const copias = Math.max(config.impressao.copias, 1);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    abrirComprovante(d, 420, 720, tituloAcao); // fallback popup
    return;
  }

  let removido = false;
  const limpar = () => {
    if (removido) return;
    removido = true;
    setTimeout(() => iframe.remove(), 800);
  };
  win.addEventListener('afterprint', limpar);
  // rede de seguranca caso afterprint nao dispare
  setTimeout(limpar, 15000);

  doc.open();
  doc.write(html);
  doc.close();

  const disparar = () => {
    try {
      win.focus();
      for (let i = 0; i < copias; i += 1) win.print();
    } catch (e) {
      console.error(e);
      limpar();
      abrirComprovante(d, 420, 720, tituloAcao);
    }
  };
  // aguarda render do conteudo
  if (doc.readyState === 'complete') setTimeout(disparar, 200);
  else iframe.addEventListener('load', () => setTimeout(disparar, 200));
}

export function imprimirComprovante(d: ComprovanteData): void {
  const config = carregarConfiguracoes();

  // Impressao silenciosa (kiosk): iframe oculto, sem popup. Com Chrome
  // --kiosk-printing pula o dialogo e vai direto pra impressora padrao.
  if (config.impressao.impressao_silenciosa) {
    imprimirViaIframe(d, 'Cupom de venda');
    return;
  }

  const largura = config.impressao.tamanho_papel === '80mm' ? 520 : config.impressao.tamanho_papel === 'A4' ? 820 : 420;
  abrirComprovante(d, largura, 720, 'Cupom de venda');
}

export function gerarPdfComprovante(d: ComprovanteData): void {
  const config = carregarConfiguracoes();
  abrirComprovante(d, config.impressao.abrir_pdf_em_a4 ? 820 : 520, 900, 'Comprovante para PDF');
}

function normalizarTelefoneWhatsApp(telefone: string | null | undefined): string | null {
  const config = carregarConfiguracoes();
  const digitos = (telefone ?? '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  if (digitos.startsWith(config.whatsapp.ddi_padrao)) return digitos;
  return `${config.whatsapp.ddi_padrao}${digitos}`;
}

export function enviarComprovanteWhatsApp(d: ComprovanteData): void {
  const config = carregarConfiguracoes();
  if (!config.whatsapp.ativo) {
    alert('Envio por WhatsApp esta desabilitado nas configuracoes.');
    return;
  }

  const telefone = normalizarTelefoneWhatsApp(d.cliente_telefone);
  if (!telefone) {
    alert('Cliente sem telefone valido para WhatsApp.');
    return;
  }

  const itens = d.itens
    .map((it) => `${it.quantidade}x ${it.produto_nome} - ${formatCurrency(it.total)}`)
    .join('\n');
  const pagamentos = d.pagamentos
    .map((p) => `${FORMA_LABEL[p.forma] ?? p.forma}${p.parcelas && p.parcelas > 1 ? ` (${p.parcelas}x)` : ''}: ${formatCurrency(p.valor)}`)
    .join('\n');
  const troco = Number(d.troco ?? 0);
  const mensagem = [
    config.whatsapp.mensagem_prefixo,
    '',
    `Comprovante ${config.loja.nome_fantasia} #${d.venda.numero}`,
    d.cliente_nome ? `Cliente: ${d.cliente_nome}` : null,
    '',
    'Itens:',
    itens,
    '',
    `Total: ${formatCurrency(Number(d.venda.total_liquido))}`,
    pagamentos ? `Pagamento:\n${pagamentos}` : null,
    troco > 0 && config.cupom.exibir_troco ? `Troco: ${formatCurrency(troco)}` : null,
    '',
    config.whatsapp.mensagem_sufixo,
    config.cupom.texto_sem_valor_fiscal,
  ]
    .filter((linha) => linha !== null && linha !== '')
    .join('\n');

  window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener,noreferrer');
}
