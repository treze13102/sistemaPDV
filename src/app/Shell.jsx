import { useEffect, useRef, useState } from "react";
import { Icon, Toasts } from "../config/ui.jsx";
import { Link, navigate } from "./router.jsx";
import { readPrefs, useStore } from "./store.jsx";
import { supabase } from "@/lib/supabase";
import { podePagina } from "./permissoes.js";

// Side rail in the original's order. Icons are this project's own line icons.
// Páginas que vivem dentro de outro item do menu (abas da mesma seção).
const GRUPO_DA_PAGINA = { calendar: "finances", analytics: "reports" };

/** Abas que juntam páginas vizinhas numa só seção do menu. */
export const SECOES = {
  finances: [
    { id: "receivables", label: "A RECEBER", to: "/finances/receivables/" },
    { id: "payables", label: "CONTAS A PAGAR", to: "/finances/payables/" },
    { id: "expenses", label: "LANÇAMENTOS", to: "/finances/expenses/" },
    { id: "calendar", label: "CALENDÁRIO", to: "/calendar/" },
  ],
  reports: [
    { id: "analytics", label: "ESTATÍSTICAS", to: "/analytics/" },
    { id: "reports", label: "ESTOQUE E VALIDADE", to: "/reports/" },
  ],
};
export function SecaoTabs({ secao, value }) {
  return <PillTabs tabs={SECOES[secao]} value={value} onChange={(id) => navigate(SECOES[secao].find((t) => t.id === id).to)} />;
}

/**
 * Converte a logo (preta em fundo claro) em branca com fundo transparente:
 * quanto mais escuro o pixel, mais opaco o branco. Sem fundo, não sobra borda nem linha.
 */
const cacheLogo = new Map();
function useLogoBranca(src) {
  const [url, setUrl] = useState(() => cacheLogo.get(src) || "");
  useEffect(() => {
    if (!src || cacheLogo.has(src)) return setUrl(cacheLogo.get(src) || "");
    const img = new Image();
    img.onload = () => {
      const alt = 120;
      const larg = Math.round((img.width / img.height) * alt);
      const c = document.createElement("canvas");
      c.width = larg;
      c.height = alt;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0, larg, alt);
      const d = x.getImageData(0, 0, larg, alt);
      for (let i = 0; i < d.data.length; i += 4) {
        const lum = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
        const a = Math.max(0, Math.min(255, (235 - lum) * 1.25)) * (d.data[i + 3] / 255);
        d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
        d.data[i + 3] = a;
      }
      x.putImageData(d, 0, 0);
      const out = c.toDataURL("image/png");
      cacheLogo.set(src, out);
      setUrl(out);
    };
    img.src = src;
  }, [src]);
  return url;
}

export const NAV = [
  { id: "checkout", label: "Vender", icon: "nav-sell", to: "/checkout/" },
  { id: "products", label: "Produtos", icon: "nav-products", to: "/products/" },
  { id: "catalog", label: "Catálogo", icon: "nav-cart", to: "/catalog/" },
  { id: "customers", label: "Clientes", icon: "nav-customer", to: "/customers/" },
  { id: "suppliers", label: "Fornecedores", icon: "nav-suppliers", to: "/suppliers/" },
  { id: "stock", label: "Estoque", icon: "nav-stock", to: "/stock/" },
  { id: "purchases", label: "Compras", icon: "nav-purchases", to: "/purchases/" },
  { id: "sales", label: "Histórico", icon: "nav-dollar", to: "/sales/" },
  { id: "finances", label: "Finanças", icon: "nav-wallet", to: "/finances/" },
  { id: "reports", label: "Relatórios", icon: "nav-stats", to: "/analytics/" },
  { id: "users", label: "Usuários", icon: "nav-users", to: "/users/" },
  { id: "config", label: "Ajustes", icon: "nav-cog", to: "/config/general/" },
];

