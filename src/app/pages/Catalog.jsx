import { useState } from "react";
import { Icon } from "../../config/ui.jsx";
import { formatDocument } from "../../config/validation.js";
import { ArtDevices } from "../Art.jsx";
import { Field, PageHeader, Switch } from "../Shell.jsx";
import { initials, readPrefs, useMoney, useStore } from "../store.jsx";
import { SaveBar, useSavedSettings } from "./settingsKit.jsx";

const THEMES = ["#2dd1ac", "#fdca40", "#ff8552", "#ff4e4e", "#ce7da5", "#89bbfe", "#0d3b66", "#444e5e", "#2d2d2a", "#82d173"];
const DEFAULTS = { created: false, active: true, slug: "", theme: "#2dd1ac", viewMode: "list", acceptOnlineOrders: true, allowGuest: true, whatsappOrder: false, showStock: false };
const SUFFIX = ".loja.site";

function validDoc(d) {
  const x = d.replace(/\D/g, "");
  return x.length === 11 || x.length === 14;
}

/** First visit: the original asks for store name, link, CPF/CNPJ and owner name before creating the catalog. */
function CreateCatalog({ onCreate }) {
  const prefs = readPrefs();
  const [v, setV] = useState({ name: prefs.name || "", slug: "", doc: prefs.documentNumber || "", owner: prefs.corporateName || "", terms: false });
  const [err, setErr] = useState({});
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const submit = () => {
    const e = {};
    if (!v.name.trim()) e.name = "Informe o nome da loja";
    if (!v.slug.trim()) e.slug = "Escolha o link do catálogo";
    if (!validDoc(v.doc)) e.doc = "CPF ou CNPJ inválido";
    if (!v.owner.trim()) e.owner = "Informe o nome do responsável";
    if (!v.terms) e.terms = "É preciso concordar para continuar";
    setErr(e);
    if (Object.keys(e).length) return;
    const general = JSON.parse(localStorage.getItem("pdv.config.general") || "{}");
    localStorage.setItem("pdv.config.general", JSON.stringify({ ...general, name: v.name, documentNumber: v.doc, corporateName: v.owner }));
    onCreate(v.slug);
  };
  return (
    <div className="catalog-new">
      <div className="catalog-new__banner">
        <ArtDevices />
      </div>
      <div className="catalog-new__form">
        <h2 data-testid="form-title-occ">Vamos criar seu Catálogo Online?</h2>
        <Field label="Nome da Loja" value={v.name} onChange={(x) => set("name", x)} error={err.name} testID="store-name-occ" />
        <Field label="Link do catálogo" value={v.slug} suffix={SUFFIX} onChange={(x) => set("slug", x.toLowerCase().replace(/[^a-z0-9-]/g, ""))} error={err.slug} testID="store-url-occ" />
        <h3>Identificação</h3>
        <Field label="CPF ou CNPJ" value={v.doc} inputMode="numeric" onChange={(x) => set("doc", formatDocument(x))} error={err.doc} testID="document-id-occ" />
        <Field label="Nome" value={v.owner} onChange={(x) => set("owner", x)} error={err.owner} testID="owner-name-occ" />
        <p className="catalog-new__note">
          Informar o CPF ou CNPJ é uma medida para validar a sua conta, preservar sua privacidade e garantir a qualidade dos catálogos. <strong>Os dados de identificação não serão exibidos no seu Catálogo Online.</strong>
        </p>
        <label className="switch-line catalog-new__terms">
          <Switch checked={v.terms} onChange={(x) => set("terms", x)} label="Concordo com os termos" />
          <span>
            Concordo com os <a href="#termos" onClick={(e) => e.preventDefault()}>Termos de uso</a> e <a href="#privacidade" onClick={(e) => e.preventDefault()}>Política de Privacidade</a>.
          </span>
        </label>
        {err.terms && <span className="kfield__error">{err.terms}</span>}
        <button type="button" className="kbtn kbtn--primary kbtn--block kbtn--lg catalog-new__go" onClick={submit} data-testid="publish-occ">
          <span>Continuar</span>
          <Icon name="chevronRight" size={20} color="#fff" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function Preview({ v }) {
  const { data } = useStore();
  const money = useMoney();
  const prefs = readPrefs();
  const items = data.products.filter((p) => p.showOnCatalog).slice(0, 6);
  return (
    <div className="phone">
      <div className="phone__bar" style={{ background: v.theme }}>
        <span className="phone__logo">{(prefs.name || "L").slice(0, 1)}</span>
        <strong>{prefs.name || "Minha Loja"}</strong>
      </div>
      {!v.active ? (
        <div className="phone__off">Catálogo desativado</div>
      ) : !items.length ? (
        <div className="phone__off">Marque “Exibir no Catálogo Online” nos produtos.</div>
      ) : v.viewMode === "list" ? (
        <ul className="phone__list">
          {items.map((p) => (
            <li key={p.id}>
              <span className="thumb" style={{ background: p.color }}>{initials(p.name)}</span>
              <span className="phone__name">{p.name}</span>
              <strong style={{ color: v.theme }}>{money(p.promoPrice ?? p.price)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className="phone__grid">
          {items.map((p) => (
            <div key={p.id} className="phone__card">
              <span className="phone__img" style={{ background: p.color }}>{initials(p.name)}</span>
              <span className="phone__name">{p.name}</span>
              <strong style={{ color: v.theme }}>{money(p.promoPrice ?? p.price)}</strong>
            </div>
          ))}
        </div>
      )}
      {v.active && <div className="phone__cta" style={{ background: v.theme }}>Ver carrinho</div>}
    </div>
  );
}

function Row({ label, desc, checked, onChange }) {
  return (
    <div className="setrow">
      <div>
        <strong>{label}</strong>
        {desc && <small>{desc}</small>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export default function Catalog() {
  const { notify } = useStore();
  const s = useSavedSettings("pdv.config.catalog", DEFAULTS);
  const { values: v, set } = s;
  if (!v.created) {
    return (
      <div className="page">
        <PageHeader title="Catálogo Online" />
        <CreateCatalog
          onCreate={(slug) => {
            const next = { ...v, created: true, slug };
            localStorage.setItem("pdv.config.catalog", JSON.stringify(next));
            s.setValues(next);
            s.markSaved(next);
            notify("Seu Catálogo Online foi criado!");
          }}
        />
      </div>
    );
  }
  const url = `https://${v.slug}${SUFFIX}`;
  return (
    <div className="page">
      <PageHeader title="Catálogo Online" />
      <div className="catalog">
        <div className="catalog__settings">
          <section className="card card--pad">
            <Row label="Catálogo ativo" desc={v.active ? "Seus clientes podem ver e fazer pedidos." : "Ninguém consegue acessar o catálogo agora."} checked={v.active} onChange={(x) => set("active", x)} />
            <div className="link-box">
              <Icon name="link" size={18} color="#2fae94" />
              <a className="link-box__url" href={url} onClick={(e) => e.preventDefault()}>
                {url}
              </a>
              <button
                type="button"
                className="kbtn kbtn--outline"
                onClick={() => {
                  navigator.clipboard?.writeText(url).catch(() => {});
                  notify("Link copiado");
                }}
              >
                Copiar link
              </button>
            </div>
          </section>
          <section className="card card--pad">
            <h3 className="card__title">Cor do tema</h3>
            <div className="color-row">
              {THEMES.map((c) => (
                <button key={c} type="button" className={v.theme === c ? "color-dot is-active" : "color-dot"} style={{ background: c }} onClick={() => set("theme", c)} aria-label={`Tema ${c}`} />
              ))}
            </div>
            <h3 className="card__title">Modo de exibição principal</h3>
            <div className="choice-cards">
              {[["list", "Modo Lista", "Navegação mais rápida, ideal para grandes quantidades de produtos."], ["insta", "Modo Instaview", "Melhor para ver o produto, ideal para fotos bem produzidas."]].map(([id, t, d]) => (
                <button key={id} type="button" className={v.viewMode === id ? "choice-card is-active" : "choice-card"} onClick={() => set("viewMode", id)}>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="card card--pad">
            <h3 className="card__title">Pedidos</h3>
            <Row label="Aceitar pedidos online" desc="Seus pedidos virão como Pendente até que você os aceite como Confirmado." checked={v.acceptOnlineOrders} onChange={(x) => set("acceptOnlineOrders", x)} />
            <Row label="Permitir compra sem cadastro" desc="Permita que as pessoas comprem apenas informando nome e celular." checked={v.allowGuest} onChange={(x) => set("allowGuest", x)} />
            <Row label="Pedidos pelo WhatsApp" desc="Usa o número de Celular/WhatsApp de Configurações › Geral." checked={v.whatsappOrder} onChange={(x) => set("whatsappOrder", x)} />
            <Row label="Mostrar estoque" checked={v.showStock} onChange={(x) => set("showStock", x)} />
          </section>
        </div>
        <div className="catalog__preview">
          <Preview v={v} />
        </div>
      </div>
      <SaveBar s={s} />
    </div>
  );
}
