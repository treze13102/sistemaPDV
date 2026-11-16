import { useEffect, useMemo, useState } from "react";
import { useCancelarPedido, useCriarPedido, useItensPedido, usePedidosCompra, useReceberPedido } from "@/hooks/usePedidosCompra";
import { useFornecedores } from "@/hooks/useFornecedores";
import { carregarConfiguracoes } from "@/lib/configuracoes";
import { isoDate } from "@/lib/recebiveis";
import { saldoItemCompra, totalItemCompra } from "@/lib/compras";
import { Icon, Modal } from "../../config/ui.jsx";
import { EmptyState, Field, GreenButton, PageHeader, SearchInput, SidePanel, Toolbar } from "../Shell.jsx";
import { fmtDia, semAcento, useMoney, useStore } from "../store.jsx";
import "./PurchaseOrders.css";

const STATUS = { ABERTO: "Aberto", PARCIAL: "Recebido parcialmente", RECEBIDO: "Recebido", CANCELADO: "Cancelado" };
const LOCATIONS = [["Loja", "Loja"], ["Deposito", "Depósito"], ["Fabrica3D", "Fábrica 3D"], ["Consignado", "Consignado"]];
const decimal = value => /^\d+(?:[.,]\d+)?$/.test(String(value).trim()) ? Number(String(value).trim().replace(",", ".")) : NaN;
const precision = (value, places) => Number.isFinite(value) && Math.abs(value - Math.round(value * 10 ** places) / 10 ** places) < 1e-8;
const dueDefault = () => { const date = new Date(); date.setDate(date.getDate() + 30); return isoDate(date); };
const receivedValue = items => Math.round(items.reduce((sum, item) => sum + totalItemCompra(Number(item.quantidade_recebida), Number(item.custo_unitario)), 0) * 100) / 100;
const nameOf = item => item.produto?.nome || item.produto_nome || "Produto";

function DateField({ label, value, onChange, disabled, required }) {
  return <label className="purchase-date">{label}<input type="date" value={value} onInput={event => onChange(event.currentTarget.value)} onChange={event => onChange(event.currentTarget.value)} disabled={disabled} required={required} /></label>;
}
function ErrorBox({ error }) { return error ? <p className="purchase-error" role="alert">{error}</p> : null; }
function useDraftClose(dirty, busy, onClose) {
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return {
    close: () => { if (!busy && !asking) { if (dirty) setAsking(true); else onClose(); } },
    dialog: asking && <Modal title="Descartar alterações?" onClose={() => !busy && setAsking(false)} actions={<><button type="button" className="kbtn kbtn--outline" onClick={() => setAsking(false)}>Continuar editando</button><button type="button" className="kbtn kbtn--primary" onClick={onClose}>Descartar alterações</button></>}><p>Os dados ainda não foram registrados. Deseja descartá-los?</p></Modal>,
  };
}

