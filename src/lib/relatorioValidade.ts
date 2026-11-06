import { supabase } from '@/lib/supabase';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import { formatCurrency, formatDate } from '@/lib/utils';

/**
 * Relatório de produtos por validade — do mais próximo de vencer ao mais distante.
 *
 * Cada linha é um lote: uma entrada de estoque que registrou data de validade.
 * A quantidade mostrada é a que ENTROU naquele lote; o sistema não baixa do
 * lote específico na venda (a saída reduz o saldo total do produto), então o
 * número serve para priorizar o giro, não como saldo exato por lote.
 */

export type FaixaValidade = 'vencido' | 'ate7' | 'ate30' | 'ate90' | 'acima90';

export const FAIXAS: { id: FaixaValidade; label: string; descricao: string }[] = [
  { id: 'vencido', label: 'Vencidos', descricao: 'já passaram da validade' },
  { id: 'ate7', label: 'Vence em até 7 dias', descricao: 'ação imediata' },
  { id: 'ate30', label: 'Vence em 8 a 30 dias', descricao: 'priorizar giro' },
  { id: 'ate90', label: 'Vence em 31 a 90 dias', descricao: 'acompanhar' },
  { id: 'acima90', label: 'Mais de 90 dias', descricao: 'sem urgência' },
];

export interface LoteValidadeRel {
  movimento_id: string;
  produto_id: string;
  produto_nome: string;
  sku: string | null;
  categoria: string;
  localizacao: string;
  quantidade: number;
  custo_unitario: number;
  /** Quanto se perde se este lote vencer sem ser vendido. */
  valor_risco: number;
  data_validade: string;
  data_entrada: string;
  dias_restantes: number;
  faixa: FaixaValidade;
}

export interface ResumoValidade {
  lotes: LoteValidadeRel[];
  total_lotes: number;
  total_itens: number;
  valor_risco_total: number;
  valor_risco_vencido: number;
  valor_risco_30d: number;
  qtd_vencidos: number;
  qtd_ate30: number;
}

/**
 * Linha crua do PostgREST. Tipada à mão porque o cliente Supabase deste
 * projeto é não-tipado e a inferência se perde em relação aninhada
 * (movimento → produto → categoria).
 */
interface LinhaCrua {
  id: string;
  produto_id: string;
  quantidade: number | string | null;
  localizacao: string;
  data_validade: string;
  data_hora: string;
  custo_unitario: number | string | null;
  produto:
    | {
        id: string;
        nome: string;
        sku: string | null;
        custo_aquisicao: number | string | null;
        categoria: { nome: string } | { nome: string }[] | null;
      }
    | {
        id: string;
        nome: string;
        sku: string | null;
        custo_aquisicao: number | string | null;
        categoria: { nome: string } | { nome: string }[] | null;
      }[]
    | null;
}

function classificar(dias: number): FaixaValidade {
  if (dias < 0) return 'vencido';
  if (dias <= 7) return 'ate7';
  if (dias <= 30) return 'ate30';
  if (dias <= 90) return 'ate90';
  return 'acima90';
}

/**
 * Carrega os lotes com validade, do mais próximo de vencer ao mais distante.
 * Compartilhado entre a tela de Relatórios e a versão para impressão.
 */
