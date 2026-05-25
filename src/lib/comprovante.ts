import { carregarConfiguracoes, type ConfiguracoesSistema } from '@/lib/configuracoes';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Venda } from '@/types/database';

export interface ComprovanteItem {
  produto_nome: string;
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

export function buildComprovanteHtml(
  d: ComprovanteData,
  options: BuildComprovanteOptions = {},
  config: ConfiguracoesSistema = carregarConfiguracoes()
): string {
  const lojaNome = d.loja_nome ?? config.loja.nome_fantasia;
  const lojaCnpj = d.loja_cnpj ?? config.loja.cnpj;
  const autoPrint = options.autoPrint ?? config.impressao.auto_abrir_impressao;
  const larguraMm = larguraPapelMm(config);
  const margemMm = Math.max(config.impressao.margem_mm, 0);
  const fontePx = Math.max(config.impressao.fonte_px, 8);
  const endereco = [config.loja.endereco, config.loja.cidade, config.loja.uf].filter(Boolean).join(' - ');
  const troco = config.cupom.exibir_troco ? Number(d.troco ?? 0) : 0;

  const rows = d.itens
    .map(
      (it) => `
      <tr>
        <td>${escape(it.produto_nome)}${config.cupom.exibir_sku && it.sku ? `<div class="meta">SKU ${escape(it.sku)}</div>` : ''}</td>
        <td class="num">${it.quantidade}</td>
        <td class="num">${formatCurrency(it.preco_unitario)}</td>
        ${config.cupom.exibir_desconto ? `<td class="num">${it.desconto > 0 ? '-' + formatCurrency(it.desconto) : '-'}</td>` : ''}
        <td class="num"><strong>${formatCurrency(it.total)}</strong></td>
      </tr>`
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
  body { font-family: ui-monospace, 'Courier New', monospace; color: #000; margin: 0; padding: 20px; font-size: ${fontePx}px; }
  .paper { width: ${larguraMm}mm; max-width: 100%; margin: 0 auto; }
  .logo { display: block; max-width: 35mm; max-height: 22mm; object-fit: contain; margin: 0 auto 6px; }
  h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
  h2 { font-size: 13px; margin: 12px 0 6px; border-bottom: 1px dashed #000; padding-bottom: 2px; }
  .center { text-align: center; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th, td { padding: 3px 4px; text-align: left; border-bottom: 1px dashed #ccc; font-size: 11px; }
  th { background: #f0f0f0; font-weight: 600; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
  .total { font-size: 14px; padding: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin: 8px 0; }
  .footer { margin-top: 16px; text-align: center; font-size: 10px; color: #555; white-space: pre-line; }
  .meta { font-size: 10px; color: #444; }
  .obs { margin-top: 8px; padding: 6px; background: #f5f5f5; font-size: 11px; }
  .cancelada { color: #c00; font-weight: bold; text-align: center; padding: 6px; border: 2px solid #c00; margin: 8px 0; }
  @media print {
    body { padding: ${margemMm}mm; }
    .paper { width: ${larguraMm}mm; }
  }
  @media print and (max-width: 80mm) {
    body { font-size: ${Math.max(fontePx - 2, 8)}px; }
    h1 { font-size: 12px; }
    h2 { font-size: 11px; }
    th, td { font-size: 9px; padding: 2px; }
    .total { font-size: 11px; }
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
  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th class="num">Qtd</th>
        <th class="num">Preco</th>
        ${config.cupom.exibir_desconto ? '<th class="num">Desc.</th>' : ''}
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

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

export function imprimirComprovante(d: ComprovanteData): void {
  const config = carregarConfiguracoes();
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