function NewPurchase({ onClose, onSaved }) {
  const { data, notify } = useStore();
  const money = useMoney();
  const suppliers = useFornecedores();
  const save = useCriarPedido();
  const [requestId] = useState(() => crypto.randomUUID());
  const [supplier, setSupplier] = useState("");
  const [expected, setExpected] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const guard = useDraftClose(!!(supplier || expected || note || items.length || search), save.isPending, onClose);
  const products = useMemo(() => {
    const term = semAcento(search);
    // Produtos com variações aparecem também uma linha por variação.
    return term ? data.products.filter(product => product.active && [product.name, product.sku, product.barcode, product.code, ...(product.variations ?? []).flatMap(v => [v.name, v.sku, v.barcode])].some(value => semAcento(value).includes(term))).slice(0, 10).flatMap(product => [product, ...(product.variations ?? []).map(v => ({ ...product, name: `${product.name} — ${v.name}`, code: v.barcode || v.sku || product.code, cost: (product.cost ?? 0) + v.costAdd, variacao_id: v.id }))]).slice(0, 20) : [];
  }, [data.products, search]);
  const total = items.reduce((sum, item) => sum + (Number.isFinite(decimal(item.quantidade)) && Number.isFinite(decimal(item.custo_unitario)) ? totalItemCompra(decimal(item.quantidade), decimal(item.custo_unitario)) : 0), 0);
  const chave = item => `${item.produto_id}|${item.variacao_id ?? ""}`;
  function add(product) {
    const k = `${product.id}|${product.variacao_id ?? ""}`;
    setItems(current => current.some(item => chave(item) === k) ? current.map(item => chave(item) === k ? { ...item, quantidade: String((decimal(item.quantidade) || 0) + 1) } : item) : [...current, { produto_id: product.id, variacao_id: product.variacao_id ?? null, produto_nome: product.name, quantidade: "1", custo_unitario: String(product.cost ?? 0) }]);
    setSearch("");
  }
  function patch(id, changes) { setItems(current => current.map(item => chave(item) === id ? { ...item, ...changes } : item)); }
  async function submit(event) {
    event.preventDefault();
    if (save.isPending) return;
    if (!supplier || !items.length) { setError("Selecione o fornecedor e adicione ao menos um produto."); return; }
    const payload = items.map(item => ({ ...item, quantidade: decimal(item.quantidade), custo_unitario: decimal(item.custo_unitario) }));
    if (payload.some(item => !precision(item.quantidade, 3) || item.quantidade <= 0 || !precision(item.custo_unitario, 2) || item.custo_unitario < 0)) { setError("Informe quantidades maiores que zero (até 3 casas decimais) e custos válidos (até 2 casas). Use vírgula ou ponto para decimais."); return; }
    setError("");
    try { const result = await save.mutateAsync({ id: requestId, fornecedor_id: supplier, previsao_entrega: expected || null, observacao: note.trim() || null, itens: payload }); notify(`Pedido de compra #${result.numero} criado`); onSaved(result.id); }
    catch (failure) { setError(failure.message || "Não foi possível criar o pedido. Os dados foram mantidos."); }
  }
  return <><SidePanel title="Novo pedido de compra" width={680} onClose={guard.close} footer={<><button type="button" className="kbtn kbtn--outline" onClick={guard.close} disabled={save.isPending}>Cancelar</button><button type="submit" form="new-purchase" className="kbtn kbtn--primary" disabled={save.isPending || suppliers.isLoading || suppliers.isError}>{save.isPending ? "Registrando…" : "Criar pedido"}</button></>}>
    <form id="new-purchase" className="purchase-form" onSubmit={submit} noValidate>
      <div className="two"><label className="purchase-date">Fornecedor *<select aria-label="Fornecedor" value={supplier} onChange={event => setSupplier(event.target.value)} disabled={save.isPending}><option value="">Selecione…</option>{(suppliers.data ?? []).map(item => <option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></label><DateField label="Previsão de entrega" value={expected} onChange={setExpected} disabled={save.isPending} /></div>
      {suppliers.isError && <ErrorBox error={`Não foi possível carregar os fornecedores. ${suppliers.error.message}`} />}
      {!suppliers.isLoading && !suppliers.isError && !suppliers.data?.length && <p className="purchase-note">Cadastre um fornecedor na tela Fornecedores antes de criar sua compra.</p>}
      <div className="purchase-search" onKeyDown={event => { if (event.key !== "Enter") return; event.preventDefault(); const codigo = search.trim(); const exato = products.find(p => p.code === codigo || (!p.variacao_id && (p.barcode === codigo || p.sku === codigo))); const unico = products.length === 1 ? products[0] : null; if (exato || unico) add(exato || unico); }}><SearchInput value={search} onChange={setSearch} placeholder="Buscar ou escanear o código de barras" width="100%" />{!!search && <div className="purchase-suggestions">{products.length ? products.map(product => <button type="button" key={`${product.id}|${product.variacao_id ?? ""}`} onClick={() => add(product)} disabled={save.isPending}><span>{product.name}<small>{product.code}</small></span><strong>{money(product.cost ?? 0)}</strong><Icon name="plus" size={16} /></button>) : <p>Nenhum produto encontrado.</p>}</div>}</div>
      <ul className="purchase-lines">{items.map(item => <li key={chave(item)}><div className="purchase-line__heading"><strong>{item.produto_nome}</strong><button type="button" className="icon-btn" aria-label={`Remover ${item.produto_nome}`} onClick={() => setItems(current => current.filter(line => chave(line) !== chave(item)))} disabled={save.isPending}><Icon name="trash" size={16} /></button></div><div className="purchase-item-inputs"><Field label="Quantidade" legend inputMode="decimal" value={item.quantidade} onChange={value => patch(chave(item), { quantidade: value })} disabled={save.isPending} /><Field label="Custo unitário" legend inputMode="decimal" value={item.custo_unitario} onChange={value => patch(chave(item), { custo_unitario: value })} disabled={save.isPending} /><span className="purchase-line__total">Total<strong>{money(Number.isFinite(decimal(item.quantidade)) && Number.isFinite(decimal(item.custo_unitario)) ? totalItemCompra(decimal(item.quantidade), decimal(item.custo_unitario)) : 0)}</strong></span></div></li>)}</ul>
      {!items.length && <p className="purchase-note">Busque os produtos acima para montar o pedido.</p>}
      <div className="purchase-total"><span>Total do pedido</span><strong>{money(total)}</strong></div>
      <Field label="Observações" legend multiline rows={3} value={note} onChange={setNote} disabled={save.isPending} />
      <ErrorBox error={error} />
    </form>
  </SidePanel>{guard.dialog}</>;
}

function ReceiveForm({ order, items, onClose, onSaved }) {
  const { notify } = useStore();
  const money = useMoney();
  const mutation = useReceberPedido();
  // Mantém a versão conferida pelo operador; refetch após falha não permite repetir o mesmo recebimento.
  const [snapshot] = useState(() => items.map(item => ({ ...item })));
  const [quantities, setQuantities] = useState(() => Object.fromEntries(snapshot.map(item => [item.id, String(saldoItemCompra(Number(item.quantidade), Number(item.quantidade_recebida)))])));
  const [expiry, setExpiry] = useState({});
  const [location, setLocation] = useState(() => carregarConfiguracoes().pdv.local_estoque_padrao || "Loja");
  const [due, setDue] = useState(dueDefault);
  const [billing, setBilling] = useState(true);
  const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);
  const guard = useDraftClose(changed, mutation.isPending, onClose);
  const pending = snapshot.filter(item => saldoItemCompra(Number(item.quantidade), Number(item.quantidade_recebida)) > 0);
  const complete = snapshot.every(item => Number(item.quantidade_recebida) + (decimal(quantities[item.id]) || 0) >= Number(item.quantidade) - 0.000001);
  const total = snapshot.reduce((sum, item) => sum + (Number.isFinite(decimal(quantities[item.id])) ? totalItemCompra(decimal(quantities[item.id]), Number(item.custo_unitario)) : 0), 0);
  function change(setter, value) { setChanged(true); setter(value); }
  async function submit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    const receipts = snapshot.map(item => ({ item_id: item.id, produto_id: item.produto_id, quantidade: decimal(quantities[item.id]), custo_unitario: Number(item.custo_unitario), total_anterior: Number(item.quantidade_recebida), quantidade_pedida: Number(item.quantidade), data_validade: expiry[item.id] || null }));
    if (receipts.some(item => !precision(item.quantidade, 3) || item.quantidade < 0 || item.quantidade > saldoItemCompra(item.quantidade_pedida, item.total_anterior)) || !receipts.some(item => item.quantidade > 0)) { setError("Informe quantidades válidas, sem ultrapassar o saldo pendente. Ao menos um item deve ser recebido."); return; }
    if (complete && billing && !due) { setError("Informe o vencimento da conta a pagar."); return; }
    setError("");
    try { const result = await mutation.mutateAsync({ pedido: order, recebimentos: receipts, localizacao: location, data_vencimento: complete && billing ? due : null }); notify(result.parcela_criada ? "Recebimento registrado e conta a pagar criada" : "Recebimento registrado"); onSaved(); }
    catch (failure) { setError(failure.message || "Não foi possível receber o pedido. Confira o saldo antes de tentar novamente."); }
  }
  return <><SidePanel title={`Receber pedido #${order.numero}`} width={680} onClose={guard.close} footer={<><button type="button" className="kbtn kbtn--outline" onClick={guard.close} disabled={mutation.isPending}>Voltar</button><button type="submit" form="receive-purchase" className="kbtn kbtn--primary" disabled={mutation.isPending}>{mutation.isPending ? "Registrando…" : "Confirmar recebimento"}</button></>}>
    <form id="receive-purchase" className="purchase-form" onSubmit={submit} noValidate>
      <p className="purchase-note">{order.fornecedor?.razao_social} · Informe somente as quantidades que chegaram agora.</p>
      <label className="purchase-date">Local de entrada<select aria-label="Local de entrada" value={location} onChange={event => change(setLocation, event.target.value)} disabled={mutation.isPending}>{LOCATIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <ul className="purchase-lines">{pending.map(item => <li key={item.id}><strong>{nameOf(item)}</strong><p className="purchase-note">Pedido: {Number(item.quantidade)} · Já recebido: {Number(item.quantidade_recebida)} · Pendente: {saldoItemCompra(Number(item.quantidade), Number(item.quantidade_recebida))}</p><div className="two"><Field label="Receber agora" legend inputMode="decimal" value={quantities[item.id]} onChange={value => { setChanged(true); setQuantities(current => ({ ...current, [item.id]: value })); }} disabled={mutation.isPending} /><DateField label="Validade (opcional)" value={expiry[item.id] ?? ""} onChange={value => { setChanged(true); setExpiry(current => ({ ...current, [item.id]: value })); }} disabled={mutation.isPending} /></div></li>)}</ul>
      <div className="purchase-total"><span>Valor recebido agora</span><strong>{money(total)}</strong></div>
      {complete ? <div className="purchase-billing"><label className="kcheck"><input type="checkbox" checked={billing} onChange={event => change(setBilling, event.target.checked)} disabled={mutation.isPending} />Gerar conta a pagar ao concluir</label>{billing ? <DateField label="Vencimento da conta a pagar" value={due} onChange={value => change(setDue, value)} disabled={mutation.isPending} required /> : <p className="purchase-note">O recebimento será concluído sem gerar conta. Faça o lançamento manual se necessário.</p>}</div> : <p className="purchase-note">Este recebimento será parcial. A conta a pagar poderá ser gerada quando o pedido for totalmente recebido.</p>}
      <ErrorBox error={error} />
    </form>
  </SidePanel>{guard.dialog}</>;
}

function CancelForm({ order, items, onClose, onSaved }) {
  const money = useMoney();
  const { notify } = useStore();
  const mutation = useCancelarPedido();
  const [expectedValue] = useState(() => receivedValue(items));
  const [reason, setReason] = useState("");
  const [due, setDue] = useState(dueDefault);
  const [error, setError] = useState("");
  const guard = useDraftClose(!!reason, mutation.isPending, onClose);
  async function submit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!reason.trim() || (expectedValue > 0 && !due)) { setError("Informe o motivo e, se houver itens recebidos, o vencimento da conta."); return; }
    try { await mutation.mutateAsync({ id: order.id, motivo: reason.trim(), data_vencimento: expectedValue > 0 ? due : null, valor_recebido_esperado: expectedValue }); notify("Saldo pendente do pedido cancelado"); onSaved(); }
    catch (failure) { setError(failure.message || "Não foi possível cancelar o pedido."); }
  }
  return <><SidePanel title={`Cancelar pedido #${order.numero}`} width={520} onClose={guard.close} footer={<><button type="button" className="kbtn kbtn--outline" onClick={guard.close} disabled={mutation.isPending}>Voltar</button><button type="submit" form="cancel-purchase" className="kbtn kbtn--primary" disabled={mutation.isPending}>{mutation.isPending ? "Cancelando…" : "Confirmar cancelamento"}</button></>}>
    <form id="cancel-purchase" className="purchase-form" onSubmit={submit} noValidate><p className="purchase-note">O saldo ainda não entregue será cancelado. Mercadorias já recebidas permanecem no estoque.</p>{expectedValue > 0 && <><p className="purchase-cancel-note">Já foram recebidos <strong>{money(expectedValue)}</strong>. Uma conta a pagar desse valor será criada caso ainda não exista, preservando a obrigação com o fornecedor.</p><DateField label="Vencimento, caso seja criada uma conta" value={due} onChange={setDue} disabled={mutation.isPending} required /></>}<Field label="Motivo do cancelamento" legend multiline rows={3} value={reason} onChange={setReason} disabled={mutation.isPending} /><ErrorBox error={error} /></form>
  </SidePanel>{guard.dialog}</>;
}

