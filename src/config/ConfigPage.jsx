import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CURRENCIES, DEFAULT_VALUES, NO_CURRENCY, STORE_FLAGS, T } from "./data.js";
import { Icon, Modal, RadioRow, SearchSelect, Toasts } from "./ui.jsx";
import { formatDocument, validate } from "./validation.js";
import { Spinner } from "../shared/Spinner.jsx";
import { Field, HelpDot, Switch as KSwitch } from "../app/Shell.jsx";

const STORAGE_KEY = "pdv.config.general";

function loadSaved() {
  try {
    return { ...DEFAULT_VALUES, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_VALUES };
  }
}

/* ---------- Tabs ---------- */
export function Tabs({ active, onChange }) {
  return (
    <div className="cfg-tabs" role="tablist">
      {T.tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? "cfg-tab is-active" : "cfg-tab"}
          data-testid={`tab-${tab.id}-cfg`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Logo upload ---------- */
function LogoUpload({ value, onChange }) {
  const input = useRef(null);
  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="logo-upload">
      <span className="logo-upload__tip">
        <HelpDot text={T.tipDisplayed} />
      </span>
      {value ? (
        <div className="logo-upload__preview">
          <img src={value} alt="" />
          <button type="button" className="logo-upload__remove" onClick={() => onChange("")} aria-label={T.removeImage}>
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : (
        <div className="logo-upload__empty">
          <Icon name="image" size={18} color="#363f4d" strokeWidth={1.6} />
          <span className="logo-upload__hint">{T.uploadLogo}</span>
          <button type="button" className="kbtn kbtn--primary" data-testid="logo-upload-button-cfg" onClick={() => input.current.click()}>
            Escolher Imagem
          </button>
        </div>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

/** Example price shown under the currency, so the effect of "decimal parts" is visible. */
function sampleAmount(cur, withDecimals) {
  const group = cur.decimal === "," ? "." : ",";
  return withDecimals ? `1${group}234${cur.decimal}56` : `1${group}235`;
}

function CurrencyFlag({ code }) {
  // Two-letter badge stands in for the original's flag images.
  return <span className="cur-flag">{code}</span>;
}

/* ---------- General tab ---------- */
function GeneralTab({ values, set, errors }) {
  const mapHref = values.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(values.address)}`
    : null;
  const lock = (
    <span title={T.tipNotDisplayed} aria-label={T.tipNotDisplayed} className="lockdot">
      <Icon name="padlock" size={20} color="#363f4d" strokeWidth={1.8} />
    </span>
  );
  const phone = (ccKey, key, label, tip) => (
    <div className="phone-row">
      <label className="kselect-wrap">
        <select className="kselect" value={values[ccKey] || ""} onChange={(e) => set(ccKey, e.target.value)} aria-label="País">
          <option value="">País</option>
          {PHONE_CODES.map(([cc, n]) => (
            <option key={cc} value={cc}>
              {n} {cc}
            </option>
          ))}
        </select>
      </label>
      <Field label={label} value={values[key]} type="tel" onChange={(v) => set(key, v.replace(/[^\d+\s()-]/g, ""))} right={<HelpDot text={tip} />} />
    </div>
  );
  const cur = CURRENCIES.find((c) => c.code === values.currency) || NO_CURRENCY;
  return (
    <div className="cfg-grid">
      <div className="cfg-col">
        <section className="card cfg-sec">
          <h3>{T.identification}</h3>
          <Field label={T.storeName} value={values.name} onChange={(v) => set("name", v)} error={errors.name} testID="store-name-input-cfg" right={<HelpDot text={T.tipDisplayed} />} />
          <Field label={T.corporateName} value={values.corporateName} onChange={(v) => set("corporateName", v)} error={errors.corporateName} testID="legal-name-input-cfg" right={lock} />
          <Field label={T.documentNumber} value={values.documentNumber} inputMode="numeric" onChange={(v) => set("documentNumber", formatDocument(v))} error={errors.documentNumber} testID="legal-id-input-cfg" right={lock} />
          <p className="infobox">
            Informar o CPF ou CNPJ é uma medida para validar a sua conta, preservar sua privacidade e garantir a qualidade de todos os catálogos. <strong>Os dados de identificação não serão exibidos no seu Catálogo Online.</strong>
          </p>
        </section>
        <section className="card cfg-sec">
          <h3>{T.contactData}</h3>
          {phone("ccPhone", "phone", T.phone, T.tipDisplayed)}
          {phone("ccWhatsapp", "whatsapp", T.whatsapp, T.tipCatalog)}
          <Field label={T.instagram} value={values.instagram} onChange={(v) => set("instagram", v.trim())} error={errors.instagram} right={<HelpDot text={T.tipCatalog} />} />
          <Field label="E-mail" value={values.email} type="email" onChange={(v) => set("email", v)} error={errors.email} right={<HelpDot text={T.tipDisplayed} />} />
        </section>
        <section className="card cfg-sec">
          <h3>{T.address}</h3>
          <Field label={T.address} value={values.address} onChange={(v) => set("address", v)} testID="address-main-input-cfg" right={<HelpDot text={T.tipDisplayed} />} />
          <Field label={T.addressComplement} value={values.addressComplement} onChange={(v) => set("addressComplement", v)} testID="address-extra-input-cfg" />
          {mapHref && (
            <a className="map-link" href={mapHref} target="_blank" rel="noreferrer" data-testid="address-maps-link-cfg">
              <Icon name="pin" size={16} />
              {T.viewOnMap}
            </a>
          )}
        </section>
      </div>
      <div className="cfg-col">
        <LogoUpload value={values.imageURL} onChange={(v) => set("imageURL", v)} />
        <section className="card cfg-sec">
          <h3>{T.aboutStore}</h3>
          <Field label={T.extraInfo} value={values.infoExtra} multiline rows={2} onChange={(v) => set("infoExtra", v)} testID="extra-info-input-cfg" right={<HelpDot text={T.tipCatalog} />} />
          <p className="cfg-note">{T.extraInfoHelp}</p>
        </section>
        <section className="card cfg-sec">
          <h3>{T.currency}</h3>
          <SearchSelect
            options={CURRENCIES}
            value={values.currency}
            onChange={(v) => set("currency", v)}
            placeholder={T.currencySearch}
            testID="currency-select-cfg"
            renderValue={(c) => `${c.currency} - ${c.symbol}`}
            renderOption={(c) => (
              <span className="cur-option">
                <CurrencyFlag code={c.code} />
                <span>
                  <strong>{c.currency}</strong>
                  <small>{c.name}</small>
                </span>
              </span>
            )}
            emptyValue={`- ${cur.symbol}`}
          />
          <div className="setrow setrow--tight">
            <strong>{T.decimalParts}</strong>
            <KSwitch checked={values.decimalCurrency} onChange={(v) => set("decimalCurrency", v)} label={T.decimalParts} testID="currency-decimal-switch-cfg" />
          </div>
          <p className="cfg-note">Exemplo: {cur.symbol}{sampleAmount(cur, values.decimalCurrency)}</p>
        </section>
        <section className="card cfg-sec">
          <h3>{T.displayOptions}</h3>
          <div className="cfg-subgroup">
            <p className="cfg-subgroup__title">{T.canceledTitle}</p>
            <RadioRow name="showCanceledSales" label={T.showCrossedOut} checked={values.showCanceledSales === true} onSelect={() => set("showCanceledSales", true)} testID="cancelled-sales-show-select-cfg" />
            <RadioRow name="showCanceledSales" label={T.hide} checked={values.showCanceledSales === false} onSelect={() => set("showCanceledSales", false)} testID="cancelled-sales-hide-select-cfg" />
          </div>
        </section>
      </div>
    </div>
  );
}

const PHONE_CODES = [["+55", "Brasil"], ["+351", "Portugal"], ["+1", "EUA"], ["+54", "Argentina"], ["+52", "México"], ["+34", "Espanha"], ["+57", "Colômbia"], ["+56", "Chile"]];

/* ---------- Page ---------- */
/** Settings › General: the form plus its save bar, toasts and WhatsApp confirmation. */
export default function GeneralSettings() {
  const [saved, setSaved] = useState(loadSaved);
  const [values, setValues] = useState(saved);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [askWhatsapp, setAskWhatsapp] = useState(false);
  const [toasts, setToasts] = useState([]);

  const dirty = useMemo(() => Object.keys(values).some((k) => values[k] !== saved[k]), [values, saved]);
  const set = useCallback((key, v) => {
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  }, []);

  const notify = useCallback((n) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, ...n }]);
    if (n.timer) setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), n.timer);
  }, []);
  const dismiss = (id) => setToasts((list) => list.filter((x) => x.id !== id));

  const discard = useCallback(() => {
    setValues(saved);
    setErrors({});
  }, [saved]);

  const doSave = useCallback(() => {
    setSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        setSaved(values);
        notify({ level: "success", title: T.saved, timer: 4000 });
      } catch {
        notify({ level: "danger", title: T.saveError, subtitle: T.tryAgain, action: () => doSave() });
      }
      setSaving(false);
    }, 700);
  }, [values, notify]);

  const submit = () => {
    if (saving) return;
    const e = validate(values, T, { catalogActive: STORE_FLAGS.catalogActive });
    setErrors(e);
    if (Object.keys(e).length) return;
    if (!values.whatsapp.trim() && saved.whatsapp && STORE_FLAGS.catalogWhatsappOrder) {
      setAskWhatsapp(true);
      return;
    }
    doSave();
  };

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <>
      <GeneralTab values={values} set={set} errors={errors} />

      <div className={dirty ? "save-bar is-visible" : "save-bar"} aria-hidden={!dirty}>
        <button type="button" className="kbtn kbtn--outline" onClick={saving ? undefined : discard}>
          {T.discard}
        </button>
        <button type="button" className="kbtn kbtn--primary" onClick={submit}>
          {saving ? (
            <>
              <Spinner light /> {T.saving}
            </>
          ) : (
            T.save
          )}
        </button>
      </div>

      <Toasts items={toasts} onDismiss={dismiss} />

      {askWhatsapp && (
        <Modal
          title={T.attention}
          onClose={() => {
            setAskWhatsapp(false);
            discard();
          }}
          actions={
            <>
              <button type="button" className="kbtn kbtn--outline" onClick={() => { setAskWhatsapp(false); discard(); }}>
                {T.cancel}
              </button>
              <button type="button" className="kbtn kbtn--primary" onClick={() => { setAskWhatsapp(false); doSave(); }}>
                {T.confirm}
              </button>
            </>
          }
        >
          <p>{T.removeWhatsapp}</p>
        </Modal>
      )}
    </>
  );
}
