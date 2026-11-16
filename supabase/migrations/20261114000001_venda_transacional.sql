-- =====================================================================
-- Venda transacional: finalizar, editar e cancelar em UMA transação.
--
-- Antes, o app gravava a venda em várias chamadas separadas (venda, itens,
-- pagamentos, estoque, parcelas). Se uma falhava no meio, as anteriores
-- ficavam gravadas — foi assim que surgiram vendas "CONCLUIDA" sem
-- pagamento, sem baixa de estoque e sem recebível.
--
-- Funções plpgsql rodam inteiras dentro de uma transação: qualquer
-- `raise exception` (ou erro de constraint) desfaz TUDO o que a chamada
-- já tinha escrito.
--
-- Também validam no servidor que as parcelas de cartão/crediário somam
-- exatamente o valor financiado (antes dava para salvar parcelas que não
-- fechavam e o dinheiro sumia do "a receber").
-- =====================================================================


-- ---------------------------------------------------------------------
-- Validação compartilhada
-- ---------------------------------------------------------------------
create or replace function public._validar_pagamento_venda(
  p_total      numeric,
  p_pagamentos jsonb,
  p_recebiveis jsonb
) returns void
language plpgsql
as $$
declare
  v_pago numeric;
  r      record;
begin
  select coalesce(sum((p->>'valor')::numeric), 0)
    into v_pago
    from jsonb_array_elements(coalesce(p_pagamentos, '[]'::jsonb)) p;

  if v_pago + 0.01 < p_total then
    raise exception 'Os pagamentos (R$ %) não cobrem o total da venda (R$ %).',
      replace(round(v_pago, 2)::text, '.', ','), replace(round(p_total, 2)::text, '.', ',');
  end if;

  -- Por forma a prazo: soma das parcelas (bruto, antes da taxa) tem que
  -- bater com o valor financiado (valor da forma menos a entrada).
  for r in
    with esperado as (
      select p->>'forma' as forma,
             sum(greatest((p->>'valor')::numeric - coalesce((p->>'entrada')::numeric, 0), 0)) as valor
        from jsonb_array_elements(coalesce(p_pagamentos, '[]'::jsonb)) p
       where p->>'forma' in ('CARTAO_CREDITO', 'CREDIARIO', 'FIADO')
       group by 1
    ),
    gerado as (
      select x->>'forma_pagamento' as forma,
             sum(coalesce((x->>'valor_bruto')::numeric, (x->>'valor')::numeric)) as valor
        from jsonb_array_elements(coalesce(p_recebiveis, '[]'::jsonb)) x
       where x->>'forma_pagamento' in ('CARTAO_CREDITO', 'CREDIARIO', 'FIADO')
       group by 1
    )
    select coalesce(e.forma, g.forma) as forma,
           coalesce(e.valor, 0)       as esperado,
           coalesce(g.valor, 0)       as gerado
      from esperado e
      full join gerado g on g.forma = e.forma
  loop
    if abs(r.esperado - r.gerado) > 0.01 then
      raise exception 'As parcelas de % somam R$ %, mas deveriam somar R$ %. Ajuste os valores das parcelas.',
        r.forma, replace(round(r.gerado, 2)::text, '.', ','), replace(round(r.esperado, 2)::text, '.', ',');
    end if;
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- Escritas compartilhadas (itens, estoque, pagamentos, recebíveis)
-- ---------------------------------------------------------------------
create or replace function public._gravar_conteudo_venda(
  p_venda_id    uuid,
  p_numero      int,
  p_status      venda_status,
  p_cliente_id  uuid,
  p_usuario_id  uuid,
  p_localizacao localizacao_estoque,
  p_itens       jsonb,
  p_pagamentos  jsonb,
  p_recebiveis  jsonb
) returns void
language plpgsql
as $$
begin
  insert into itens_venda (venda_id, produto_id, variacao_id, quantidade, preco_unitario, desconto, total)
  select p_venda_id,
         (i->>'produto_id')::uuid,
         nullif(i->>'variacao_id', '')::uuid,
         (i->>'quantidade')::numeric,
         (i->>'preco_unitario')::numeric,
         coalesce((i->>'desconto')::numeric, 0),
         (i->>'quantidade')::numeric * (i->>'preco_unitario')::numeric - coalesce((i->>'desconto')::numeric, 0)
    from jsonb_array_elements(p_itens) i;

  -- Orçamento não mexe em estoque nem gera financeiro.
  if p_status <> 'CONCLUIDA' then
    return;
  end if;

  -- Saída grava quantidade POSITIVA: a view v_estoque_saldo é quem nega SAIDA_*.
  insert into movimentos_estoque (produto_id, variacao_id, tipo, quantidade, localizacao, usuario_id, origem_tipo, origem_id)
  select (i->>'produto_id')::uuid,
         nullif(i->>'variacao_id', '')::uuid,
         'SAIDA_VENDA',
         (i->>'quantidade')::numeric,
         p_localizacao,
         p_usuario_id,
         'VENDA',
         p_venda_id
    from jsonb_array_elements(p_itens) i;

  insert into pagamentos_venda (venda_id, forma, valor, parcelas, bandeira)
  select p_venda_id,
         (p->>'forma')::forma_pagamento,
         (p->>'valor')::numeric,
         coalesce((p->>'parcelas')::int, 1),
         nullif(p->>'bandeira', '')
    from jsonb_array_elements(coalesce(p_pagamentos, '[]'::jsonb)) p;

  insert into parcelas_financeiras (
    tipo, origem_tipo, origem_id, descricao, data_emissao, data_vencimento,
    valor, valor_bruto, taxa_percentual, taxa_valor, status, centro_custo,
    cliente_id, numero_parcela, total_parcelas, forma_pagamento, bandeira
  )
  select 'RECEBER',
         'VENDA',
         p_venda_id,
         -- O cliente não sabe o número da venda antes de ela existir: usa {numero}.
         replace(x->>'descricao', '{numero}', p_numero::text),
         (x->>'data_emissao')::date,
         (x->>'data_vencimento')::date,
         (x->>'valor')::numeric,
         coalesce((x->>'valor_bruto')::numeric, (x->>'valor')::numeric),
         coalesce((x->>'taxa_percentual')::numeric, 0),
         coalesce((x->>'taxa_valor')::numeric, 0),
         'ABERTA',
         'Loja',
         p_cliente_id,
         (x->>'numero_parcela')::int,
         (x->>'total_parcelas')::int,
         (x->>'forma_pagamento')::forma_pagamento,
         nullif(x->>'bandeira', '')
    from jsonb_array_elements(coalesce(p_recebiveis, '[]'::jsonb)) x;
