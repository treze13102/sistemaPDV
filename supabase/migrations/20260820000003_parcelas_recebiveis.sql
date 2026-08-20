-- Enriquece as parcelas financeiras para suportar o fluxo de recebíveis
-- gerado automaticamente pela venda (cartão parcelado e crediário).
alter table public.parcelas_financeiras
  add column if not exists numero_parcela int,
  add column if not exists total_parcelas int,
  add column if not exists forma_pagamento forma_pagamento;

comment on column public.parcelas_financeiras.numero_parcela is
  'Posição da parcela dentro do plano (1..total_parcelas).';
comment on column public.parcelas_financeiras.total_parcelas is
  'Quantidade total de parcelas do plano que originou esta parcela.';
comment on column public.parcelas_financeiras.forma_pagamento is
  'Forma de pagamento que originou o recebível (CARTAO_CREDITO, CREDIARIO, FIADO...).';

-- Consultas do calendário e da projeção de caixa filtram por vencimento + tipo.
create index if not exists idx_parcelas_venc_tipo
  on public.parcelas_financeiras(data_vencimento, tipo);

-- Entrada do crediário registrada na venda (paga no ato, não vira recebível).
alter table public.vendas
  add column if not exists entrada_valor numeric(12,2) not null default 0;

comment on column public.vendas.entrada_valor is
  'Valor pago como entrada no ato (crediário). O restante vira parcelas a receber.';
