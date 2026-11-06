-- =====================================================================
-- Aplicar migrations pendentes — cole no SQL Editor do Supabase e rode.
--
-- Seguro rodar mais de uma vez: tudo usa "if not exists" / update
-- condicional, então não duplica nem sobrescreve dado existente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Validade de estoque (migration 20260820000001)
-- ---------------------------------------------------------------------
alter table public.movimentos_estoque
  add column if not exists data_validade date;

-- ---------------------------------------------------------------------
-- 2) Recebíveis: parcelamento e origem (migration 20260820000003)
-- ---------------------------------------------------------------------
alter table public.parcelas_financeiras
  add column if not exists numero_parcela int,
  add column if not exists total_parcelas int,
  add column if not exists forma_pagamento forma_pagamento;

create index if not exists idx_parcelas_venc_tipo
  on public.parcelas_financeiras(data_vencimento, tipo);

alter table public.vendas
  add column if not exists entrada_valor numeric(12,2) not null default 0;

-- ---------------------------------------------------------------------
-- 3) Taxas da adquirente (migration 20260820000004)
-- ---------------------------------------------------------------------
alter table public.parcelas_financeiras
  add column if not exists valor_bruto numeric(12,2),
  add column if not exists taxa_percentual numeric(6,3) not null default 0,
  add column if not exists taxa_valor numeric(12,2) not null default 0;

-- Parcelas antigas não tinham taxa: o bruto é o próprio valor.
update public.parcelas_financeiras
set valor_bruto = valor
where valor_bruto is null;

-- ---------------------------------------------------------------------
-- 4) Bandeira do cartão (migration 20260820000005) — a que causou o erro
-- ---------------------------------------------------------------------
alter table public.pagamentos_venda
  add column if not exists bandeira text;

alter table public.parcelas_financeiras
  add column if not exists bandeira text;

-- ---------------------------------------------------------------------
-- 5) Força o PostgREST a recarregar o cache de schema.
--    Sem isso o erro "Could not find the column ... in the schema cache"
--    pode persistir por alguns minutos mesmo com a coluna já criada.
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Conferência: deve listar todas as colunas novas.
-- ---------------------------------------------------------------------
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'movimentos_estoque'    and column_name = 'data_validade') or
    (table_name = 'vendas'                and column_name = 'entrada_valor') or
    (table_name = 'pagamentos_venda'      and column_name = 'bandeira') or
    (table_name = 'parcelas_financeiras'  and column_name in
      ('numero_parcela','total_parcelas','forma_pagamento','valor_bruto','taxa_percentual','taxa_valor','bandeira'))
  )
order by table_name, column_name;