const NAV_PATHS = {
  "nav-stock": () => <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 7l9-4 9 4v12l-9 3-9-3ZM3 7l9 4 9-4M12 11v11M7 5l10 4"/></g>,
  "nav-reports": () => <g fill="none" stroke="#fff" strokeWidth="1.7"><path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 17v-4M12 17V9M16 17v-6"/></g>,
  "nav-purchases": () => <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14v17l-3-2-3 2-3-2-3 2V4ZM8 2v4M16 2v4M10 10h5M10 14h5" /></g>,
  "nav-suppliers": () => <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h11v11H3ZM14 10h4l3 4v3h-7" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></g>,
  "nav-calendar": () => <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="16" height="15" rx="2" /><path d="M4 11h16M8 3v5M16 3v5M8 15h2M14 15h2" /></g>,
  "nav-sell": (f) => (f ? <><circle cx="12" cy="12" r="9" fill="#fff" /><path d="M8 12.5l3 3 5-6" stroke="#363f4d" strokeWidth="2" fill="none" strokeLinecap="round" /></> : <><path d="M20 11.5A8.5 8.5 0 1 1 15.5 4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" /><path d="M8 12l3 3 9-9" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" /></>),
  "nav-products": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></g>,
  "nav-kai": () => <g fill="none" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 3l8 8-8 9-8-9Z" /><path d="M12 3c-2 5-2 11 0 17" /><path d="M16 4l1-2M19 6l2-1M18 3l1 1" strokeLinecap="round" /></g>,
  "nav-cart": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"><path d="M3 4h2.5l2 11h10.5l2-8H6.5" /><circle cx="9" cy="19" r="1.6" /><circle cx="17" cy="19" r="1.6" /></g>,
  "nav-customer": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M5 20.5c0-4 3-6.5 7-6.5s7 2.5 7 6.5Z" strokeLinejoin="round" /></g>,
  "nav-dollar": () => <path d="M12 3v18M16 7.5c0-1.9-1.8-2.8-4-2.8s-4 1-4 2.9C8 12 16 10.2 16 14.6c0 2-1.8 3-4 3s-4-.9-4-2.9" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />,
  "nav-wallet": () => <g fill="none" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"><path d="M4 8h15a1.5 1.5 0 0 1 1.5 1.5V19H4Z" /><path d="M4 8l12-4v4M13 13.5h7.5" /></g>,
  "nav-stats": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7"><rect x="3.5" y="12" width="4" height="8" rx="1" /><rect x="10" y="7" width="4" height="13" rx="1" /><rect x="16.5" y="3" width="4" height="17" rx="1" /></g>,
  "nav-users": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5" /><path d="M3 19.5c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5Z" /><path d="M15 4.8a3.5 3.5 0 0 1 0 6.4M17 14c2.5.5 4 2.4 4 5.5h-3" /></g>,
  "nav-cog": (f) => <g fill={f ? "#fff" : "none"} stroke="#fff" strokeWidth="1.7"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill={f ? "#363f4d" : "none"} /><path d="M19.4 12a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z" strokeLinejoin="round" /></g>,
};

function NavIcon({ name, active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {NAV_PATHS[name](active)}
    </svg>
  );
}

const OPEN_KEY = "pdv.drawer.open";
const BANNER_KEY = "pdv.trialBanner.closed";

export default function Shell({ current, children }) {
  const { data, toasts, dismiss } = useStore();
  const [open, setOpen] = useState(() => { const s = localStorage.getItem(OPEN_KEY); return s == null ? window.innerWidth >= 1240 : s === "true"; });
  // The signed-in original shows no trial banner over the page, so it starts closed.
  const [banner, setBanner] = useState(false);
  const orders = data.orders.length;
  useEffect(() => localStorage.setItem(OPEN_KEY, String(open)), [open]);
  // Below 1240 px the original always shows the narrow menu (icons with labels underneath).
  const [wide, setWide] = useState(() => window.innerWidth >= 1240);
  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 1240);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const expanded = open && wide;
  // Logo da loja (Ajustes › Geral), mostrada em branco sobre o menu escuro.
  const logo = useLogoBranca(readPrefs().imageURL);

  return (
    <div className={`shell${expanded ? " is-open" : ""}${banner ? " has-banner" : ""}`}>
      {banner && (
        <div className="trial-banner" role="status">
          <span className="trial-banner__icon" aria-hidden="true">⚠</span>
          <span>
            Você tem <strong>7 dias</strong> de teste grátis no computador.
          </span>
          <a href="#assinar" onClick={(e) => e.preventDefault()}>
            Assine o plano GROW
          </a>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={() => {
              sessionStorage.setItem(BANNER_KEY, "1");
              setBanner(false);
            }}
          >
            <Icon name="close" size={20} color="#fff" strokeWidth={2} />
          </button>
        </div>
      )}
      <nav className="rail" aria-label="Menu principal">
        <div className="rail__top">
          {expanded ? (
            <>
              {logo ? <img className="rail__logo" src={logo} alt="Mont Royal" /> : <span className="rail__trial">MONT ROYAL</span>}
              <button type="button" className="rail__collapse" onClick={() => setOpen(false)} aria-label="Recolher menu" title="Recolher menu">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v16M20 12H9m4-5-5 5 5 5" fill="none" stroke="#a9b1be" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          ) : (
            <button type="button" className="rail__burger" onClick={() => setOpen(true)} aria-label="Expandir menu" title="Expandir menu">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="#a9b1be" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          )}
        </div>
        <ul className="rail__list">
          {NAV.filter((n) => podePagina(data.acesso, n.id)).map((n) => {
            const active = (GRUPO_DA_PAGINA[current] || current) === n.id;
            return (
              <li key={n.id}>
                <Link to={n.to} className={active ? "rail__item is-active" : "rail__item"} data-testid={`${n.id}-menu`} title={expanded ? undefined : n.label}>
                  {n.icon === "badge" ? <span className="rail__count">{orders}</span> : <NavIcon name={n.icon} active={active} />}
                  <span className="rail__label">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="shell__main">{children}</div>

      <Toasts items={toasts} onDismiss={dismiss} />
    </div>
  );
}

/* ---------- Page header: title, optional count, Ajuda, user menu ---------- */
function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { data } = useStore();
  const [auth, setAuth] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: r }) => setAuth(r.user));
  }, []);
  const perfil = data.users.find((u) => u.id === auth?.id);
  const owner = {
    name: perfil?.name || auth?.user_metadata?.nome || auth?.email?.split("@")[0] || "Usuário",
    email: auth?.email || "",
  };
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const ini = owner.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <div className={open ? "usermenu is-open" : "usermenu"} ref={ref}>
      <button type="button" className="usermenu__chip" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="usermenu__avatar">{ini}</span>
        <span className="usermenu__text">
          <strong>{owner.name}</strong>
          <small>{owner.email}</small>
        </span>
        <Icon name="chevron" size={18} color="#363f4d" />
      </button>
      {open && (
        <div className="usermenu__menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="usermenu__item is-danger"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login/";
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, count, back, lowercase }) {
  return (
    <header className="ph">
      <div className="ph__left">
        {back && (
          <button type="button" className="ph__back" onClick={() => navigate(back)} aria-label="Voltar">
            <Icon name="chevronLeft" size={26} color="#363f4d" strokeWidth={1.8} />
          </button>
        )}
        <h1 className={lowercase ? "ph__title is-lower" : "ph__title"}>{title}</h1>
        {count != null && <span className="ph__count">{count}</span>}
      </div>
      <div className="ph__right">
        <a className="ph__help" href="#help" data-testid="help-top-nav" onClick={(e) => e.preventDefault()}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-3-6.2M20 4v4h-4" fill="none" stroke="#363f4d" strokeWidth="1.6" strokeLinecap="round" /><path d="M9.5 13.5c1.4 1.3 3.6 1.3 5 0" stroke="#363f4d" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
          Ajuda
        </a>
        <UserMenu />
      </div>
    </header>
  );
}

