import { useEffect, useRef, useState } from "react";
import { HelpIcon } from "../shared/icons.jsx";

/* ---------- Line icons for the side menu and form (neutral stand-ins) ---------- */
const PATHS = {
  cart: "M3 4h2l2 10h10l2-7H7M9 19a1 1 0 1 0 0 .01M17 19a1 1 0 1 0 0 .01",
  bag: "M5 8h14l-1 12H6Zm4 0V6a3 3 0 0 1 6 0v2",
  box: "M4 8l8-4 8 4v9l-8 4-8-4Zm0 0 8 4 8-4M12 12v9",
  customer: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  history: "M4 12a8 8 0 1 0 2.3-5.7M4 4v3h3M12 8v4l3 2",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9a3 3 0 1 0-1-5.8M18 20h3a5 5 0 0 0-5-5",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  logout: "M10 4H5v16h5M14 8l4 4-4 4M18 12H9",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M6 6l12 12M18 6 6 18",
  pin: "M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  padlock: "M6 11h12v9H6Zm2 0V8a4 4 0 0 1 8 0v3",
  chevron: "M6 9l6 6 6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 5 5",
  image: "M4 5h16v14H4Zm0 11 5-5 4 4 3-3 4 4M15 9.5a1 1 0 1 0 0 .01",
  check: "M5 12l5 5 9-10",
  refresh: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4",
  checkin: "M4 6h16v12H4ZM4 10h16M8 14h3",
  wallet: "M4 7h14a2 2 0 0 1 2 2v9H4Zm0 0 12-3v3M16 13h1",
  dollar: "M12 3v18M16 7.5C16 5.6 14.2 5 12 5s-4 1-4 2.8C8 12 16 10 16 14.5c0 2-1.8 3-4 3s-4-.8-4-2.8",
  stats: "M4 20V12m5 8V6m5 14v-9m5 9V3",
  kai: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13",
  edit: "M4 20h4L19 9l-4-4L4 16Zm9-13 4 4",
  copy: "M8 8h11v11H8ZM5 16V5h11",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  star: "M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.2 7 19l1.2-5.6L4 9.6 9.6 9Z",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6",
  printer: "M7 9V4h10v5M7 17H5V9h14v8h-2M7 14h10v6H7Z",
  truck: "M3 6h11v10H3Zm11 4h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01",
  store: "M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  download: "M12 4v11m-4-4 4 4 4-4M5 20h14",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  mail: "M3 6h18v12H3Zm0 0 9 7 9-7",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  calendar: "M4 6h16v14H4ZM4 10h16M8 3v5M16 3v5",
  send: "M4 12l16-8-6 16-3-7Z",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm5-9.5h.01",
  tag: "M3 12V4h8l9 9-8 8ZM7.5 7.5h.01",
  chevronUp: "M6 15l6-6 6 6",
  barcode: "M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3M8 9v6M10.5 9v6M13 9v6M16 9v6",
  bolt: "M13 2 5 14h6l-1 8 8-12h-6Z",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  grid: "M4 4h6v6H4ZM14 4h6v6h-6ZM4 14h6v6H4ZM14 14h6v6h-6Z",
  folder: "M3 6h6l2 2h10v11H3Z",
  upload: "M12 15V4m-4 4 4-4 4 4M5 13v7h14v-7",
  import: "M5 4h14v16H5ZM12 7v8m-3-3 3 3 3-3M8 18h8",
  filter: "M4 5h16l-6 8v6l-4-2v-4Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  duplicate: "M8 8h12v12H8ZM4 16V4h12",
  arrowUp: "M12 20V5m-6 6 6-6 6 6",
  arrowDown: "M12 4v15m-6-6 6 6 6-6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  hand: "M8 13V6a1.5 1.5 0 0 1 3 0v5V4.5a1.5 1.5 0 0 1 3 0V11V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7S5 18 4 15l-1-3a1.5 1.5 0 0 1 2.6-1.4L8 13",
  calc: "M6 3h12v18H6ZM9 6h6v3H9ZM9 13h.01M12 13h.01M15 13h.01M9 17h.01M12 17h.01M15 17h.01",
  money2: "M3 7h18v10H3ZM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 10v4M18 10v4",
};

