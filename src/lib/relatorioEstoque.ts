import { supabase } from '@/lib/supabase';
import { carregarConfiguracoes } from '@/lib/configuracoes';
import { formatCurrency } from '@/lib/utils';

interface ProdutoRel {
  id: string;
  nome: string;
  sku: string | null;
  custo_aquisicao: number;
  preco_venda_padrao: number;
  estoque_minimo: number | null;
  status: string;
  categoria: { nome: string } | null;
}

interface LinhaRel {
  nome: string;
  sku: string | null;
  categoria: string;
  saldo: number;
  custo: number;
  preco: number;
  estoque_minimo: number;
  abaixo: boolean;
}

function escape(s: string | null | undefined): string {
  return (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
}

async function carregarLinhas(): Promise<LinhaRel[]> {
  const [prodRes, saldoRes] = await Promise.all([
    supabase
      .from('produtos')
      .select('id, nome, sku, custo_aquisicao, preco_venda_padrao, estoque_minimo, status, categoria:categorias(nome)')
      .order('nome'),
    supabase.from('v_estoque_saldo').select('produto_id, saldo'),
  ]);
  if (prodRes.error) throw prodRes.error;
  if (saldoRes.error) throw saldoRes.error;

  const saldoPorProduto = new Map<string, number>();
  for (const s of saldoRes.data ?? []) {
    saldoPorProduto.set(s.produto_id, (saldoPorProduto.get(s.produto_id) ?? 0) + Number(s.saldo ?? 0));
  }

  return ((prodRes.data ?? []) as unknown as ProdutoRel[]).map((p) => {
    const saldo = saldoPorProduto.get(p.id) ?? 0;
    const minimo = Number(p.estoque_minimo ?? 0);
    return {
      nome: p.nome,
      sku: p.sku,
      categoria: p.categoria?.nome ?? 'Sem categoria',
      saldo,
      custo: Number(p.custo_aquisicao),
      preco: Number(p.preco_venda_padrao),
      estoque_minimo: minimo,
      abaixo: minimo > 0 && saldo <= minimo && p.status === 'ativo',
    };
  });
}

function buildHtml(linhas: LinhaRel[]): string {
  const config = carregarConfiguracoes();
  const lojaNome = config.loja.nome_fantasia || 'Loja';
  const geradoEm = new Date().toLocaleString('pt-BR');

  // agrupa por categoria
  const grupos = new Map<string, LinhaRel[]>();
  for (const l of linhas) {
    const arr = grupos.get(l.categoria) ?? [];
    arr.push(l);
    grupos.set(l.categoria, arr);
  }

  let totalCusto = 0;
  let totalVenda = 0;
  let totalItens = 0;
  let totalAbaixo = 0;

  const secoes = [...grupos.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cat, itens]) => {
      let subCusto = 0;
      let subVenda = 0;
      const rows = itens
        .map((l) => {
          const valorCusto = l.saldo * l.custo;
          const valorVenda = l.saldo * l.preco;
          subCusto += valorCusto;
          subVenda += valorVenda;
          totalItens += l.saldo;
          if (l.abaixo) totalAbaixo += 1;
          return `<tr class="${l.abaixo ? 'low' : ''}">
            <td>${escape(l.nome)}</td>
            <td>${escape(l.sku) || '—'}</td>
            <td class="num">${l.saldo}</td>
            <td class="num">${l.estoque_minimo || '—'}</td>
            <td class="num">${formatCurrency(l.custo)}</td>
            <td class="num">${formatCurrency(l.preco)}</td>
            <td class="num">${formatCurrency(valorCusto)}</td>
            <td class="num">${formatCurrency(valorVenda)}</td>
          </tr>`;
        })
        .join('');
      totalCusto += subCusto;
      totalVenda += subVenda;
      return `<tbody class="grupo">
        <tr class="cat"><td colspan="6">${escape(cat)} <span class="muted">(${itens.length} produto(s))</span></td>
          <td class="num">${formatCurrency(subCusto)}</td><td class="num">${formatCurrency(subVenda)}</td></tr>
        ${rows}
      </tbody>`;
    })
    .join('');

  const margem = totalVenda > 0 ? ((totalVenda - totalCusto) / totalVenda) * 100 : 0;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de Estoque — ${escape(lojaNome)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 0; padding: 24px; font-size: 12px; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .sub { color: #666; font-size: 11px; margin-bottom: 16px; }
  .cards { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
  .card { flex: 1 1 150px; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; }
  .card .label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: .04em; }
  .card .value { font-size: 18px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 2px solid #333; padding: 6px 8px; }
  td { padding: 5px 8px; border-bottom: 1px solid #eee; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr.cat td { background: #f3f4f6; font-weight: 700; border-top: 2px solid #ccc; }
  tr.low td { background: #fff4f4; }
  tr.low td:first-child::after { content: ' ⚠'; color: #c00; }
  .muted { color: #888; font-weight: 400; font-size: 10px; }
  tfoot td { font-weight: 700; border-top: 2px solid #333; padding: 8px; }
  .footer { margin-top: 20px; color: #999; font-size: 10px; text-align: center; }
  @media print { body { padding: 8mm; } .card { break-inside: avoid; } tbody.grupo { break-inside: avoid; } }
</style>
</head>
<body>
  <h1>Relatório de Estoque</h1>
  <div class="sub">${escape(lojaNome)} · gerado em ${geradoEm}</div>

  <div class="cards">
    <div class="card"><div class="label">Produtos</div><div class="value">${linhas.length}</div></div>
    <div class="card"><div class="label">Itens em estoque</div><div class="value">${totalItens}</div></div>
    <div class="card"><div class="label">Valor de custo</div><div class="value">${formatCurrency(totalCusto)}</div></div>
    <div class="card"><div class="label">Valor de venda</div><div class="value">${formatCurrency(totalVenda)}</div></div>
    <div class="card"><div class="label">Margem potencial</div><div class="value">${margem.toFixed(1)}%</div></div>
    <div class="card"><div class="label">Abaixo do mínimo</div><div class="value">${totalAbaixo}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Produto</th><th>SKU</th><th class="num">Saldo</th><th class="num">Mín.</th>
        <th class="num">Custo</th><th class="num">Preço</th><th class="num">Vlr custo</th><th class="num">Vlr venda</th>
      </tr>
    </thead>
    ${secoes}
    <tfoot>
      <tr>
        <td colspan="6">TOTAL GERAL</td>
        <td class="num">${formatCurrency(totalCusto)}</td>
        <td class="num">${formatCurrency(totalVenda)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">${escape(lojaNome)} — relatório interno de controle de estoque</div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

export async function gerarRelatorioEstoque(): Promise<void> {
  const linhas = await carregarLinhas();
  const html = buildHtml(linhas);
  const w = window.open('', '_blank', 'width=1000,height=760');
  if (!w) {
    alert('Bloqueador de pop-up impediu a abertura do relatório. Permita pop-ups para continuar.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