/* ---------- Building blocks ---------- */
export function Toolbar({ children, className = "" }) {
  return <div className={`toolbar ${className}`}>{children}</div>;
}

export function SearchInput({ value, onChange, placeholder, width = 471, disabled, testID }) {
  return (
    <label className={disabled ? "sinput is-disabled" : "sinput"} style={{ width }}>
      <input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testID} />
      <Icon name="search" size={20} color={disabled ? "#a9b1be" : "#363f4d"} strokeWidth={1.7} />
    </label>
  );
}

export function TextAction({ icon, label, onClick, active, chevron, disabled }) {
  return (
    <button type="button" className={`taction${active ? " is-active" : ""}`} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={18} color={disabled ? "#a9b1be" : "#363f4d"} strokeWidth={1.6} />}
      <span>{label}</span>
      {chevron && <Icon name="chevron" size={16} color="#363f4d" strokeWidth={1.8} />}
    </button>
  );
}

export function GreenButton({ label, onClick, icon = "plus", testID, small, disabled }) {
  return (
    <button type="button" className={small ? "gbtn gbtn--small" : "gbtn"} onClick={onClick} data-testid={testID} disabled={disabled}>
      {icon && <Icon name={icon} size={small ? 20 : 22} color="#fff" strokeWidth={1.6} />}
      {label && <span>{label}</span>}
    </button>
  );
}

