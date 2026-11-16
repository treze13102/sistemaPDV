import { useEffect, useRef, useState } from "react";
import { Flag, HelpIcon, Illustration, LogoTile, LogoWord, ProviderMark } from "../shared/icons.jsx";
import { LANGS, STRINGS } from "./strings.js";
import { Spinner } from "../shared/Spinner.jsx";
import { supabase } from "@/lib/supabase";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function useLang() {
  const [lang, setLang] = useState(() => localStorage.getItem("pdv.lang") || "pt");
  useEffect(() => {
    localStorage.setItem("pdv.lang", lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  }, [lang]);
  return [lang, setLang];
}

function LanguageSelect({ lang, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const current = LANGS.find((l) => l.value === lang);
  return (
    <div className="lang" ref={ref} data-testid="lang-main">
      <button
        type="button"
        className="lang-control"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current.label}
        onClick={() => setOpen((o) => !o)}
      >
        <Flag lang={lang} />
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {LANGS.map((l) => (
            <li
              key={l.value}
              role="option"
              aria-selected={l.value === lang}
              className={l.value === lang ? "is-selected" : ""}
              onClick={() => {
                onChange(l.value);
                setOpen(false);
              }}
            >
              <Flag lang={l.value} />
              <span>{l.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HelpPill({ label }) {
  return (
    <a className="help-pill" href="#help" data-testid="help-main" onClick={(e) => e.preventDefault()}>
      <span>{label}</span>
      <HelpIcon size={16} color="var(--c-text-secondary)" />
    </a>
  );
}

function Header({ lang, setLang, t }) {
  return (
    <header className="login-header">
      <div className="login-header__left">
        <LogoTile />
        <HelpPill label={t.help} />
      </div>
      <div className="login-header__center">
        <LogoWord />
      </div>
      <div className="login-header__right">
        <HelpPill label={t.help} />
        <LanguageSelect lang={lang} onChange={setLang} />
      </div>
    </header>
  );
}

function Carousel({ slides }) {
  const [index, setIndex] = useState(0);
  const start = useRef(null);
  const onDown = (e) => (start.current = e.clientX);
  const onUp = (e) => {
    if (start.current == null) return;
    const dx = e.clientX - start.current;
    start.current = null;
    if (dx < -40) setIndex((i) => Math.min(slides.length - 1, i + 1));
    if (dx > 40) setIndex((i) => Math.max(0, i - 1));
  };
  return (
    <div className="carousel" onPointerDown={onDown} onPointerUp={onUp}>
      <ul className="carousel__track" style={{ transform: `translate3d(${-index * 100}%,0,0)` }}>
        {slides.map(([title, subtitle], i) => (
          <li className="carousel__slide" key={i} aria-hidden={i !== index}>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-subtitle">{subtitle}</p>
            <Illustration />
          </li>
        ))}
      </ul>
      <ul className="carousel__dots">
        {slides.map((_, i) => (
          <li key={i}>
            <button
              type="button"
              className={i === index ? "dot is-selected" : "dot"}
              aria-label={`slide item ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function enterApp() {
  // O original manda o usuário autenticado para a tela de venda.
  window.location.href = "/checkout/";
}

/** Mensagens do Supabase Auth em português. */
function erroAuth(e) {
  const m = e?.message ?? "";
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (/already registered/i.test(m)) return "Este e-mail já tem conta. Use a opção Entrar.";
  return m || "Não foi possível entrar. Tente de novo.";
}

function Providers({ t, onEmail }) {
  const [pending, setPending] = useState(null);
  const go = (kind) => {
    if (pending) return;
    if (kind === "email") return onEmail();
    setPending(kind);
    setTimeout(enterApp, 900);
  };
  const items = [
    ["google", "Google"],
    ["facebook", "Facebook"],
    ["apple", "Apple"],
    ["email", t.email],
  ];
  return (
    <>
      <p className="card-title" data-testid="menu-text">
        {t.choose}
      </p>
      <div className="providers">
        {items.map(([kind, label]) => (
          <button
            key={kind}
            type="button"
            className={`provider provider--${kind}`}
            data-testid={`${kind}-main`}
            onClick={() => go(kind)}
          >
            <span className="provider__mark">
              <ProviderMark kind={kind} />
            </span>
            <span className="provider__label">{pending === kind ? <Spinner /> : label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function EmailForm({ t }) {
  const [modo, setModo] = useState("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [aviso, setAviso] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (modo === "cadastrar" && !nome.trim()) next.nome = "Informe seu nome";
    if (!EMAIL_RE.test(email)) next.email = t.emailInvalid;
    if (password.length < 6) next.password = t.passwordShort;
    setErrors(next);
    setAviso("");
    if (Object.keys(next).length) return;
    setPending(true);
    const res =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { nome: nome.trim() } } });
    setPending(false);
    if (res.error) return setErrors({ geral: erroAuth(res.error) });
    // Cadastro com confirmação por e-mail ligada não devolve sessão.
    if (modo === "cadastrar" && !res.data.session) {
      setModo("entrar");
      return setAviso("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.");
    }
    enterApp();
  };
  return (
    <form className="email-form" onSubmit={submit} noValidate>
      <p className="card-title" data-testid="menu-text">
        {modo === "entrar" ? "Entre com sua conta" : "Crie sua conta"}
      </p>
      {aviso && <p className="field__error" style={{ color: "var(--c-text-secondary)" }}>{aviso}</p>}
      {modo === "cadastrar" && (
        <label className="field">
          <span className="field__label">Nome</span>
          <input className={errors.nome ? "field__input has-error" : "field__input"} value={nome} autoComplete="name" onChange={(e) => setNome(e.target.value)} />
          {errors.nome && <span className="field__error">{errors.nome}</span>}
        </label>
      )}
      <label className="field">
        <span className="field__label">{t.emailLabel}</span>
        <input
          className={errors.email ? "field__input has-error" : "field__input"}
          type="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span className="field__error">{errors.email}</span>}
      </label>
      <label className="field">
        <span className="field__label">{t.passwordLabel}</span>
        <input
          className={errors.password ? "field__input has-error" : "field__input"}
          type="password"
          value={password}
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <span className="field__error">{errors.password}</span>}
      </label>
      {errors.geral && <span className="field__error">{errors.geral}</span>}
      <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
        {pending ? <Spinner light /> : modo === "entrar" ? t.enter : "Criar conta"}
      </button>
      <button
        type="button"
        className="link-back"
        onClick={() => {
          setModo((m) => (m === "entrar" ? "cadastrar" : "entrar"));
          setErrors({});
          setAviso("");
        }}
      >
        {modo === "entrar" ? "Não tenho conta — cadastrar" : "Já tenho conta — entrar"}
      </button>
    </form>
  );
}

export default function Login() {
  const [lang, setLang] = useLang();
  const t = STRINGS[lang];
  // Já autenticado (sessão salva): vai direto para a venda.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && enterApp());
  }, []);
  return (
    <div className="page">
      <main className="panel">
        <Header lang={lang} setLang={setLang} t={t} />
        <div className="login-row">
          <section className="login-left">
            <Carousel key={lang} slides={t.slides} />
          </section>
          <section className="login-right">
            <div className="login-card">
              <EmailForm t={t} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
