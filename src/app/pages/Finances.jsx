import { useMemo, useState } from "react";
import { Icon } from "../../config/ui.jsx";
import { ArtArrowUp, ArtCalcReceipt, ArtClipboard, ArtJar, ArtTelescope } from "../Art.jsx";
import { SecaoTabs, Field, GreenButton, PageHeader, PillTabs, SearchInput, SidePanel, Switch, TextAction, Toolbar } from "../Shell.jsx";
import { fmtDia, parseMoney, semAcento, useMoney, useStore } from "../store.jsx";
import { navigate } from "../router.jsx";
import { useBaixarParcela, useDeleteParcela, useParcelas, useUpsertParcela } from "@/hooks/useFinanceiro";
import { useFornecedores } from "@/hooks/useFornecedores";

// Categorias do Kyte gravadas como origem do lançamento no Royal.
const ORIGENS = [
  { id: "DESPESA_FIXA", label: "Despesa fixa" },
  { id: "DESPESA_VARIAVEL", label: "Despesa variável" },
  { id: "COMPRA", label: "Compra / fornecedor" },
  { id: "IMPOSTO", label: "Imposto" },
  { id: "COMISSAO", label: "Comissão" },
];
const CENTROS = ["Loja", "Producao3D", "Administrativo", "Marketing"];
const rotuloOrigem = (o) => ORIGENS.find((x) => x.id === o)?.label ?? (o === "VENDA" ? "Venda" : o);