end $$;


-- ---------------------------------------------------------------------
-- FINALIZAR
-- ---------------------------------------------------------------------
create or replace function public.finalizar_venda(
  p_venda      jsonb,   -- cliente_id, usuario_id, canal, status, desconto_extra,
                        -- observacao, validade_orcamento, localizacao_estoque
  p_itens      jsonb,
  p_pagamentos jsonb,
  p_recebiveis jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_status      venda_status := coalesce(nullif(p_venda->>'status', ''), 'CONCLUIDA')::venda_status;
  v_cliente     uuid := nullif(p_venda->>'cliente_id', '')::uuid;
  v_usuario     uuid := nullif(p_venda->>'usuario_id', '')::uuid;
  v_local       localizacao_estoque := coalesce(nullif(p_venda->>'localizacao_estoque', ''), 'Loja')::localizacao_estoque;
  v_bruto       numeric;
  v_desc_itens  numeric;
  v_desc_total  numeric;
  v_liquido     numeric;
  v_entrada     numeric;
  v_id          uuid;
  v_numero      int;
  v_data        timestamptz;
begin
  if jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) = 0 then
    raise exception 'A venda precisa ter ao menos um item.';
  end if;

  -- Totais calculados AQUI, a partir dos itens — fonte única, sem confiar
  -- em números montados no navegador.
  select coalesce(sum((i->>'quantidade')::numeric * (i->>'preco_unitario')::numeric), 0),
         coalesce(sum(coalesce((i->>'desconto')::numeric, 0)), 0)
    into v_bruto, v_desc_itens
    from jsonb_array_elements(p_itens) i;

  v_desc_total := v_desc_itens + coalesce((p_venda->>'desconto_extra')::numeric, 0);
  v_liquido    := v_bruto - v_desc_total;

  if v_liquido < 0 then
    raise exception 'O desconto (R$ %) é maior que o valor da venda (R$ %).', replace(round(v_desc_total, 2)::text, '.', ','), replace(round(v_bruto, 2)::text, '.', ',');
  end if;

  select coalesce(sum(coalesce((p->>'entrada')::numeric, 0)), 0)
    into v_entrada
    from jsonb_array_elements(coalesce(p_pagamentos, '[]'::jsonb)) p;

  if v_status = 'CONCLUIDA' then
    perform public._validar_pagamento_venda(v_liquido, p_pagamentos, p_recebiveis);
  end if;

  insert into vendas (
    usuario_id, cliente_id, canal, total_bruto, desconto_total, total_liquido,
    forma_pagamento_principal, status, entrada_valor, observacao, validade_orcamento
  ) values (
    v_usuario,
    v_cliente,
    coalesce(nullif(p_venda->>'canal', ''), 'Loja')::venda_canal,
    v_bruto,
    v_desc_total,
    v_liquido,
    nullif(p_pagamentos->0->>'forma', '')::forma_pagamento,
    v_status,
    v_entrada,
    nullif(p_venda->>'observacao', ''),
    nullif(p_venda->>'validade_orcamento', '')::date
  )
  returning id, numero, data_hora into v_id, v_numero, v_data;

  perform public._gravar_conteudo_venda(
    v_id, v_numero, v_status, v_cliente, v_usuario, v_local, p_itens, p_pagamentos, p_recebiveis
  );

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'data_hora', v_data, 'total_liquido', v_liquido);
end $$;


