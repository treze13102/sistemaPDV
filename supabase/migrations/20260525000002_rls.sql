-- =====================================================================
-- RLS - MVP: authenticated users tem acesso (refinar depois com perfis)
-- =====================================================================

alter table perfis_acesso enable row level security;
alter table usuarios enable row level security;
alter table categorias enable row level security;
alter table fornecedores enable row level security;
alter table produtos enable row level security;
alter table variacoes_produto enable row level security;
alter table clientes enable row level security;
alter table movimentos_estoque enable row level security;
alter table vendas enable row level security;
alter table itens_venda enable row level security;
alter table pagamentos_venda enable row level security;
alter table historico_preco enable row level security;
alter table pedidos_compra enable row level security;
alter table itens_pedido_compra enable row level security;
alter table parcelas_financeiras enable row level security;
alter table metas enable row level security;
alter table auditoria_logs enable row level security;

-- Policy padrão: authenticated tem CRUD; refinar por perfil posteriormente
do $$ declare t text;
begin
  for t in select unnest(array[
    'perfis_acesso','usuarios','categorias','fornecedores','produtos','variacoes_produto',
    'clientes','movimentos_estoque','vendas','itens_venda','pagamentos_venda',
    'historico_preco','pedidos_compra','itens_pedido_compra','parcelas_financeiras',
    'metas','auditoria_logs'
  ]) loop
    execute format('drop policy if exists "auth_all_%s" on %s', t, t);
    execute format('create policy "auth_all_%s" on %s for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- Auto-vincular auth.users -> usuarios via trigger
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
declare perfil_id uuid;
begin
  select id into perfil_id from perfis_acesso where nome = 'PDV_Vendas' limit 1;
  insert into usuarios (id, nome, email, perfil_acesso_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), new.email, perfil_id)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();
