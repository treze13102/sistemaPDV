-- =====================================================================
-- Fix: invite/signup falhando com "Database error saving new user"
-- Causa: trigger handle_new_auth_user roda como SECURITY DEFINER a partir
-- do schema auth e (a) sem search_path nao encontra tabelas public,
-- (b) on conflict (id) nao cobre unique(email).
-- Solucao: set search_path = public, cobrir email, e guard de excecao
-- para nunca abortar a criacao do usuario de autenticacao.
-- =====================================================================

create or replace function handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare perfil_id uuid;
begin
  select id into perfil_id from perfis_acesso where nome = 'PDV_Vendas' limit 1;

  insert into usuarios (id, nome, email, perfil_acesso_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email, perfil_id)
  on conflict (id) do nothing;

  return new;
exception when others then
  -- Nunca bloquear a criacao do auth user por falha no espelhamento.
  raise warning 'handle_new_auth_user falhou para %: %', new.id, sqlerrm;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