export function IconSquare({ icon, onClick, label }) {
  return (
    <button type="button" className="gsquare" onClick={onClick} aria-label={label} title={label}>
      <Icon name={icon} size={22} color="#fff" strokeWidth={1.6} />
    </button>
  );
}

export function EmptyState({ art, title, size = "lg", text, help = true, children }) {
  return (
    <div className={`empty empty--${size}`}>
      {art}
      <h2 className="empty__title" data-testid="search-empty-state-title">{title}</h2>
      {text && <p className="empty__text">{text}</p>}
      {help && (
        <>
          <p className="empty__text" data-testid="search-empty-state-description">Está com dúvidas?</p>
          <a className="empty__link" href="#help" onClick={(e) => e.preventDefault()}>
            Clique aqui e descubra nossa Central de Ajuda
          </a>
        </>
      )}
      {children}
    </div>
  );
}

export function PillTabs({ tabs, value, onChange }) {
  return (
    <div className="pills" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} className={value === t.id ? "pill is-active" : "pill"} onClick={() => onChange(t.id)} data-testid={`tab-${t.id}-cfg`}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Right-hand slide-over, as the original uses for filters and add forms. */
export function SidePanel({ title, onClose, children, footer, width = 450, dark }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="sp-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={dark ? "sp sp--dark" : "sp"} style={{ width }} role="dialog" aria-modal="true" aria-label={title}>
        <header className="sp__header">
          <strong>{title}</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} color="#363f4d" strokeWidth={2} />
          </button>
        </header>
        <div className="sp__body">{children}</div>
        {footer && <footer className="sp__footer">{footer}</footer>}
      </aside>
    </div>
  );
}

export function Switch({ checked, onChange, label, testID, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} data-testid={testID} disabled={disabled} className={checked ? "kswitch is-on" : "kswitch"} onClick={() => onChange(!checked)}>
      <span />
    </button>
  );
}

export function Field({ label, value, onChange, right, type = "text", inputMode, error, multiline, disabled, testID, rows = 2, suffix, legend }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={`kfield${error ? " has-error" : ""}${disabled ? " is-disabled" : ""}${legend ? " has-legend" : ""}`}>
      <label className="kfield__box">
        {legend && <span className="kfield__legend">{label}</span>}
        <Tag
          className="kfield__input"
          value={value}
          type={multiline ? undefined : type}
          inputMode={inputMode}
          placeholder={legend ? "" : label}
          rows={multiline ? rows : undefined}
          disabled={disabled}
          data-testid={testID}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {suffix && <span className="kfield__suffix">{suffix}</span>}
        {right && <span className="kfield__right">{right}</span>}
      </label>
      {error && <span className="kfield__error">{error}</span>}
    </div>
  );
}

export function HelpDot({ text }) {
  const [o, setO] = useState(false);
  return (
    <span className="helpdot" tabIndex={0} onMouseEnter={() => setO(true)} onMouseLeave={() => setO(false)} onFocus={() => setO(true)} onBlur={() => setO(false)} aria-label={text}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="#363f4d" strokeWidth="1.4" /><path d="M9.5 9.5a2.5 2.5 0 0 1 5 .3c0 1.7-2.5 2-2.5 3.7" fill="none" stroke="#363f4d" strokeWidth="1.4" strokeLinecap="round" /><circle cx="12" cy="16.8" r=".9" fill="#363f4d" /></svg>
      {o && <span className="tip__bubble">{text}</span>}
    </span>
  );
}

export function Avatar({ name, size = 36 }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ini}
    </span>
  );
}

export function Tag({ children, tone = "green" }) {
  return <span className={`ktag ktag--${tone}`}>{children}</span>;
}
