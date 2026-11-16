-- Pedidos de compra: criação, recebimento e cancelamento em transações únicas.
-- Migração aditiva: cria somente funções; preserva tabelas, colunas e registros.
-- Executar no SQL Editor do mesmo Supabase usado pelo Royal e pelo Kyte.

create or replace function public.criar_pedido_compra(p_pedido jsonb, p_itens jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := coalesce(nullif(p_pedido->>'id','')::uuid, gen_random_uuid());
  v_fornecedor uuid := nullif(p_pedido->>'fornecedor_id','')::uuid;
  v_previsao date := nullif(p_pedido->>'previsao_entrega','')::date;
  v_obs text := nullif(trim(p_pedido->>'observacao'),'');
  v_total numeric;
  v_conteudo jsonb;
  v_existente jsonb;
  v_pedido public.pedidos_compra%rowtype;
begin
  if auth.uid() is null then raise exception 'Entre no sistema para registrar compras.'; end if;
  if v_fornecedor is null then raise exception 'Selecione o fornecedor.'; end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then raise exception 'Informe os produtos da compra.'; end if;
  if jsonb_array_length(p_itens) = 0 then raise exception 'Adicione ao menos um produto.'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_itens) as i(produto_id uuid, quantidade numeric, custo_unitario numeric)
    where produto_id is null or quantidade is null or quantidade <= 0 or quantidade::text in ('NaN','Infinity','-Infinity')
      or round(quantidade,3) <> quantidade or custo_unitario is null or custo_unitario < 0
      or custo_unitario::text in ('NaN','Infinity','-Infinity') or round(custo_unitario,2) <> custo_unitario
  ) then raise exception 'Informe quantidades positivas (até 3 casas decimais) e custos válidos (até 2 casas).'; end if;
  select sum(round(quantidade*custo_unitario,2)),
    jsonb_agg(jsonb_build_array(produto_id,variacao_id,quantidade,custo_unitario) order by produto_id,variacao_id,quantidade,custo_unitario)
  into v_total,v_conteudo from jsonb_to_recordset(p_itens) as i(produto_id uuid,variacao_id uuid,quantidade numeric,custo_unitario numeric);
  -- O mesmo identificador pode ser reenviado após uma falha de conexão sem duplicar a compra.
  perform pg_advisory_xact_lock(hashtextextended(v_id::text,0));
  select * into v_pedido from public.pedidos_compra where id=v_id for update;
  if found then
    select jsonb_agg(jsonb_build_array(produto_id,variacao_id,quantidade,custo_unitario) order by produto_id,variacao_id,quantidade,custo_unitario)
      into v_existente from public.itens_pedido_compra where pedido_id=v_id;
    if v_pedido.fornecedor_id is distinct from v_fornecedor or v_pedido.previsao_entrega is distinct from v_previsao
      or v_pedido.observacao is distinct from v_obs or v_existente is distinct from v_conteudo then
      raise exception 'Este pedido já foi registrado com outros dados. Feche o formulário e confira a listagem antes de continuar.';
    end if;
    return jsonb_build_object('id',v_id,'numero',v_pedido.numero);
  end if;
  insert into public.pedidos_compra(id,fornecedor_id,data_pedido,previsao_entrega,observacao,total,status)
    values(v_id,v_fornecedor,(now() at time zone 'America/Sao_Paulo')::date,v_previsao,v_obs,v_total,'ABERTO') returning * into v_pedido;
  insert into public.itens_pedido_compra(pedido_id,produto_id,variacao_id,quantidade,custo_unitario,total)
    select v_id,produto_id,variacao_id,quantidade,custo_unitario,round(quantidade*custo_unitario,2)
    from jsonb_to_recordset(p_itens) as i(produto_id uuid,variacao_id uuid,quantidade numeric,custo_unitario numeric);
  return jsonb_build_object('id',v_id,'numero',v_pedido.numero);
end $$;

