import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Modal } from "../../config/ui.jsx";
import { ArtDevices } from "../Art.jsx";
import { EmptyState, Field, PageHeader, SearchInput, SidePanel, TextAction, Toolbar } from "../Shell.jsx";
import { PAYMENT_METHODS } from "../seed.js";
import { fmtDate, fmtTime, readPrefs, semAcento, useMoney, useStore } from "../store.jsx";
import { Receipt, ReceiptActions } from "./Receipt.jsx";

export const PERIODS = [
  { id: "today", label: "Hoje", days: 1 },
  { id: "7", label: "7 dias", days: 7 },
  { id: "30", label: "30 dias", days: 30 },
  { id: "all", label: "Tudo", days: null },
];

const dayStart = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  return d.getTime();
};

export function inPeriod(t, period) {
  const p = PERIODS.find((x) => x.id === period);
  if (!p || !p.days) return true;
  return t >= dayStart(p.days - 1);
}

function CancelModal({ sale, onClose }) {
  const { actions, notify } = useStore();
  const [motivo, setMotivo] = useState("");
  const [busy, setBusy] = useState(false);
  const confirmar = async () => {
    setBusy(true);
    try {
      await actions.cancelSale(sale, motivo.trim());
      notify(`Venda #${sale.number} cancelada`, "success", "Estoque devolvido ao local de origem e parcelas em aberto canceladas.");
      onClose();
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={`Cancelar venda #${sale.number}`}
      onClose={() => !busy && onClose()}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose} disabled={busy}>
            Voltar
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={!motivo.trim() || busy} onClick={confirmar}>
            {busy ? "Cancelando..." : "Confirmar cancelamento"}
          </button>
        </>
      }
    >
      <p className="modal__lead">O estoque volta para o local de onde saiu e as parcelas em aberto desta venda são canceladas.</p>
      <Field label="Motivo do cancelamento" value={motivo} multiline rows={3} onChange={setMotivo} />
    </Modal>
  );
}

function SaleDetail({ sale, onClose }) {
  const { data } = useStore();
  const money = useMoney();
  const customer = data.customers.find((c) => c.id === sale.customerId);
  const [cancelando, setCancelando] = useState(false);
  const cancel = () => setCancelando(true);
  const text = encodeURIComponent(`Recibo da venda #${sale.number}: ${money(sale.total)}`);
  return (
    <SidePanel
      title={`Venda #${sale.number}`}
      onClose={onClose}
      footer={
        <>
          {sale.status !== "canceled" && (
            <button type="button" className="kbtn kbtn--outline" onClick={cancel}>
              Cancelar venda
            </button>
          )}
          <ReceiptActions sale={sale}/>
          <a className="kbtn kbtn--primary" href={customer?.phone ? `https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${text}` : `mailto:${customer?.email || ""}?subject=Recibo&body=${text}`} target="_blank" rel="noreferrer">
            Enviar recibo
          </a>
        </>
      }
    >
      {sale.status === "canceled" && <div className="alert">Venda cancelada{sale.canceledReason ? ` — ${sale.canceledReason}` : ""}</div>}
      <Receipt sale={sale} />
      {cancelando && <CancelModal sale={sale} onClose={() => setCancelando(false)} />}
    </SidePanel>
  );
}

