import { useState } from "react";
import SystemSettings from "./SystemSettings.jsx";
import { Icon, Modal } from "../../config/ui.jsx";
import { T } from "../../config/data.js";
import { ArtBill, ArtDocGear, ArtPlug, ArtReceipt, ArtScooter, ArtStore } from "../Art.jsx";
import { Field, HelpDot, PageHeader, PillTabs, Switch } from "../Shell.jsx";
import { ORDER_STATUSES } from "../seed.js";
import { parseMoney, readPrefs, uid, useMoney, useStore } from "../store.jsx";
import { navigate } from "../router.jsx";
import { ProviderMark } from "../../shared/icons.jsx";
import { StatusIcon } from "./Orders.jsx";
import { useSavedSettings, SaveBar } from "./settingsKit.jsx";

// Pedidos e vendas, Entrega e Integrações saíram: eram do fluxo de pedidos/catálogo do Kyte e só gravavam no navegador.
const TABS = [
  { id: "general", label: "GERAL", art: <ArtStore />, title: "Informações gerais", sub: "Forneça detalhes sobre seu negócio" },
  { id: "receipt", label: "RECIBO", art: <ArtReceipt />, title: "Meu Recibo", sub: "Personalize as informações impressas no recibo" },
  { id: "payments", label: "PAGAMENTOS", art: <ArtBill />, title: "Pagamentos", sub: "Configure os meios de pagamento que seu negócio oferece" },
];

function InApp() {
  return <span className="ktag ktag--solid">NO APP</span>;
}

function SwitchCard({ title, desc, checked, onChange, children }) {
  return (
    <section className="card switch-card">
      <div className="switch-card__head">
        <div>
          <h3>{title}</h3>
          {desc && <small>{desc}</small>}
        </div>
        <Switch checked={checked} onChange={onChange} label={title} />
      </div>
      {checked && children}
    </section>
  );
}

/* ---------- Pedidos e vendas ---------- */
function OrdersAndSales() {
  const money = useMoney();
  const s = useSavedSettings("pdv.config.orders", { useTax: false, taxName: "Taxa de serviço", taxPercent: "10", catalogTax: false, statuses: ORDER_STATUSES });
  const v = s.values;
  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState(null);
  const setStatuses = (fn) => s.saveNow({ ...v, statuses: fn(v.statuses) });
  return (
    <div className="cfg-grid">
      <div className="cfg-col">
        <SwitchCard title="Usar taxa de vendas" checked={v.useTax} onChange={(x) => s.set("useTax", x)}>
          <div className="two">
            <Field label="Nome da taxa" value={v.taxName} onChange={(x) => s.set("taxName", x)} />
            <Field label="Percentual (%)" value={v.taxPercent} inputMode="decimal" onChange={(x) => s.set("taxPercent", x.replace(/[^\d.,]/g, ""))} />
          </div>
          <p className="cfg-note">Ex.: em uma venda de {money(100)}, a taxa adiciona {money(parseMoney(v.taxPercent))}.</p>
        </SwitchCard>
        <SwitchCard title="Aplicar a taxa do catálogo online" checked={v.catalogTax} onChange={(x) => s.set("catalogTax", x)}>
          <p className="cfg-note">A mesma taxa será somada aos pedidos feitos pelo Catálogo Online.</p>
        </SwitchCard>
      </div>
      <div className="cfg-col">
        <section className="card statuses">
          <h3>Status de Pedidos</h3>
          <ul>
            {v.statuses.map((st) => (
              <li key={st.id} className={st.fixed ? "is-fixed" : ""}>
                <StatusIcon st={st} />
                <button type="button" className="statuses__text" disabled={st.fixed} onClick={() => setEdit(st)}>
                  <strong>{st.label}</strong>
                  {st.description && <small>{st.description}</small>}
                </button>
                {!st.fixed && <Switch checked={st.active} onChange={(x) => setStatuses((l) => l.map((y) => (y.id === st.id ? { ...y, active: x } : y)))} label={st.label} />}
              </li>
            ))}
          </ul>
          <p className="infobox infobox--gray">
            <strong>Você pode editar e criar novos status.</strong> Os status criados podem ser atribuídos aos pedidos, na lista de pedidos.
          </p>
          <button type="button" className="kbtn kbtn--primary kbtn--lg statuses__add" onClick={() => setAdding(true)}>
            Adicionar novo status
          </button>
        </section>
      </div>
      {(adding || edit) && (
        <StatusModal
          status={edit}
          onClose={() => (setAdding(false), setEdit(null))}
          onSave={(st) => {
            setStatuses((l) => (edit ? l.map((y) => (y.id === st.id ? st : y)) : [...l, st]));
            setAdding(false);
            setEdit(null);
          }}
          onDelete={
            edit
              ? () => {
                  setStatuses((l) => l.filter((y) => y.id !== edit.id));
                  setEdit(null);
                }
              : undefined
          }
        />
      )}
      <SaveBar s={s} />
    </div>
  );
}