function PurchasePanel({ order, mode, onMode, onClose }) {
  const money = useMoney();
  const query = useItensPedido(order.id);
  const editable = ["ABERTO", "PARCIAL"].includes(order.status);
  if (query.isLoading || query.isError) return <SidePanel title={`Pedido de compra #${order.numero}`} onClose={onClose}><p className="purchase-note">{query.isLoading ? "Carregando itens…" : query.error.message}</p>{query.isError && <button type="button" className="kbtn kbtn--outline" onClick={() => query.refetch()}>Tentar novamente</button>}</SidePanel>;
  const items = query.data ?? [];
  if (mode === "receive") return <ReceiveForm key={`receive-${order.id}`} order={order} items={items} onClose={() => onMode("detail")} onSaved={() => onMode("detail")} />;
  if (mode === "cancel") return <CancelForm key={`cancel-${order.id}`} order={order} items={items} onClose={() => onMode("detail")} onSaved={() => onMode("detail")} />;
  return <SidePanel title={`Pedido de compra #${order.numero}`} width={640} onClose={onClose} footer={<><button type="button" className="kbtn kbtn--outline" onClick={onClose}>Fechar</button>{editable && <><button type="button" className="kbtn kbtn--outline" onClick={() => onMode("cancel")}>Cancelar pedido</button><button type="button" className="kbtn kbtn--primary" onClick={() => onMode("receive")} disabled={!items.length}>Receber itens</button></>}</>}>
    <div className="purchase-form"><strong>{order.fornecedor?.razao_social || "Fornecedor"}</strong><span className={`ktag ${order.status === "RECEBIDO" ? "ktag--green" : order.status === "CANCELADO" ? "ktag--red" : "ktag--gray"}`}>{STATUS[order.status]}</span><div className="purchase-summary"><span>Data do pedido<strong>{fmtDia(order.data_pedido)}</strong></span><span>Previsão de entrega<strong>{fmtDia(order.previsao_entrega) || "Não informada"}</strong></span><span>Total do pedido<strong>{money(Number(order.total))}</strong></span><span>Valor já recebido<strong>{money(receivedValue(items))}</strong></span></div><ul className="purchase-lines">{items.map(item => <li key={item.id}><strong>{nameOf(item)}</strong><p className="purchase-note">Pedido: {Number(item.quantidade)} · Recebido: {Number(item.quantidade_recebida)} · Pendente: {saldoItemCompra(Number(item.quantidade), Number(item.quantidade_recebida))}</p><span className="purchase-note">Custo unitário {money(Number(item.custo_unitario))} · Total {money(Number(item.total))}</span></li>)}</ul>{order.observacao && <p className="purchase-observation">{order.observacao}</p>}</div>
  </SidePanel>;
}

