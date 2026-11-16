import { useState } from "react";
import { Field, GreenButton, PageHeader, PillTabs, SidePanel, Switch, Toolbar } from "../Shell.jsx";
import { useMoney, useStore } from "../store.jsx";
import { MODULOS, ehAdmin, matrizDe, podeModulo } from "../permissoes.js";

function UserPanel({ user, onClose }) {
  const { data, actions, notify } = useStore();
  const [v, setV] = useState({ id: user.id, name: user.name, perfilId: user.perfilId || "", active: user.active });
  const [busy, setBusy] = useState(false);
  const eu = data.acesso?.meuId === user.id;
  const perfil = data.perfis.find((p) => p.id === v.perfilId);
  const save = async () => {
    setBusy(true);
    try {
      await actions.saveUser(v);
      notify("Usuário atualizado");
      onClose();
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SidePanel
      title={user.name}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="kbtn kbtn--primary" onClick={save} disabled={busy || !v.name.trim()}>
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <Field label="Nome" value={v.name} onChange={(x) => setV((s) => ({ ...s, name: x }))} />
      <Field label="E-mail" value={user.email} disabled onChange={() => {}} />
      <label className="kselect-wrap">
        <select className="kselect" value={v.perfilId} onChange={(e) => setV((s) => ({ ...s, perfilId: e.target.value }))}>
          <option value="">Sem perfil (sem acesso)</option>
          {data.perfis.map((p) => (
            <option key={p.id} value={p.id}>
              Perfil: {p.nome}
            </option>
          ))}
        </select>
      </label>
      <div className="setrow">
        <span>
          <strong>Acesso ativo</strong>
          <small>{eu ? "Você não pode desativar a si mesmo" : "Inativo não consegue entrar no sistema"}</small>
        </span>
        <Switch checked={v.active} disabled={eu} onChange={(x) => setV((s) => ({ ...s, active: x }))} label="Acesso ativo" />
      </div>
      <section className="fgroup">
        <h4>O que este perfil libera</h4>
        {ehAdmin(perfil) ? (
          <p className="sp__text">Acesso total.</p>
        ) : (
          MODULOS.map((m) => (
            <label key={m.id} className="kcheck">
              <input type="checkbox" disabled checked={podeModulo(perfil, m.id)} readOnly />
              <span>{m.label}</span>
            </label>
          ))
        )}
      </section>
    </SidePanel>
  );
}

/** Chaves que só o Royal usa (ex.: "producao") são preservadas ao salvar. */
const extrasDoRoyal = (perfil) => Object.fromEntries(Object.entries(perfil?.matriz || {}).filter(([k]) => k !== "all" && !MODULOS.some((m) => m.id === k)));

function ProfilePanel({ perfil, onClose }) {
  const { data, actions, notify } = useStore();
  const [nome, setNome] = useState(perfil?.nome || "");
  const [todos, setTodos] = useState(ehAdmin(perfil));
  const [mods, setMods] = useState(MODULOS.filter((m) => podeModulo(perfil, m.id)).map((m) => m.id));
  const [busy, setBusy] = useState(false);
  const usando = perfil ? data.users.filter((u) => u.perfilId === perfil.id).length : 0;
  const toggle = (id) => setMods((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const run = async (fn, msg) => {
    setBusy(true);
    try {
      await fn();
      notify(msg);
      onClose();
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SidePanel
      title={perfil ? `Perfil ${perfil.nome}` : "Novo perfil"}
      onClose={() => !busy && onClose()}
      footer={
        <>
          {perfil && (
            <button type="button" className="kbtn kbtn--outline" disabled={busy} onClick={() => window.confirm(`Excluir o perfil ${perfil.nome}?`) && run(() => actions.deleteProfile(perfil.id), "Perfil excluído")}>
              Excluir
            </button>
          )}
          <button type="button" className="kbtn kbtn--primary" disabled={busy || !nome.trim()} onClick={() => run(() => actions.saveProfile({ id: perfil?.id, nome, matriz: todos ? matrizDe(mods, true) : { ...extrasDoRoyal(perfil), ...matrizDe(mods, false) } }), "Perfil salvo")}>
            {busy ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <Field label="Nome do perfil" value={nome} onChange={setNome} />
      {perfil && <p className="sp__text">{usando ? `${usando} usuário(s) com este perfil.` : "Nenhum usuário com este perfil."}</p>}
      <div className="setrow">
        <span>
          <strong>Acesso total</strong>
          <small>Inclui usuários, ajustes e tudo o que vier depois</small>
        </span>
        <Switch checked={todos} onChange={setTodos} label="Acesso total" />
      </div>
      {!todos && (
        <section className="fgroup">
          <h4>Telas liberadas</h4>
          {MODULOS.map((m) => (
            <label key={m.id} className="kcheck">
              <input type="checkbox" checked={mods.includes(m.id)} onChange={() => toggle(m.id)} />
              <span>{m.label}</span>
            </label>
          ))}
        </section>
      )}
    </SidePanel>
  );
}

export default function Users() {
  const { data } = useStore();
  const money = useMoney();
  const [tab, setTab] = useState("users");
  const [open, setOpen] = useState(null);
  const [perfilAberto, setPerfilAberto] = useState(null);
  const closed = data.sales.filter((s) => s.status === "closed");
  const total = closed.reduce((t, s) => t + s.total, 0);
  const nomePerfil = (id) => data.perfis.find((p) => p.id === id)?.nome || "Sem perfil";
  return (
    <div className="page">
      <PageHeader title="Usuários" />
      <div className="fin-tabs">
        <PillTabs tabs={[{ id: "users", label: "USUÁRIOS" }, { id: "profiles", label: "PERFIS E PERMISSÕES" }]} value={tab} onChange={setTab} />
        {tab === "profiles" && <GreenButton label="Perfil" small onClick={() => setPerfilAberto("new")} />}
      </div>
      {data.acesso?.semAdmin && (
        <div className="alert">Nenhum usuário ativo tem um perfil com acesso total, por isso todas as telas estão liberadas para todos. Defina um administrador para as permissões passarem a valer.</div>
      )}
      {tab === "users" ? (
        <>
          <Toolbar>
            <span className="sp__text">
              Para adicionar alguém, a pessoa cria a conta em <strong>{window.location.origin}/login/</strong> (Não tenho conta — cadastrar). Depois ela aparece aqui e você escolhe o perfil.
            </span>
          </Toolbar>
          <div className="utable">
            <div className="utable__head">
              <span>Nome</span>
              <span>Faturamento</span>
              <span>Vendas</span>
              <span>%</span>
            </div>
            {data.users.map((u) => {
              const mine = closed.filter((s) => s.userId === u.id);
              const rev = mine.reduce((t, s) => t + s.total, 0);
              return (
                <button key={u.id} type="button" className="utable__row" onClick={() => setOpen(u.id)}>
                  <span>
                    <strong>{u.name}</strong>
                    <small>
                      {u.email} · {nomePerfil(u.perfilId)}
                    </small>
                    {!u.active && <span className="ktag ktag--gray">INATIVO</span>}
                  </span>
                  <span>{rev ? money(rev) : "-"}</span>
                  <span>{mine.length || "-"}</span>
                  <span>{rev && total ? `${Math.round((rev / total) * 100)}%` : "-"}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="utable">
          <div className="utable__head">
            <span>Perfil</span>
            <span>Acesso</span>
            <span>Usuários</span>
            <span />
          </div>
          {data.perfis.map((p) => (
            <button key={p.id} type="button" className="utable__row" onClick={() => setPerfilAberto(p.id)}>
              <span>
                <strong>{p.nome}</strong>
              </span>
              <span>{ehAdmin(p) ? "Total" : `${MODULOS.filter((m) => podeModulo(p, m.id)).length} de ${MODULOS.length} áreas`}</span>
              <span>{data.users.filter((u) => u.perfilId === p.id).length}</span>
              <span />
            </button>
          ))}
        </div>
      )}
      {open && <UserPanel user={data.users.find((u) => u.id === open)} onClose={() => setOpen(null)} />}
      {perfilAberto && <ProfilePanel perfil={perfilAberto === "new" ? null : data.perfis.find((p) => p.id === perfilAberto)} onClose={() => setPerfilAberto(null)} />}
    </div>
  );
}
