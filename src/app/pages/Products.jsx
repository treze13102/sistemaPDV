import { PriceHistory } from "./PriceHistory.jsx";
import { useMemo, useRef, useState } from "react";
import { Icon, Modal } from "../../config/ui.jsx";
import { ArtArrowUp, ArtDevices, ArtShirts } from "../Art.jsx";
import { EmptyState, Field, GreenButton, HelpDot, IconSquare, PageHeader, SearchInput, SidePanel, Switch, TextAction, Toolbar } from "../Shell.jsx";
import { initials, parseMoney, semAcento, useMoney, useStore } from "../store.jsx";
import { navigate } from "../router.jsx";
import VariationsPanel from "../components/VariationsPanel.jsx";
import { MovementHistory } from "./Stock.jsx";
import { ProductTile } from "./Checkout.jsx";

// Stock states as named in the original's code and its Filters panel.
export function stockState(p) {
  if (!p.stockActive) return { id: "NOT_CONTROLLED", label: "Sem controle de estoque", tone: "gray" };
  if (p.stock <= 0) return { id: "OUT_OF_STOCK", label: "Sem estoque", tone: "red" };
  if (p.stock <= p.minStock) return { id: "BELOW_MIN", label: "Mínimo", tone: "yellow" };
  return { id: "ABOVE_MIN", label: "Acima do mínimo", tone: "green" };
}

export function csvDownload(name, rows) {
  const esc = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function ProductFilters({ value, categories, onApply, onClose }) {
  const [v, setV] = useState(value);
  const toggle = (k, id) => setV((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : [...s[k], id] }));
  return (
    <SidePanel title="Filtros" onClose={onClose} footer={<button type="button" className="kbtn kbtn--primary" onClick={() => onApply(v)}>Filtrar</button>}>
      <section className="fgroup">
        <h4>Estoque</h4>
        {[["OUT_OF_STOCK", "Sem estoque"], ["BELOW_MIN", "Mínimo"], ["ABOVE_MIN", "Acima do mínimo"], ["NOT_CONTROLLED", "Sem controle de estoque"]].map(([id, l]) => (
          <label key={id} className="kcheck">
            <input type="checkbox" checked={v.stock.includes(id)} onChange={() => toggle("stock", id)} />
            <span>{l}</span>
          </label>
        ))}
      </section>
      <section className="fgroup">
        <h4>Categorias</h4>
        {categories.map((c) => (
          <label key={c} className="kcheck">
            <input type="checkbox" checked={v.cats.includes(c)} onChange={() => toggle("cats", c)} />
            <span>{c}</span>
          </label>
        ))}
      </section>
    </SidePanel>
  );
}

