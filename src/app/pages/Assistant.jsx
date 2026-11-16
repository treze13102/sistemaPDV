import { useEffect, useRef, useState } from "react";
import { Icon } from "../../config/ui.jsx";
import { PageHeader } from "../Shell.jsx";
import { ArtKite } from "../Art.jsx";
import { PAYMENT_METHODS } from "../seed.js";
import { useMoney, useStore } from "../store.jsx";
import { stockState } from "./Products.jsx";

const SUGGESTIONS = ["Quanto vendi hoje?", "Quanto vendi nos últimos 7 dias?", "Qual o produto mais vendido?", "Quais produtos estão acabando?", "Quem são meus melhores clientes?", "Qual a forma de pagamento mais usada?"];

/** Answers simple questions from the store's own data (a local stand-in for the AI assistant). */
function answer(q, data, money) {
  const t = q.toLowerCase();
  const closed = data.sales.filter((s) => s.status === "closed");
  const since = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime() - (days - 1) * 86400000;
  };
  const sum = (l) => l.reduce((s, x) => s + x.total, 0);
  if (/hoje/.test(t)) {
    const l = closed.filter((s) => s.createdAt >= since(1));
    return `Hoje você fez ${l.length} venda(s), somando ${money(sum(l))}.`;
  }
  if (/(semana|7 dias)/.test(t)) {
    const l = closed.filter((s) => s.createdAt >= since(7));
    return `Nos últimos 7 dias: ${l.length} vendas, ${money(sum(l))} de faturamento e ticket médio de ${money(l.length ? sum(l) / l.length : 0)}.`;
  }
  if (/(mês|mes|30 dias)/.test(t)) {
    const l = closed.filter((s) => s.createdAt >= since(30));
    return `Nos últimos 30 dias: ${l.length} vendas, ${money(sum(l))} de faturamento.`;
  }
  if (/(mais vendido|campeão|top)/.test(t)) {
    const m = {};
    closed.forEach((s) => s.items.forEach((i) => (m[i.name] = (m[i.name] || 0) + i.qty)));
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return top.length ? `Os mais vendidos: ${top.map(([n, q2], i) => `${i + 1}. ${n} (${q2} un.)`).join(", ")}.` : "Ainda não há vendas.";
  }
  if (/(estoque|acabando|falta)/.test(t)) {
    const low = data.products.filter((p) => ["OUT_OF_STOCK", "BELOW_MIN"].includes(stockState(p).id));
    return low.length ? `Atenção a: ${low.map((p) => `${p.name} (${p.stock} un.)`).join(", ")}.` : "Nenhum produto com estoque baixo. 👍";
  }
  if (/client/.test(t)) {
    const m = {};
    closed.filter((s) => s.customerId).forEach((s) => (m[s.customerId] = (m[s.customerId] || 0) + s.total));
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return top.length ? `Seus melhores clientes: ${top.map(([id, v]) => `${data.customers.find((c) => c.id === id)?.name} (${money(v)})`).join(", ")}.` : "Ainda não há vendas com cliente.";
  }
  if (/(pagamento|pix|cartão|cartao|dinheiro)/.test(t)) {
    const m = {};
    closed.forEach((s) => (m[s.payments[0]?.method] = (m[s.payments[0]?.method] || 0) + 1));
    const [id, n] = Object.entries(m).sort((a, b) => b[1] - a[1])[0] || [];
    return id ? `A forma mais usada é ${PAYMENT_METHODS.find((x) => x.id === id)?.label} (${n} vendas).` : "Ainda não há vendas.";
  }
  return "Posso responder sobre vendas (hoje, 7 ou 30 dias), produtos mais vendidos, estoque baixo, melhores clientes e formas de pagamento.";
}

export default function Assistant() {
  const { data } = useStore();
  const money = useMoney();
  // The original shows a Prime paywall; here "Assinar o Prime" opens a local demo of the assistant.
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("pdv.kai") === "1");
  const [msgs, setMsgs] = useState([{ from: "kai", text: "Olá! Sou o Kai, seu assistente. Pergunte sobre suas vendas, produtos e clientes." }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, typing]);
  const ask = (q) => {
    if (!q.trim() || typing) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { from: "kai", text: answer(q, data, money) }]);
      setTyping(false);
    }, 600);
  };
  if (!unlocked) {
    return (
      <div className="page">
        <PageHeader title="Kai" />
        <div className="kai-lock">
          <ArtKite />
          <h2>Conecte-se ao poder dos seus dados</h2>
          <p>Tenha conversas inteligentes e tire insights valiosos para o seu negócio</p>
          <p>
            <strong>Assine o Prime e experimente.</strong>
          </p>
          <button
            type="button"
            className="kai-lock__btn"
            onClick={() => {
              sessionStorage.setItem("pdv.kai", "1");
              setUnlocked(true);
            }}
          >
            Assinar o Prime
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="page page--chat">
      <PageHeader title="Kai" />
      <div className="chat">
        <div className="chat__msgs">
          {msgs.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.from}`}>
              {m.from === "kai" && (
                <span className="bubble__avatar">
                  <Icon name="kai" size={16} color="#fff" />
                </span>
              )}
              <p>{m.text}</p>
            </div>
          ))}
          {typing && (
            <div className="bubble bubble--kai">
              <span className="bubble__avatar">
                <Icon name="kai" size={16} color="#fff" />
              </span>
              <p className="typing">
                <span />
                <span />
                <span />
              </p>
            </div>
          )}
          <div ref={end} />
        </div>
        <div className="chat__suggestions">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => ask(s)}>
              {s}
            </button>
          ))}
        </div>
        <form
          className="chat__input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Pergunte algo ao Kai" aria-label="Mensagem" />
          <button type="submit" className="kbtn kbtn--primary chat__send" aria-label="Enviar">
            <Icon name="send" size={16} color="#fff" />
          </button>
        </form>
      </div>
    </div>
  );
}
