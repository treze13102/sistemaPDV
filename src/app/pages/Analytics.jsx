import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../config/ui.jsx";
import { ArtMagnifier } from "../Art.jsx";
import { PageHeader, SecaoTabs } from "../Shell.jsx";
import { useMoney } from "../store.jsx";
import { useEstatisticas } from "@/hooks/useEstatisticas";
import { calcularEstatisticas, obterPeriodo } from "@/lib/estatisticas";
import { isoDate } from "@/lib/recebiveis";
import { navigate } from "../router.jsx";
import "./Analytics.css";
const PALETTE = ["#2dd1ac", "#4286f4", "#fdca40", "#ff8552", "#ce7da5", "#0d3b66", "#82d173"];
const MODES = [["day", "Dia"], ["week", "Semana"], ["month", "Mês"], ["quarter", "Trimestre"], ["semester", "Semestre"], ["year", "Anual"], ["all", "Todo o período"], ["custom", "Período personalizado"]];
function Line({ points, fmt }) {
  const w = 800, h = 300, pad = 56;
  const min = Math.min(0, ...points.map((p) => p.v));
  const max = Math.max(1, ...points.map((p) => p.v));
  const x = (i) => pad + (i * (w - pad * 2)) / Math.max(1, points.length - 1);
  const y = (v) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.v)}`).join(" ");
  const step = Math.ceil(points.length / 10);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Gráfico">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad} x2={w - pad} y1={y(min + (max - min) * t)} y2={y(min + (max - min) * t)} stroke="#e8e9ea" />
          <text x={pad} y={y(min + (max - min) * t) - 8} className="chart__label">{fmt(min + (max - min) * t)}</text>
        </g>
      ))}
      <path d={`${d} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)}Z`} fill="rgba(45,209,172,0.12)" />
      <path d={d} fill="none" stroke="#2dd1ac" strokeWidth="2.5" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.v)} r="3" fill="#2dd1ac"><title>{`${p.label}: ${fmt(p.v)}`}</title></circle>
          {i % step === 0 && <text x={x(i)} y={h - 8} textAnchor="middle" className="chart__label">{p.label}</text>}
        </g>
      ))}
    </svg>
  );
}

function Pie({ parts, fmt }) {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  let a = -Math.PI / 2;
  const arcs = parts.map((p, i) => {
    const a2 = a + (p.v / total) * Math.PI * 2;
    const r = 80;
    const d = `M90,90 L${90 + r * Math.cos(a)},${90 + r * Math.sin(a)} A${r},${r} 0 ${a2 - a > Math.PI ? 1 : 0} 1 ${90 + r * Math.cos(a2)},${90 + r * Math.sin(a2)}Z`;
    a = a2;
    return { d, color: PALETTE[i % PALETTE.length], ...p };
  });
  return (
    <div className="pie">
      <svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Gráfico de pizza">
        {arcs.length === 1 ? <circle cx="90" cy="90" r="80" fill={arcs[0].color} /> : arcs.map((p) => <path key={p.key ?? p.label} d={p.d} fill={p.color} />)}
        <circle cx="90" cy="90" r="44" fill="#fff" />
      </svg>
      <ul className="legend">
        {arcs.map((p) => (
          <li key={p.key ?? p.label}>
            <span className="legend__dot" style={{ background: p.color }} />
            <span>{p.label}</span>
            <strong>{fmt(p.v)}</strong>
            <small>{Math.round((p.v / total) * 100)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Ranking({ rows, fmt, unit }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <ol className="ranking">
      {rows.map((r, i) => (
        <li key={r.key ?? r.label}>
          <span className="ranking__pos">{i + 1}</span>
          <div className="ranking__body">
            <div className="ranking__top">
              <span>{r.label}</span>
              <strong>{fmt(r.v)}</strong>
            </div>
            <div className="ranking__bar"><span style={{ width: `${(r.v / max) * 100}%` }} /></div>
            <small>{r.n} {unit}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Analytics() {
  const money = useMoney();
  const [mode, setMode] = useState("day");
  const [offset, setOffset] = useState(0);
  const [metric, setMetric] = useState("revenue");
  const [modeOpen, setModeOpen] = useState(false);
  const [custom, setCustom] = useState(() => ({ inicio: isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), fim: isoDate(new Date()) }));
  const [draft, setDraft] = useState(custom);
  const [customOpen, setCustomOpen] = useState(false);
  const [dateError, setDateError] = useState("");
  const ref = useRef(null);
  const today = isoDate(new Date());
  const period = useMemo(() => obterPeriodo(mode, offset, custom), [mode, offset, custom, today]);
  const query = useEstatisticas(period);
  const st = useMemo(() => calcularEstatisticas(query.data ?? [], period, mode), [query.data, period, mode]);
  const ready = !query.isLoading && !query.isError;
  const movable = mode !== "all" && mode !== "custom";
  useEffect(() => {
    const close = event => { if (ref.current && !ref.current.contains(event.target)) setModeOpen(false); };
    const escape = event => { if (event.key === "Escape") setModeOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, []);
  const topPay = st.payments[0];
  const metrics = [
    { id: "revenue", label: "FATURAMENTO", title: "Faturamento", value: money(st.revenue) },
    { id: "sales", label: "VENDAS", title: "Vendas", value: st.count },
    { id: "ticket", label: "TICKET MÉDIO", title: "Ticket médio", value: money(st.ticket) },
    { id: "profit", label: "LUCRO", title: "Lucro bruto estimado", value: money(st.profit) },
    { id: "tax", label: "TAXA DE VENDA", title: "Taxa de venda", value: money(st.tax) },
    { id: "payment", label: "MEIO DE PAGAMENTO", title: "Meio de pagamento", value: topPay ? `${Math.round(topPay.v / (st.revenue || 1) * 100)}% ${topPay.label}` : "0%" },
    { id: "products", label: "RANKING DE PRODUTOS", title: "Ranking de produtos", value: st.products[0]?.label ?? "–" },
    { id: "customers", label: "RANKING DE CLIENTES", title: "Ranking de clientes", value: st.customers[0]?.label ?? "–" },
    { id: "sellers", label: "VENDAS POR VENDEDOR", title: "Vendas por vendedor", value: st.sellers[0]?.label ?? "–" },
  ];
  const current = metrics.find(item => item.id === metric);
  const chartField = { revenue: "revenue", sales: "sales", ticket: "ticket", profit: "profit", tax: "tax" }[metric];
  const ranking = metric === "products" ? st.products : st.customers;
  const pie = metric === "payment" ? st.payments : st.sellers;

  function choosePeriod(next) {
    if (next === "custom") { setDraft(custom); setCustomOpen(true); setDateError(""); return; }
    setMode(next); setOffset(0); setModeOpen(false); setCustomOpen(false);
  }
  function applyCustom(event) {
    event.preventDefault();
    try { obterPeriodo("custom", 0, draft); }
    catch (error) { setDateError(error.message); return; }
    setCustom({ ...draft }); setMode("custom"); setOffset(0); setModeOpen(false); setCustomOpen(false); setDateError("");
  }
  function changeDate(key, event) {
    const value = event.currentTarget.value;
    setDraft(current => ({ ...current, [key]: value }));
  }

  return (
    <div className="page page--analytics">
      <PageHeader title="Relatórios" />
      <div className="fin-tabs"><SecaoTabs secao="reports" value="analytics" /></div>
      <div className="stats">
        <aside className="stats__side" aria-label="Indicadores de vendas">
          <div className="stats__period" ref={ref}>
            <div className="datenav">
              <button type="button" onClick={() => setOffset(value => value - 1)} disabled={!movable} aria-label="Período anterior"><Icon name="chevronLeft" size={16} /></button>
              <button type="button" className="datenav__label" onClick={() => setModeOpen(value => !value)} aria-expanded={modeOpen} aria-label={`Selecionar período: ${period.rotulo}`}>{period.rotulo}</button>
              <button type="button" onClick={() => setOffset(value => Math.min(0, value + 1))} disabled={!movable || offset >= 0} aria-label="Próximo período"><Icon name="chevronRight" size={16} /></button>
            </div>
            {modeOpen && (
              <div className="popover popover--menu analytics-period-menu" role="dialog" aria-label="Selecionar período">
                <div className="analytics-period-options">{MODES.map(([id, text]) => <button type="button" key={id} className={mode === id ? "is-active" : ""} onClick={() => choosePeriod(id)}>{text}{mode === id && <Icon name="check" size={16} />}</button>)}</div>
                {customOpen && (
                  <form className="analytics-custom" onSubmit={applyCustom}>
                    <label>Data inicial<input type="date" value={draft.inicio} onInput={event => changeDate("inicio", event)} onChange={event => changeDate("inicio", event)} required /></label>
                    <label>Data final<input type="date" value={draft.fim} onInput={event => changeDate("fim", event)} onChange={event => changeDate("fim", event)} required /></label>
                    {dateError && <p className="analytics-date-error" role="alert">{dateError}</p>}
                    <button type="submit" className="kbtn kbtn--primary">Aplicar período</button>
                  </form>
                )}
              </div>
            )}
          </div>
          <ul className="metrics">{metrics.map(item => <li key={item.id}><button type="button" className={`metric${ready && st.count ? " has-data" : ""}${metric === item.id ? " is-active" : ""}`} onClick={() => setMetric(item.id)} aria-pressed={metric === item.id}><span className="metric__label">{item.label}</span><span className="metric__value">{ready ? item.value : "—"}</span><Icon name="chevronRight" size={14} /></button></li>)}</ul>
        </aside>
        <section className="stats__main" aria-label={current.title} aria-busy={query.isLoading}>
          <div className="analytics-heading"><h3>{current.title}</h3>{ready && st.count > 0 && <strong className={metric === "profit" && st.profit < 0 ? "analytics-negative" : ""}>{current.value}</strong>}</div>
          {query.isError ? <div className="stats__empty" role="alert"><p>Não foi possível carregar as estatísticas.</p><small>{query.error.message}</small><button type="button" className="kbtn kbtn--outline" onClick={() => query.refetch()}>Tentar novamente</button></div> : query.isLoading ? <div className="stats__empty" role="status">Carregando estatísticas…</div> : st.count === 0 ? (
            <div className="stats__empty"><ArtMagnifier /><p>Não há vendas no período selecionado</p><button type="button" className="kbtn kbtn--link kbtn--dark" onClick={() => navigate("/checkout/")}>Vamos vender?</button></div>
          ) : (
            <div className="stats__chart">
              {chartField ? <Line points={st.series.map(item => ({ label: item.label, v: item[chartField] }))} fmt={metric === "sales" ? value => Math.round(value) : money} /> : ["products", "customers"].includes(metric) ? ranking.length ? <Ranking rows={ranking} fmt={money} unit={metric === "products" ? "un." : "compras"} /> : <p className="analytics-note">Não há {metric === "customers" ? "clientes identificados" : "produtos registrados"} nas vendas deste período.</p> : pie.length ? <Pie parts={pie} fmt={money} /> : <p className="analytics-note">Nenhum pagamento registrado neste período.</p>}
              <p className="analytics-note">{metric === "profit" ? "Faturamento menos o custo atual dos produtos vendidos. Estimativa de lucro bruto, antes de despesas e taxas; o custo histórico não foi registrado nos itens da venda." : metric === "tax" ? "Taxas registradas no financeiro das vendas. Vendas sem taxa registrada não acrescentam valor a esta soma." : "Somente vendas concluídas. Cancelamentos não entram nos indicadores."}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
