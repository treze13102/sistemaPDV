-- =====================================================================
-- Configuracoes globais do sistema
-- =====================================================================

create table if not exists configuracoes_sistema (
  chave text primary key,
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_configuracoes_sistema_updated_at on configuracoes_sistema;
create trigger trg_configuracoes_sistema_updated_at
  before update on configuracoes_sistema
  for each row execute function set_updated_at();

alter table configuracoes_sistema enable row level security;

drop policy if exists "auth_all_configuracoes_sistema" on configuracoes_sistema;
create policy "auth_all_configuracoes_sistema"
  on configuracoes_sistema
  for all
  to authenticated
  using (true)
  with check (true);