create or replace function public.receber_pedido_compra(
  p_pedido_id uuid, p_recebimentos jsonb, p_data_vencimento date default null,
  p_localizacao public.localizacao_estoque default 'Loja', p_usuario_id uuid default null
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_pedido public.pedidos_compra%rowtype;
  v_item public.itens_pedido_compra%rowtype;
  r record;
  v_qtd numeric;
  v_status text;
  v_valor numeric;
  v_contas numeric;
  v_tem_conta boolean;
  v_parcela_criada boolean := false;
begin
  if auth.uid() is null then raise exception 'Entre no sistema para receber compras.'; end if;
  if p_usuario_id is not null and p_usuario_id <> auth.uid() then raise exception 'O usuário do recebimento deve ser o usuário conectado.'; end if;
  select * into v_pedido from public.pedidos_compra where id=p_pedido_id for update;
  if not found then raise exception 'Pedido de compra não encontrado.'; end if;
  if v_pedido.status not in ('ABERTO','PARCIAL') then raise exception 'Somente pedidos abertos ou parciais podem receber mercadorias.'; end if;
  if not exists(select 1 from public.itens_pedido_compra where pedido_id=p_pedido_id) then raise exception 'Este pedido não possui itens. Confira o cadastro antes de receber.'; end if;
  if p_recebimentos is null or jsonb_typeof(p_recebimentos) <> 'array' then raise exception 'Informe os itens a receber.'; end if;
  if exists(select 1 from jsonb_array_elements(p_recebimentos) x group by x->>'item_id' having count(*)>1) then raise exception 'Um item foi informado mais de uma vez.'; end if;
  v_qtd := 0;
  for r in select * from jsonb_to_recordset(p_recebimentos) as x(item_id uuid,quantidade numeric,total_anterior numeric,data_validade date) loop
    if r.quantidade is null or r.quantidade < 0 or r.quantidade::text in ('NaN','Infinity','-Infinity') or round(r.quantidade,3)<>r.quantidade then raise exception 'Informe uma quantidade válida para cada item.'; end if;
    if r.quantidade=0 then continue; end if;
    select * into v_item from public.itens_pedido_compra where id=r.item_id and pedido_id=p_pedido_id for update;
    if not found then raise exception 'Um dos itens não pertence a este pedido.'; end if;
    if r.total_anterior is null or r.total_anterior <> v_item.quantidade_recebida then raise exception 'Este recebimento já foi alterado. Feche a janela e confira as quantidades atualizadas antes de tentar novamente.'; end if;
    if r.quantidade > v_item.quantidade-v_item.quantidade_recebida then raise exception 'A quantidade recebida não pode ultrapassar o saldo pendente do produto.'; end if;
    insert into public.movimentos_estoque(produto_id,variacao_id,tipo,quantidade,localizacao,custo_unitario,data_validade,usuario_id,origem_tipo,origem_id,observacao)
      values(v_item.produto_id,v_item.variacao_id,'ENTRADA_COMPRA',r.quantidade,coalesce(p_localizacao,'Loja'),v_item.custo_unitario,r.data_validade,p_usuario_id,'PEDIDO_COMPRA',p_pedido_id,'Recebimento do pedido #'||v_pedido.numero);
    update public.itens_pedido_compra set quantidade_recebida=quantidade_recebida+r.quantidade where id=v_item.id;
    v_qtd := v_qtd+r.quantidade;
  end loop;
  if v_qtd<=0 then raise exception 'Informe ao menos uma quantidade maior que zero.'; end if;
  select case when bool_and(quantidade_recebida>=quantidade) then 'RECEBIDO' else 'PARCIAL' end,
    sum(round(quantidade_recebida*custo_unitario,2)) into v_status,v_valor from public.itens_pedido_compra where pedido_id=p_pedido_id;
  if v_status='RECEBIDO' and p_data_vencimento is not null and v_valor>0 then
    select count(*)>0,coalesce(sum(valor),0) into v_tem_conta,v_contas from public.parcelas_financeiras
      where tipo='PAGAR' and origem_tipo='COMPRA' and origem_id=p_pedido_id and status<>'CANCELADA';
    if v_tem_conta and v_contas<>v_valor then raise exception 'Já existem contas desta compra com valor diferente do recebido. Confira o Financeiro antes de finalizar o recebimento.'; end if;
    if not v_tem_conta then
      insert into public.parcelas_financeiras(tipo,origem_tipo,origem_id,descricao,data_emissao,data_vencimento,valor,status,centro_custo,fornecedor_id)
        values('PAGAR','COMPRA',p_pedido_id,'Pedido de compra #'||v_pedido.numero,(now() at time zone 'America/Sao_Paulo')::date,p_data_vencimento,v_valor,'ABERTA','Loja',v_pedido.fornecedor_id);
      v_parcela_criada := true;
    end if;
  end if;
  update public.pedidos_compra set status=v_status where id=p_pedido_id;
  return jsonb_build_object('id',p_pedido_id,'status',v_status,'quantidade_recebida_agora',v_qtd,'valor_recebido',v_valor,'parcela_criada',v_parcela_criada);
end $$;

create or replace function public.cancelar_pedido_compra(
  p_pedido_id uuid, p_motivo text, p_data_vencimento date default null,
  p_valor_recebido_esperado numeric default null
) returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_pedido public.pedidos_compra%rowtype;
  v_recebido numeric;
  v_tem_conta boolean;
  v_contas numeric;
  v_parcela_criada boolean := false;
begin
  if auth.uid() is null then raise exception 'Entre no sistema para cancelar compras.'; end if;
  if nullif(trim(p_motivo),'') is null then raise exception 'Informe o motivo do cancelamento.'; end if;
  select * into v_pedido from public.pedidos_compra where id=p_pedido_id for update;
  if not found then raise exception 'Pedido de compra não encontrado.'; end if;
  if v_pedido.status not in ('ABERTO','PARCIAL') then raise exception 'Somente pedidos abertos ou parciais podem ser cancelados.'; end if;
  select coalesce(sum(round(quantidade_recebida*custo_unitario,2)),0) into v_recebido from public.itens_pedido_compra where pedido_id=p_pedido_id;
  if p_valor_recebido_esperado is not null and v_recebido<>p_valor_recebido_esperado then raise exception 'O recebimento foi alterado. Feche a janela e confira o pedido antes de cancelar.'; end if;
  if v_recebido>0 then
    select count(*)>0,coalesce(sum(valor),0) into v_tem_conta,v_contas from public.parcelas_financeiras
      where tipo='PAGAR' and origem_tipo='COMPRA' and origem_id=p_pedido_id and status<>'CANCELADA';
    if v_tem_conta and v_contas<>v_recebido then raise exception 'As contas desta compra não correspondem aos itens já recebidos. Confira o Financeiro antes de cancelar o saldo.'; end if;
    if not v_tem_conta then
      if p_data_vencimento is null then raise exception 'Informe o vencimento da conta dos itens já recebidos antes de cancelar o saldo pendente.'; end if;
      insert into public.parcelas_financeiras(tipo,origem_tipo,origem_id,descricao,data_emissao,data_vencimento,valor,status,centro_custo,fornecedor_id)
        values('PAGAR','COMPRA',p_pedido_id,'Pedido de compra #'||v_pedido.numero||' — itens recebidos',(now() at time zone 'America/Sao_Paulo')::date,p_data_vencimento,v_recebido,'ABERTA','Loja',v_pedido.fornecedor_id);
      v_parcela_criada := true;
    end if;
  end if;
  -- Mercadorias recebidas permanecem no estoque; cancela-se somente o saldo pendente.
  update public.pedidos_compra set status='CANCELADO',observacao=concat_ws(E'\n',nullif(observacao,''),'Cancelamento: '||trim(p_motivo)) where id=p_pedido_id;
  return jsonb_build_object('id',p_pedido_id,'valor_recebido',v_recebido,'parcela_criada',v_parcela_criada);
end $$;

revoke execute on function public.criar_pedido_compra(jsonb,jsonb) from public,anon;
revoke execute on function public.receber_pedido_compra(uuid,jsonb,date,public.localizacao_estoque,uuid) from public,anon;
revoke execute on function public.cancelar_pedido_compra(uuid,text,date,numeric) from public,anon;
grant execute on function public.criar_pedido_compra(jsonb,jsonb) to authenticated;
grant execute on function public.receber_pedido_compra(uuid,jsonb,date,public.localizacao_estoque,uuid) to authenticated;
grant execute on function public.cancelar_pedido_compra(uuid,text,date,numeric) to authenticated;

notify pgrst, 'reload schema';