function SellerDropdown({ value, onChange, users }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const c = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, []);
  const cur = users.find((u) => u.id === value);
  return (
    <div className="popover-anchor" ref={ref}>
      <button type="button" className="taction" onClick={() => setOpen((o) => !o)}>
        <Icon name="users" size={18} color="#363f4d" strokeWidth={1.6} />
        <span>{cur ? cur.name : "Todos os vendedores"}</span>
        <Icon name={open ? "chevronUp" : "chevron"} size={16} color="#363f4d" strokeWidth={1.8} />
      </button>
      {open && (
        <ul className="popover popover--menu">
          <li><button type="button" onClick={() => (onChange("all"), setOpen(false))}>Todos os vendedores</button></li>
          {users.map((u) => (
            <li key={u.id}><button type="button" onClick={() => (onChange(u.id), setOpen(false))}>{u.name}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SalesFilters({ value, onApply, onClose }) {
  const [v, setV] = useState(value);
  const toggle = (id) => setV((s) => ({ ...s, methods: s.methods.includes(id) ? s.methods.filter((x) => x !== id) : [...s.methods, id] }));
  return (
    <SidePanel title="Filtros" onClose={onClose} footer={<button type="button" className="kbtn kbtn--primary" onClick={() => onApply(v)}>Filtrar</button>}>
      <section className="fgroup">
        <h4>Período</h4>
        {PERIODS.map((p) => (
          <label key={p.id} className="kcheck">
            <input type="radio" name="period" checked={v.period === p.id} onChange={() => setV((s) => ({ ...s, period: p.id }))} />
            <span>{p.label}</span>
          </label>
        ))}
      </section>
      <section className="fgroup">
        <h4>Forma de pagamento</h4>
        {PAYMENT_METHODS.map((m) => (
          <label key={m.id} className="kcheck">
            <input type="checkbox" checked={v.methods.includes(m.id)} onChange={() => toggle(m.id)} />
            <span>{m.label}</span>
          </label>
        ))}
      </section>
      <section className="fgroup">
        <h4>Status</h4>
        {[["all", "Todas"], ["closed", "Finalizadas"], ["canceled", "Canceladas"]].map(([id, l]) => (
          <label key={id} className="kcheck">
            <input type="radio" name="status" checked={v.status === id} onChange={() => setV((s) => ({ ...s, status: id }))} />
            <span>{l}</span>
          </label>
        ))}
      </section>
    </SidePanel>
  );
}

export default function Sales() {
  const { data } = useStore();
  const money = useMoney();
  const prefs = readPrefs();
  const [q, setQ] = useState("");
  const [seller, setSeller] = useState("all");
  const [f, setF] = useState({ period: "all", methods: [], status: "all" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState(null);

  const closed = data.sales.filter((s) => s.status === "closed" && (seller === "all" || s.userId === seller));
  const sum = (from, to = Infinity) => {
    const l = closed.filter((s) => s.createdAt >= from && s.createdAt < to);
    return { n: l.length, v: l.reduce((t, s) => t + s.total, 0) };
  };
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const weekStart = dayStart(new Date().getDay());
  const strip = [["Hoje", sum(dayStart(0))], ["Ontem", sum(dayStart(1), dayStart(0))], ["Esta semana", sum(weekStart)], ["Este mês", sum(monthStart)]];

  const list = useMemo(() => {
    const t = semAcento(q);
    return data.sales
      .filter((s) => inPeriod(s.createdAt, f.period))
      .filter((s) => seller === "all" || s.userId === seller)
      .filter((s) => !f.methods.length || s.payments.some((p) => f.methods.includes(p.method)))
      .filter((s) => f.status === "all" || s.status === f.status)
      .filter((s) => prefs.showCanceledSales || s.status !== "canceled")
      .filter((s) => {
        if (!t) return true;
        const c = data.customers.find((x) => x.id === s.customerId);
        return (c && semAcento(c.name).includes(t)) || s.items.some((i) => semAcento(i.name).includes(t)) || String(s.number).includes(t);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.sales, data.customers, q, seller, f, prefs.showCanceledSales]);
  const open = data.sales.find((s) => s.id === openId);
  let lastDay = "";

  return (
    <div className="page">
      <PageHeader title="Histórico de vendas" />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Nome do cliente ou produto" testID="search-input-sale" />
        <TextAction icon="filter" label="Filtros" onClick={() => setFiltersOpen(true)} />
        <SellerDropdown value={seller} onChange={setSeller} users={data.users} />
      </Toolbar>
      <div className="strip">
        {strip.map(([label, x]) => (
          <div key={label}>
            <span>
              <b>{label}:</b> {x.n} {x.n === 1 ? "venda" : x.n ? "vendas" : "venda"}
            </span>
            <span>{money(x.v)}</span>
          </div>
        ))}
      </div>
      {data.sales.length === 0 ? (
        <EmptyState art={<ArtDevices />} title="Ainda não há vendas" size="lg" />
      ) : list.length === 0 ? (
        <EmptyState art={<ArtDevices />} title="Nenhuma venda encontrada" size="sm" help={false} />
      ) : (
        <div className="ktable ktable--sales">
          {list.map((s) => {
            const day = fmtDate(s.createdAt);
            const head = day !== lastDay ? ((lastDay = day), <div key={`d${s.id}`} className="ktable__group">{day}</div>) : null;
            const c = data.customers.find((x) => x.id === s.customerId);
            return [
              head,
              <button key={s.id} type="button" className={`ktable__row${s.status === "canceled" ? " is-crossed" : ""}`} onClick={() => setOpenId(s.id)}>
                <span>
                  <strong>#{s.number}</strong>
                  <small>{fmtTime(s.createdAt)}</small>
                </span>
                <span className="cell-ellipsis">{s.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}</span>
                <span>{c ? c.name : "—"}</span>
                <span>{s.payments.map((p) => PAYMENT_METHODS.find((m) => m.id === p.method)?.label).join(", ")}</span>
                <strong className="num">{money(s.total)}</strong>
              </button>,
            ];
          })}
        </div>
      )}
      {filtersOpen && <SalesFilters value={f} onClose={() => setFiltersOpen(false)} onApply={(x) => (setF(x), setFiltersOpen(false))} />}
      {open && <SaleDetail sale={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