export async function carregarLotesValidade(): Promise<ResumoValidade> {
  const { data, error } = await supabase
    .from('movimentos_estoque')
    .select(
      'id, produto_id, quantidade, localizacao, data_validade, data_hora, custo_unitario, ' +
        'produto:produtos(id, nome, sku, custo_aquisicao, categoria:categorias(nome))',
    )
    .not('data_validade', 'is', null)
    .gt('quantidade', 0)
    .order('data_validade', { ascending: true })
    .limit(2000);
  if (error) throw error;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const lotes: LoteValidadeRel[] = ((data ?? []) as unknown as LinhaCrua[]).map((raw) => {
    // PostgREST devolve relações to-one como array em alguns casos.
    const produto = Array.isArray(raw.produto) ? raw.produto[0] : raw.produto;
    const categoriaRaw = produto?.categoria;
    const categoria = Array.isArray(categoriaRaw) ? categoriaRaw[0] : categoriaRaw;

    // Parse local: 'T00:00:00' evita o deslocamento de fuso que faria a data "voltar" um dia.
    const validade = new Date(`${raw.data_validade}T00:00:00`);
    const dias = Math.round((validade.getTime() - hoje.getTime()) / 86400000);

    const quantidade = Number(raw.quantidade ?? 0);
    // Custo do próprio movimento quando houver; senão o custo cadastrado do produto.
    const custo = Number(raw.custo_unitario ?? produto?.custo_aquisicao ?? 0);

    return {
      movimento_id: raw.id,
      produto_id: raw.produto_id,
      produto_nome: produto?.nome ?? '—',
      sku: produto?.sku ?? null,
      categoria: categoria?.nome ?? 'Sem categoria',
      localizacao: raw.localizacao,
      quantidade,
      custo_unitario: custo,
      valor_risco: +(quantidade * custo).toFixed(2),
      data_validade: raw.data_validade,
      data_entrada: raw.data_hora,
      dias_restantes: dias,
      faixa: classificar(dias),
    };
  });

  const soma = (fn: (l: LoteValidadeRel) => boolean) =>
    lotes.filter(fn).reduce((s, l) => s + l.valor_risco, 0);

  return {
    lotes,
    total_lotes: lotes.length,
    total_itens: lotes.reduce((s, l) => s + l.quantidade, 0),
    valor_risco_total: lotes.reduce((s, l) => s + l.valor_risco, 0),
    valor_risco_vencido: soma((l) => l.faixa === 'vencido'),
    valor_risco_30d: soma((l) => l.dias_restantes >= 0 && l.dias_restantes <= 30),
    qtd_vencidos: lotes.filter((l) => l.faixa === 'vencido').length,
    qtd_ate30: lotes.filter((l) => l.dias_restantes >= 0 && l.dias_restantes <= 30).length,
  };
}