export default function PurchaseOrders() {
  const query = usePedidosCompra();
  const money = useMoney();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("detail");
  const rows = useMemo(() => { const term = semAcento(search.replace(/^#/, "")); return (query.data ?? []).filter(order => (!status || order.status === status) && (!term || [String(order.numero), order.fornecedor?.razao_social, order.observacao].some(value => semAcento(value).includes(term)))); }, [query.data, search, status]);
  const selected = (query.data ?? []).find(order => order.id === selectedId);
  return <div className="page page--purchases"><PageHeader title="Pedidos de compra" count={query.data?.length} /><Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Número, fornecedor ou observação" width={360} /><label className="kselect-wrap purchase-status"><select className="kselect" aria-label="Status dos pedidos" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos os status</option>{Object.entries(STATUS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><div className="toolbar__spacer" /><GreenButton label="Novo pedido" onClick={() => setNewOpen(true)} /></Toolbar>
    {query.isError ? <div className="alert" role="alert">Não foi possível carregar os pedidos. {query.error.message} <button type="button" className="kbtn kbtn--outline" onClick={() => query.refetch()}>Tentar novamente</button></div> : query.isLoading ? <p className="ktable__empty" role="status">Carregando pedidos de compra…</p> : rows.length === 0 ? <EmptyState title={search || status ? "Nenhum pedido encontrado" : "Crie seu primeiro pedido de compra"} text="Organize as compras dos fornecedores e registre a chegada das mercadorias." help={false} size="sm" /> : <div className="ktable purchase-table"><div className="ktable__head purchase-row"><span>Pedido</span><span>Fornecedor</span><span>Data / previsão</span><span className="num">Total</span><span>Status</span><span /></div>{rows.map(order => <button type="button" className="ktable__row purchase-row" key={order.id} aria-label={`Ver pedido de compra ${order.numero}`} onClick={() => { setSelectedId(order.id); setMode("detail"); }}><strong>#{order.numero}</strong><span>{order.fornecedor?.razao_social || "—"}</span><span className="purchase-row__dates">{fmtDia(order.data_pedido)}<small>{order.previsao_entrega ? `Previsão ${fmtDia(order.previsao_entrega)}` : "Sem previsão"}</small></span><strong className="num">{money(Number(order.total))}</strong><span className={`ktag ${order.status === "RECEBIDO" ? "ktag--green" : order.status === "CANCELADO" ? "ktag--red" : "ktag--gray"}`}>{STATUS[order.status]}</span><Icon name="chevronRight" size={16} /></button>)}</div>}
    {newOpen && <NewPurchase onClose={() => setNewOpen(false)} onSaved={id => { setNewOpen(false); setSelectedId(id); setMode("detail"); }} />}
    {!newOpen && selected && <PurchasePanel order={selected} mode={mode} onMode={setMode} onClose={() => setSelectedId(null)} />}
  </div>;
}
