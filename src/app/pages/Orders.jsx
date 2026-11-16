import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../config/ui.jsx";
import { ArtBasket } from "../Art.jsx";
import { EmptyState, PageHeader, SearchInput, SidePanel, TextAction, Toolbar } from "../Shell.jsx";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../seed.js";
import { fmtDateTime, fmtTime, uid, useMoney, useStore } from "../store.jsx";

/** Order statuses, including the ones the store edits in Settings › Orders and sales. */
export function readStatuses({ onlyActive = true } = {}) {
  let s = ORDER_STATUSES;
  try {
    const saved = JSON.parse(localStorage.getItem("pdv.config.orders") || "{}").statuses;
    if (Array.isArray(saved) && saved.length) s = saved;
  } catch {
    /* keep defaults */
  }
  return onlyActive ? s.filter((x) => x.fixed || x.active) : s;
}

export function StatusIcon({ st, size = 20 }) {
  if (st.money) return <Icon name="dollar" size={size} color={st.color} strokeWidth={1.8} />;
  if (st.id === "pending") return <Icon name="clock" size={size} color={st.color} strokeWidth={1.8} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill={st.color} />
      <path d="M12 7v5h-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function StatusDropdown({ value, onChange, statuses }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const c = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, []);
  const cur = statuses.find((s) => s.id === value);
  return (
    <div className="popover-anchor" ref={ref}>
      <button type="button" className="taction" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {cur ? <StatusIcon st={cur} size={18} /> : <span className="taction__dot" />}
        <span>{cur ? cur.label : "Todos os status"}</span>
        <Icon name={open ? "chevronUp" : "chevron"} size={16} color="#363f4d" strokeWidth={1.8} />
      </button>
      {open && (
        <ul className="popover popover--menu">
          <li>
            <button type="button" onClick={() => (onChange("all"), setOpen(false))}>
              Todos os status
            </button>
          </li>
          {statuses.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => (onChange(s.id), setOpen(false))}>
                <StatusIcon st={s} size={18} /> {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filters({ value, onApply, onClose }) {
  const [v, setV] = useState(value);
  const toggle = (k, id) => setV((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id] }));
  const group = (title, k, opts) => (
    <section className="fgroup">
      <h4>{title}</h4>
      {opts.map(([id, l]) => (
        <label key={id} className="kcheck">
          <input type="checkbox" checked={v[k].includes(id)} onChange={() => toggle(k, id)} />
          <span>{l}</span>
        </label>
      ))}
    </section>
  );
  return (
    <SidePanel
      title="Filtros"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="kbtn kbtn--link" onClick={() => setV({ origin: [], delivery: [], paid: [] })}>
            Limpar
          </button>
          <button type="button" className="kbtn kbtn--primary" onClick={() => onApply(v)}>
            Filtrar
          </button>
        </>
      }
    >
      {group("Origem", "origin", [["store", "Loja (PDV)"], ["catalog", "Catálogo Online"]])}
      {group("Entrega", "delivery", [["delivery", "Entrega"], ["pickup", "Retirada"]])}
      {group("Pagamento", "paid", [["yes", "Pago"], ["no", "A receber"]])}
    </SidePanel>
  );
}

function OrderDetail({ order, onClose }) {
  const { data, update, notify } = useStore();
  const money = useMoney();
  const statuses = readStatuses();
  const [method, setMethod] = useState("pix");
  const customer = data.customers.find((c) => c.id === order.customerId);
  const setStatus = (status) => {
    update((d) => ({ orders: d.orders.map((o) => (o.id === order.id ? { ...o, status, paid: status === "paid" ? true : o.paid } : o)) }));
    notify("Status atualizado");
  };
  const close = () => {
    const sale = { id: uid("s"), number: data.nextNumber, items: order.items, discount: order.discount || 0, total: order.total, payments: [{ method, value: order.total }], customerId: order.customerId, userId: order.userId, status: "closed", createdAt: order.createdAt, closedAt: Date.now(), isOrder: true };
    update((d) => ({
      sales: [sale, ...d.sales],
      nextNumber: d.nextNumber + 1,
      orders: d.orders.filter((o) => o.id !== order.id),
      products: d.products.map((p) => {
        const it = order.items.find((i) => i.productId === p.id);
        return it && p.stockActive && !["confirmed"].includes(order.status) ? { ...p, stock: p.stock - it.qty } : p;
      }),
    }));
    notify(`Pedido #${order.number} finalizado`);
    onClose();
  };
  const cancel = () => {
    if (!window.confirm("Cancelar este pedido?")) return;
    update((d) => ({ orders: d.orders.filter((o) => o.id !== order.id) }));
    notify("Pedido cancelado", "danger");
    onClose();
  };
  return (
    <SidePanel
      title={`Pedido #${order.number}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={cancel}>
            Cancelar pedido
          </button>
          <button type="button" className="kbtn kbtn--primary" onClick={close}>
            Finalizar venda
          </button>
        </>
      }
    >
      <p className="sp__meta">
        {fmtDateTime(order.createdAt)} · {order.origin === "catalog" ? "Catálogo Online" : "Loja"} · {order.delivery === "delivery" ? "Entrega" : "Retirada"}
      </p>
      <section className="fgroup">
        <h4>Status</h4>
        <ul className="status-pick">
          {statuses.map((s) => (
            <li key={s.id}>
              <button type="button" className={order.status === s.id ? "is-active" : ""} onClick={() => setStatus(s.id)}>
                <StatusIcon st={s} /> {s.label}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {customer && (
        <section className="fgroup">
          <h4>Cliente</h4>
          <p className="sp__text">
            <strong>{customer.name}</strong>
            <br />
            {customer.phone}
            {customer.address && (
              <>
                <br />
                {customer.address}
              </>
            )}
          </p>
        </section>
      )}
      <section className="fgroup">
        <h4>Itens</h4>
        <ul className="lines">
          {order.items.map((i) => (
            <li key={i.productId}>
              <span>{i.qty}x</span>
              <span>{i.name}</span>
              <strong>{money(i.price * i.qty)}</strong>
            </li>
          ))}
          <li className="lines__total">
            <span />
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </li>
        </ul>
      </section>
      {order.note && (
        <section className="fgroup">
          <h4>Observação</h4>
          <p className="sp__text">{order.note}</p>
        </section>
      )}
      <section className="fgroup">
        <h4>Pagamento ao finalizar</h4>
        <select className="kselect" value={method} onChange={(e) => setMethod(e.target.value)}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </section>
    </SidePanel>
  );
}

export default function Orders() {
  const { data } = useStore();
  const money = useMoney();
  const statuses = readStatuses();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ origin: [], delivery: [], paid: [] });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const empty = data.orders.length === 0;

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return data.orders
      .filter((o) => status === "all" || o.status === status)
      .filter((o) => !filters.origin.length || filters.origin.includes(o.origin))
      .filter((o) => !filters.delivery.length || filters.delivery.includes(o.delivery))
      .filter((o) => !filters.paid.length || filters.paid.includes(o.paid ? "yes" : "no"))
      .filter((o) => {
        if (!t) return true;
        const c = data.customers.find((x) => x.id === o.customerId);
        return String(o.number).includes(t) || (c && c.name.toLowerCase().includes(t)) || o.items.some((i) => i.name.toLowerCase().includes(t));
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [data.orders, data.customers, status, q, filters]);
  const nFilters = filters.origin.length + filters.delivery.length + filters.paid.length;

  return (
    <div className="page">
      <PageHeader title="pedidos abertos" lowercase />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Item ou cliente" disabled={empty} testID="search-input-ord" />
        <TextAction icon="filter" label={nFilters ? `Filtros (${nFilters})` : "Filtros"} onClick={() => setFiltersOpen(true)} disabled={empty} />
        <StatusDropdown value={status} onChange={setStatus} statuses={statuses} />
      </Toolbar>
      {empty ? (
        <EmptyState art={<ArtBasket />} title="Ainda não há pedidos" size="sm" />
      ) : list.length === 0 ? (
        <EmptyState art={<ArtBasket />} title="Nenhum pedido encontrado" size="sm" help={false} />
      ) : (
        <ul className="order-list">
          {list.map((o) => {
            const st = statuses.find((s) => s.id === o.status) || ORDER_STATUSES[0];
            const c = data.customers.find((x) => x.id === o.customerId);
            return (
              <li key={o.id}>
                <button type="button" className="order-card" onClick={() => setOpenId(o.id)}>
                  <span className="order-card__status">
                    <StatusIcon st={st} /> {st.label}
                  </span>
                  <span className="order-card__main">
                    <strong>
                      #{o.number} · {c ? c.name : "Sem cliente"}
                    </strong>
                    <small>
                      {o.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                    </small>
                  </span>
                  <span className="order-card__meta">
                    <small>{o.origin === "catalog" ? "Catálogo" : "Loja"} · {o.delivery === "delivery" ? "Entrega" : "Retirada"} · {fmtTime(o.createdAt)}</small>
                    {o.paid ? <span className="ktag ktag--green">PAGO</span> : <span className="ktag ktag--gray">A RECEBER</span>}
                  </span>
                  <strong className="order-card__total">{money(o.total)}</strong>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {filtersOpen && (
        <Filters
          value={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(f) => {
            setFilters(f);
            setFiltersOpen(false);
          }}
        />
      )}
      {openId && data.orders.find((o) => o.id === openId) && <OrderDetail order={data.orders.find((o) => o.id === openId)} onClose={() => setOpenId(null)} />}
    </div>
  );
}