function CategoriesPanel({ onClose }) {
  const { data, actions, notify } = useStore();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    const c = name.trim();
    if (!c || data.categories.includes(c) || busy) return;
    setBusy(true);
    try {
      await actions.addCategory(c);
      setName("");
      notify("Categoria criada");
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (c) => {
    const n = data.products.filter((p) => p.category === c).length;
    if (!window.confirm(`Excluir a categoria "${c}"?${n ? ` Os ${n} produto(s) dela ficam sem categoria.` : ""}`)) return;
    try {
      await actions.removeCategory(c);
      notify("Categoria excluída");
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  return (
    <SidePanel title="Categorias" onClose={onClose}>
      <div className="inline-add">
        <Field label="Nova categoria" value={name} onChange={setName} />
        <button type="button" className="kbtn kbtn--primary" onClick={add} disabled={busy}>
          {busy ? "Salvando..." : "Adicionar"}
        </button>
      </div>
      <ul className="lines lines--cats">
        {data.categories.map((c) => (
          <li key={c}>
            <Icon name="folder" size={18} color="#535d6e" />
            <span>{c}</span>
            <small>{data.products.filter((p) => p.category === c).length} itens</small>
            <button type="button" className="icon-btn" onClick={() => remove(c)} aria-label={`Excluir ${c}`}>
              <Icon name="trash" size={16} />
            </button>
          </li>
        ))}
        {!data.categories.length && <li className="pick-list__empty">Nenhuma categoria ainda.</li>}
      </ul>
    </SidePanel>
  );
}

function ImportModal({ onClose }) {
  const { actions, notify } = useStore();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const read = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then((t) => {
      const lines = t.replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
      const parsed = lines.slice(1).map((l) => l.split(/[;,]/).map((x) => x.replace(/^"|"$/g, "").trim())).filter((r) => r[0]);
      setRows(parsed);
    });
  };
  const doImport = async () => {
    setBusy(true);
    try {
      const n = await actions.importProducts(
        rows.map((r) => ({ name: r[0], code: r[1] || "", category: r[2] || "", price: parseMoney(r[3] || 0), cost: parseMoney(r[4] || 0), stock: Number(r[5]) || 0 })),
      );
      notify(`${n} produto(s) importado(s)`);
      onClose();
    } catch (e) {
      // Importa linha a linha: as anteriores ao erro já foram gravadas.
      notify(e.message, "danger", "Os produtos anteriores a esta linha já foram importados.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Importar produtos"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={() => csvDownload("modelo-produtos.csv", [["Nome", "Código", "Categoria", "Preço", "Custo", "Estoque"], ["Exemplo", "123", "Geral", "10,00", "5,00", "8"]])}>
            Baixar modelo
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={!rows?.length || busy} onClick={doImport}>
            {busy ? "Importando..." : `Importar ${rows?.length ? `(${rows.length})` : ""}`}
          </button>
        </>
      }
    >
      <p className="modal__lead">Envie uma planilha CSV com as colunas Nome, Código, Categoria, Preço, Custo e Estoque.</p>
      <input type="file" accept=".csv,text/csv" onChange={read} />
    </Modal>
  );
}

export default function Products() {
  const { data } = useStore();
  const money = useMoney();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ stock: [], cats: [] });
  const [panel, setPanel] = useState(null);
  const searchRef = useRef(null);
  const n = data.products.length;

  const list = useMemo(() => {
    const t = semAcento(q);
    return data.products
      .filter((p) => !filters.stock.length || filters.stock.includes(stockState(p).id))
      .filter((p) => !filters.cats.length || filters.cats.includes(p.category))
      .filter((p) => !t || [p.name, p.sku, p.barcode, p.description].some((x) => semAcento(x).includes(t)))
      .sort((a, b) => Number(b.active) - Number(a.active) || Number(b.highlight) - Number(a.highlight) || a.name.localeCompare(b.name));
  }, [data.products, q, filters]);

  const exportCsv = () =>
    csvDownload("produtos.csv", [["Nome", "Código", "Categoria", "Preço", "Custo", "Estoque"], ...data.products.map((p) => [p.name, p.code, p.category, p.price, p.cost, p.stockActive ? p.stock : ""])]);

  return (
    <div className="page">
      <PageHeader title="Produtos" count={`${n} ${n === 1 ? "item cadastrado" : "itens cadastrados"}`} />
      <Toolbar>
        <span ref={searchRef} style={{ display: "contents" }}>
          <SearchInput value={q} onChange={setQ} placeholder="Nome, SKU, código de barras ou descrição" width={427} testID="search-input-prod" />
        </span>
        <TextAction icon="filter" label={filters.stock.length + filters.cats.length ? `Filtros (${filters.stock.length + filters.cats.length})` : "Filtros"} onClick={() => setPanel("filters")} />
        <div className="toolbar__spacer" />
        <TextAction icon="folder" label="Categorias" onClick={() => setPanel("cats")} />
        <TextAction icon="upload" label="Exportar" onClick={exportCsv} />
        <button type="button" className="ticon" aria-label="Ler código de barras" title="Ler código de barras" onClick={() => searchRef.current?.querySelector("input")?.focus()}>
          <Icon name="barcode" size={24} color="#363f4d" strokeWidth={1.5} />
        </button>
        <IconSquare icon="import" label="Importar produtos" onClick={() => setPanel("import")} />
        <GreenButton label="Produto" onClick={() => navigate("/products/create/")} testID="add-prod-cta-prod" />
      </Toolbar>

      {n === 0 ? (
        <div className="empty-wrap">
          <span className="empty-arrow"><ArtArrowUp /></span>
          <EmptyState art={<ArtDevices />} title="Que tal cadastrar o seu primeiro produto?" size="xl" help={false} />
        </div>
      ) : list.length === 0 ? (
        <EmptyState art={<ArtDevices />} title="Nenhum produto encontrado" size="sm" help={false} />
      ) : (
        <div className="ktable">
          <div className="ktable__head">
            <span>Produto</span>
            <span>Categoria</span>
            <span>Estoque</span>
            <span className="num">Preço</span>
          </div>
          {list.map((p) => {
            const st = stockState(p);
            return (
              <button key={p.id} type="button" className="ktable__row" onClick={() => navigate(`/products/create/?id=${p.id}`)}>
                <span className="cell-product">
                  <span className="thumb" style={{ background: p.color, backgroundImage: p.image ? `url(${p.image})` : undefined }}>{p.image ? "" : initials(p.name)}</span>
                  <span>
                    <strong>
                      {p.name} {p.highlight && <Icon name="star" size={14} color="#f5a623" />}
                      {!p.active && <span className="ktag ktag--gray" style={{ marginLeft: 6 }}>Inativo</span>}
                    </strong>
                    <small>{p.code}</small>
                  </span>
                </span>
                <span>{p.category || "—"}</span>
                <span>
                  <span className={`ktag ktag--${st.tone}`}>{p.stockActive ? `${p.stock} · ${st.label}` : st.label}</span>
                </span>
                <span className="num">
                  {p.promoPrice != null && <s className="cell-muted">{money(p.price)} </s>}
                  <strong>{money(p.promoPrice ?? p.price)}</strong>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {panel === "filters" && <ProductFilters value={filters} categories={data.categories} onClose={() => setPanel(null)} onApply={(f) => (setFilters(f), setPanel(null))} />}
      {panel === "cats" && <CategoriesPanel onClose={() => setPanel(null)} />}
      {panel === "import" && <ImportModal onClose={() => setPanel(null)} />}
    </div>
  );
}

/* ---------- Cadastrar produto ---------- */
const LABEL_COLORS = ["#535d6e", "#2dd1ac", "#fdca40", "#ff8552", "#ff4e4e", "#ce7da5", "#89bbfe", "#0d3b66", "#82d173", "#2d2d2a"];

function readCatalogReady() {
  try {
    return !!JSON.parse(localStorage.getItem("pdv.config.catalog") || "{}").created;
  } catch {
    return false;
  }
}

/**
 * Reduz a foto para no máximo 480 px e JPEG ~80%. O Royal guarda a imagem
 * como texto no próprio produto; uma foto de celular crua (vários MB)
 * deixaria toda carga de produtos lenta.
 */
function reduzirFoto(file, max = 480) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta imagem."));
    };
    img.src = url;
  });
}

export function ProductForm({ id }) {
  const { data, actions, notify } = useStore();
  const money = useMoney();
  const existing = data.products.find((p) => p.id === id);
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState(
    () =>
      existing || { name: "", code: "", category: "", labelName: "", price: "", cost: "", promoPrice: "", description: "", unit: "unit", stockActive: true, stock: "", minStock: "", color: "#535d6e", image: "", showOnCatalog: false, highlight: false, active: true, variations: [] }
  );
  const [errors, setErrors] = useState({});
  const [colorOpen, setColorOpen] = useState(false);
  const [showMoves, setShowMoves] = useState(false);
  const [variationOpen, setVariationOpen] = useState(false);
  const photo = useRef(null);
  const autoPhoto = useRef(null);
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const catalogReady = readCatalogReady();

  const pickImage = async (e, auto) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      set("image", await reduzirFoto(f));
      if (auto && !v.name) set("name", f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    } catch (err) {
      notify(err.message, "danger");
    }
  };

  const save = async () => {
    const e = {};
    if (!v.name.trim()) e.name = "Informe o nome do produto";
    if (parseMoney(v.price) <= 0) e.price = "Informe o preço de venda";
    const promo = v.promoPrice === "" || v.promoPrice == null ? null : parseMoney(v.promoPrice);
    if (promo != null && promo >= parseMoney(v.price)) e.promo = "O preço promocional precisa ser menor que o de venda";
    setErrors(e);
    if (Object.keys(e).length || busy) return;
    const p = { ...v, price: parseMoney(v.price), cost: parseMoney(v.cost), promoPrice: promo, stock: Number(v.stock) || 0, minStock: Number(v.minStock) || 0 };
    setBusy(true);
    try {
      await actions.saveProduct(p, existing);
      notify(existing ? "Produto atualizado" : "Produto cadastrado");
      navigate("/products/");
    } catch (err) {
      notify(err.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!existing || !window.confirm("Excluir este produto?")) return;
    try {
      const r = await actions.deleteProduct(id);
      // Produto com vendas/movimentos não pode sumir do histórico: vira inativo.
      notify(r === "inativado" ? "Produto inativado" : "Produto excluído", "success", r === "inativado" ? "Ele tem vendas ou movimentos registrados, então foi inativado em vez de excluído." : undefined);
      navigate("/products/");
    } catch (err) {
      notify(err.message, "danger");
    }
  };
  const duplicate = async () => {
    if (!existing) return;
    try {
      const novoId = await actions.duplicateProduct(existing);
      notify("Produto duplicado", "success", "A cópia nasce sem código de barras e sem estoque.");
      navigate(`/products/create/?id=${novoId}`);
    } catch (err) {
      notify(err.message, "danger");
    }
  };
  const suggest = () => {
    if (!v.name.trim()) return notify("Informe o nome do produto primeiro", "danger");
    set("description", `${v.name.trim()}${v.category ? ` da categoria ${v.category}` : ""}. Produto de qualidade, pronto para você aproveitar.`);
  };
  const moves = data.sales.filter((s) => s.items.some((i) => i.productId === id));

  return (
    <div className="page page--form">
      <PageHeader title={existing ? "Editar produto" : "Cadastrar produto"} />
      <div className="formbar">
        <button type="button" className={v.highlight ? "formbar__star is-on" : "formbar__star"} onClick={() => set("highlight", !v.highlight)}>
          <Icon name="star" size={20} color="#f5a623" strokeWidth={1.6} />
          Destacar produto
        </button>
        <label className="formbar__catalog">
          <Switch checked={v.showOnCatalog} onChange={(x) => set("showOnCatalog", x)} label="Exibir no Catálogo Online" disabled={!catalogReady} />
          <span>
            <strong>Exibir no Catálogo Online</strong>
            <small>{catalogReady ? "Aparece para seus clientes" : "Você ainda não tem um catálogo"}</small>
          </span>
        </label>
        <label className="formbar__catalog">
          <Switch checked={v.active !== false} onChange={(x) => set("active", x)} label="Produto ativo" />
          <span>
            <strong>Produto ativo</strong>
            <small>{v.active !== false ? "Aparece na tela de venda" : "Fora da venda, mantém o histórico"}</small>
          </span>
        </label>
        <div className="toolbar__spacer" />
        <button type="button" className="taction" disabled={!existing} onClick={duplicate}>
          <Icon name="duplicate" size={16} color={existing ? "#363f4d" : "#a9b1be"} strokeWidth={1.6} />
          <span>Duplicar</span>
        </button>
        <button type="button" className="ticon" disabled={!existing} onClick={remove} aria-label="Excluir produto">
          <Icon name="trash" size={22} color={existing ? "#363f4d" : "#a9b1be"} strokeWidth={1.5} />
        </button>
      </div>

      <div className="pform">
        <section className="card pform__left">
          <div className="pform__preview">
            <ProductTile p={v} money={money} preview onClick={() => {}} />
          </div>
          <div className="pform__tools">
            <div className="popover-anchor">
              <button type="button" className="taction" onClick={() => setColorOpen((o) => !o)}>
                <span className="swatch" style={{ background: v.color }} />
                <span>Cor da etiqueta</span>
                <Icon name="chevron" size={16} color="#363f4d" strokeWidth={1.8} />
              </button>
              {colorOpen && (
                <div className="popover popover--colors">
                  {LABEL_COLORS.map((c) => (
                    <button key={c} type="button" className={v.color === c ? "color-dot is-active" : "color-dot"} style={{ background: c }} onClick={() => (set("color", c), setColorOpen(false))} aria-label={c} />
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="taction" onClick={() => photo.current.click()}>
              <Icon name="image" size={20} color="#363f4d" strokeWidth={1.5} />
              <span>{v.image ? "Trocar foto" : "Fotos"}</span>
            </button>
            {v.image && (
              <button type="button" className="kbtn kbtn--link" onClick={() => set("image", "")}>
                Remover foto
              </button>
            )}
            <input ref={photo} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, false)} />
          </div>
          <div className="pform__fields">
            <Field label="Nome do Produto" value={v.name} onChange={(x) => set("name", x)} error={errors.name} testID="product-name" />
            <Field label="Preço de Venda" value={String(v.price)} inputMode="decimal" onChange={(x) => set("price", x)} error={errors.price} testID="product-price" />
            <h3 className="pform__h">Opcionais</h3>
            <Field label="Preço promocional" value={v.promoPrice == null ? "" : String(v.promoPrice)} inputMode="decimal" onChange={(x) => set("promoPrice", x)} error={errors.promo} />
            <p className="pform__note">
              O preço de venda será riscado, por exemplo: de <s>$10,00</s> para $5,00
            </p>
            <label className="kselect-wrap">
              <select className="kselect" value={v.category} onChange={(e) => set("category", e.target.value)}>
                <option value="">Categoria</option>
                {data.categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <Field label="Nome da etiqueta" value={v.labelName || ""} onChange={(x) => set("labelName", x.slice(0, 10))} />
            <div className="pform__desc">
              <Field label="Descrição" value={v.description} multiline rows={5} onChange={(x) => set("description", x)} />
              <span className="pform__suggest">
                <button type="button" onClick={suggest}>
                  <Icon name="kai" size={14} color="#a9b1be" /> Sugerir descrição
                </button>
                <HelpDot text="Cria uma descrição a partir do nome e da categoria." />
              </span>
            </div>
            <Field label="Código do produto" value={v.code} onChange={(x) => set("code", x)} />
            <Field label="Custo" value={String(v.cost)} inputMode="decimal" onChange={(x) => set("cost", x)} />
            <label className="kselect-wrap has-legend">
              <span className="kfield__legend">Vender por</span>
              <select className="kselect" value={v.unit || "unit"} onChange={(e) => set("unit", e.target.value)}>
                <option value="unit">Unidade</option>
                <option value="fraction">Fração (kg, g, l...)</option>
              </select>
            </label>
          </div>
        </section>

        <div className="pform__right">
          <section className="autobox">
            <button type="button" className="autobox__btn" onClick={() => autoPhoto.current.click()}>
              <Icon name="image" size={18} color="#fff" strokeWidth={1.6} /> Selecionar uma foto
            </button>
            <input ref={autoPhoto} type="file" accept="image/*" hidden onChange={(e) => pickImage(e, true)} />
            <div>
              <h3>
                Cadastro automático <span className="ktag ktag--outline">BETA</span>
              </h3>
              <p>
                <strong>É só enviar uma foto:</strong> o nome do produto é preenchido a partir do arquivo e você ajusta o que quiser.
              </p>
            </div>
          </section>

          <section className="card card--pad">
            <div className="card__row">
              <h3 className="card__title">Estoque</h3>
            </div>
            <div className="two">
              <Field label="Estoque atual" legend value={String(v.stock)} inputMode="decimal" onChange={(x) => set("stock", x.replace(/[^\d.,-]/g, "").replace(",", "."))} />
              <Field label="Estoque mínimo" legend value={String(v.minStock)} inputMode="numeric" onChange={(x) => set("minStock", x.replace(/\D/g, ""))} />
            </div>
            <p className="pform__note">
              {existing
                ? "Alterar o estoque atual registra um ajuste de inventário com a diferença, no histórico de movimentos."
                : "O estoque informado entra como estoque inicial do produto."}
            </p>
            <h3 className="card__title card__title--sm">Histórico de movimentações</h3>
            {existing ? <MovementHistory productId={id}/> : <p className="pform__note">Salve o produto para consultar os movimentos.</p>}
          </section>

          <section className="card card--pad"><h3 className="card__title">Variações</h3><p className="pform__note">Cor, tamanho, fragrância e outros atributos, salvos no banco Royal.</p><button type="button" className="kbtn kbtn--outline" disabled={!existing || busy} onClick={()=>setVariationOpen(true)}>Gerenciar variações</button>{!existing && <p className="pform__note">Salve o produto primeiro.</p>}</section>
          {existing && <section className="card card--pad"><h3 className="card__title">Histórico de preços</h3><PriceHistory productId={existing.id} /></section>}
        </div>
      </div>

      <div className="save-bar is-visible">
        <button type="button" className="kbtn kbtn--outline" onClick={() => navigate("/products/")}>
          Cancelar
        </button>
        <button type="button" className="kbtn kbtn--primary" onClick={save} disabled={busy} data-testid="save-product">
          {busy ? "Salvando..." : "Salvar"}
        </button>
      </div>
      {variationOpen && existing && <VariationsPanel product={existing} onClose={()=>setVariationOpen(false)}/> }
    </div>
  );
}

function VariationModal({ onClose, onAdd }) {
  const [name, setName] = useState("Tamanho");
  const [opts, setOpts] = useState("P, M, G");
  const options = opts.split(",").map((x) => x.trim()).filter(Boolean);
  return (
    <Modal
      title="Adicionar variação"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={!name.trim() || !options.length} onClick={() => onAdd({ name: name.trim(), options })}>
            Adicionar
          </button>
        </>
      }
    >
      <div className="quick">
        <Field label="Nome da variação (ex.: Cor, Tamanho)" value={name} onChange={setName} />
        <Field label="Opções separadas por vírgula" value={opts} onChange={setOpts} />
        <div className="chips-row">
          {options.map((o) => (
            <span key={o} className="ktag ktag--gray">{o}</span>
          ))}
        </div>
      </div>
    </Modal>
  );
}
