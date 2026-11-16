/** Quantidade com 3 casas e custo em centavos, como nas colunas do Royal. */
export function totalItemCompra(quantidade: number, custo: number): number {
  return Math.round(Math.round(quantidade * 1000) * Math.round(custo * 100) / 1000) / 100;
}
export function saldoItemCompra(quantidade: number, recebido: number): number {
  return Math.max(0, Math.round((quantidade - recebido) * 1000) / 1000);
}
