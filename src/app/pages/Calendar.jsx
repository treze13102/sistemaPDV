import { useMemo, useState } from "react";
import { useAgendaFinanceira, useProjecaoRecebiveis } from "@/hooks/useFluxoCaixa";
import { FORMA_LABEL, isoDate } from "@/lib/recebiveis";
import { Icon } from "../../config/ui.jsx";
import { PageHeader, SecaoTabs, TextAction, Toolbar } from "../Shell.jsx";
import { fmtDia, useMoney } from "../store.jsx";
import { navigate } from "../router.jsx";
import "./Calendar.css";
import SettlementDialog from "../components/SettlementDialog.jsx";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const statusLabel = (entry, today) => {
  if (entry.status === "PAGA") return entry.tipo === "RECEBER" ? "Recebido" : "Pago";
  if (entry.data_vencimento < today && entry.saldo > 0) return "Atrasado";
  return entry.status === "PARCIAL" ? "Parcial" : "Em aberto";
};

function QueryError({ query, label }) {
  return (
    <div className="alert calendar-error" role="alert">
      <span>{label} {query.error?.message}</span>
      <button type="button" className="kbtn kbtn--outline kbtn--small" disabled={query.isFetching} onClick={() => query.refetch()}>
        {query.isFetching ? "Tentando…" : "Tentar novamente"}
      </button>
    </div>
  );
}

