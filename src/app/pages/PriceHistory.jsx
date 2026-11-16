import { useHistoricoPreco } from "@/hooks/useProdutos";
import { fmtDateTime, useMoney } from "../store.jsx";

/** Mudanças de preço de venda gravadas em `historico_preco` (Royal e Kyte gravam igual). */
export function PriceHistory({ productId }) {
  const money = useMoney();
  const q = useHistoricoPreco(productId);
  if (q.isLoading) return <p className="ops-note">Carregando…</p>;
  if (q.isError) return <p className="alert">{q.error.message}</p>;
  if (!q.data?.length) return <p className="ops-note">Nenhuma mudança de preço registrada.</p>;
  return (
    <ul className="price-hist">
      {q.data.map((h) => {
        const pct = Number(h.variacao_pct ?? 0);
        return (
          <li key={h.id}>
            <span>
              <strong>
                {money(Number(h.preco_anterior))} → {money(Number(h.preco_novo))}
              </strong>
              <small>
                {fmtDateTime(new Date(h.created_at).getTime())}
                {h.usuario?.nome ? ` · ${h.usuario.nome}` : ""}
                {h.justificativa ? ` · ${h.justificativa}` : ""}
              </small>
            </span>
            <span className={pct > 0 ? "ktag ktag--red" : pct < 0 ? "ktag ktag--green" : "ktag ktag--gray"}>
              {pct > 0 ? "+" : ""}
              {pct.toFixed(1).replace(".", ",")}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}