const STATUS_COLORS = ["#fe0000", "#ff8552", "#f4c138", "#89bbfe", "#ce7da5", "#853bec", "#0d3b66", "#82d173"];
function StatusModal({ status, onClose, onSave, onDelete }) {
  const [label, setLabel] = useState(status?.label || "");
  const [color, setColor] = useState(status?.color || STATUS_COLORS[4]);
  return (
    <Modal
      title={status ? "Editar status" : "Novo status"}
      onClose={onClose}
      actions={
        <>
          {onDelete && (
            <button type="button" className="kbtn kbtn--outline" onClick={onDelete}>
              Excluir
            </button>
          )}
          <button type="button" className="kbtn kbtn--primary" disabled={!label.trim()} onClick={() => onSave({ id: status?.id || uid("st"), label: label.trim(), color, active: status ? status.active : true })}>
            Salvar
          </button>
        </>
      }
    >
      <div className="quick">
        <Field label="Nome do status" value={label} onChange={setLabel} />
        <div className="color-row">
          {STATUS_COLORS.map((c) => (
            <button key={c} type="button" className={color === c ? "color-dot is-active" : "color-dot"} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Recibo ---------- */
function ReceiptTab() {
  const money = useMoney();
  const prefs = readPrefs();
  const s = useSavedSettings("pdv.config.receipt", { header: "", footer: "", showCustomer: false, showCode: false });
  const v = s.values;
  const checks = [
    ["NOME DA LOJA", !!prefs.name],
    ["LOGO", !!prefs.imageURL],
    ["TELEFONE", !!prefs.phone],
    ["WHATSAPP", !!prefs.whatsapp],
    ["ENDEREÇO", !!prefs.address],
  ];
  const complete = checks.every(([, ok]) => ok);
  return (
    <div className="cfg-grid cfg-grid--receipt">
      <div className="cfg-col">
        <section className="card cfg-box">
          <h3>Dados da Loja</h3>
          <p>{complete ? "Seus dados aparecem no recibo e no catálogo." : "Complete as informações da sua loja e deixe seu catálogo profissional!"}</p>
          <ul className="checks">
            {checks.map(([l, ok]) => (
              <li key={l} className={ok ? "is-ok" : ""}>
                <Icon name={ok ? "check" : "close"} size={14} color={ok ? "#2dd1ac" : "#a9b1be"} strokeWidth={2} /> {l}
              </li>
            ))}
          </ul>
          <button type="button" className="kbtn kbtn--primary kbtn--block kbtn--lg" onClick={() => navigate("/config/general/")}>
            {complete ? "Editar dados da loja" : "Completar dados da loja"}
          </button>
        </section>
        <section className="card cfg-box">
          <div className="setrow">
            <div>
              <strong>Adicionar dados do cliente</strong>
              <small>Nome, Endereço e Telefone</small>
            </div>
            <Switch checked={v.showCustomer} onChange={(x) => s.set("showCustomer", x)} label="Adicionar dados do cliente" />
          </div>
          <div className="setrow">
            <div>
              <strong>Exibir código do produto</strong>
              <small>Abaixo do nome do item</small>
            </div>
            <Switch checked={v.showCode} onChange={(x) => s.set("showCode", x)} label="Exibir código do produto" />
          </div>
        </section>
        <section className="card cfg-box">
          <h3>Cabeçalho e rodapé</h3>
          <Field label="Texto do cabeçalho" value={v.header} onChange={(x) => s.set("header", x)} right={<HelpDot text="Aparece no topo do recibo" />} />
          <Field label="Texto do rodapé" value={v.footer} onChange={(x) => s.set("footer", x)} right={<HelpDot text="Aparece no fim do recibo" />} />
        </section>
      </div>
      <div className="cfg-col">
        <section className="rprev">
          <p className="rprev__title">
            <Icon name="eye" size={18} color="#363f4d" strokeWidth={1.6} /> Prévia do seu recibo
          </p>
          <div className="rpaper">
            {prefs.imageURL && <img className="rpaper__logo" src={prefs.imageURL} alt="" />}
            <h4>{prefs.name || "RECIBO"}</h4>
            {v.header && <p className="rpaper__center">{v.header}</p>}
            {v.showCustomer && <p className="rpaper__center">Cliente: Nome do Cliente · (00) 00000-0000</p>}
            <div className="rpaper__obs">Observações do recibo</div>
            <p className="rpaper__count">2 itens (Qtd.: 3)</p>
            <ul>
              <li>
                <span>2x</span>
                <span>
                  Nome do Produto{v.showCode && <small>Cód. 123456</small>}
                </span>
                <span>{money(99.98)}</span>
              </li>
              <li>
                <span>1x</span>
                <span>
                  Nome do Produto{v.showCode && <small>Cód. 654321</small>}
                </span>
                <span>{money(99.98)}</span>
              </li>
            </ul>
            <div className="rpaper__totals">
              <span>Subtotal: {money(9.99)}</span>
              <span>Taxa de entrega: {money(9.99)}</span>
              <strong>Total: {money(99.99)}</strong>
              <span>Total: {money(99.99)}</span>
            </div>
            <p className="rpaper__date">{new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
            {v.footer && <p className="rpaper__center">{v.footer}</p>}
          </div>
        </section>
      </div>
      <SaveBar s={s} />
    </div>
  );
}

/* ---------- Pagamentos ---------- */
function PaymentsTab() {
  const s = useSavedSettings("pdv.config.payments", { allowAccount: true, accountOnCatalog: false });
  const v = s.values;
  const [info, setInfo] = useState(null);
  const integ = [
    ["link", "Link de Pagamento", "PDV", "Envie um link para o cliente pagar à distância."],
    ["auto", "Pagamentos automáticos", "CATÁLOGO", "Receba pagamentos online direto no catálogo."],
    ["readers", "Maquininhas de Pagamento", null, "Conecte a maquininha de cartão ao seu PDV."],
  ];
  return (
    <div className="cfg-grid">
      <div className="cfg-col">
        <section className="card cfg-box">
          <h3>Pagamentos a combinar</h3>
          <div className="payrow">
            <Icon name="user" size={26} color="#363f4d" strokeWidth={1.4} />
            <div>
              <strong>Saldo Cliente</strong>
              <span className="payrow__where">
                <span className={v.allowAccount ? "is-on" : ""}>{v.allowAccount ? "✓" : "✕"} PDV</span>
                <button type="button" className={v.accountOnCatalog ? "is-on" : ""} onClick={() => s.saveNow({ ...v, accountOnCatalog: !v.accountOnCatalog })}>
                  {v.accountOnCatalog ? "✓" : "✕"} CATÁLOGO
                </button>
              </span>
            </div>
          </div>
        </section>
      </div>
      <div className="cfg-col">
        <section className="card cfg-box">
          <h3>Integrações</h3>
          <ul className="integ">
            {integ.map(([id, t, where, d]) => (
              <li key={id}>
                <button type="button" onClick={() => setInfo([t, d])}>
                  <Icon name={id === "link" ? "link" : id === "auto" ? "phone" : "calc"} size={28} color="#363f4d" strokeWidth={1.4} />
                  <span>
                    <strong>{t}</strong>
                    {where && <small>✕ {where}</small>}
                  </span>
                  <InApp />
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="card switch-card">
          <div className="switch-card__head">
            <div>
              <h3>Permitir vendas fiado</h3>
              <small className="switch-card__desc">Desative caso você não trabalhe com Fiado</small>
            </div>
            <Switch checked={v.allowAccount} onChange={(x) => s.saveNow({ ...v, allowAccount: x })} label="Permitir vendas fiado" />
          </div>
        </section>
      </div>
      {info && (
        <Modal title={info[0]} onClose={() => setInfo(null)} actions={<button type="button" className="kbtn kbtn--primary" onClick={() => setInfo(null)}>Entendi</button>}>
          <p className="modal__lead">{info[1]} Esta configuração é feita no aplicativo do celular.</p>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Entrega e retirada ---------- */
function DeliveryTab() {
  const money = useMoney();
  const s = useSavedSettings("pdv.config.delivery", { delivery: false, fees: [], deliveryDescription: "" });
  const v = s.values;
  const [fee, setFee] = useState({ name: "", value: "" });
  return (
    <div className="cfg-grid">
      <div className="cfg-col">
        <SwitchCard title="Trabalho com entregas" desc="Um campo obrigatório de endereço será solicitado aos seus clientes." checked={v.delivery} onChange={(x) => s.set("delivery", x)}>
          <Field label="Dias e horários de entrega" value={v.deliveryDescription} multiline rows={2} onChange={(x) => s.set("deliveryDescription", x)} />
          <h4 className="switch-card__h">Taxas de entrega</h4>
          <ul className="lines">
            {v.fees.map((f) => (
              <li key={f.id}>
                <span>{f.name}</span>
                <strong>{money(f.value)}</strong>
                <button type="button" className="icon-btn" onClick={() => s.set("fees", v.fees.filter((x) => x.id !== f.id))} aria-label="Remover taxa">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className="inline-add">
            <Field label="Região ou bairro" value={fee.name} onChange={(x) => setFee((f) => ({ ...f, name: x }))} />
            <Field label="Taxa" value={fee.value} inputMode="decimal" onChange={(x) => setFee((f) => ({ ...f, value: x }))} />
            <button
              type="button"
              className="kbtn kbtn--primary"
              onClick={() => {
                if (!fee.name.trim()) return;
                s.set("fees", [...v.fees, { id: uid("d"), name: fee.name.trim(), value: parseMoney(fee.value) }]);
                setFee({ name: "", value: "" });
              }}
            >
              Adicionar
            </button>
          </div>
        </SwitchCard>
      </div>
      <div className="cfg-col" />
      <SaveBar s={s} />
    </div>
  );
}

/* ---------- Integrações ---------- */
function IntegrationsTab() {
  const s = useSavedSettings("pdv.config.integrations", { metaShopping: false, googleShopping: false });
  const v = s.values;
  const toggle = (k, label) => {
    s.saveNow({ ...v, [k]: !v[k] });
  };
  return (
    <div className="cfg-grid">
      <div className="cfg-col">
        <section className="card icard">
          <header>
            <ProviderMark kind="instagram" />
            <ProviderMark kind="facebook" />
            <strong>Facebook / Instagram</strong>
          </header>
          <button type="button" className="icard__row" onClick={() => toggle("metaShopping")}>
            <span>
              <strong>Shopping</strong>
              <small>{v.metaShopping ? "Conectado: catálogo sincronizado com as lojas do Facebook e Instagram" : "Conecte seu catálogo de produtos às lojas do Facebook e Instagram"}</small>
            </span>
            {v.metaShopping ? <span className="ktag ktag--green">CONECTADO</span> : <Icon name="chevronRight" size={22} color="#363f4d" strokeWidth={1.6} />}
          </button>
          <div className="icard__row">
            <span>
              <strong>Pedidos de comida</strong>
              <small>Receba pedidos no seu cardápio digital pelo Facebook e Instagram</small>
            </span>
            <InApp />
          </div>
        </section>
      </div>
      <div className="cfg-col">
        <section className="card icard">
          <header>
            <ProviderMark kind="google" />
            <strong>Google</strong>
          </header>
          <button type="button" className="icard__row" onClick={() => toggle("googleShopping")}>
            <span>
              <strong>Shopping</strong>
              <small>{v.googleShopping ? "Conectado: seus produtos aparecem no Google" : "Alcance clientes no Google"}</small>
            </span>
            {v.googleShopping ? <span className="ktag ktag--green">CONECTADO</span> : <Icon name="chevronRight" size={22} color="#363f4d" strokeWidth={1.6} />}
          </button>
        </section>
      </div>
    </div>
  );
}

export default function Config({ tab }) {
  const t = TABS.find((x) => x.id === tab) || TABS[0];
  return (
    <div className="page page--config">
      <PageHeader title={T.pageTitle} />
      <PillTabs tabs={TABS} value={t.id} onChange={(id) => navigate(`/config/${id}/`)} />
      <div className="cfg-hero">
        {t.art}
        <h2>{t.title}</h2>
        <p>{t.sub}</p>
      </div>
      <div key={t.id}>
        {t.id === "general" && <SystemSettings section="store" />}
        {t.id === "receipt" && <SystemSettings section="receipt" />}
        {t.id === "payments" && <SystemSettings section="payments" />}
      </div>
    </div>
  );
}