-- ---------------------------------------------------------------------
-- EDITAR
-- ---------------------------------------------------------------------
create or replace function public.editar_venda(
  p_venda_id   uuid,
  p_venda      jsonb,   -- mesmos campos de finalizar_venda (status é ignorado)
  p_itens      jsonb,
  p_pagamentos jsonb,
  p_recebiveis jsonb
) returns jsonb
language plpgsql
as $$
declare
  v_atual       vendas%rowtype;
  v_cliente     uuid := nullif(p_venda->>'cliente_id', '')::uuid;
  v_usuario     uuid := nullif(p_venda->>'usuario_id', '')::uuid;
  v_local       localizacao_estoque := coalesce(nullif(p_venda->>'localizacao_estoque', ''), 'Loja')::localizacao_estoque;
  v_bruto       numeric;
  v_desc_itens  numeric;
  v_desc_total  numeric;
  v_liquido     numeric;
  v_entrada     numeric;
begin
  -- FOR UPDATE: duas edições simultâneas da mesma venda não se atropelam.
  select * into v_atual from vendas where id = p_venda_id for update;
  if not found then
    raise exception 'Venda não encontrada.';
  end if;
  if v_atual.status = 'CANCELADA' then
    raise exception 'Venda cancelada não pode ser editada.';
  end if;
  if jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) = 0 then
    raise exception 'A venda precisa ter ao menos um item.';
  end if;

  -- Mexer no total depois que o dinheiro entrou desalinharia o caixa.
  if exists (
    select 1 from parcelas_financeiras
     where origem_tipo = 'VENDA'
       and origem_id = p_venda_id
       and status <> 'CANCELADA'
       and (coalesce(valor_pago, 0) > 0 or status in ('PAGA', 'PARCIAL'))
  ) then
    raise exception 'Esta venda já possui parcelas recebidas. Estorne os recebimentos no Financeiro ou cancele a venda antes de editar.';
  end if;

  select coalesce(sum((i->>'quantidade')::numeric * (i->>'preco_unitario')::numeric), 0),
         coalesce(sum(coalesce((i->>'desconto')::numeric, 0)), 0)
    into v_bruto, v_desc_itens
    from jsonb_array_elements(p_itens) i;

  v_desc_total := v_desc_itens + coalesce((p_venda->>'desconto_extra')::numeric, 0);
  v_liquido    := v_bruto - v_desc_total;

  if v_liquido < 0 then
    raise exception 'O desconto (R$ %) é maior que o valor da venda (R$ %).', replace(round(v_desc_total, 2)::text, '.', ','), replace(round(v_bruto, 2)::text, '.', ',');
  end if;

  select coalesce(sum(coalesce((p->>'entrada')::numeric, 0)), 0)
    into v_entrada
    from jsonb_array_elements(coalesce(p_pagamentos, '[]'::jsonb)) p;

  if v_atual.status = 'CONCLUIDA' then
    perform public._validar_pagamento_venda(v_liquido, p_pagamentos, p_recebiveis);
  end if;

  update vendas set
    cliente_id                = v_cliente,
    canal                     = coalesce(nullif(p_venda->>'canal', ''), v_atual.canal::text)::venda_canal,
    total_bruto               = v_bruto,
    desconto_total            = v_desc_total,
    total_liquido             = v_liquido,
    forma_pagamento_principal = coalesce(nullif(p_pagamentos->0->>'forma', '')::forma_pagamento, v_atual.forma_pagamento_principal),
    entrada_valor             = v_entrada,
    observacao                = nullif(p_venda->>'observacao', ''),
    updated_at                = now()
  where id = p_venda_id;

  -- Apaga só o que a própria venda gerou e regrava a partir do novo conteúdo.
  delete from itens_venda where venda_id = p_venda_id;
  if v_atual.status = 'CONCLUIDA' then
    delete from movimentos_estoque where origem_tipo = 'VENDA' and origem_id = p_venda_id;
    delete from pagamentos_venda   where venda_id = p_venda_id;
    delete from parcelas_financeiras
     where origem_tipo = 'VENDA' and origem_id = p_venda_id and status in ('ABERTA', 'ATRASADA');
  end if;

  perform public._gravar_conteudo_venda(
    p_venda_id, v_atual.numero, v_atual.status, v_cliente, v_usuario, v_local, p_itens, p_pagamentos, p_recebiveis
  );

  return jsonb_build_object('id', p_venda_id, 'numero', v_atual.numero, 'total_liquido', v_liquido);
