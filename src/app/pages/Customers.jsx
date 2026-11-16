import { useMemo, useState } from "react";
import { Icon, Modal } from "../../config/ui.jsx";
import { formatDocument } from "../../config/validation.js";
import { ArtArrowUp, ArtBasket, ArtPeople } from "../Art.jsx";
import { Avatar, EmptyState, Field, GreenButton, IconSquare, PageHeader, SearchInput, Switch, Toolbar } from "../Shell.jsx";
import { fmtDateTime, parseMoney, semAcento, useMoney, useStore } from "../store.jsx";
import { navigate } from "../router.jsx";
import { csvDownload } from "./Products.jsx";

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const COUNTRIES = [["+55", "🇧🇷"], ["+351", "🇵🇹"], ["+1", "🇺🇸"], ["+54", "🇦🇷"], ["+52", "🇲🇽"], ["+34", "🇪🇸"]];

function ImportCustomers({ onClose }) {
  const { actions, notify } = useStore();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const read = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => setRows(t.replace(/^﻿/, "").split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(/[;,]/).map((x) => x.replace(/^"|"$/g, "").trim()))));
  };
  return (
    <Modal
      title="Importar clientes"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={() => csvDownload("modelo-clientes.csv", [["Nome", "Telefone", "Email", "Endereço"], ["Ana Souza", "+55 11 90000-0000", "ana@exemplo.com", "Rua A, 1"]])}>
            Baixar modelo
          </button>
          <button
            type="button"
            className="kbtn kbtn--primary"
            disabled={!rows?.length || busy}
            onClick={async () => {
              setBusy(true);
              try {
                const n = await actions.importCustomers(rows.filter((r) => r[0]).map((r) => ({ name: r[0], phone: r[1], email: r[2], address: r[3] })));
                notify(`${n} cliente(s) importado(s)`);
                onClose();
              } catch (e) {
                notify(e.message, "danger");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Importando..." : `Importar ${rows?.length ? `(${rows.length})` : ""}`}
          </button>
        </>
      }
    >
      <p className="modal__lead">Envie uma planilha CSV com as colunas Nome, Telefone, Email e Endereço.</p>
      <input type="file" accept=".csv,text/csv" onChange={read} />
    </Modal>
  );
}

export default function Customers() {
  const { data } = useStore();
  const money = useMoney();
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState(false);
  const n = data.customers.length;
  const list = useMemo(() => {
    const t = semAcento(q);
    const digitos = q.replace(/\D/g, "");
    return data.customers
      .filter((c) => !t || semAcento(c.name).includes(t) || semAcento(c.email).includes(t) || (digitos.length >= 3 && `${c.phone}${c.document}`.replace(/\D/g, "").includes(digitos)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.customers, q]);
  return (
    <div className="page">
      <PageHeader title="Clientes" count={`${n} ${n === 1 ? "cliente cadastrado" : "clientes cadastrados"}`} />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Nome, telefone, CPF/CNPJ ou e-mail" testID="search-input-cust" />
        <div className="toolbar__spacer" />
        <IconSquare icon="import" label="Importar clientes" onClick={() => setImporting(true)} />
        <GreenButton label="Cliente" onClick={() => navigate("/customers/create/")} testID="customer-add-button-cust" />
      </Toolbar>
      {n === 0 ? (
        <div className="empty-wrap">
          <span className="empty-arrow"><ArtArrowUp /></span>
          <EmptyState art={<ArtPeople />} title="Vamos cadastrar seu primeiro cliente?" size="lg" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState art={<ArtPeople />} title="Nenhum cliente encontrado" size="sm" help={false} />
      ) : (
        <div className="ktable">
          <div className="ktable__head">
            <span>Nome</span>
            <span>Telefone</span>
            <span>E-mail</span>
            <span className="num">Em aberto</span>
          </div>
          {list.map((c) => (
            <button key={c.id} type="button" className="ktable__row" onClick={() => navigate(`/customers/create/?id=${c.id}`)}>
              <span className="cell-product">
                <Avatar name={c.name} />
                <strong>{c.name}</strong>
              </span>
              <span>{c.phone || "—"}</span>
              <span>{c.email || "—"}</span>
              <span className={`num ${c.balance < 0 ? "is-negative" : ""}`}>{c.balance < 0 ? money(-c.balance) : "—"}</span>
            </button>
          ))}
        </div>
      )}
      {importing && <ImportCustomers onClose={() => setImporting(false)} />}
    </div>
  );
}

function BalanceModal({ kind, onClose, onConfirm }) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return (
    <Modal
      title={kind === "add" ? "Adicionar ao saldo" : "Subtrair do saldo"}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={parseMoney(value) <= 0} onClick={() => onConfirm(parseMoney(value), note)}>
            Confirmar
          </button>
        </>
      }
    >
      <div className="quick">
        <Field label="Valor" value={value} inputMode="decimal" onChange={setValue} />
        <Field label="Observação (opcional)" value={note} onChange={setNote} />
      </div>
    </Modal>
  );
}

export function CustomerForm({ id }) {
  const { data, actions, notify } = useStore();
  const money = useMoney();
  const existing = data.customers.find((c) => c.id === id);
  const [v, setV] = useState(existing || { name: "", document: "", note: "", birthday: "", email: "", cc1: "+55", phone: "", cc2: "+55", phone2: "", address: "", addressComplement: "", balance: 0 });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const sales = existing ? data.sales.filter((s) => s.customerId === existing.id) : [];
  const emAberto = existing && existing.balance < 0 ? -existing.balance : 0;

  const validate = () => {
    const e = {};
    if (!v.name.trim()) e.name = "Informe o nome do cliente";
    if (v.email && !EMAIL_RE.test(v.email)) e.email = "E-mail inválido";
    if (v.birthday && !/^\d{2}\/\d{2}\/\d{4}$/.test(v.birthday)) e.birthday = "Use o formato DD/MM/AAAA";
    setErr(e);
    return !Object.keys(e).length;
  };
  const save = async () => {
    if (!validate() || busy) return;
    setBusy(true);
    try {
      await actions.saveCustomer(v, existing?.id);
      notify(existing ? "Cliente atualizado" : "Cliente cadastrado");
      navigate("/customers/");
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!existing || !window.confirm("Excluir este cliente?")) return;
    try {
      await actions.deleteCustomer(id);
      notify("Cliente excluído");
      navigate("/customers/");
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const newOrder = () => {
    sessionStorage.setItem("pdv.cart", JSON.stringify({ items: [], discount: 0, customerId: existing.id }));
    navigate("/checkout/");
  };

  const phoneRow = (ccKey, key, label) => (
    <div className="phone-row">
      <label className="kselect-wrap kselect-wrap--flag">
        <select className="kselect" value={v[ccKey] || "+55"} onChange={(e) => set(ccKey, e.target.value)} aria-label="País">
          {COUNTRIES.map(([cc, flag]) => (
            <option key={cc} value={cc}>
              {flag} {cc}
            </option>
          ))}
        </select>
      </label>
      <Field label={label} legend value={v[key] || ""} type="tel" onChange={(x) => set(key, x.replace(/[^\d\s()-]/g, ""))} />
    </div>
  );

  return (
    <div className="page page--form">
      <PageHeader title={existing ? existing.name : "Cadastrar cliente"} back="/customers/" />
      <div className="formbar">
        <div className="toolbar__spacer" />
        <button type="button" className="ticon" disabled={!existing} onClick={remove} aria-label="Excluir cliente">
          <Icon name="trash" size={22} color={existing ? "#363f4d" : "#a9b1be"} strokeWidth={1.5} />
        </button>
        <button type="button" className="kbtn kbtn--primary kbtn--lg" disabled={!existing} onClick={newOrder}>
          Novo pedido
        </button>
      </div>
      <div className="cform">
        <div className="cform__left">
          <section className="card cform__card">
            <div className="cform__avatar">{v.name ? v.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") : ""}</div>
            <Field label="Nome" value={v.name} onChange={(x) => set("name", x)} error={err.name} testID="customer-name" />
            <Field label="CPF/CNPJ" value={v.document} inputMode="numeric" onChange={(x) => set("document", formatDocument(x))} />
            <Field label="Observações" value={v.note} multiline rows={2} onChange={(x) => set("note", x)} />
            <Field label="Data de aniversário (DD/MM/AAAA)" value={v.birthday || ""} onChange={(x) => set("birthday", x.replace(/[^\d/]/g, "").slice(0, 10))} error={err.birthday} />
          </section>
          <section className="card cform__card">
            <h3 className="card__title">Contato</h3>
            <Field label="E-mail" value={v.email} type="email" onChange={(x) => set("email", x)} error={err.email} />
            <Field label="Telefone/Celular" value={v.phone || ""} type="tel" onChange={(x) => set("phone", x.replace(/[^\d\s()+-]/g, ""))} />
          </section>
          <section className="card cform__card">
            <h3 className="card__title">Endereço</h3>
            <Field label="Endereço completo" value={v.address} multiline rows={2} onChange={(x) => set("address", x)} />
          </section>
        </div>
        <div className="cform__right">
          <section className="card card--pad account">
            <h3 className="card__title">Conta</h3>
            <span className="account__label">EM ABERTO (CREDIÁRIO E FIADO)</span>
            <strong className={`account__value${emAberto > 0 ? " is-negative" : ""}`}>{money(emAberto)}</strong>
            <p className="pform__note">
              Soma das parcelas ainda não pagas. Para registrar um pagamento, dê baixa na parcela em Finanças.
            </p>
          </section>
          <section className="card card--pad cform__orders">
            {sales.length === 0 ? (
              <>
                <ArtBasket w={120} h={112} />
                <strong>Este cliente ainda não fez pedidos.</strong>
                <button type="button" className="kbtn kbtn--primary kbtn--lg" disabled={!existing} onClick={newOrder}>
                  Novo pedido
                </button>
              </>
            ) : (
              <>
                <h3 className="card__title">Compras</h3>
                <ul className="lines">
                  {sales.slice(0, 12).map((s) => (
                    <li key={s.id} className={s.status === "canceled" ? "is-crossed" : ""}>
                      <span>#{s.number}</span>
                      <span>{fmtDateTime(s.createdAt)}</span>
                      <strong>{money(s.total)}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
      <div className="save-bar is-visible">
        <button type="button" className="kbtn kbtn--outline" onClick={() => navigate("/customers/")}>
          Cancelar
        </button>
        <button type="button" className="kbtn kbtn--primary" onClick={save} disabled={busy} data-testid="save-customer">
          {busy ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