export default function Calendar() {
  const money = useMoney();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selected, setSelected] = useState(() => isoDate(new Date()));
  const [settlement, setSettlement] = useState(null);
  const first = isoDate(month);
  const last = isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const today = isoDate(new Date());
  const agenda = useAgendaFinanceira(first, last);
  const projection = useProjecaoRecebiveis(12);
  const days = agenda.data ?? [];
  const months = projection.data ?? [];
  const ready = !agenda.isLoading && !agenda.isError;
  const byDay = useMemo(() => new Map((agenda.data ?? []).map((day) => [day.data, day])), [agenda.data]);
  const totals = days.reduce((sum, day) => ({ receive: sum.receive + day.receber, pay: sum.pay + day.pagar }), { receive: 0, pay: 0 });
  const detail = byDay.get(selected);
  const cells = useMemo(() => {
    const offset = month.getDay();
    const length = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + length) / 7) * 7 }, (_, index) => {
      const day = index - offset + 1;
      return day > 0 && day <= length ? isoDate(new Date(month.getFullYear(), month.getMonth(), day)) : null;
    });
  }, [month]);
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const maxValue = Math.max(1, ...months.flatMap((item) => [item.receber, item.pagar]));
  const horizon = months.reduce((sum, item) => sum + item.receber, 0);

  function changeMonth(date, day = null) {
    setMonth(monthStart(date));
    setSelected(day ?? isoDate(monthStart(date)));
  }

  return (
    <div className="page page--calendar">
      <PageHeader title="Finanças" />
      <div className="fin-tabs"><SecaoTabs secao="finances" value="calendar" /></div>
      <Toolbar>
        <div className="winnav calendar-nav">
          <button type="button" aria-label="Mês anterior" onClick={() => changeMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
            <Icon name="chevronLeft" size={20} />
          </button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button type="button" aria-label="Próximo mês" onClick={() => changeMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        <button type="button" className="kbtn kbtn--outline kbtn--small" onClick={() => changeMonth(new Date(), today)}>Hoje</button>
        <div className="toolbar__spacer" />
        <TextAction icon="wallet" label="Ver finanças" onClick={() => navigate("/finances/")} />
      </Toolbar>

      <div className="calendar-summary" aria-busy={agenda.isLoading}>
        {[
          ["A receber no mês", totals.receive, "calendar-positive"],
          ["A pagar no mês", totals.pay, "calendar-negative"],
          ["Saldo previsto do mês", totals.receive - totals.pay, totals.receive >= totals.pay ? "calendar-positive" : "calendar-negative"],
        ].map(([label, value, color]) => (
          <section className="calendar-summary__card" key={label}>
            <span>{label}</span>
            <strong className={color}>{ready ? money(value) : "—"}</strong>
          </section>
        ))}
      </div>
      <p className="calendar-note">Valores restantes em aberto, já descontadas as taxas de cartão e as baixas parciais. O saldo previsto é a diferença entre entradas e saídas.</p>

      {agenda.isError ? <QueryError query={agenda} label="Não foi possível carregar os vencimentos." /> : agenda.isLoading ? (
        <div className="calendar-card calendar-state" role="status">Carregando vencimentos…</div>
      ) : (
        <div className="calendar-layout">
          <section className="calendar-card" aria-label={`Vencimentos de ${monthLabel}`}>
            <div className="calendar-card__heading">
              <h2>Vencimentos por dia</h2>
              <div className="calendar-legend"><span className="calendar-positive">+ A receber</span><span className="calendar-negative">− A pagar</span></div>
            </div>
            <div className="calendar-grid">
              {WEEKDAYS.map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
              {cells.map((date, index) => {
                if (!date) return <div className="calendar-blank" key={`empty-${index}`} aria-hidden="true" />;
                const day = byDay.get(date);
                const pending = day?.lancamentos.filter((entry) => entry.saldo > 0).length ?? 0;
                return (
                  <button
                    type="button"
                    key={date}
                    className={`calendar-day${date === selected ? " is-selected" : ""}${date === today ? " is-today" : ""}`}
                    aria-pressed={date === selected}
                    aria-current={date === today ? "date" : undefined}
                    aria-label={`${fmtDia(date)}. A receber: ${money(day?.receber ?? 0)}. A pagar: ${money(day?.pagar ?? 0)}. ${pending} em aberto.`}
                    onClick={() => setSelected(date)}
                  >
                    <strong className="calendar-day__number">{Number(date.slice(8))}</strong>
                    {day?.receber > 0 && <span className="calendar-positive">+{money(day.receber)}</span>}
                    {day?.pagar > 0 && <span className="calendar-negative">−{money(day.pagar)}</span>}
                    {!!day?.lancamentos.length && <small>{pending ? `${pending} em aberto` : "Liquidado"}</small>}
                  </button>
                );
              })}
            </div>
            {!days.length && <p className="calendar-note">Nenhum lançamento com vencimento neste mês.</p>}
          </section>

          <section className="calendar-card calendar-detail" aria-label={`Lançamentos de ${fmtDia(selected)}`}>
            <div className="calendar-card__heading"><h2>{fmtDia(selected)}</h2><span>{detail?.lancamentos.length ?? 0} lançamento(s)</span></div>
            {!detail?.lancamentos.length ? <p className="calendar-state">Nenhum vencimento neste dia. Selecione outro dia no calendário.</p> : (
              <>
                <div className="calendar-detail__totals"><span className="calendar-positive">A receber <strong>{money(detail.receber)}</strong></span><span className="calendar-negative">A pagar <strong>{money(detail.pagar)}</strong></span></div>
                <ul className="calendar-entries">
                  {detail.lancamentos.map((entry) => (
                    <li key={entry.id}>
                      <div className="calendar-entry__top">
                        <strong>{entry.descricao}</strong>
                        <span className={entry.tipo === "RECEBER" ? "calendar-positive" : "calendar-negative"}>{entry.tipo === "RECEBER" ? "+" : "−"}{money(entry.saldo)}</span>
                      </div>
                      {entry.cliente_nome && <span>{entry.cliente_nome}</span>}
                      {entry.fornecedor_nome && <span>{entry.fornecedor_nome}</span>}
                      <div className="calendar-entry__meta">
                        <span>{entry.tipo === "RECEBER" ? "A receber" : "A pagar"}{entry.forma_pagamento ? ` · ${FORMA_LABEL[entry.forma_pagamento] ?? entry.forma_pagamento}` : ""}</span>
                        {entry.total_parcelas > 0 && <span>Parcela {entry.numero_parcela}/{entry.total_parcelas}</span>}
                        <span className={`ktag ${entry.status === "PAGA" ? "ktag--green" : entry.saldo > 0 && entry.data_vencimento < today ? "ktag--red" : "ktag--gray"}`}>{statusLabel(entry, today)}</span>
                      </div>
                      {entry.valor_pago > 0 && <small>Valor {money(entry.valor)} · Baixado {money(entry.valor_pago)}</small>}
                      {entry.saldo > 0 && entry.status !== "CANCELADA" && <button type="button" className="kbtn kbtn--small kbtn--primary calendar-entry__settle" onClick={() => setSettlement({ ...entry })}>{entry.tipo === "RECEBER" ? "Receber" : "Pagar"}</button>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}

      <section className="calendar-card calendar-projection">
        <div className="calendar-card__heading"><div><h2>Projeção dos próximos 12 meses</h2><p>Contas em aberto a partir do mês atual. O acumulado parte de zero e não representa o saldo bancário.</p></div>{!projection.isLoading && !projection.isError && <span>A receber no período <strong className="calendar-positive">{money(horizon)}</strong></span>}</div>
        {projection.isError ? <QueryError query={projection} label="Não foi possível carregar a projeção." /> : projection.isLoading ? <p className="calendar-state" role="status">Carregando projeção…</p> : (
          <>
            {!months.some((item) => item.receber > 0 || item.pagar > 0) && <p className="calendar-note">Nenhuma conta em aberto nos próximos 12 meses.</p>}
            <div className="calendar-projection__list">
              {months.map((item) => (
                <button type="button" key={item.mes} className={`calendar-month${item.mes === first.slice(0, 7) ? " is-selected" : ""}`} aria-pressed={item.mes === first.slice(0, 7)} aria-label={`Ver ${item.label}`} onClick={() => changeMonth(new Date(`${item.inicio}T00:00:00`))}>
                  <div className="calendar-month__top"><strong>{item.label}</strong>{item.vencido && <span className="ktag ktag--red">Há atrasados</span>}<span className={`calendar-month__balance ${item.acumulado >= 0 ? "calendar-positive" : "calendar-negative"}`}>Acumulado {money(item.acumulado)}</span></div>
                  <div className="calendar-month__values"><span className="calendar-positive">A receber {money(item.receber)}</span><span className="calendar-negative">A pagar {money(item.pagar)}</span><span>Saldo do mês {money(item.liquido)}</span></div>
                  <div className="calendar-bars" aria-hidden="true"><span><i style={{ width: `${item.receber / maxValue * 100}%` }} /></span><span><i style={{ width: `${item.pagar / maxValue * 100}%` }} /></span></div>
                  {!!item.porForma.length && <div className="calendar-month__methods">{item.porForma.map((method) => <span key={method.forma}>{FORMA_LABEL[method.forma] ?? "Outros"}: <strong>{money(method.valor)}</strong></span>)}</div>}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
      {settlement && <SettlementDialog key={settlement.id} entry={settlement} onClose={() => setSettlement(null)} />}
    </div>
  );
}