const iso = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const hoje = () => iso(new Date());
const somarDias = (s, n) => {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const emAberto = (p) => p.status !== "PAGA" && p.status !== "CANCELADA";
const restante = (p) => +(Number(p.valor) - Number(p.valor_pago || 0)).toFixed(2);
const quem = (p) => p.fornecedor?.razao_social || p.cliente?.nome || "";

function AddOutflow({ tipo, onClose }) {
  const { notify } = useStore();
  const salvar = useUpsertParcela();
  const { data: fornecedores = [] } = useFornecedores();
  const [v, setV] = useState({ paid: false, value: "", due: hoje(), origem: "DESPESA_VARIAVEL", centro: "Loja", name: "", fornecedor: "", note: "", repeat: false, every: "monthly", times: "3" });
  const [busy, setBusy] = useState(false);
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const value = parseMoney(v.value);
  const receber = tipo === "RECEBER";

  const add = async () => {
    const n = v.repeat ? Math.max(1, Math.min(60, Number(v.times) || 1)) : 1;
    setBusy(true);
    try {
      for (let k = 0; k < n; k++) {
        const d = new Date(`${v.due}T12:00:00`);
        if (v.every === "monthly") d.setMonth(d.getMonth() + k);
        else d.setDate(d.getDate() + 7 * k);
        const pago = k === 0 && v.paid;
        await salvar.mutateAsync({
          tipo,
          origem_tipo: receber ? "VENDA" : v.origem,
          descricao: (v.name.trim() || rotuloOrigem(v.origem)) + (n > 1 ? ` (${k + 1}/${n})` : ""),
          valor: value,
          data_emissao: hoje(),
          data_vencimento: iso(d),
          valor_pago: pago ? value : 0,
          data_pagamento: pago ? hoje() : null,
          status: pago ? "PAGA" : "ABERTA",
          centro_custo: v.centro,
          fornecedor_id: !receber && v.fornecedor ? v.fornecedor : null,
          observacao: v.note.trim() || null,
          numero_parcela: n > 1 ? k + 1 : null,
          total_parcelas: n > 1 ? n : null,
        });
      }
      notify(n > 1 ? `${n} lançamentos adicionados` : "Lançamento adicionado");
      onClose();
    } catch (e) {
      notify(e.message, "danger");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SidePanel
      title={receber ? "Adicionar conta a receber" : "Adicionar saída"}
      onClose={() => !busy && onClose()}
      width={420}
      footer={
        <>
          <button type="button" className="kbtn kbtn--outline" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="kbtn kbtn--primary" disabled={value <= 0 || busy} onClick={add}>
            {busy ? "Salvando..." : "Adicionar"}
          </button>
        </>
      }
    >
      <div className="outflow">
        <div className="outflow__top">
          <div className="seg2">
            <button type="button" className={!v.paid ? "is-active" : ""} onClick={() => set("paid", false)}>
              {receber ? "A receber" : "A pagar"}
            </button>
            <button type="button" className={v.paid ? "is-active" : ""} onClick={() => set("paid", true)}>
              {receber ? "Recebido" : "Pago"}
            </button>
          </div>
          <label className="outflow__value">
            <span>Valor</span>
            <input inputMode="decimal" value={v.value} placeholder="R$ 0,00" autoFocus onChange={(e) => set("value", e.target.value.replace(/[^\d.,]/g, ""))} />
          </label>
          <div className="outflow__row">
            <label>
              <span>Vencimento</span>
              <input type="date" value={v.due} onChange={(e) => set("due", e.target.value)} />
            </label>
            {!receber && (
              <label>
                <span>Categoria</span>
                <select value={v.origem} onChange={(e) => set("origem", e.target.value)}>
                  {ORIGENS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
        <div className="outflow__more">
          <h4>Mais informações</h4>
          <Field label="Descrição" value={v.name} onChange={(x) => set("name", x)} />
          {!receber && (
            <label className="kselect-wrap">
              <select className="kselect" value={v.fornecedor} onChange={(e) => set("fornecedor", e.target.value)}>
                <option value="">Fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.razao_social}</option>
                ))}
              </select>
            </label>
          )}
          <label className="kselect-wrap">
            <select className="kselect" value={v.centro} onChange={(e) => set("centro", e.target.value)}>
              {CENTROS.map((c) => (
                <option key={c} value={c}>Centro de custo: {c === "Producao3D" ? "Produção 3D" : c}</option>
              ))}
            </select>
          </label>
          <Field label="Observações" value={v.note} multiline rows={2} onChange={(x) => set("note", x)} />
          <div className="repeat">
            <span>Repetir lançamento</span>
            <Switch checked={v.repeat} onChange={(x) => set("repeat", x)} label="Repetir lançamento" />
          </div>
          {v.repeat && (
            <div className="two">
              <label className="kselect-wrap">
                <select className="kselect" value={v.every} onChange={(e) => set("every", e.target.value)}>
                  <option value="monthly">Todo mês</option>
                  <option value="weekly">Toda semana</option>
                </select>
              </label>
              <Field label="Quantas vezes" value={v.times} inputMode="numeric" onChange={(x) => set("times", x.replace(/\D/g, ""))} />
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
}

function Bucket({ title, items, art, emptyTitle, emptyText, money, onPay, verbo }) {
  return (
    <section className="bucket">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <div className="bucket__empty">
          {art}
          <strong>{emptyTitle}</strong>
          <span>{emptyText}</span>
        </div>
      ) : (
        <ul className="bucket__list">
          {items.map((f) => (
            <li key={f.id}>
              <span>
                <strong>{f.descricao}</strong>
                <small>
                  {fmtDia(f.data_vencimento)} · {quem(f) || rotuloOrigem(f.origem_tipo)}
                </small>
              </span>
              <strong>{money(restante(f))}</strong>
              <button type="button" className="kbtn kbtn--small kbtn--primary" onClick={() => onPay(f)}>
                {verbo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TABS = [
  { id: "payables", label: "CONTAS A PAGAR" },
  { id: "receivables", label: "A RECEBER" },
  { id: "expenses", label: "LANÇAMENTOS" },
];

export default function Finances({ sub }) {
  const tab = TABS.some((t) => t.id === sub) ? sub : "receivables";
  const { notify } = useStore();
  const money = useMoney();
  const [adding, setAdding] = useState(null);
  const [win, setWin] = useState(0);
  const [q, setQ] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [tipoLista, setTipoLista] = useState("PAGAR");
  const baixar = useBaixarParcela();
  const excluir = useDeleteParcela();
  const t0 = hoje();

  // Buckets: tudo em aberto até 7 dias à frente (inclui atrasados antigos).
  const pagar = useParcelas({ tipo: "PAGAR", dataFim: somarDias(t0, 7) });
  const receber = useParcelas({ tipo: "RECEBER", dataFim: somarDias(t0, 7) });
  const inicio = somarDias(t0, win * 30);
  const fim = somarDias(inicio, 29);
  const lista = useParcelas({ tipo: tipoLista, dataInicio: inicio, dataFim: fim });

  const pay = async (f) => {
    try {
      await baixar.mutateAsync({ id: f.id, valor: Number(f.valor), valor_pago: Number(f.valor), valor_pago_anterior: Number(f.valor_pago), data_pagamento: t0 });
      notify(f.tipo === "PAGAR" ? "Conta marcada como paga" : "Recebimento registrado");
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const undo = async (f) => {
    try {
      await baixar.mutateAsync({ id: f.id, valor: Number(f.valor), valor_pago: 0, valor_pago_anterior: Number(f.valor_pago), data_pagamento: null });
      notify("Baixa desfeita");
    } catch (e) {
      notify(e.message, "danger");
    }
  };
  const remove = async (f) => {
    if (!window.confirm(`Excluir "${f.descricao}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await excluir.mutateAsync(f.id);
      notify("Lançamento excluído");
    } catch (e) {
      notify(e.message, "danger");
    }
  };

  const buckets = (res, verbo) => {
    const abertos = (res.data || []).filter(emAberto);
    const ok = verbo === "Pagar";
    return (
      <div className="buckets">
        <Bucket title="Atrasados" items={abertos.filter((f) => f.data_vencimento < t0)} art={<ArtClipboard />} emptyTitle="Bom trabalho!" emptyText={ok ? "Suas contas estão todas em dia" : "Nenhum cliente em atraso"} money={money} onPay={pay} verbo={verbo} />
        <Bucket title="Vence hoje" items={abertos.filter((f) => f.data_vencimento === t0)} art={<ArtJar />} emptyTitle="Dia calmo!" emptyText="Nada vence hoje" money={money} onPay={pay} verbo={verbo} />
        <Bucket title="Próximos 7 dias" items={abertos.filter((f) => f.data_vencimento > t0)} art={<ArtTelescope />} emptyTitle="Semana tranquila!" emptyText="Nada para os próximos dias" money={money} onPay={pay} verbo={verbo} />
      </div>
    );
  };

  const itens = useMemo(() => {
    const s = semAcento(q);
    return (lista.data || [])
      .filter((f) => f.status !== "CANCELADA")
      .filter((f) => !onlyOpen || emAberto(f))
      .filter((f) => !s || [f.descricao, quem(f), f.observacao].some((x) => semAcento(x || "").includes(s)));
  }, [lista.data, q, onlyOpen]);
  const total = itens.reduce((t, f) => t + Number(f.valor), 0);
  const carregando = (r) => r.isLoading && <p className="ktable__empty">Carregando...</p>;
  const erro = (r) => r.error && <div className="alert">{r.error.message}</div>;

  return (
    <div className="page">
      <PageHeader title="Finanças" />
      <div className="fin-tabs">
        <SecaoTabs secao="finances" value={tab} />
        {tab === "payables" && <GreenButton label="Saída" small onClick={() => setAdding("PAGAR")} />}
        {tab === "receivables" && <GreenButton label="A receber" small onClick={() => setAdding("RECEBER")} />}
      </div>
      {tab === "payables" && (
        <>
          {erro(pagar)}
          {carregando(pagar) || buckets(pagar, "Pagar")}
        </>
      )}
      {tab === "receivables" && (
        <>
          {erro(receber)}
          {carregando(receber) || buckets(receber, "Receber")}
        </>
      )}
      {tab === "expenses" && (
        <>
          <Toolbar>
            <div className="seg2">
              <button type="button" className={tipoLista === "PAGAR" ? "is-active" : ""} onClick={() => setTipoLista("PAGAR")}>A pagar</button>
              <button type="button" className={tipoLista === "RECEBER" ? "is-active" : ""} onClick={() => setTipoLista("RECEBER")}>A receber</button>
            </div>
            <div className="winnav">
              <button type="button" onClick={() => setWin((w) => w - 1)} aria-label="Período anterior">
                <Icon name="chevronLeft" size={18} color="#363f4d" strokeWidth={1.8} />
              </button>
              <span>{win === 0 ? "Próximos 30 dias" : `${fmtDia(inicio)} – ${fmtDia(fim)}`}</span>
              <button type="button" onClick={() => setWin((w) => w + 1)} aria-label="Próximo período">
                <Icon name="chevronRight" size={18} color="#363f4d" strokeWidth={1.8} />
              </button>
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Descrição, fornecedor ou cliente" width={250} />
            <TextAction icon="filter" label={onlyOpen ? "Só em aberto" : "Todos"} onClick={() => setOnlyOpen((o) => !o)} active={onlyOpen} />
            <div className="toolbar__spacer" />
            <GreenButton label="Lançamento" small onClick={() => setAdding(tipoLista)} />
          </Toolbar>
          {erro(lista)}
          {carregando(lista) ||
            (itens.length === 0 && !q && !onlyOpen ? (
              <div className="empty-wrap">
                <span className="empty-arrow empty-arrow--small"><ArtArrowUp /></span>
                <div className="empty empty--md">
                  <ArtCalcReceipt />
                  <h2 className="empty__title">Nada neste período</h2>
                  <p className="empty__text">Use as setas para ver outros meses.</p>
                </div>
              </div>
            ) : (
              <div className="ktable">
                <div className="ktable__head ktable__head--5">
                  <span>Lançamento</span>
                  <span>Categoria</span>
                  <span>Vencimento</span>
                  <span className="num">Valor ({money(total)})</span>
                  <span />
                </div>
                {itens.map((f) => {
                  const pago = f.status === "PAGA";
                  return (
                    <div key={f.id} className="ktable__row ktable__row--5">
                      <span>
                        <strong>{f.descricao}</strong>
                        <small>{[quem(f), f.bandeira, f.observacao].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span>{rotuloOrigem(f.origem_tipo)}</span>
                      <span>
                        {fmtDia(f.data_vencimento)}{" "}
                        {pago ? <span className="ktag ktag--green">{f.tipo === "PAGAR" ? "PAGO" : "RECEBIDO"}</span> : f.status === "PARCIAL" ? <span className="ktag ktag--gray">PARCIAL</span> : f.data_vencimento < t0 ? <span className="ktag ktag--red">ATRASADO</span> : <span className="ktag ktag--gray">EM ABERTO</span>}
                      </span>
                      <strong className="num">{money(Number(f.valor))}</strong>
                      <span className="row-actions">
                        <button type="button" className="kbtn kbtn--link" onClick={() => (pago ? undo(f) : pay(f))}>
                          {pago ? "Desfazer" : f.tipo === "PAGAR" ? "Pagar" : "Receber"}
                        </button>
                        {/* Parcelas de venda pertencem à venda: cancelar pela venda, não apagar aqui. */}
                        {(f.origem_tipo !== "VENDA" || !f.origem_id) && (
                          <button type="button" className="icon-btn" onClick={() => remove(f)} aria-label="Excluir">
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
                {!itens.length && <p className="ktable__empty">Nenhum lançamento encontrado.</p>}
              </div>
            ))}
        </>
      )}
      {adding && <AddOutflow tipo={adding} onClose={() => setAdding(null)} />}
    </div>
  );
}
