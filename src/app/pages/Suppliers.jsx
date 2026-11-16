import { useEffect, useMemo, useState } from "react";
import { useDeleteFornecedor, useFornecedores, useUpsertFornecedor } from "@/hooks/useFornecedores";
import { maskCpfCnpj, maskPhone } from "@/lib/utils";
import { Icon, Modal } from "../../config/ui.jsx";
import { EmptyState, Field, GreenButton, PageHeader, SearchInput, SidePanel, Toolbar } from "../Shell.jsx";
import { semAcento, useStore } from "../store.jsx";
import "./Suppliers.css";

const blank = { razao_social: "", cnpj: "", telefone: "", email: "", endereco: "", condicoes_comerciais_padrao: "" };

function SupplierForm({ supplier, onClose }) {
  const { notify } = useStore();
  const save = useUpsertFornecedor();
  const remove = useDeleteFornecedor();
  const [initial] = useState(() => Object.fromEntries(Object.keys(blank).map(key => [key, supplier?.[key] ?? ""])));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [confirmation, setConfirmation] = useState(null);
  const busy = save.isPending || remove.isPending;
  const dirty = JSON.stringify(initial) !== JSON.stringify(values);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const set = (key, value) => setValues(current => ({ ...current, [key]: value }));
  function close() { if (!busy && !confirmation) { if (dirty) setConfirmation("discard"); else onClose(); } }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = {};
    if (!values.razao_social.trim()) nextErrors.razao_social = "Informe a razão social ou o nome do fornecedor.";
    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = "Informe um e-mail válido.";
    const document = values.cnpj.replace(/\D/g, "");
    if (document && ![11, 14].includes(document.length)) nextErrors.cnpj = "Informe 11 dígitos para CPF ou 14 para CNPJ.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      await save.mutateAsync({
        ...(supplier ? { id: supplier.id } : {}),
        razao_social: values.razao_social.trim(),
        ...Object.fromEntries(Object.keys(blank).filter(key => key !== "razao_social").map(key => [key, values[key].trim() || null])),
      });
      notify(supplier ? "Fornecedor atualizado" : "Fornecedor cadastrado");
      onClose();
    } catch (error) { notify(error.message || "Não foi possível salvar o fornecedor.", "danger"); }
  }
  async function deleteSupplier() {
    if (busy || !supplier) return;
    try { await remove.mutateAsync(supplier.id); notify("Fornecedor excluído"); onClose(); }
    catch (error) { notify(error.message || "Não foi possível excluir o fornecedor.", "danger"); setConfirmation(null); }
  }
  return (
    <>
      <SidePanel title={supplier ? "Editar fornecedor" : "Novo fornecedor"} width={480} onClose={close} footer={<><button type="button" className="kbtn kbtn--outline" onClick={close} disabled={busy}>Cancelar</button><button type="submit" form="supplier-form" className="kbtn kbtn--primary" disabled={busy}>{save.isPending ? "Salvando…" : "Salvar fornecedor"}</button></>}>
        <form id="supplier-form" className="supplier-form" onSubmit={submit} noValidate aria-busy={busy}>
          <Field label="Razão social / nome *" legend value={values.razao_social} onChange={value => set("razao_social", value)} error={errors.razao_social} disabled={busy} />
          <div className="two"><Field label="CPF / CNPJ" legend value={values.cnpj} inputMode="numeric" onChange={value => set("cnpj", maskCpfCnpj(value))} error={errors.cnpj} disabled={busy} /><Field label="Telefone" legend type="tel" value={values.telefone} onChange={value => set("telefone", maskPhone(value))} disabled={busy} /></div>
          <Field label="E-mail" legend type="email" value={values.email} onChange={value => set("email", value)} error={errors.email} disabled={busy} />
          <Field label="Endereço" legend multiline rows={2} value={values.endereco} onChange={value => set("endereco", value)} disabled={busy} />
          <Field label="Condições comerciais" legend multiline rows={3} value={values.condicoes_comerciais_padrao} onChange={value => set("condicoes_comerciais_padrao", value)} disabled={busy} />
          <p className="supplier-note">Registre prazos, formas de pagamento e condições combinadas para as próximas compras.</p>
          {supplier && <button type="button" className="kbtn kbtn--link supplier-delete" onClick={() => setConfirmation("delete")} disabled={busy}><Icon name="trash" size={16} /> Excluir fornecedor</button>}
        </form>
      </SidePanel>
      {confirmation && <Modal title={confirmation === "delete" ? "Excluir fornecedor?" : "Descartar alterações?"} onClose={() => !busy && setConfirmation(null)} actions={<><button type="button" className="kbtn kbtn--outline" disabled={busy} onClick={() => setConfirmation(null)}>{confirmation === "delete" ? "Cancelar" : "Continuar editando"}</button><button type="button" className="kbtn kbtn--primary" disabled={busy} onClick={confirmation === "delete" ? deleteSupplier : onClose}>{remove.isPending ? "Excluindo…" : confirmation === "delete" ? "Excluir fornecedor" : "Descartar alterações"}</button></>}><p>{confirmation === "delete" ? `O cadastro de “${supplier.razao_social}” será excluído. Fornecedores vinculados a produtos, compras ou contas não podem ser excluídos.` : "As alterações ainda não foram salvas. Deseja descartá-las?"}</p></Modal>}
    </>
  );
}

export default function Suppliers() {
  const query = useFornecedores();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const suppliers = useMemo(() => {
    const term = semAcento(search);
    const digits = search.replace(/\D/g, "");
    return (query.data ?? []).filter(item => !term || [item.razao_social, item.cnpj, item.telefone, item.email, item.endereco].some(value => semAcento(value).includes(term)) || (digits && /^[-+()./\d\s]+$/.test(search) && [item.cnpj, item.telefone].some(value => (value ?? "").replace(/\D/g, "").includes(digits))));
  }, [query.data, search]);
  return (
    <div className="page page--suppliers">
      <PageHeader title="Fornecedores" count={query.data?.length} />
      <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Nome, CPF/CNPJ, telefone ou e-mail" width={420} /><div className="toolbar__spacer" /><GreenButton label="Novo fornecedor" onClick={() => setEditing("new")} /></Toolbar>
      {query.isError ? <div className="alert supplier-error" role="alert"><span>Não foi possível carregar os fornecedores. {query.error.message}</span><button type="button" className="kbtn kbtn--outline" onClick={() => query.refetch()}>Tentar novamente</button></div> : query.isLoading ? <p className="ktable__empty" role="status">Carregando fornecedores…</p> : suppliers.length === 0 ? <EmptyState title={search ? "Nenhum fornecedor encontrado" : "Cadastre seu primeiro fornecedor"} text={search ? "Tente outro nome, documento ou contato." : "Organize os contatos e as condições comerciais das suas compras."} help={false} size="sm" /> : (
        <div className="ktable supplier-table">
          <div className="ktable__head supplier-row"><span>Fornecedor</span><span>CPF / CNPJ</span><span>Telefone</span><span>E-mail</span><span /></div>
          {suppliers.map(supplier => <button type="button" className="ktable__row supplier-row" key={supplier.id} onClick={() => setEditing(supplier)} aria-label={`Editar fornecedor ${supplier.razao_social}`}><span><strong>{supplier.razao_social}</strong><small>{supplier.endereco || ""}</small></span><span>{supplier.cnpj || "—"}</span><span>{supplier.telefone || "—"}</span><span>{supplier.email || "—"}</span><Icon name="chevronRight" size={16} /></button>)}
        </div>
      )}
      {editing && <SupplierForm key={editing === "new" ? "new" : editing.id} supplier={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
