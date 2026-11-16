import { useState } from "react";
import { useBaixarParcela } from "@/hooks/useFinanceiro";
import { isoDate } from "@/lib/recebiveis";
import { Modal } from "../../config/ui.jsx";
import { Field } from "../Shell.jsx";
import { fmtDia, parseMoney, useMoney, useStore } from "../store.jsx";

export default function SettlementDialog({ entry, onClose }) {
  const { notify } = useStore();
  const money = useMoney();
  const mutation = useBaixarParcela();
  const receiving = entry.tipo === "RECEBER";
  const balance = Math.max(0, Math.round((entry.valor - entry.valor_pago) * 100) / 100);
  const [amount, setAmount] = useState(() => balance.toFixed(2).replace(".", ","));
  const [date, setDate] = useState(() => isoDate(new Date()));
  const [error, setError] = useState("");
  const value = Math.round(parseMoney(amount) * 100) / 100;
  async function submit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!Number.isFinite(value) || value <= 0 || value > balance) { setError(`Informe um valor maior que zero e até ${money(balance)}.`); return; }
    if (!date) { setError("Informe a data da baixa."); return; }
    setError("");
    try {
      await mutation.mutateAsync({ id: entry.id, valor: entry.valor, valor_pago_anterior: entry.valor_pago, valor_pago: Math.round((entry.valor_pago + value) * 100) / 100, data_pagamento: date });
      notify(value < balance ? `${receiving ? "Recebimento" : "Pagamento"} parcial registrado` : receiving ? "Recebimento registrado" : "Pagamento registrado");
      onClose();
    } catch (failure) { setError(failure.message || "Não foi possível registrar a baixa. Seus valores foram mantidos."); }
  }
  return (
    <Modal title={receiving ? "Registrar recebimento" : "Registrar pagamento"} onClose={() => !mutation.isPending && onClose()} actions={<><button type="button" className="kbtn kbtn--outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</button><button type="submit" form="calendar-settlement" className="kbtn kbtn--primary" disabled={mutation.isPending}>{mutation.isPending ? "Registrando…" : "Confirmar baixa"}</button></>}>
      <form id="calendar-settlement" className="calendar-settlement" onSubmit={submit} noValidate>
        <strong>{entry.descricao}</strong>
        {(entry.cliente_nome || entry.fornecedor_nome) && <span>{entry.cliente_nome || entry.fornecedor_nome}</span>}
        <small>Vencimento: {fmtDia(entry.data_vencimento)}</small>
        <div className="calendar-settlement__summary"><span>Valor original<strong>{money(entry.valor)}</strong></span><span>Já baixado<strong>{money(entry.valor_pago)}</strong></span><span>Saldo em aberto<strong>{money(balance)}</strong></span></div>
        <Field label={receiving ? "Valor recebido agora" : "Valor pago agora"} legend inputMode="decimal" value={amount} onChange={setAmount} disabled={mutation.isPending} />
        <label className="calendar-settlement__date">{receiving ? "Data do recebimento" : "Data do pagamento"}<input type="date" value={date} onInput={event => setDate(event.currentTarget.value)} onChange={event => setDate(event.currentTarget.value)} disabled={mutation.isPending} required /></label>
        {value > 0 && value <= balance && <p className="calendar-note">Saldo após esta baixa: <strong>{money(balance - value)}</strong>{value < balance ? ". O restante continuará em aberto." : ". A conta ficará quitada."}</p>}
        {error && <p className="calendar-settlement__error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
