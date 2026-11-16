-- =====================================================================
-- Campos do cadastro de produto usados pelo novo app (visual Kyte).
--
-- 100% ADITIVO: só cria colunas novas, todas opcionais ou com default.
-- Nenhuma coluna, linha ou regra existente é alterada — o app Royal antigo
-- continua funcionando igual, ele simplesmente ignora estas colunas.
-- Seguro rodar mais de uma vez.
-- =====================================================================
alter table public.produtos
  add column if not exists cor_etiqueta      text,
  add column if not exists nome_etiqueta     text,
  add column if not exists preco_promocional numeric(12,2),
  add column if not exists destaque          boolean not null default false;

comment on column public.produtos.cor_etiqueta is
  'Cor do bloco do produto na tela de venda (hex). Nulo = cor automática.';
comment on column public.produtos.nome_etiqueta is
  'Texto curto mostrado no bloco do produto (até 10 caracteres).';
comment on column public.produtos.preco_promocional is
  'Quando preenchido, é o preço praticado na venda; o preço padrão aparece riscado.';
comment on column public.produtos.destaque is
  'Produtos em destaque aparecem primeiro nas listas.';

notify pgrst, 'reload schema';
