import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Modal } from "../../config/ui.jsx";
import { ArtCartEmpty } from "../Art.jsx";
import { Field, GreenButton, PageHeader, SearchInput, SidePanel, Switch, Toolbar, TextAction, Avatar } from "../Shell.jsx";
import { PAYMENT_METHODS } from "../seed.js";
import { initials, parseMoney, semAcento, useMoney, useStore } from "../store.jsx";
import { BANDEIRAS, gerarPlanoCartao, gerarPlanoCrediario } from "@/lib/recebiveis";
import { carregarConfiguracoes } from "@/lib/configuracoes";
import { navigate } from "../router.jsx";
import { Receipt, ReceiptActions } from "./Receipt.jsx";

const CART_KEY = "pdv.cart";

function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(CART_KEY)) || { items: [], discount: 0, customerId: "" };
    } catch {
      return { items: [], discount: 0, customerId: "" };
    }
  });
  useEffect(() => sessionStorage.setItem(CART_KEY, JSON.stringify(cart)), [cart]);
  return [cart, setCart];
}

/** Product tile: label colour, big label text, name and price on a dark band (as in the original). */
export function ProductTile({ p, onClick, money, preview }) {
  const out = p.stockActive && p.stock <= 0;
  return (
    <button type="button" className={`ptile${out ? " is-out" : ""}${preview ? " is-preview" : ""}`} onClick={onClick} style={{ backgroundColor: p.color || "#535d6e", backgroundImage: p.image ? `url(${p.image})` : undefined }} title={p.name}>
      {!p.image && <span className="ptile__label">{p.labelName || (p.name ? initials(p.name) : "Label")}</span>}
      <span className="ptile__band">
        <strong>{p.name || "Nome do Produto"}</strong>
        <span>{money(p.promoPrice ?? (Number(p.price) || 0))}</span>
      </span>
      {p.stockActive && !preview && <span className={p.stock <= p.minStock ? "ptile__stock is-low" : "ptile__stock"}>{out ? "Sem estoque" : p.stock}</span>}
    </button>
  );
}

function CategoryPopover({ categories, selected, onApply, onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(selected);
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && !e.target.closest(".js-cat-toggle") && onClose();
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);
  const list = categories.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="popover popover--cats" ref={ref}>
      <h3>Filtrar por categorias</h3>
      <div className="popover__body">
        <label className="sinput sinput--focus">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome" />
          <Icon name="search" size={20} color="#363f4d" strokeWidth={1.7} />
        </label>
        <ul className="checklist">
          {list.map((c) => (
            <li key={c}>
              <label>
                <input type="checkbox" checked={sel.includes(c)} onChange={() => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))} />
                {c}
              </label>
            </li>
          ))}
        </ul>
        <button type="button" className="kbtn kbtn--primary" disabled={!sel.length && !selected.length} onClick={() => onApply(sel)}>
          Filtrar produtos
        </button>
      </div>
    </div>
  );
}

function QuickSale({ onClose, onAdd }) {
  const money = useMoney();
  const [value, setValue] = useState("");
  const [desc, setDesc] = useState("");
  const v = parseMoney(value);
  return (
    <Modal
      title="Vender item não cadastrado"
      onClose={onClose}
      actions={
        <div className="quick__actions">
          <button type="button" className="kbtn kbtn--primary kbtn--block" disabled={v <= 0} onClick={() => onAdd({ value: v, desc })}>
            Adicionar ao carrinho
          </button>
          <button type="button" className="kbtn kbtn--link" onClick={onClose}>
            Cancelar
          </button>
        </div>
      }
    >
      <div className="quick">
        <Field label="Valor do item" legend value={value} inputMode="decimal" onChange={setValue} />
        {v > 0 && <small className="quick__hint">{money(v)}</small>}
        <Field label="Descrição" value={desc} onChange={setDesc} />
        <p className="pform__note">O item é cadastrado em Produtos para a venda baixar estoque e entrar nos relatórios.</p>
      </div>
    </Modal>
  );
}

function CustomerPicker({ onPick, onClose }) {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const list = data.customers.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <SidePanel
      title="Selecionar cliente"
      onClose={onClose}
      footer={
        <button type="button" className="kbtn kbtn--primary" onClick={() => navigate("/customers/create/")}>
          Cadastrar cliente
        </button>
      }
    >
      <SearchInput value={q} onChange={setQ} placeholder="Procure por nome" width="100%" />
      <ul className="pick-list">
        {list.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c.id)}>
              <Avatar name={c.name} />
              <span>
                <strong>{c.name}</strong>
                <small>{c.phone || c.email || "—"}</small>
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="pick-list__empty">Nenhum cliente encontrado.</li>}
      </ul>
    </SidePanel>
  );
}

