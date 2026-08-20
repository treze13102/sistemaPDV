-- Adiciona data de validade aos movimentos de estoque.
-- Cada linha de movimento representa um lote (compra/produção); quando o usuário
-- informa datas individuais por unidade, o app insere um movimento por unidade
-- (quantidade = 1 cada) em vez de uma única linha com a quantidade total.
alter table public.movimentos_estoque
  add column if not exists data_validade date;

comment on column public.movimentos_estoque.data_validade is
  'Data de validade do lote/unidade recebida nesse movimento (opcional).';