end $$;


-- ---------------------------------------------------------------------
-- CANCELAR
-- ---------------------------------------------------------------------
create or replace function public.cancelar_venda(
  p_venda_id   uuid,
  p_motivo     text,
  p_usuario_id uuid
) returns void
language plpgsql
as $$
declare
  v_atual vendas%rowtype;
begin
  select * into v_atual from vendas where id = p_venda_id for update;
  if not found then
    raise exception 'Venda não encontrada.';
  end if;
  if v_atual.status not in ('CONCLUIDA', 'ORCAMENTO') then
    raise exception 'Apenas vendas concluídas ou orçamentos podem ser cancelados.';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  if v_atual.status = 'CONCLUIDA' then
    -- Estorna a partir das SAÍDAS reais da venda: mesmo produto, variação e
    -- LOCAL de onde saiu (antes o estorno ia sempre para 'Loja').
    insert into movimentos_estoque (produto_id, variacao_id, tipo, quantidade, localizacao, usuario_id, origem_tipo, origem_id, observacao)
    select produto_id, variacao_id, 'AJUSTE_INVENTARIO', quantidade, localizacao, p_usuario_id,
           'CANCELAMENTO_VENDA', p_venda_id, 'Estorno de venda cancelada — motivo: ' || p_motivo
      from movimentos_estoque
     where origem_tipo = 'VENDA' and origem_id = p_venda_id and tipo = 'SAIDA_VENDA';

    update parcelas_financeiras
       set status = 'CANCELADA'
     where origem_tipo = 'VENDA' and origem_id = p_venda_id and status in ('ABERTA', 'PARCIAL', 'ATRASADA');
  end if;

  update vendas
     set status = 'CANCELADA', cancelada_em = now(), cancelada_motivo = p_motivo, updated_at = now()
   where id = p_venda_id;
end $$;


grant execute on function public.finalizar_venda(jsonb, jsonb, jsonb, jsonb)       to authenticated;
grant execute on function public.editar_venda(uuid, jsonb, jsonb, jsonb, jsonb)     to authenticated;
grant execute on function public.cancelar_venda(uuid, text, uuid)                   to authenticated;

-- Funções internas não são chamadas direto pelo app.
revoke execute on function public._validar_pagamento_venda(numeric, jsonb, jsonb) from public, anon;
revoke execute on function public._gravar_conteudo_venda(uuid, int, venda_status, uuid, uuid, localizacao_estoque, jsonb, jsonb, jsonb) from public, anon;
grant  execute on function public._validar_pagamento_venda(numeric, jsonb, jsonb) to authenticated;
grant  execute on function public._gravar_conteudo_venda(uuid, int, venda_status, uuid, uuid, localizacao_estoque, jsonb, jsonb, jsonb) to authenticated;

-- PostgREST passa a enxergar as funções novas sem esperar o cache expirar.
notify pgrst, 'reload schema';
