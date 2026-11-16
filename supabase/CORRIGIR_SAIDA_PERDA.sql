-- =====================================================================
-- Corrige o sinal das saídas por perda/quebra já gravadas.
--
-- O formulário de estoque gravava SAIDA_PERDA com quantidade NEGATIVA,
-- mas a view v_estoque_saldo já aplica o sinal negativo nesse tipo:
--
--   when tipo in ('SAIDA_VENDA','SAIDA_PERDA') then -quantidade
--
-- Resultado da dupla negação: uma perda de 5 unidades AUMENTAVA o saldo
-- em 5 em vez de reduzir. O código já foi corrigido para gravar positivo
-- (igual a SAIDA_VENDA, que sempre esteve certo); este script acerta o
-- que ficou no banco.
--
-- SEGURO rodar mais de uma vez: só toca em linhas ainda negativas.
-- =====================================================================

-- 1) CONFIRA ANTES. Se não voltar nenhuma linha, não há nada a corrigir
--    e o resto do script não fará diferença.
select
  id,
  produto_id,
  quantidade        as quantidade_atual,
  abs(quantidade)   as quantidade_corrigida,
  localizacao,
  data_hora,
  observacao
from public.movimentos_estoque
where tipo = 'SAIDA_PERDA'
  and quantidade < 0
order by data_hora desc;

-- 2) Quanto o saldo vai mudar por produto, se aplicar a correção.
--    O impacto é de 2x a quantidade: tira o que foi somado por engano
--    e passa a subtrair o que deveria.
select
  p.nome,
  count(*)                        as lancamentos,
  sum(abs(m.quantidade)) * 2      as reducao_no_saldo
from public.movimentos_estoque m
join public.produtos p on p.id = m.produto_id
where m.tipo = 'SAIDA_PERDA'
  and m.quantidade < 0
group by p.nome
order by reducao_no_saldo desc;

-- 3) APLIQUE a correção (rode depois de conferir os SELECTs acima).
update public.movimentos_estoque
set quantidade = abs(quantidade)
where tipo = 'SAIDA_PERDA'
  and quantidade < 0;

-- 4) Conferência final: deve voltar zero linhas.
select count(*) as ainda_negativas
from public.movimentos_estoque
where tipo = 'SAIDA_PERDA'
  and quantidade < 0;
