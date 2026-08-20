-- Taxa da adquirente nos recebíveis de cartão.
-- `valor` passa a ser o líquido (o que efetivamente cai na conta) para que a
-- projeção de caixa não fique otimista; o bruto e a taxa ficam registrados ao
-- lado para conferência e para o cálculo do "recebido à vista" continuar certo.
alter table public.parcelas_financeiras
  add column if not exists valor_bruto numeric(12,2),
  add column if not exists taxa_percentual numeric(6,3) not null default 0,
  add column if not exists taxa_valor numeric(12,2) not null default 0;

comment on column public.parcelas_financeiras.valor_bruto is
  'Valor da parcela antes da taxa da adquirente. Igual a `valor` quando não há taxa.';
comment on column public.parcelas_financeiras.taxa_percentual is
  'Percentual retido pela adquirente aplicado nesta parcela.';
comment on column public.parcelas_financeiras.taxa_valor is
  'Valor em reais retido pela adquirente (valor_bruto - valor).';

-- Parcelas já existentes não tinham taxa: o bruto é o próprio valor.
update public.parcelas_financeiras
set valor_bruto = valor
where valor_bruto is null;