function escape(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

function rotuloDias(dias: number): string {
  if (dias < 0) return `vencido há ${Math.abs(dias)}d`;
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  return `${dias} dias`;
}

function buildHtml(resumo: ResumoValidade): string {
  const config = carregarConfiguracoes();
  const lojaNome = config.loja.nome_fantasia || 'Loja';
  const geradoEm = new Date().toLocaleString('pt-BR');

  const secoes = FAIXAS.map((faixa) => {
    const itens = resumo.lotes.filter((l) => l.faixa === faixa.id);
    if (itens.length === 0) return '';

    const subValor = itens.reduce((s, l) => s + l.valor_risco, 0);
    const subQtd = itens.reduce((s, l) => s + l.quantidade, 0);

    const rows = itens
      .map(
        (l) => `<tr class="${l.faixa === 'vencido' ? 'vencido' : l.faixa === 'ate7' ? 'urgente' : ''}">
          <td>${escape(l.produto_nome)}</td>
          <td>${escape(l.sku) || '—'}</td>
          <td>${escape(l.categoria)}</td>
          <td>${escape(l.localizacao)}</td>
          <td class="num">${l.quantidade}</td>
          <td class="num">${formatDate(l.data_validade)}</td>
          <td class="num prazo">${rotuloDias(l.dias_restantes)}</td>
          <td class="num">${formatCurrency(l.valor_risco)}</td>
        </tr>`,
      )
      .join('');

    return `<tbody class="grupo">
      <tr class="cat">
        <td colspan="4">${escape(faixa.label)}
          <span class="muted">${escape(faixa.descricao)} · ${itens.length} lote(s)</span>
        </td>
        <td class="num">${subQtd}</td>
        <td colspan="2"></td>
        <td class="num">${formatCurrency(subValor)}</td>
      </tr>
      ${rows}
    </tbody>`;
  }).join('');

  const semDados = resumo.total_lotes === 0;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de Validade — ${escape(lojaNome)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 16px; }
  .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .card { flex: 1 1 150px; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; }
  .card.alerta { border-color: #e5a0a0; background: #fff6f6; }
  .card .label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: .04em; }
  .card .value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  .card.alerta .value { color: #c00; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 2px solid #333; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .prazo { font-weight: 600; }
  tr.cat td { background: #f3f4f6; font-weight: 700; border-top: 2px solid #ccc; }
  tr.vencido td { background: #fff4f4; }
  tr.vencido td.prazo { color: #c00; }
  tr.urgente td { background: #fffaf0; }
  tr.urgente td.prazo { color: #b45309; }
  .muted { color: #888; font-weight: 400; font-size: 10px; }
  tfoot td { font-weight: 700; border-top: 2px solid #333; padding: 8px; }
  .nota { margin-top: 16px; padding: 8px 10px; background: #f8f9fa; border-left: 3px solid #ccc; color: #555; font-size: 10px; }
  .vazio { padding: 40px; text-align: center; color: #888; border: 1px dashed #ddd; border-radius: 8px; }
  .footer { margin-top: 20px; color: #999; font-size: 10px; text-align: center; }
  @media print { body { padding: 8mm; } .card { break-inside: avoid; } tbody.grupo { break-inside: avoid; } }
</style>
</head>
<body>
  <h1>Relatório de Validade</h1>
  <div class="sub">${escape(lojaNome)} · gerado em ${geradoEm} · ordenado do mais próximo ao mais distante</div>

  <div class="cards">
    <div class="card"><div class="label">Lotes com validade</div><div class="value">${resumo.total_lotes}</div></div>
    <div class="card"><div class="label">Itens</div><div class="value">${resumo.total_itens}</div></div>
    <div class="card ${resumo.qtd_vencidos > 0 ? 'alerta' : ''}">
      <div class="label">Vencidos</div><div class="value">${resumo.qtd_vencidos}</div>
    </div>
    <div class="card ${resumo.valor_risco_vencido > 0 ? 'alerta' : ''}">
      <div class="label">Perda já realizada</div><div class="value">${formatCurrency(resumo.valor_risco_vencido)}</div>
    </div>
    <div class="card"><div class="label">Em risco (30 dias)</div><div class="value">${formatCurrency(resumo.valor_risco_30d)}</div></div>
    <div class="card"><div class="label">Custo total em validade</div><div class="value">${formatCurrency(resumo.valor_risco_total)}</div></div>
  </div>

  ${
    semDados
      ? '<div class="vazio">Nenhum lote com data de validade registrada.<br>Informe a validade ao dar entrada de estoque para acompanhar aqui.</div>'
      : `<table>
    <thead>
      <tr>
        <th>Produto</th><th>SKU</th><th>Categoria</th><th>Local</th>
        <th class="num">Qtd</th><th class="num">Validade</th><th class="num">Prazo</th><th class="num">Valor em risco</th>
      </tr>
    </thead>
    ${secoes}
    <tfoot>
      <tr>
        <td colspan="4">TOTAL GERAL</td>
        <td class="num">${resumo.total_itens}</td>
        <td colspan="2"></td>
        <td class="num">${formatCurrency(resumo.valor_risco_total)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="nota">
    <strong>Como ler:</strong> cada linha é um lote de entrada que registrou validade. A quantidade é a que
    entrou naquele lote — como a baixa de venda reduz o saldo total do produto e não o lote específico,
    use estes números para priorizar o giro, não como saldo exato por lote.
    O valor em risco usa o custo de aquisição: é o que se perde se o lote vencer sem ser vendido.
  </div>`
  }

  <div class="footer">${escape(lojaNome)} — relatório interno de controle de validade</div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

export async function gerarRelatorioValidade(): Promise<void> {
  const resumo = await carregarLotesValidade();
  const html = buildHtml(resumo);
  const w = window.open('', '_blank', 'width=1000,height=760');
  if (!w) {
    alert('Bloqueador de pop-up impediu a abertura do relatório. Permita pop-ups para continuar.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