const COM_BANDEIRA = ["CARTAO_CREDITO", "CARTAO_DEBITO"];
const PARCELADAS = ["CARTAO_CREDITO", "CREDIARIO", "FIADO"];
const CREDIARIO = ["CREDIARIO", "FIADO"];

/**
 * Pagamento com as regras do Royal: bandeira (define a taxa da maquininha),
 * cartão parcelado, e crediário com entrada e datas negociáveis. As parcelas
 * viram contas a receber no banco, na mesma transação da venda.
 */
function PaymentModal({ total, customer, onClose, onConfirm, money, busy }) {
  const config = carregarConfiguracoes();
  const [method, setMethod] = useState(config.pdv.forma_pagamento_padrao || "DINHEIRO");
  const [received, setReceived] = useState("");
  const [bandeira, setBandeira] = useState("mastercard");
  const [parcelas, setParcelas] = useState(1);
  const [entrada, setEntrada] = useState("");
  const [primeiroVenc, setPrimeiroVenc] = useState("");
  const [planoEditado, setPlanoEditado] = useState(null);

  const ehParcelado = PARCELADAS.includes(method);
  const ehCrediario = CREDIARIO.includes(method);
  const entradaValor = ehCrediario ? Math.min(Math.max(parseMoney(entrada), 0), total) : 0;
  const financiado = +(total - entradaValor).toFixed(2);
  const alvo = method === "CARTAO_CREDITO" ? total : financiado;

  const planoAuto = useMemo(() => {
    if (method === "CARTAO_CREDITO") return gerarPlanoCartao(total, parcelas, new Date(), config.recebiveis.dias_recebimento_credito);
    if (ehCrediario && financiado > 0) return gerarPlanoCrediario(financiado, parcelas, primeiroVenc || undefined);
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, total, financiado, parcelas, primeiroVenc]);
  // Mudar forma, parcelas, entrada ou 1º vencimento refaz o plano automático.
  useEffect(() => setPlanoEditado(null), [method, parcelas, primeiroVenc, entrada]);
  const plano = planoEditado ?? planoAuto;
  const soma = +plano.reduce((s, p) => s + p.valor, 0).toFixed(2);
  const diff = +(alvo - soma).toFixed(2);
  const patch = (i, campo, valor) => setPlanoEditado((prev) => (prev ?? planoAuto).map((p, k) => (k === i ? { ...p, [campo]: valor } : p)));

  const paid = parseMoney(received);
  const change = method === "DINHEIRO" && paid > total ? paid - total : 0;
  const short = method === "DINHEIRO" && received !== "" && paid < total;
  const needsCustomer = ehCrediario && !customer;
  const planoErrado = ehParcelado && plano.length > 0 && Math.abs(diff) > 0.01;

  const confirmar = () =>
    onConfirm({
      pagamento: {
        forma: method,
        valor: total,
        parcelas: ehParcelado ? parcelas : 1,
        bandeira: COM_BANDEIRA.includes(method) ? bandeira : undefined,
        entrada: entradaValor || undefined,
        plano: ehParcelado && plano.length ? plano : undefined,
      },
      received: method === "DINHEIRO" ? paid || total : total,
      change,
    });

  return (
    <Modal
      title="Pagamento"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose} disabled={busy}>
            Voltar
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={needsCustomer || short || planoErrado || busy} onClick={confirmar} data-testid="finish-sale">
            {busy ? "Gravando venda..." : "Concluir venda"}
          </button>
        </>
      }
    >
      <div className="pay">
        <div className="pay__total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="pay__methods">
          {PAYMENT_METHODS.map((m) => (
            <button key={m.id} type="button" className={method === m.id ? "pay__method is-active" : "pay__method"} onClick={() => setMethod(m.id)}>
              {m.label}
            </button>
          ))}
        </div>

        {method === "DINHEIRO" && <Field label="Valor recebido" value={received} inputMode="decimal" onChange={setReceived} error={short ? "Valor menor que o total" : undefined} />}
        {change > 0 && <p className="pay__change">Troco: {money(change)}</p>}

        {COM_BANDEIRA.includes(method) && (
          <label className="kselect-wrap has-legend">
            <span className="kfield__legend">Bandeira</span>
            <select className="kselect" value={bandeira} onChange={(e) => setBandeira(e.target.value)}>
              {BANDEIRAS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </label>
        )}

        {ehParcelado && (
          <div className="pay__plano">
            <div className="two">
              <Field label="Parcelas" legend value={String(parcelas)} inputMode="numeric" onChange={(x) => setParcelas(Math.min(Math.max(Number(x.replace(/\D/g, "")) || 1, 1), 36))} />
              {ehCrediario ? (
                <Field label="Entrada" legend value={entrada} inputMode="decimal" onChange={setEntrada} />
              ) : (
                <Field label="1º recebimento" legend value={`${config.recebiveis.dias_recebimento_credito} dias`} disabled onChange={() => {}} />
              )}
            </div>
            {ehCrediario && <Field label="1º vencimento" legend type="date" value={primeiroVenc} onChange={setPrimeiroVenc} />}
            {needsCustomer && <p className="kfield__error">Selecione um cliente: as parcelas ficam no nome dele.</p>}

            {plano.length > 0 && (
              <>
                <div className="pay__plano-head">
                  <strong>Parcelas</strong>
                  {planoEditado && (
                    <button type="button" className="kbtn kbtn--link" onClick={() => setPlanoEditado(null)}>
                      Restaurar automático
                    </button>
                  )}
                </div>
                <ul className="pay__parcelas">
                  {plano.map((p, i) => (
                    <li key={i}>
                      <span>{p.numero}/{plano.length}</span>
                      <input type="date" value={p.data_vencimento} onChange={(e) => patch(i, "data_vencimento", e.target.value)} aria-label={`Vencimento da parcela ${p.numero}`} />
                      <input inputMode="decimal" value={p.valor} onChange={(e) => patch(i, "valor", parseMoney(e.target.value))} aria-label={`Valor da parcela ${p.numero}`} />
                    </li>
                  ))}
                </ul>
                <p className={planoErrado ? "kfield__error" : "pay__soma"}>
                  {planoErrado
                    ? `${diff > 0 ? "Faltam" : "Sobram"} ${money(Math.abs(diff))} para fechar ${money(alvo)}.`
                    : `Soma das parcelas: ${money(soma)}`}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Checkout() {
  const { data, actions, notify } = useStore();
  const [finalizando, setFinalizando] = useState(false);
  const money = useMoney();
  const [cart, setCart] = useCart();
  const [q, setQ] = useState("");
  const [cats, setCats] = useState([]);
  const [catOpen, setCatOpen] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem("pdv.checkout.view") || "grid");
  const [quick, setQuick] = useState(false);
  const [picker, setPicker] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);
  const searchRef = useRef(null);
  useEffect(() => localStorage.setItem("pdv.checkout.view", view), [view]);

  const products = useMemo(() => {
    const t = semAcento(q);
    return data.products
      .filter((p) => p.active)
      .filter((p) => !cats.length || cats.includes(p.category))
      .filter((p) => !t || [p.name, p.sku, p.barcode, p.description].some((x) => semAcento(x).includes(t)))
      .sort((a, b) => Number(b.highlight) - Number(a.highlight) || a.name.localeCompare(b.name))
      // A grade renderiza um bloco por produto: sem busca, limita para não travar com milhares de itens.
      .slice(0, t || cats.length ? 300 : 120);
  }, [data.products, q, cats]);
  const totalAtivos = useMemo(() => data.products.filter((p) => p.active).length, [data.products]);

  /** Leitor de código de barras: Enter com código exato adiciona direto ao carrinho. */
  const aoTeclarBusca = (e) => {
    if (e.key !== "Enter") return;
    const codigo = q.trim();
    if (!codigo) return;
    // Código de uma variação adiciona direto aquela variação.
    for (const p of data.products) {
      const v = p.active && p.variations?.find((x) => x.barcode === codigo || x.sku === codigo);
      if (v) {
        add(p, v);
        setQ("");
        return;
      }
    }
    const achado = data.products.find((p) => p.active && (p.barcode === codigo || p.sku === codigo));
    if (achado) {
      add(achado);
      setQ("");
    } else if (products.length === 1) {
      add(products[0]);
      setQ("");
    } else {
      notify(`Nenhum produto com o código "${codigo}"`, "danger");
    }
  };

  const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
  // Desconto em R$ ou em % do subtotal (limitado a 100%); a venda grava sempre o valor em reais.
  const emPct = cart.discountType === "pct";
  const descontoValor = Math.min(emPct ? +((subtotal * Math.min(parseMoney(cart.discount), 100)) / 100).toFixed(2) : parseMoney(cart.discount), subtotal);
  const total = Math.max(0, +(subtotal - descontoValor).toFixed(2));
  const customer = data.customers.find((c) => c.id === cart.customerId);

  const chave = (i) => i.key ?? i.productId;
  const [escolhendo, setEscolhendo] = useState(null);
  /** Produto com variações pede a variação; o item do carrinho é produto + variação. */
  const add = (p, variacao) => {
    if (p.variations?.length && variacao === undefined) return setEscolhendo(p);
    const key = variacao ? `${p.id}|${variacao.id}` : p.id;
    // Não bloqueia: o saldo do sistema pode estar desatualizado e a peça estar na mão do cliente.
    const noCarrinho = cart.items.filter((i) => i.productId === p.id).reduce((t, i) => t + i.qty, 0);
    if (p.stock - noCarrinho <= 0) notify(`${p.name}: estoque do sistema zerado`, "danger", "A venda segue e o saldo fica negativo até a próxima entrada.");
    const preco = +((p.promoPrice ?? p.price) + (variacao?.priceAdd || 0)).toFixed(2);
    setCart((c) => {
      const ex = c.items.find((i) => chave(i) === key);
      const items = ex
        ? c.items.map((i) => (chave(i) === key ? { ...i, qty: i.qty + 1 } : i))
        : [...c.items, { key, productId: p.id, variationId: variacao?.id ?? null, name: variacao ? `${p.name} — ${variacao.name}` : p.name, price: preco, cost: p.cost + (variacao?.costAdd || 0), qty: 1 }];
      return { ...c, items };
    });
  };
  const setQty = (k, qty) => setCart((c) => ({ ...c, items: qty <= 0 ? c.items.filter((i) => chave(i) !== k) : c.items.map((i) => (chave(i) === k ? { ...i, qty } : i)) }));
  const clear = () => setCart((c) => ({ items: [], discount: 0, discountType: c.discountType, customerId: "" }));

  /**
   * Item avulso. O banco exige que todo item vendido seja um produto (é o que
   * baixa estoque e entra nos relatórios), então ele é sempre cadastrado.
   */
  const addQuick = async ({ value, desc }) => {
    const name = desc.trim() || "Item avulso";
    try {
      const productId = await actions.saveProduct({ name, code: "", category: "", price: value, cost: 0, promoPrice: null, description: "", stock: 0, minStock: 0, color: "#535d6e", image: "", showOnCatalog: false, highlight: false, active: true }, null);
      setCart((c) => ({ ...c, items: [...c.items, { productId, name, price: value, cost: 0, qty: 1 }] }));
      setQuick(false);
      notify("Item cadastrado e adicionado", "success", "Ele fica em Produtos para as próximas vendas.");
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  const finish = async ({ pagamento, received, change }) => {
    setFinalizando(true);
    try {
      const venda = await actions.finalizeSale({
        items: cart.items,
        discount: subtotal - total,
        customerId: cart.customerId || null,
        pagamentos: [pagamento],
      });
      setPaying(false);
      setDone({
        id: venda.id,
        number: venda.number,
        userId: venda.userId,
        items: cart.items,
        discount: subtotal - total,
        total,
        payments: [{ method: pagamento.forma, value: total, parcelas: pagamento.parcelas, bandeira: pagamento.bandeira }],
        entrada: pagamento.entrada || 0,
        parcelas: venda.parcelas,
        received,
        change,
        customerId: cart.customerId || null,
        status: "closed",
        createdAt: venda.createdAt,
      });
      clear();
    } catch (e) {
      // A transação desfez tudo: o carrinho continua montado para tentar de novo.
      notify(e.message, "danger", "Nada foi gravado. O carrinho continua aqui.");
    } finally {
      setFinalizando(false);
    }
  };

  if (done) {
    return (
      <div className="page">
        <PageHeader title="Vender" />
        <div className="done">
          <div className="done__icon">
            <Icon name="check" size={34} color="#fff" strokeWidth={2.4} />
          </div>
          <h2>Venda concluída!</h2>
          <p>
            Venda #{done.number} · {money(done.total)}
            {done.change > 0 && ` · Troco ${money(done.change)}`}
          </p>
          <Receipt sale={done} />
          <div className="done__actions">
            <ReceiptActions sale={done} autoPrint/>
            <button type="button" className="kbtn kbtn--primary" onClick={() => setDone(null)}>
              Nova venda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const placeholders = Math.max(0, 19 - products.length);

  return (
    <div className="page page--checkout">
      <PageHeader title="Vender" />
      <div className="checkout">
        <section className="checkout__left">
          <Toolbar>
            <span ref={searchRef} style={{ display: "contents" }} onKeyDown={aoTeclarBusca}>
              <SearchInput value={q} onChange={setQ} placeholder="Nome, código ou escaneie" width={331} testID="search-input" />
            </span>
            <div className="popover-anchor">
              <button type="button" className="taction js-cat-toggle" onClick={() => setCatOpen((o) => !o)} aria-expanded={catOpen}>
                <Icon name="tag" size={18} color="#363f4d" strokeWidth={1.6} />
                <span>Categorias{cats.length ? ` (${cats.length})` : ""}</span>
                <Icon name={catOpen ? "chevronUp" : "chevron"} size={16} color="#363f4d" strokeWidth={1.8} />
              </button>
              {catOpen && (
                <CategoryPopover
                  categories={data.categories}
                  selected={cats}
                  onClose={() => setCatOpen(false)}
                  onApply={(s) => {
                    setCats(s);
                    setCatOpen(false);
                  }}
                />
              )}
            </div>
            <div className="toolbar__spacer" />
            <button type="button" className="ticon" title="Ler código de barras" aria-label="Ler código de barras" onClick={() => searchRef.current?.querySelector("input")?.focus()}>
              <Icon name="barcode" size={24} color="#363f4d" strokeWidth={1.5} />
            </button>
            <button type="button" className="ticon" title="Vender item não cadastrado" aria-label="Vender item não cadastrado" onClick={() => setQuick(true)}>
              <Icon name="bolt" size={24} color="#363f4d" strokeWidth={1.5} />
            </button>
            <button type="button" className="ticon" title={view === "grid" ? "Ver produtos em lista" : "Ver produtos em grade"} aria-label={view === "grid" ? "Ver produtos em lista" : "Ver produtos em grade"} onClick={() => setView((v) => (v === "grid" ? "list" : "grid"))}>
              <Icon name={view === "grid" ? "list" : "grid"} size={24} color="#363f4d" strokeWidth={1.5} />
            </button>
          </Toolbar>

          {view === "grid" ? (
            <div className="pgrid">
              <button type="button" className="ptile ptile--add" onClick={() => navigate("/products/create/")} aria-label="Cadastrar produto">
                <Icon name="plus" size={56} color="#fff" strokeWidth={1.2} />
              </button>
              {products.map((p) => (
                <ProductTile key={p.id} p={p} money={money} onClick={() => add(p)} />
              ))}
              {Array.from({ length: placeholders }, (_, k) => (
                <span key={k} className="ptile ptile--ghost" aria-hidden="true" />
              ))}
            </div>
          ) : (
            <div className="plist">
              {products.length === 0 && (
                <div className="plist__empty">
                  <GreenButton label="Produto" small onClick={() => navigate("/products/create/")} />
                </div>
              )}
              {products.map((p) => (
                <button key={p.id} type="button" className="plist__row" onClick={() => add(p)}>
                  <span className="plist__swatch" style={{ background: p.color }} />
                  <span className="plist__name">{p.name}</span>
                  <span className="plist__stock">{p.stockActive ? `${p.stock} em estoque` : ""}</span>
                  <strong>{money(p.promoPrice ?? p.price)}</strong>
                </button>
              ))}
            </div>
          )}
          {!q && !cats.length && totalAtivos > products.length && (
            <p className="pform__note" style={{ textAlign: "center", marginTop: 12 }}>
              Mostrando {products.length} de {totalAtivos} produtos. Busque pelo nome ou escaneie o código para encontrar os demais.
            </p>
          )}
        </section>

        <aside className="cart" aria-label="Carrinho">
          <div className="cart__top">
            {customer ? (
              <span className="cart__customer">
                <Avatar name={customer.name} size={28} />
                {customer.name}
                <button type="button" className="icon-btn" onClick={() => setCart((c) => ({ ...c, customerId: "" }))} aria-label="Remover cliente">
                  <Icon name="close" size={14} />
                </button>
              </span>
            ) : (
              <button type="button" className="cart__pick" onClick={() => setPicker(true)}>
                Selecionar cliente
              </button>
            )}
          </div>
          <div className="cart__body">
            {cart.items.length === 0 ? (
              <div className="cart__empty">
                <span data-testid="cart-empty-state-image"><ArtCartEmpty /></span>
                <strong data-testid="cart-empty-state-title">Seu carrinho está vazio.</strong>
                <p data-testid="cart-empty-state-description">Clique nos produtos para adicioná-los à venda.</p>
              </div>
            ) : (
              <ul className="cart__items">
                {cart.items.map((i) => (
                  <li key={chave(i)} className="cart__item">
                    <div className="qty">
                      <button type="button" onClick={() => setQty(chave(i), i.qty - 1)} aria-label="Diminuir">
                        <Icon name="minus" size={14} />
                      </button>
                      <span>{i.qty}</span>
                      <button type="button" onClick={() => setQty(chave(i), i.qty + 1)} aria-label="Aumentar">
                        <Icon name="plus" size={14} />
                      </button>
                    </div>
                    <span className="cart__name">{i.name}</span>
                    <strong>{money(i.price * i.qty)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {cart.items.length > 0 && (
            <div className="cart__summary">
              <div className="cart__row">
                <span>
                  Desconto
                  {emPct && descontoValor > 0 && <small className="cart__desc-valor"> −{money(descontoValor)}</small>}
                </span>
                <span className="cart__desc">
                  <span className="seg2 seg2--mini" role="group" aria-label="Tipo de desconto">
                    <button type="button" className={!emPct ? "is-active" : ""} onClick={() => setCart((c) => ({ ...c, discountType: "valor", discount: "" }))}>R$</button>
                    <button type="button" className={emPct ? "is-active" : ""} onClick={() => setCart((c) => ({ ...c, discountType: "pct", discount: "" }))}>%</button>
                  </span>
                  <input aria-label={emPct ? "Desconto em porcentagem" : "Desconto em reais"} inputMode="decimal" value={cart.discount || ""} placeholder={emPct ? "0%" : money(0)} onChange={(e) => setCart((c) => ({ ...c, discount: e.target.value.replace(/[^\d.,]/g, "") }))} />
                </span>
              </div>
              {emPct && parseMoney(cart.discount) > 100 && <p className="kfield__error">O desconto foi limitado a 100%.</p>}
              <div className="cart__row cart__total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
          )}
          <div className="cart__footer">
            <button type="button" className="cart__trash" onClick={clear} aria-label="Esvaziar carrinho" disabled={!cart.items.length}>
              <Icon name="trash" size={20} color="#363f4d" strokeWidth={1.5} />
            </button>
            <button type="button" className="cart__go" disabled={!cart.items.length} onClick={() => setPaying(true)} data-testid="cart-finish-button">
              <span>Ir para pagamento{cart.items.length ? ` · ${money(total)}` : ""}</span>
              <Icon name="chevronRight" size={16} color="currentColor" strokeWidth={1.8} />
            </button>
          </div>
        </aside>
      </div>

      {quick && <QuickSale onClose={() => setQuick(false)} onAdd={addQuick} />}
      {picker && (
        <CustomerPicker
          onClose={() => setPicker(false)}
          onPick={(id) => {
            setCart((c) => ({ ...c, customerId: id }));
            setPicker(false);
          }}
        />
      )}
      {escolhendo && (
        <Modal title={escolhendo.name} onClose={() => setEscolhendo(null)} actions={<button type="button" className="kbtn kbtn--outline" onClick={() => setEscolhendo(null)}>Cancelar</button>}>
          <p className="modal__lead">Escolha a variação</p>
          <div className="var-pick">
            {escolhendo.variations.map((v) => (
              <button key={v.id} type="button" className="kbtn kbtn--outline" onClick={() => (add(escolhendo, v), setEscolhendo(null))}>
                <span>{v.name}</span>
                <strong>{money((escolhendo.promoPrice ?? escolhendo.price) + (v.priceAdd || 0))}</strong>
              </button>
            ))}
            <button type="button" className="kbtn kbtn--link" onClick={() => (add(escolhendo, null), setEscolhendo(null))}>
              Vender sem variação
            </button>
          </div>
        </Modal>
      )}
      {paying && <PaymentModal total={total} customer={customer} money={money} busy={finalizando} onClose={() => !finalizando && setPaying(false)} onConfirm={finish} />}
    </div>
  );
}
