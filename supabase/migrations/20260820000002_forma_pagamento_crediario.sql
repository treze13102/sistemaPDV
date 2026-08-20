-- Adiciona CREDIARIO como forma de pagamento.
-- Em arquivo próprio: o novo valor de enum não pode ser usado na mesma
-- transação em que é criado, então as migrations seguintes já o enxergam.
alter type forma_pagamento add value if not exists 'CREDIARIO';
