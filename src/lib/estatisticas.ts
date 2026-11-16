import { FORMA_LABEL, isoDate } from './recebiveis';
import type { FormaPagamento } from '@/types/database';

export type ModoPeriodo = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';
export interface PeriodoEstatistica { inicio: Date | null; fim: Date | null; rotulo: string }
export interface DatasPersonalizadas { inicio: string; fim: string }

export function obterPeriodo(mode: ModoPeriodo, offset = 0, custom?: DatasPersonalizadas, base = new Date()): PeriodoEstatistica {
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (mode === 'all') return { inicio: null, fim: null, rotulo: 'Todo o período' };
  if (mode === 'custom') {
    if (!custom?.inicio || !custom.fim) throw new Error('Informe a data inicial e a data final.');
    const start = new Date(`${custom.inicio}T00:00:00`);
    const end = new Date(`${custom.fim}T00:00:00`);
    if (!Number.isFinite(+start) || !Number.isFinite(+end) || isoDate(start) !== custom.inicio || isoDate(end) !== custom.fim) throw new Error('Informe datas válidas.');
    if (start > end) throw new Error('A data final deve ser igual ou posterior à inicial.');
    end.setDate(end.getDate() + 1);
    return { inicio: start, fim: end, rotulo: `${start.toLocaleDateString('pt-BR')} – ${new Date(custom.fim + 'T00:00:00').toLocaleDateString('pt-BR')}` };
  }
  let start: Date;
  let end: Date;
  let label: string;
  if (mode === 'day') {
    start = new Date(today); start.setDate(start.getDate() + offset);
    end = new Date(start); end.setDate(end.getDate() + 1);
    label = `${offset === 0 ? 'Hoje: ' : offset === -1 ? 'Ontem: ' : ''}${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
  } else if (mode === 'week') {
    start = new Date(today); start.setDate(start.getDate() - start.getDay() + offset * 7);
    end = new Date(start); end.setDate(end.getDate() + 7);
    const last = new Date(end); last.setDate(last.getDate() - 1);
    label = `${start.toLocaleDateString('pt-BR')} – ${last.toLocaleDateString('pt-BR')}`;
  } else {
    const step = mode === 'year' ? 12 : mode === 'semester' ? 6 : mode === 'quarter' ? 3 : 1;
    const initialMonth = mode === 'year' ? 0 : Math.floor(today.getMonth() / step) * step;
    start = new Date(today.getFullYear(), initialMonth + offset * step, 1);
    end = new Date(start.getFullYear(), start.getMonth() + step, 1);
    label = mode === 'year' ? `Ano de ${start.getFullYear()}` : mode === 'quarter' ? `${Math.floor(start.getMonth() / 3) + 1}º trimestre de ${start.getFullYear()}` : mode === 'semester' ? `${Math.floor(start.getMonth() / 6) + 1}º semestre de ${start.getFullYear()}` : start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  return { inicio: start, fim: end, rotulo: label };
}

interface NomeRelacao { nome: string }
type Relacao<T> = T | T[] | null;
const um = <T,>(value?: Relacao<T>): T | null => Array.isArray(value) ? value[0] ?? null : value ?? null;
export interface VendaEstatistica {
  id: string;
  data_hora: string;
  total_liquido: number;
  cliente_id: string | null;
  usuario_id: string | null;
  cliente?: Relacao<NomeRelacao>;
  usuario?: Relacao<NomeRelacao>;
  itens: { produto_id: string; quantidade: number; preco_unitario: number; desconto?: number; total: number; produto?: Relacao<NomeRelacao & { custo_aquisicao: number }> }[];
  pagamentos: { forma: FormaPagamento; valor: number }[];
  taxa?: number;
}
interface RankingLinha { key: string; label: string; v: number; n: number }
interface Ponto { key: string; label: string; revenue: number; sales: number; profit: number; tax: number }
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Rateia o total líquido preservando os centavos, inclusive o desconto da venda. */
function ratear(total: number, pesos: number[]): number[] {
  const sum = pesos.reduce((s, value) => s + value, 0);
  if (sum <= 0) return pesos.map(() => 0);
  const cents = Math.round(total * 100);
  // Diferenças de arredondamento ficam nas maiores sobras, sem parcela negativa.
  const parts = pesos.map((peso, index) => ({ index, raw: cents * peso / sum, value: Math.floor(cents * peso / sum) }));
  let remaining = cents - parts.reduce((s, item) => s + item.value, 0);
  for (const item of [...parts].sort((a, b) => (b.raw - b.value) - (a.raw - a.value))) {
    if (remaining-- <= 0) break;
    item.value += 1;
  }
  return parts.map(item => item.value / 100);
}

export function calcularEstatisticas(vendas: VendaEstatistica[], periodo: PeriodoEstatistica, mode: ModoPeriodo) {
  const selected = vendas.filter(venda => (!periodo.inicio || +new Date(venda.data_hora) >= +periodo.inicio) && (!periodo.fim || +new Date(venda.data_hora) < +periodo.fim));
  const extremes = selected.reduce((result, sale) => { const time = +new Date(sale.data_hora); return { min: Math.min(result.min, time), max: Math.max(result.max, time) }; }, { min: Infinity, max: -Infinity });
  const earliest = selected.length ? new Date(extremes.min) : new Date();
  const latest = selected.length ? new Date(extremes.max) : new Date();
  const start = periodo.inicio ?? new Date(earliest.getFullYear(), earliest.getMonth(), earliest.getDate());
  const end = periodo.fim ?? new Date(latest.getFullYear(), latest.getMonth(), latest.getDate() + 1);
  const monthCount = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  const span = (+end - +start) / 86400000;
  const grouping = mode === 'day' ? 'hour' : monthCount > 36 ? 'year' : ['quarter', 'semester', 'year'].includes(mode) || span > 62 ? 'month' : 'day';
  const keyOf = (date: Date) => grouping === 'hour' ? String(date.getHours()) : grouping === 'year' ? String(date.getFullYear()) : isoDate(date).slice(0, grouping === 'month' ? 7 : 10);
  const buckets = new Map<string, Ponto>();
  const cursor = grouping === 'year' ? new Date(start.getFullYear(), 0, 1) : grouping === 'month' ? new Date(start.getFullYear(), start.getMonth(), 1) : new Date(start);
  while (cursor < end) {
    const key = keyOf(cursor);
    const label = grouping === 'hour' ? `${cursor.getHours()}h` : grouping === 'year' ? String(cursor.getFullYear()) : cursor.toLocaleDateString('pt-BR', grouping === 'month' ? { month: 'short', year: '2-digit' } : { day: '2-digit', month: '2-digit' });
    buckets.set(key, { key, label, revenue: 0, sales: 0, profit: 0, tax: 0 });
    if (grouping === 'hour') cursor.setHours(cursor.getHours() + 1);
    else if (grouping === 'year') cursor.setFullYear(cursor.getFullYear() + 1);
    else if (grouping === 'month') cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  const products = new Map<string, RankingLinha>();
  const customers = new Map<string, RankingLinha>();
  const sellers = new Map<string, RankingLinha>();
  const payments = new Map<string, RankingLinha>();
  let revenue = 0, cost = 0, tax = 0;
  function add(map: Map<string, RankingLinha>, key: string, label: string, value: number, count: number) {
    const item = map.get(key) ?? { key, label, v: 0, n: 0 };
    item.v += value; item.n += count; map.set(key, item);
  }
  for (const sale of selected) {
    const total = Number(sale.total_liquido);
    const saleTax = Number(sale.taxa ?? 0);
    const items = sale.itens ?? [];
    const saleCost = items.reduce((sum, item) => sum + Number(um(item.produto)?.custo_aquisicao ?? 0) * Number(item.quantidade), 0);
    revenue += total; cost += saleCost; tax += saleTax;
    const bucket = buckets.get(keyOf(new Date(sale.data_hora)));
    if (bucket) { bucket.revenue += total; bucket.sales += 1; bucket.profit += total - saleCost; bucket.tax += saleTax; }
    const itemValues = ratear(total, items.map(item => Math.max(Number(item.total ?? Number(item.preco_unitario) * Number(item.quantidade) - Number(item.desconto ?? 0)), 0)));
    items.forEach((item, index) => add(products, item.produto_id, um(item.produto)?.nome ?? 'Produto removido', itemValues[index], Number(item.quantidade)));
    // O troco sai primeiro do dinheiro; só o valor líquido entra na divisão por forma.
    const methods = (sale.pagamentos ?? []).map(item => ({ ...item, valor: Math.max(Number(item.valor), 0) }));
    let change = Math.max(methods.reduce((sum, item) => sum + item.valor, 0) - total, 0);
    for (const method of methods) if (method.forma === 'DINHEIRO') { const amount = Math.min(method.valor, change); method.valor -= amount; change -= amount; }
    const paymentValues = ratear(total, methods.map(item => item.valor));
    methods.forEach((method, index) => add(payments, method.forma, FORMA_LABEL[method.forma] ?? method.forma, paymentValues[index], 1));
    if (sale.cliente_id) add(customers, sale.cliente_id, um(sale.cliente)?.nome ?? 'Cliente removido', total, 1);
    add(sellers, sale.usuario_id ?? 'unknown', um(sale.usuario)?.nome ?? 'Sem vendedor identificado', total, 1);
  }
  const ranking = (map: Map<string, RankingLinha>) => [...map.values()].map(item => ({ ...item, v: round(item.v) })).sort((a, b) => b.v - a.v || a.label.localeCompare(b.label, 'pt-BR'));
  const series = [...buckets.values()].map(item => ({ ...item, revenue: round(item.revenue), profit: round(item.profit), tax: round(item.tax), ticket: item.sales ? round(item.revenue / item.sales) : 0 }));
  return { count: selected.length, revenue: round(revenue), cost: round(cost), profit: round(revenue - cost), tax: round(tax), ticket: selected.length ? round(revenue / selected.length) : 0, series, products: ranking(products).slice(0, 10), customers: ranking(customers).slice(0, 10), sellers: ranking(sellers), payments: ranking(payments).filter(item => item.v > 0) };
}