export function Icon({ name, size = 20, color = "currentColor", strokeWidth = 1.6 }) {
  if (name === "help") return <HelpIcon size={size} color={color} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ---------- Tooltip (info icon with hover/focus text) ---------- */
export function Tip({ text, icon = "help", size = 18 }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="tip"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-label={text}
    >
      <Icon name={icon} size={size} color="var(--c-gray-05)" />
      {open && <span className="tip__bubble" role="tooltip">{text}</span>}
    </span>
  );
}

/* ---------- Section block (title, optional helper text, max 420px) ---------- */
export function Section({ title, additionalText, children }) {
  return (
    <section className="cfg-section">
      <h3 className="cfg-section__title">{title}</h3>
      {additionalText && <p className="cfg-section__text">{additionalText}</p>}
      {children}
    </section>
  );
}

/* ---------- Text field with floating label and right adornment ---------- */
export function TextField({ label, value, onChange, error, right, multiline, testID, inputMode, type = "text" }) {
  const filled = value != null && String(value).length > 0;
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={`tf${filled ? " is-filled" : ""}${error ? " has-error" : ""}${multiline ? " tf--multiline" : ""}`}>
      <label className="tf__box">
        <Tag
          className="tf__input"
          data-testid={testID}
          value={value}
          type={multiline ? undefined : type}
          inputMode={inputMode}
          placeholder=" "
          rows={multiline ? 4 : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="tf__label">{label}</span>
        {right && <span className="tf__right">{right}</span>}
      </label>
      {error && <span className="tf__error">{error}</span>}
    </div>
  );
}

/* ---------- Switch ---------- */
export function Switch({ label, checked, onChange, testID }) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testID}
        className={checked ? "switch is-on" : "switch"}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__knob" />
      </button>
    </label>
  );
}

/* ---------- Radio row (label left, radio right) ---------- */
export function RadioRow({ label, checked, onSelect, testID, name }) {
  return (
    <label className="radio-row" data-testid={testID}>
      <span>{label}</span>
      <input type="radio" name={name} checked={checked} onChange={onSelect} />
      <span className="radio" aria-hidden="true" />
    </label>
  );
}

/* ---------- Searchable select ---------- */
export function SearchSelect({ options, value, onChange, renderOption, renderValue, placeholder, testID, emptyValue }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = options.find((o) => o.code === value);
  const q = query.trim().toLowerCase();
  const list = q
    ? options.filter((o) => `${o.name} ${o.currency} ${o.symbol}`.toLowerCase().includes(q))
    : options;
  return (
    <div className={open ? "ss is-open" : "ss"} ref={ref} data-testid={testID}>
      <button type="button" className="ss__control" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className="ss__value">{selected ? renderValue(selected) : emptyValue ?? placeholder}</span>
        <Icon name="chevron" size={18} color="var(--c-text-secondary)" />
      </button>
      {open && (
        <div className="ss__menu">
          <div className="ss__search">
            <Icon name="search" size={16} color="var(--c-gray-05)" />
            <input autoFocus value={query} placeholder={placeholder} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <ul role="listbox">
            {list.map((o) => (
              <li
                key={o.code}
                role="option"
                aria-selected={o.code === value}
                className={o.code === value ? "is-selected" : ""}
                onClick={() => {
                  onChange(o.code);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {renderOption(o)}
              </li>
            ))}
            {!list.length && <li className="ss__empty">—</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ title, children, onClose, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <span className="modal__title">{title}</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">{actions}</div>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
export function Toasts({ items, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((n) => (
        <div key={n.id} className={`toast toast--${n.level}`}>
          <Icon name={n.level === "success" ? "check" : "close"} size={18} color="currentColor" />
          <div className="toast__text">
            <strong>{n.title}</strong>
            {n.subtitle && <span>{n.subtitle}</span>}
          </div>
          {n.action && (
            <button type="button" className="icon-btn" onClick={n.action} aria-label="Tentar novamente">
              <Icon name="refresh" size={18} />
            </button>
          )}
          <button type="button" className="icon-btn" onClick={() => onDismiss(n.id)} aria-label="Fechar">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
