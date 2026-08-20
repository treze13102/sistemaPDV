-- Guarda a bandeira do cartão para que a taxa aplicada (e a taxa mostrada
-- depois, em relatórios) reflita o custo real por bandeira/adquirente.
alter table public.pagamentos_venda
  add column if not exists bandeira text;

alter table public.parcelas_financeiras
  add column if not exists bandeira text;

comment on column public.pagamentos_venda.bandeira is
  'Bandeira do cartão (mastercard, visa, elo, amex, cabal, outras) — nula para formas sem cartão.';
comment on column public.parcelas_financeiras.bandeira is
  'Bandeira usada para calcular a taxa desta parcela.';
