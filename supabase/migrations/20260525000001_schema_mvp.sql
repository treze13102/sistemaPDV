-- =====================================================================
-- sistemaRoyal - MVP schema (Fase 1)
-- Loja de Presentes, Perfumes, Folheados, Bolsas e Itens 3D
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type categoria_tipo as enum (
    'Presentes','Perfumes','Folheados','Bolsas','Itens_3D','Insumos_3D','Outros'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type produto_status as enum ('ativo','inativo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type movimento_tipo as enum (
    'ENTRADA_COMPRA','ENTRADA_PRODUCAO','SAIDA_VENDA','SAIDA_PERDA','AJUSTE_INVENTARIO'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type localizacao_estoque as enum ('Loja','Deposito','Fabrica3D','Consignado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type venda_canal as enum ('Loja','WhatsApp','Instagram','Marketplace','Site');
exception when duplicate_object then null; end $$;

do $$ begin
  create type venda_status as enum ('CONCLUIDA','CANCELADA','ORCAMENTO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type forma_pagamento as enum (
    'DINHEIRO','CARTAO_CREDITO','CARTAO_DEBITO','PIX','FIADO','VALE_PRESENTE'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type parcela_tipo as enum ('PAGAR','RECEBER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type parcela_status as enum ('ABERTA','PAGA','PARCIAL','ATRASADA','CANCELADA');
exception when duplicate_object then null; end $$;

do $$ begin
  create type parcela_origem as enum ('COMPRA','VENDA','DESPESA_FIXA','DESPESA_VARIAVEL','IMPOSTO','COMISSAO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type centro_custo as enum ('Loja','Producao3D','Administrativo','Marketing');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PERFIS DE ACESSO + USUARIOS (vincula auth.users do Supabase)
-- ---------------------------------------------------------------------
create table if not exists perfis_acesso (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  matriz_permissoes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  perfil_acesso_id uuid references perfis_acesso(id),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CATEGORIAS (hierárquicas)
-- ---------------------------------------------------------------------
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria_pai_id uuid references categorias(id) on delete set null,
  tipo categoria_tipo not null default 'Outros',
  markup_minimo_pct numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categorias_pai on categorias(categoria_pai_id);

-- ---------------------------------------------------------------------
-- FORNECEDORES
-- ---------------------------------------------------------------------
create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  cnpj text unique,
  telefone text,
  email text,
  endereco text,
  condicoes_comerciais_padrao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PRODUTOS
-- ---------------------------------------------------------------------
create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao_curta text,
  descricao_detalhada text,
  categoria_id uuid references categorias(id),
  sku text unique,
  codigo_barras text,
  unidade_medida text default 'UN',
  fornecedor_principal_id uuid references fornecedores(id),
  custo_aquisicao numeric(12,2) not null default 0,
  preco_venda_padrao numeric(12,2) not null default 0,
  margem_desejada_percentual numeric(10,2),
  estoque_minimo numeric(12,3) default 0,
  estoque_maximo numeric(12,3),
  ponto_reposicao numeric(12,3),
  status produto_status not null default 'ativo',
  -- canal flags
  canal_loja_fisica boolean not null default true,
  canal_ecommerce boolean not null default false,
  canal_marketplace_x boolean not null default false,
  canal_marketplace_y boolean not null default false,
  is_item_3d boolean not null default false,
  imagem_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_produtos_categoria on produtos(categoria_id);
create index if not exists idx_produtos_fornecedor on produtos(fornecedor_principal_id);
create index if not exists idx_produtos_status on produtos(status);
create index if not exists idx_produtos_sku on produtos(sku);

-- ---------------------------------------------------------------------
-- VARIAÇÕES DE PRODUTO
-- ---------------------------------------------------------------------
create table if not exists variacoes_produto (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  nome text not null,
  sku text unique,
  codigo_barras text,
  cor text,
  tamanho text,
  fragrancia text,
  voltagem text,
  custo_adicional numeric(12,2) default 0,
  preco_adicional numeric(12,2) default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_variacoes_produto on variacoes_produto(produto_id);

-- ---------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  cpf_cnpj text,
  endereco text,
  data_aniversario date,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_clientes_nome on clientes(nome);
create index if not exists idx_clientes_cpf on clientes(cpf_cnpj);

-- ---------------------------------------------------------------------
-- ESTOQUE (movimentos)
-- ---------------------------------------------------------------------
create table if not exists movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete restrict,
  variacao_id uuid references variacoes_produto(id) on delete set null,
  tipo movimento_tipo not null,
  quantidade numeric(12,3) not null check (quantidade <> 0),
  localizacao localizacao_estoque not null default 'Loja',
  custo_unitario numeric(12,2),
  data_hora timestamptz not null default now(),
  usuario_id uuid references usuarios(id),
  origem_tipo text,
  origem_id uuid,
  observacao text,
  created_at timestamptz not null default now()
);
create index if not exists idx_mov_estoque_produto on movimentos_estoque(produto_id);
create index if not exists idx_mov_estoque_data on movimentos_estoque(data_hora desc);

-- View saldo de estoque
create or replace view v_estoque_saldo as
select
  produto_id,
  variacao_id,
  localizacao,
  sum(
    case
      when tipo in ('ENTRADA_COMPRA','ENTRADA_PRODUCAO') then quantidade
      when tipo in ('SAIDA_VENDA','SAIDA_PERDA') then -quantidade
      when tipo = 'AJUSTE_INVENTARIO' then quantidade
    end
  ) as saldo
from movimentos_estoque
group by produto_id, variacao_id, localizacao;

-- ---------------------------------------------------------------------
-- VENDAS (PDV)
-- ---------------------------------------------------------------------
create table if not exists vendas (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  data_hora timestamptz not null default now(),
  usuario_id uuid references usuarios(id),
  cliente_id uuid references clientes(id),
  canal venda_canal not null default 'Loja',
  total_bruto numeric(12,2) not null default 0,
  desconto_total numeric(12,2) not null default 0,
  total_liquido numeric(12,2) not null default 0,
  forma_pagamento_principal forma_pagamento,
  status venda_status not null default 'CONCLUIDA',
  observacao text,
  cancelada_em timestamptz,
  cancelada_motivo text,
  validade_orcamento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_vendas_data on vendas(data_hora desc);
create index if not exists idx_vendas_cliente on vendas(cliente_id);
create index if not exists idx_vendas_status on vendas(status);

create table if not exists itens_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas(id) on delete cascade,
  produto_id uuid not null references produtos(id) on delete restrict,
  variacao_id uuid references variacoes_produto(id) on delete set null,
  quantidade numeric(12,3) not null check (quantidade > 0),
  preco_unitario numeric(12,2) not null,
  desconto numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_itens_venda on itens_venda(venda_id);

create table if not exists pagamentos_venda (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references vendas(id) on delete cascade,
  forma forma_pagamento not null,
  valor numeric(12,2) not null check (valor > 0),
  parcelas int default 1,
  created_at timestamptz not null default now()
);
create index if not exists idx_pag_venda on pagamentos_venda(venda_id);

-- ---------------------------------------------------------------------
-- HISTÓRICO DE PREÇO
-- ---------------------------------------------------------------------
create table if not exists historico_preco (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references produtos(id) on delete cascade,
  preco_anterior numeric(12,2),
  preco_novo numeric(12,2) not null,
  variacao_pct numeric(10,2),
  justificativa text,
  aprovador_id uuid references usuarios(id),
  usuario_id uuid references usuarios(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_hist_preco_produto on historico_preco(produto_id);

-- ---------------------------------------------------------------------
-- PEDIDO DE COMPRA
-- ---------------------------------------------------------------------
create table if not exists pedidos_compra (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,
  fornecedor_id uuid not null references fornecedores(id),
  data_pedido date not null default current_date,
  previsao_entrega date,
  status text not null default 'ABERTO' check (status in ('ABERTO','PARCIAL','RECEBIDO','CANCELADO')),
  total numeric(12,2) not null default 0,
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists itens_pedido_compra (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos_compra(id) on delete cascade,
  produto_id uuid not null references produtos(id),
  variacao_id uuid references variacoes_produto(id),
  quantidade numeric(12,3) not null,
  quantidade_recebida numeric(12,3) not null default 0,
  custo_unitario numeric(12,2) not null,
  total numeric(12,2) not null
);

-- ---------------------------------------------------------------------
-- FINANCEIRO
-- ---------------------------------------------------------------------
create table if not exists parcelas_financeiras (
  id uuid primary key default gen_random_uuid(),
  tipo parcela_tipo not null,
  origem_tipo parcela_origem not null,
  origem_id uuid,
  descricao text not null,
  data_emissao date not null default current_date,
  data_vencimento date not null,
  valor numeric(12,2) not null,
  valor_pago numeric(12,2) not null default 0,
  data_pagamento date,
  status parcela_status not null default 'ABERTA',
  centro_custo centro_custo,
  cliente_id uuid references clientes(id),
  fornecedor_id uuid references fornecedores(id),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_parcelas_status on parcelas_financeiras(status);
create index if not exists idx_parcelas_venc on parcelas_financeiras(data_vencimento);
create index if not exists idx_parcelas_tipo on parcelas_financeiras(tipo);

-- ---------------------------------------------------------------------
-- METAS
-- ---------------------------------------------------------------------
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  mes int not null check (mes between 1 and 12),
  canal venda_canal,
  vendedor_id uuid references usuarios(id),
  valor_meta numeric(12,2) not null,
  created_at timestamptz not null default now(),
  unique(ano, mes, canal, vendedor_id)
);

-- ---------------------------------------------------------------------
-- AUDITORIA
-- ---------------------------------------------------------------------
create table if not exists auditoria_logs (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id),
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  dados_anteriores jsonb,
  dados_novos jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entidade on auditoria_logs(entidade, entidade_id);
create index if not exists idx_audit_data on auditoria_logs(created_at desc);

-- ---------------------------------------------------------------------
-- TRIGGER updated_at
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$ declare t text;
begin
  for t in select unnest(array[
    'usuarios','categorias','fornecedores','produtos','clientes','vendas','parcelas_financeiras'
  ]) loop
    execute format('drop trigger if exists trg_%s_updated_at on %s', t, t);
    execute format('create trigger trg_%s_updated_at before update on %s for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- SEED perfis de acesso
-- ---------------------------------------------------------------------
insert into perfis_acesso (nome, matriz_permissoes) values
  ('Administrador', '{"all": true}'::jsonb),
  ('Financeiro', '{"financeiro": ["read","write"], "vendas": ["read"], "relatorios": ["read"]}'::jsonb),
  ('Estoque', '{"estoque": ["read","write"], "produtos": ["read","write"]}'::jsonb),
  ('PDV_Vendas', '{"vendas": ["read","write"], "clientes": ["read","write"], "produtos": ["read"]}'::jsonb),
  ('Producao_3D', '{"producao": ["read","write"], "produtos": ["read"]}'::jsonb)
on conflict (nome) do nothing;
