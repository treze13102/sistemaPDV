-- Seed Controle de Estoque (gerado de Controle_Estoque.xlsx)
-- Rodar no SQL Editor do Supabase. Idempotente via ON CONFLICT.
begin;

-- CATEGORIAS
insert into categorias (nome, tipo) select 'Perfumaria', 'Perfumes'::categoria_tipo where not exists (select 1 from categorias where nome = 'Perfumaria');
insert into categorias (nome, tipo) select 'Cabelos', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Cabelos');
insert into categorias (nome, tipo) select 'Corpo e Banho', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Corpo e Banho');
insert into categorias (nome, tipo) select 'Rosto e Skincare', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Rosto e Skincare');
insert into categorias (nome, tipo) select 'Maquiagem', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Maquiagem');
insert into categorias (nome, tipo) select 'Desodorantes', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Desodorantes');
insert into categorias (nome, tipo) select 'Bolsas e Carteiras', 'Bolsas'::categoria_tipo where not exists (select 1 from categorias where nome = 'Bolsas e Carteiras');
insert into categorias (nome, tipo) select 'Acessorios e Kits', 'Presentes'::categoria_tipo where not exists (select 1 from categorias where nome = 'Acessorios e Kits');
insert into categorias (nome, tipo) select 'Outros', 'Outros'::categoria_tipo where not exists (select 1 from categorias where nome = 'Outros');

-- FORNECEDORES (marcas)
insert into fornecedores (razao_social) select 'Avon' where not exists (select 1 from fornecedores where razao_social = 'Avon');
insert into fornecedores (razao_social) select 'Eudora' where not exists (select 1 from fornecedores where razao_social = 'Eudora');
insert into fornecedores (razao_social) select 'Jequiti' where not exists (select 1 from fornecedores where razao_social = 'Jequiti');
insert into fornecedores (razao_social) select 'Mahogany' where not exists (select 1 from fornecedores where razao_social = 'Mahogany');
insert into fornecedores (razao_social) select 'Natura' where not exists (select 1 from fornecedores where razao_social = 'Natura');
insert into fornecedores (razao_social) select 'O Boticário' where not exists (select 1 from fornecedores where razao_social = 'O Boticário');
insert into fornecedores (razao_social) select 'O.U.i' where not exists (select 1 from fornecedores where razao_social = 'O.U.i');
insert into fornecedores (razao_social) select 'Perfumaria Árabe' where not exists (select 1 from fornecedores where razao_social = 'Perfumaria Árabe');

-- PRODUTOS
insert into produtos (sku, nome, codigo_barras, categoria_id, fornecedor_principal_id, custo_aquisicao, preco_venda_padrao, status) values
  ('ROY-0001', 'Advance Techniques Nutrição Completa Sérum de Tratamento Hidratante 30 ml', '7909189184293', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 23.09, 32.99, 'ativo'::produto_status),
  ('ROY-0002', 'Advance Techniques Nutrição Completa Sérum de Tratamento Finalizador 30 ml', '7909189183999', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 23.09, 32.99, 'ativo'::produto_status),
  ('ROY-0003', 'Advance Techniques Cachos Poderosos Sérum de Tratamento Finalizador 30 ml', '7909189337859', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 23.09, 32.99, 'ativo'::produto_status),
  ('ROY-0004', 'Advance Techniques Nutrição Completa Óleo de Tratamento Hidratante Argan 90ml', '7909189183944', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0005', 'Advance Techniques Nutrição Completa Óleo de Tratamento Restaurador Camelia 90 ml', '7909189184309', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0006', 'Renew Platinum Definição e Elasticidade Sérum 30 ml', '7909189359516', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 104.93, 149.90, 'ativo'::produto_status),
  ('ROY-0007', 'Advance Techniques Limpeza Profunda Shampoo 300 ml', '7909189262243', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 18.19, 25.99, 'ativo'::produto_status),
  ('ROY-0008', 'Erva Doce Desodorante Creme Antitranspirante 48h 50g', '7909189188710', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 8.04, 11.49, 'ativo'::produto_status),
  ('ROY-0009', 'Renew Solar Tripla Proteção FPS 50 Hialurônico Loção Facial Matte 40g', '7909189331512', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 38.43, 54.90, 'ativo'::produto_status),
  ('ROY-0010', 'Renew Solar Tripla Proteção FPS 70 Protinol Loção Facial Matte 40g', '7909189331529', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 45.43, 64.90, 'ativo'::produto_status),
  ('ROY-0011', 'Care Máscara de Limpeza Facial 3 em 1 Pepino e Aloe Vera 75g', '7909189243815', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0012', 'Care Gel Esfoliante Facial 3 em 1 100g', '7909189238828', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0013', 'Care Sabonete Gel de Limpeza Facial 3 em 1 100g', '7909189238804', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0014', 'Care Protetor Luvas de Silicone Creme para Mãos 120g', '7909189258642', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 17.49, 24.99, 'ativo'::produto_status),
  ('ROY-0015', 'Colonia Moana 150 ml', '7909189357635', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 24.49, 34.99, 'ativo'::produto_status),
  ('ROY-0016', 'Colonia Minie 150 ml', '7909189373093', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 24.49, 34.99, 'ativo'::produto_status),
  ('ROY-0017', 'Colonia Mickey 150 ml', '7909189373079', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 24.49, 34.99, 'ativo'::produto_status),
  ('ROY-0018', 'Care Sun+ Kids FPS 50 120g', '7909189382781', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 43.33, 61.90, 'ativo'::produto_status),
  ('ROY-0019', 'Shampoo 2 em 1 Mickey 200 ml', '7909189373086', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 15.39, 21.99, 'ativo'::produto_status),
  ('ROY-0020', 'Touca de Banho Mickey', '7891834250128', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 5.59, 7.99, 'ativo'::produto_status),
  ('ROY-0021', 'Caixa de Sabonete Cremoso Encanto Sortido 4 um', '7909189242443', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 17.49, 24.99, 'ativo'::produto_status),
  ('ROY-0022', 'Deo Parfum Sweet Honest 100 ml', '7909883472900', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0023', 'Deo Parfum Charisma Magnetic 100 ml', '7909883472955', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0024', 'Deo Colonia Petit Atitude 50 ml', '7909189255139', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 45.43, 64.90, 'ativo'::produto_status),
  ('ROY-0025', 'Body Splash Aquavibe Chypre 1L', '7909189320677', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0026', 'Body Splash Aquavibe Lavanda 1L', '7909189233281', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0027', 'Body Splash Aquavibe Framboesa e Cassis 300 ml', '7909189289530', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 27.99, 39.99, 'ativo'::produto_status),
  ('ROY-0028', 'Body Splash Aquavibe Pretty Blue 300 ml', '7909189320653', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 27.99, 39.99, 'ativo'::produto_status),
  ('ROY-0029', 'Body Splash Aquavibe Baby Smell 300 ml', '7909189233298', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 27.99, 39.99, 'ativo'::produto_status),
  ('ROY-0030', 'Shampoo Cabelo e Corpo 300km Quantum 80 ml', '7909189364299', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 16.09, 22.99, 'ativo'::produto_status),
  ('ROY-0031', 'Shampoo Cabelo e Corpo Black Essential Dark 90 ml', '7909189349180', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 16.09, 22.99, 'ativo'::produto_status),
  ('ROY-0032', 'Loção Pós Barba Black Essential Real Intense 90 ml', '7909189349227', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 18.89, 26.99, 'ativo'::produto_status),
  ('ROY-0033', 'Deo Colonia 300km Quantum 100 ml', '7909189249183', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0034', 'Deo Colonia Black Essential Dark 100 ml', '7909189349166', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0035', 'Deo Colonia Black Essential 100 ml', '7909189349142', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0036', 'Deo Colonia Black Essential Secret 100 ml', '7909189349173', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0037', 'Deo Colonia Black Essential Charm 100 ml', '7909189319305', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0038', 'Body Splash Pink Riviera 250 ml', '7896086926807', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0039', 'Body Splash Party at Ibiza 250 ml', '7896086926814', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0040', 'Body Splash Bambou 350 ml', '7896086913715', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 81.90, 117.00, 'ativo'::produto_status),
  ('ROY-0041', 'Body Splash Flor de cerejeira 350 ml', '7896086927781', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 81.90, 117.00, 'ativo'::produto_status),
  ('ROY-0042', 'Body Splash Lavanda e Algodão 350 ml', '7896086999658', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 81.90, 117.00, 'ativo'::produto_status),
  ('ROY-0043', 'Perfume Glam 100 ml', '7896086960788', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 173.60, 248.00, 'ativo'::produto_status),
  ('ROY-0044', 'Perfume Glam White Mist 100 ml', '7896086998958', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 173.60, 248.00, 'ativo'::produto_status),
  ('ROY-0045', 'Perfume Flor de Cerejeira 100 ml', '7896086997401', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 118.30, 169.00, 'ativo'::produto_status),
  ('ROY-0046', 'Kit English Rose Sab 140 ml+Hidr 120 ml', '7896086996756', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 69.30, 99.00, 'ativo'::produto_status),
  ('ROY-0047', 'Emulsão PerfumadaEnglish Rose 350 ml', '7896086935885', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0048', 'Eau de Toilette Íris e Flor de Laranjeira 100 ml', '7896086933393', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 166.60, 238.00, 'ativo'::produto_status),
  ('ROY-0049', 'Eau de Toilette Pimenta Rosa e Cedro 100 ml', '7896086933454', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Mahogany' limit 1), 166.60, 238.00, 'ativo'::produto_status),
  ('ROY-0050', 'Homem Cor.agio 100 ml', '7908016675065', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 223.93, 319.90, 'ativo'::produto_status),
  ('ROY-0051', 'Homem Sagaz 100 ml', '7908016604232', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 167.93, 239.90, 'ativo'::produto_status),
  ('ROY-0052', 'Homem Absoluto 100 ml', '7909883362584', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 167.93, 239.90, 'ativo'::produto_status),
  ('ROY-0053', 'Essencial Clássico Masculino 100 ml', '7908132288569', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0054', 'Essencial Oud Masculino 100 ml', '7908132288606', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0055', 'Essencial Desejos 100 ml', '7909883308001', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 209.93, 299.90, 'ativo'::produto_status),
  ('ROY-0056', 'Essencial Sentir Masculino 100 ml', '7909883219284', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0057', 'Biografia (Masculino)', '7908132240857', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0058', 'K Masculino 100 ml', '7899846000304', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0059', 'Kaiak Tradicional Azul 100 ml', '7908371662755', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0060', 'Kaiak Ultra Masculino 100 ml', '7909883227043', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0061', 'Kaiak Urbe masculino 100 ml', '7908371662762', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0062', 'Kaiak Aventura intensa Masculino 100 ml', '7909883234669', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0063', 'Sintonia Masculino 100 ml', '7908132241830', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0064', 'Revelar 75 ml', '7908132294454', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0065', 'Kaiak Ultra Feminino 100 ml', '7909883226916', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0066', 'Ilía Florescer 50ml', '7909883168742', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 139.93, 199.90, 'ativo'::produto_status),
  ('ROY-0067', 'Ilía Secreto 50ml', '7908016619106', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 139.93, 199.90, 'ativo'::produto_status),
  ('ROY-0068', 'Ilía Laços 50 ml', '7908240819464', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 139.93, 199.90, 'ativo'::produto_status),
  ('ROY-0069', 'Ilía Dual 50 ml', '7909883433208', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 139.93, 199.90, 'ativo'::produto_status),
  ('ROY-0070', 'Ilía Flor de Laranjeira 50 ml', '7908240851051', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 139.93, 199.90, 'ativo'::produto_status),
  ('ROY-0071', 'Essencial Único Fem 90 ml', '7908371636251', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 226.03, 322.90, 'ativo'::produto_status),
  ('ROY-0072', 'Essencial Sentir Feminino 100 ml', '7909883219291', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0073', 'Essencial Clássico Feminino 100 ml', '7908132288576', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0074', 'Essencial Ato Feminino 100 ml', '7908132207089', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 195.93, 279.90, 'ativo'::produto_status),
  ('ROY-0075', 'Hoje Feminino 100 ml', '7908240893426', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0076', 'Luna Liberdade 75 ml', '7909883226930', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 130.13, 185.90, 'ativo'::produto_status),
  ('ROY-0077', 'Luna Confiante 75 ml', '7908371626665', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 130.13, 185.90, 'ativo'::produto_status),
  ('ROY-0078', 'Luna Divina 75 ml', '7909883235543', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 130.13, 185.90, 'ativo'::produto_status),
  ('ROY-0079', 'Luna Divina Hidratante Iluminador 150 ml', '7909883235444', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 46.13, 65.90, 'ativo'::produto_status),
  ('ROY-0080', 'Luna Divina Perfume para Cabelos', '7909883280352', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 61.53, 87.90, 'ativo'::produto_status),
  ('ROY-0081', 'Ekos Frescor Açaí 150 ml', '7908132261562', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 90.93, 129.90, 'ativo'::produto_status),
  ('ROY-0082', 'Ekos Frescor Andiroba 150 ml', '7909883329617', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 90.93, 129.90, 'ativo'::produto_status),
  ('ROY-0083', 'Kriska Jeans 100 ml', '7908371639474', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0084', 'Meu Primeiro Humor 75ml', '7908016651762', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0085', 'Águas Violeta 170ml', '7908240823393', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 81.83, 116.90, 'ativo'::produto_status),
  ('ROY-0086', 'Águas Lírio 170ml', '7908240823423', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 81.83, 116.90, 'ativo'::produto_status),
  ('ROY-0087', 'Tododia Body Splash Maçã Caramelada 200 ml', '7909883270032', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0088', 'Tododia Body Splash Amora e Flor de Pêssego 200 ml', '7909883271220', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0089', 'Tododia Body Splash Flor de Maçã 200 ml', '7909883080846', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0090', 'Tododia Body Splash Macadâmia 200 ml', '7908132247597', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0091', 'Tododia Body Splash Cereja Negra e Praline 200 ml', '7909883248475', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0092', 'Tododia Body Splash Algodão 200 ml', '7908132247580', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0093', 'Tododia Body Splash Flor de Pessego e Jasmim 200 ml', '7909883401979', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.73, 93.90, 'ativo'::produto_status),
  ('ROY-0094', 'Tododia Creme Hidratante Cereja e Avelã 400 ml', '7908371613351', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0095', 'Tododia Creme Hidratante Framboesa e Pimenta Vermelha 400 ml', '7908371688892', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0096', 'Tododia Creme Hidratante Maçã Caramelada 400 ml', '7909883270049', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0097', 'Tododia Creme Hidratante Acerola e Hibisco 400 ml', '7908240820781', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0098', 'Tododia Creme Hidratante Ameixa e Flor de Baunilha 400 ml', '7908371616208', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0099', 'Tododia Creme Hidratante Macadamia 400 ml', '7908132216289', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0100', 'Tododia Creme Hidratante Amora e Flor de Pêssego 400 ml', '7909883271114', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0101', 'Tododia Creme Hidratante Algodão 400 ml', '7908132216319', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0102', 'Tododia Creme Hidratante Flor de Pessego e Jasmim 400 ml', '7909883401955', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0103', 'Tododia Creme Hidratante Morango e Baunilha Dourada 400 ml', '7909883365110', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0104', 'Tododia Creme Hidratante Jambo Rosa e Flor de Caju 400 ml', '7909883234577', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.23, 78.90, 'ativo'::produto_status),
  ('ROY-0105', 'Ekos Creme Hidratante Açaí', '7908371607091', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0106', 'Chronos Sabonete em Óleo Limpeza Demaquilante 125 ml', '7909883080037', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 57.40, 82.00, 'ativo'::produto_status),
  ('ROY-0107', 'Chronos Derma Sérum Intensivo Multiclareador 30 ml', '7909883226329', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0108', 'Chronos Sérum Intensivo Preenchedor Hidratante 30 ml', '7909883226282', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0109', 'Chronos Sérum Intensivo Lifting e Firmeza 30 ml', '7909883226381', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0110', 'Chronos Derma Sérum Intensivo Multiclareador 30 ml', '7909883226329', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0111', 'Chronos Sérum Intensivo Antioxidante 15 ml', '7909883226152', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0112', 'Chronos Super Sérum para Olhos (Redutor de rugas e flacidez) 15 ml', '7909883226107', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0113', 'Chronos Derma Triplo Esfoliante (Peeling antissinais) 50 g', '7909883080211', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 57.40, 82.00, 'ativo'::produto_status),
  ('ROY-0114', 'Chronos Derma Balm Labial Reparador Hidratante 15 ml', '7909883219253', (select id from categorias where nome = 'Maquiagem' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 41.30, 59.00, 'ativo'::produto_status),
  ('ROY-0115', 'Chronos Derma Multiprotetor Clareador FPS 70', '7909883275334', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.50, 195.00, 'ativo'::produto_status),
  ('ROY-0116', 'Chronos Multiprotetor Antissinais FPS 50', '7909883054946', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 75.60, 108.00, 'ativo'::produto_status),
  ('ROY-0117', 'Chronos Protetor Multiclareador FPS 70 Médio-Escuro', '7908371613580', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 83.30, 119.00, 'ativo'::produto_status),
  ('ROY-0118', 'Chronos Protetor Multiclareador FPS 70 Claro-Médio', '7908016674747', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 83.30, 119.00, 'ativo'::produto_status),
  ('ROY-0119', 'Erva Doce Casa Spray de Ambientes 200 ml', '7909883234201', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0120', 'Mamãe e Bebê Caixa de Presente Kit', '7909883081065', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.69, 46.70, 'ativo'::produto_status),
  ('ROY-0121', 'Naturé Pula Pula Água de Colônia', '7909883024116', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0122', 'Naturé Catavento Água de Colônia', '7908371651711', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0123', 'Naturé Corre Corre Água de Colônia', '7909883024109', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0124', 'Naturé Pique Pega Água de Colônia', '7908371629727', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0125', 'Naturé Hidratante Pós-sol', '7909883214883', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 30.03, 42.90, 'ativo'::produto_status),
  ('ROY-0126', 'Mamãe e Bebê Sabonete Líquido', '7908132208482', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 37.03, 52.90, 'ativo'::produto_status),
  ('ROY-0127', 'Mamãe e Bebê Água de Colônia', '7908132208406', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 74.83, 106.90, 'ativo'::produto_status),
  ('ROY-0128', 'Essencial Atrai Masculino Deo Corporal', '7909883225841', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0129', 'Essencial Atrai Feminino Deo Corporal', '7909883225858', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0130', 'Homem (Deo Corporal) Aromatico', '7909883219468', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0131', 'Essencial Sentir Masculino Deo Corporal', '7909883275235', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0132', 'Erva Doce Deo Corporal', '7909883001308', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0133', 'Tododia Pele Uniforme Desodorante Roll-on', '7909883304690', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 20.93, 29.90, 'ativo'::produto_status),
  ('ROY-0134', 'Erva Doce Desodorante Roll-on', '7909883137762', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 20.93, 29.90, 'ativo'::produto_status),
  ('ROY-0135', 'Kaiak Oceano Deo Corporal Refil', '7908240895482', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 31.43, 44.90, 'ativo'::produto_status),
  ('ROY-0136', 'Kaiak Oceano Fem Deo Corporal Refil', '7908371632567', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 31.43, 44.90, 'ativo'::produto_status),
  ('ROY-0137', 'Erva Doce Deo Corporal  Refil', '7909883001315', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 31.43, 44.90, 'ativo'::produto_status),
  ('ROY-0138', 'Tododia Invisível Macadâmia Desodorante em Creme', '7908240832692', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 21.63, 30.90, 'ativo'::produto_status),
  ('ROY-0139', 'Tododia Ameixa e Flor de Baunilha Desodorante em Creme', '7908371617823', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 21.63, 30.90, 'ativo'::produto_status),
  ('ROY-0140', 'Fotoequilíbrio Protetor Solar Corporal FPS 60 120 ml', '7908371634998', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 97.93, 139.90, 'ativo'::produto_status),
  ('ROY-0141', 'Natura Solar Protetor Facial em Stick FPS 50 15 g', '7909883261634', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 88.13, 125.90, 'ativo'::produto_status),
  ('ROY-0142', 'Boti.Sun Acqua Fluido Antissinais FPS 70 40 ml', '7891033476022', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0143', 'Botik Ácido Hialurônico Protetor Solar Fluido FPS 50 40 ml', '7891033538386', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 68.53, 97.90, 'ativo'::produto_status),
  ('ROY-0144', 'Malbec Club Tônico Antiqueda 100ml', '7891033502073', (select id from categorias where nome = 'Rosto e Skincare' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0145', 'Malbec Gold 100 ml', '7891033843916', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 174.93, 249.90, 'ativo'::produto_status),
  ('ROY-0146', 'Malbec Icon 100 ml', '7891033541508', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0147', 'Malbec Tradicional 100 ml', '7891033843879', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0148', 'Malbec Pure Gold 100 ml', '7891033585069', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 174.93, 249.90, 'ativo'::produto_status),
  ('ROY-0149', 'Arbo Tradicional 100ml', '7891033744381', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0150', 'Connexion 100 ml', '7891033277070', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 136.43, 194.90, 'ativo'::produto_status),
  ('ROY-0151', 'Zaad Expedition 95ml', '7891033468980', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 230.93, 329.90, 'ativo'::produto_status),
  ('ROY-0152', 'Egeo Beat 90ml', '7891033487011', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 111.93, 159.90, 'ativo'::produto_status),
  ('ROY-0153', 'Egeo Original 90ml', '7891033498123', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 111.93, 159.90, 'ativo'::produto_status),
  ('ROY-0154', 'Egeo Choc High 90ml', '7891033594368', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 111.93, 159.90, 'ativo'::produto_status),
  ('ROY-0155', 'Egeo Choc High Sufle Hidratante 250g', '7891033584994', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0156', 'L''eau de Lily Soleil 75ml', '7891033496808', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0157', 'L''eau de Lily Blanche 75ml', '7891033868957', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0158', 'Lily Gardênia Eau de Parfum 75ml', '7891033553631', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 216.93, 309.90, 'ativo'::produto_status),
  ('ROY-0159', 'Coffee Man Addictive', '7891033813308', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0160', 'Floratta Flores Secretas 75 ml', '7891033481361', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0161', 'Floratta Rose 75ml', '7891033486359', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0162', 'Floratta Romance de verão 75 ml', '7891033556595', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0163', 'Floratta Cerejeira em Flor', '7891033481422', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0164', 'Floratta Blue 75ml', '7891033254583', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0165', 'Floratta Rose Bouquet 75ml', '7891033482962', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0166', 'Linda Irresistível 100 ml', '7891033817566', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0167', 'Dream Céu de Baunilha Body Splash 200ml', '7891033766215', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 76.93, 109.90, 'ativo'::produto_status),
  ('ROY-0168', 'Liz 100ml', '7891033767007', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0169', 'Liz Aura 100ml', '7891033869909', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0170', 'Liz Aura Creme Hidratante Desodorante Corporal', '7891033869886', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0171', 'Coffee Man Lucky 100ml', '7891033837571', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0172', 'Insensatez 100ml', '7891033481446', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 122.43, 174.90, 'ativo'::produto_status),
  ('ROY-0173', 'Thaty Boticollection 100ml', '7891033197347', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0174', 'Free Boticollection 100ml', '7891033222490', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 115.43, 164.90, 'ativo'::produto_status),
  ('ROY-0175', 'Accordes Harmonia 80 ml', '7891033512133', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 171.43, 244.90, 'ativo'::produto_status),
  ('ROY-0176', 'Men Shower Gel 205g', '7891033560257', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 36.33, 51.90, 'ativo'::produto_status),
  ('ROY-0177', 'O.U.i Scapin 245 (Eau de Parfum)', '7891033820597', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O.U.i' limit 1), 265.30, 379.00, 'ativo'::produto_status),
  ('ROY-0178', 'Coffee Woman Seduction 100ml', '7891033481392', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0179', 'Cuide-se Bem Rosa e Algodão Body Splash 200ml', '7891033511631', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 65.03, 92.90, 'ativo'::produto_status),
  ('ROY-0180', 'Nativa SPA Jasmim Sambac Body Splash 200ml', '7891033820528', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 69.93, 99.90, 'ativo'::produto_status),
  ('ROY-0181', 'Cuide-se Bem Nuvem Óleo Hidratante Corporal 110 ml', '7891033583423', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0182', 'Cuide-se Bem Cereja de Fases Desodorante Hidratante 200ml', '7891033856725', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 38.43, 54.90, 'ativo'::produto_status),
  ('ROY-0183', 'Cuide-se Bem Cereja de Fases Sabonetes em barra 4 unid.', '7891033856794', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 25.83, 36.90, 'ativo'::produto_status),
  ('ROY-0184', 'Cuide-se Bem Cereja de Fases Creme Relaxante Corporal 200g', '7891033856756', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 48.93, 69.90, 'ativo'::produto_status),
  ('ROY-0185', 'Cuide-se Bem Cereja de Fases Oleo Termico Corporal', '7891033879632', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 40.53, 57.90, 'ativo'::produto_status),
  ('ROY-0186', 'Cuide-se Bem Deleite Caramelizado Loção Hidratante 400ml', '7891033896622', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0187', 'Cuide-se Bem Deleite Caramelizado Body Splash 200 ml', '7891033902194', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0188', 'Cuide-se Bem Deleite Manteiga Hidratante 200g', '7891033896585', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 51.03, 72.90, 'ativo'::produto_status),
  ('ROY-0189', 'Cuide-se Bem Algodão doce Sabonetes em barra 4 unid', '7891033859184', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 25.83, 36.90, 'ativo'::produto_status),
  ('ROY-0190', 'Cuide-se Bem Algodão Gel Facial 50g', '7891033860241', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0191', 'Lily Lumière Creme Acetinado Hidratante 250g', '7891033779901', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0192', 'Lily Tradicional Creme Acetinado Hidratante 250g', '7891033480609', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0193', 'Lily Cashmere Creme Acetinado Hidratante 250g', '7891033852390', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0194', 'Lily Soleil Creme Acetinado Hidratante 200g', '7891033894468', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0195', 'Eudora Instance Karite Body Splash 200ml', '7891033877652', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 52.49, 74.99, 'ativo'::produto_status),
  ('ROY-0196', 'Eudora Instance Frutas Vermelhas Body Splash 200ml', '7891033510825', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 52.49, 74.99, 'ativo'::produto_status),
  ('ROY-0197', 'Eudora Instance Rosa Absoluta Body Splash 200ml', '7891033865017', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 52.49, 74.99, 'ativo'::produto_status),
  ('ROY-0198', 'Eudora Instance Baunilha Intensa Body Splash 200ml', '7891033897018', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 52.49, 74.99, 'ativo'::produto_status),
  ('ROY-0199', 'Eudora Instance Frutas Vermelhas Creme Hidratante 400ml', '7891033510658', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 41.99, 59.99, 'ativo'::produto_status),
  ('ROY-0200', 'Eudora Instance Baunilha Intensa Creme Hidratante 400ml', '7891033862252', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 41.99, 59.99, 'ativo'::produto_status),
  ('ROY-0201', 'Eudora Instance Karite Creme Hidratante 400ml', '7891033510740', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 41.99, 59.99, 'ativo'::produto_status),
  ('ROY-0202', 'Eudora Imensi Body Spray 100ml', '7891033586417', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 33.59, 47.99, 'ativo'::produto_status),
  ('ROY-0203', 'Eudora Instance Maracujá Creme Relaxante 180ml', '7891033530175', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 26.59, 37.99, 'ativo'::produto_status),
  ('ROY-0204', 'Eudora Instance Baunilha Creme p maos 30g', '7891033862269', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 16.09, 22.99, 'ativo'::produto_status),
  ('ROY-0205', 'Eudora Instance Baunilha Sabonete liquido 200ml', '7891033862276', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 27.99, 39.99, 'ativo'::produto_status),
  ('ROY-0206', 'Cuide-se Bem Framboesa Loção Hidratante 400ml', '7891033537945', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0207', 'Nativa SPA Ameixa Loção Nutritiva 400ml', '7891033482825', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 60.83, 86.90, 'ativo'::produto_status),
  ('ROY-0208', 'Nativa SPA Cereja Rouge Loção Aveludada 400ml', '7891033578290', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 60.83, 86.90, 'ativo'::produto_status),
  ('ROY-0209', 'Cuide-se Bem Deleite Loção Hidratante 400ml', '7891033851249', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0210', 'Cuide-se Bem Algodão Doce Loção Hidratante 400ml', '7891033859160', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0211', 'Tododia Framboesa e Pimenta Rosa Creme Iluminador 125 ml', '7909883263195', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 41.93, 59.90, 'ativo'::produto_status),
  ('ROY-0212', 'Ekos Castanha Refil Frescor 150ml', '7908132261692', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 74.13, 105.90, 'ativo'::produto_status),
  ('ROY-0213', 'Ekos Andiroba Esfoliante Termico 100g', '7909883201326', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0214', 'Lumina Essência Sublime Perfume para Cabelos 30ml', '7909883237233', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0215', 'Lily Creme Acetinado Hidratante  Refil 250g', '7891033480623', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0216', 'Cuide-se Bem Boa Noite Loção Hidratante Refil 350ml', '7891033498796', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 41.93, 59.90, 'ativo'::produto_status),
  ('ROY-0217', 'Nativa SPA Orquídea Noire Loção Noturna Refil 350ml', '7891033499571', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 47.53, 67.90, 'ativo'::produto_status),
  ('ROY-0218', 'Eudora Instance Obsessão por Baunilha Creme Hidratante Refil 350ml', '7891033871360', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0219', 'Lumina Óleo Bifásico Nutrição 100ml', '7909883346362', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0220', 'Lumina Definição Intensa Gelatina Cabelos Cacheados e Crespos 240g', '7909883130404', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 41.23, 58.90, 'ativo'::produto_status),
  ('ROY-0221', 'Tododia Sabonete em Barra Alecrim e Sálvia Caixa c/ 5', '7908132220231', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 24.43, 34.90, 'ativo'::produto_status),
  ('ROY-0222', 'Tododia Sabonete em Barra Cereja Negra e Praliné Caixa c/ 5', '7909883248819', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 24.43, 34.90, 'ativo'::produto_status),
  ('ROY-0223', 'Tododia Sabonete em Barra Maçã Caramelizada e Baunilha Caixa c/ 5', '7909883270063', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 24.43, 34.90, 'ativo'::produto_status),
  ('ROY-0224', 'Ekos Sabonetes Cremoso Cupuaçu 4x100g', '7909883343163', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.13, 45.90, 'ativo'::produto_status),
  ('ROY-0225', 'Ekos Sabonetes Cremosos 4x100g', '7909883206963', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.13, 45.90, 'ativo'::produto_status),
  ('ROY-0226', 'Ekos Nectar Corpo Maracuja', '7909883048655', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0227', 'Cuide-se Bem Maçã Verde Loção Hidratante 200ml', '7891033536856', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0228', 'Cuide-se Bem Coco Creme Esfoliante 150ml', '7891033536849', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0229', 'Cuide-se Bem Seiva de Babosa Creme de Pentear Antinós 200ml', '7891033551057', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0230', 'Cuide-se Bem Shampoo Vinagre Framboesa 230ml', '7891033551040', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 18.13, 25.90, 'ativo'::produto_status),
  ('ROY-0231', 'Cuide-se Bem Feira Cx de Sabonete com 4 unid', '7891033537921', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0232', 'Lumina Nutrição de Nanoprecisão Shampoo 300ml', '7909883346270', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 37.03, 52.90, 'ativo'::produto_status),
  ('ROY-0233', 'Lumina Nutrição de Nanoprecisão Condicionador 300 ml', '7909883346300', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.13, 55.90, 'ativo'::produto_status),
  ('ROY-0234', 'Lumina Nutrição de Nanoprecisão Máscara 250ml', '7909883346126', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0235', 'Lumina Nutrição de Nanoprecisão Óleo Bifásico 100ml', '7909883346362', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0236', 'Lumina Antissinais Regenerador Capilar Shampoo 300ml', '7909883246792', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0237', 'Lumina Antissinais Regenerador Capilar Condicionador 300ml', '7909883246785', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 41.93, 59.90, 'ativo'::produto_status),
  ('ROY-0238', 'Lumina Antissinais Regenerador Capilar Sérum de Prevenção 100ml', '7909883246877', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 66.43, 94.90, 'ativo'::produto_status),
  ('ROY-0239', 'Lumina Antissinais Regenerador Capilar Máscara 250g', '7909883246808', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0240', 'Lumina Hidratação e Proteção Antipoluição Máscara 250g', '7909883346201', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 55.93, 79.90, 'ativo'::produto_status),
  ('ROY-0241', 'Ekos Alma Eau de Parfum 50ml', '7909883134167', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0242', 'Ekos Pedra Eau de Parfum 50ml', '7909883134143', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0243', 'Power Stay Deo Parfum 50ml', '7909189376629', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0244', 'Attraction Closer Para Ela Deo Parfum 50ml', '7909189327478', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Avon' limit 1), 94.43, 134.90, 'ativo'::produto_status),
  ('ROY-0245', 'Tododia Body Splash Kit com 3 Miniaturas 3x60ml', '7909883365981', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 0.00, 0, 'ativo'::produto_status),
  ('ROY-0246', 'Luna Clássico Tradicional 75ml', '7899563226278', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 130.13, 185.90, 'ativo'::produto_status),
  ('ROY-0247', 'Luna Glow Body Splash Iluminador 200ml', '7909883407445', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.03, 92.90, 'ativo'::produto_status),
  ('ROY-0248', 'Luna Absoluta 75 ml', '7908240854021', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 130.13, 185.90, 'ativo'::produto_status),
  ('ROY-0249', 'Luna Absoluta Body Splash Iluminador 200ml', '7909883483814', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 65.03, 92.90, 'ativo'::produto_status),
  ('ROY-0250', 'Luna Nuit Desodorante Hidratante Corporal Perfumado 300ml', '7909883358853', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 67.13, 95.90, 'ativo'::produto_status),
  ('ROY-0251', 'Luna Intenso Creme Hidratante Corporal Pote 200g', '7909883308742', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 94.43, 134.90, 'ativo'::produto_status),
  ('ROY-0252', 'Biografia Assinatura Feminino 100ml', '7908132240864', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0253', 'Biografia Assinatura Desodorante Hidratante Corporal 300ml', '7909883386719', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 67.13, 95.90, 'ativo'::produto_status),
  ('ROY-0254', 'Sintonia Shampoo Cabelo e Corpo 100ml', '7908371673911', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.13, 45.90, 'ativo'::produto_status),
  ('ROY-0255', 'Homem Evolut.io Shampoo Cabelo, Corpo e Barba 125ml', '7909883251048', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 42.63, 60.90, 'ativo'::produto_status),
  ('ROY-0256', 'Homem Cor.agio Balm Pós Barba 75ml', '7909883308667', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 53.13, 75.90, 'ativo'::produto_status),
  ('ROY-0257', 'Essencial Feminino Creme Hidratante para as Mãos 40g', '7908371667552', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 33.53, 47.90, 'ativo'::produto_status),
  ('ROY-0258', 'Essencial Feminino Deo Corporal 100ml', '7908240893518', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 39.83, 56.90, 'ativo'::produto_status),
  ('ROY-0259', 'Ekos Cupuaçu Creme Esfoliante para o Bumbum 190g', '7909883343057', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 59.43, 84.90, 'ativo'::produto_status),
  ('ROY-0260', 'Ekos Cupuaçu Creme Firmador para o Corpo 400ml', '7909883343040', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0261', 'Ekos Cupuaçu Creme Firmador para o Bumbum 200g', '7909883343071', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 74.13, 105.90, 'ativo'::produto_status),
  ('ROY-0262', 'Ekos Cupuaçu Cx Sabonete 4x100g', '7909883365356', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.13, 45.90, 'ativo'::produto_status),
  ('ROY-0263', 'Tododia Manteiga Desodorante Jambo Rosa e Flor de Caju 200g', '7909883234645', (select id from categorias where nome = 'Desodorantes' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 59.43, 84.90, 'ativo'::produto_status),
  ('ROY-0264', 'Tododia Oleo em Creme Nutritivo Jambo Rosa e Flor de Caju 200ml', '7909883234751', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 59.43, 84.90, 'ativo'::produto_status),
  ('ROY-0265', 'Tododia Geleia Iluminadora Corporal Jambo Rosa e Flor de Caju 100g', '7909883234621', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 41.93, 59.90, 'ativo'::produto_status),
  ('ROY-0266', 'Tododia Sabonete em Barra Morango e Baunilha Dourada Caixa c/5x90g', '7909883365165', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 24.43, 34.90, 'ativo'::produto_status),
  ('ROY-0267', 'Tododia Esfoliante para o Corpo Morango e Baunilha Dourada 190g', '7909883385163', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 35.63, 50.90, 'ativo'::produto_status),
  ('ROY-0268', 'Tododia Creme Merengue para o Corpo Morango e Baunilha Dourada 250g', '7909883365196', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 59.43, 84.90, 'ativo'::produto_status),
  ('ROY-0269', 'Eudora Siàge Cica Therapy Shampoo Pump 400ml', '7891033559572', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 47.59, 67.99, 'ativo'::produto_status),
  ('ROY-0270', 'Eudora Siàge Cica Therapy Condicionador Pump 400ml', '7891033559589', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 51.09, 72.99, 'ativo'::produto_status),
  ('ROY-0271', 'Eudora Siàge Pro Cronology Curvas Shampoo 250ml', '7891033583072', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0272', 'Eudora Siàge Pro Cronology Curvas Condicionador 250ml', '7891033583089', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 37.09, 52.99, 'ativo'::produto_status),
  ('ROY-0273', 'Eudora Siàge Pro Cronology Curvas Creme p Pentear 300ml', '7891033583102', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 38.49, 54.99, 'ativo'::produto_status),
  ('ROY-0274', 'Eudora Siàge Pro Cronology Curvas Cronograma Capilar 250g', '7891033557646', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 97.93, 139.90, 'ativo'::produto_status),
  ('ROY-0275', 'Eudora Siàge Cauterização dos Fios Shampoo 250 ml', '7891033534289', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0276', 'Eudora Siàge Cauterização dos Fios Condicionador 200 ml', '7891033534302', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 37.09, 52.99, 'ativo'::produto_status),
  ('ROY-0277', 'Eudora Bad Intention 100ml', null, (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 111.93, 159.90, 'ativo'::produto_status),
  ('ROY-0278', 'Eudora Diva Suprema 100ml', null, (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 104.93, 149.90, 'ativo'::produto_status),
  ('ROY-0279', 'Tododia Amora e Óleo de Coco Gelatina Capilar 250g', '7909883243913', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0280', 'Tododia Repara Máscara Concentrada Capilar 250ml', '7909883161224', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 34.93, 49.90, 'ativo'::produto_status),
  ('ROY-0281', 'Eudora Siàge Volume Imediato (Shampoo - Bisnaga) 250ml', '7891033875573', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0282', 'Eudora Siàge Volume Imediato (Condicionador - Bisnaga)200ml', '7891033875580', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 37.09, 52.99, 'ativo'::produto_status),
  ('ROY-0283', 'Eudora Siàge Volume Imediato Sérum Capilar Pró-Volume 100ml', '7891033879502', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 48.99, 69.99, 'ativo'::produto_status),
  ('ROY-0284', 'Tododia Amora e Óleo de Coco Spray Revitalizador 200ml', '7909883243845', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 32.13, 45.90, 'ativo'::produto_status),
  ('ROY-0285', 'Eudora Siàge Revela os Cachos Creme de Pentear Restauração Intensa 270ml', '7891033534647', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 38.49, 54.99, 'ativo'::produto_status),
  ('ROY-0286', 'Eudora Siàge Cica Therapy Shampoo Bisnaga 250ml', '7891033198160', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 34.99, 49.99, 'ativo'::produto_status),
  ('ROY-0287', 'Eudora Siàge Cica Therapy Condicionador Bisnaga 200ml', '7891033070664', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 37.09, 52.99, 'ativo'::produto_status),
  ('ROY-0288', 'Eudora Siàge Volume Imediato Máscara Volumizadora 250g', '7891033875597', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 51.09, 72.99, 'ativo'::produto_status),
  ('ROY-0289', 'Eudora Siàge Resgate Imediato Máscara Balm Preenchedora 250g', '7891033558049', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 51.09, 72.99, 'ativo'::produto_status),
  ('ROY-0290', 'Eudora Siàge Cauterização dos Fios Máscara Cauterização Imediata 250g', '7891033534333', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 51.09, 72.99, 'ativo'::produto_status),
  ('ROY-0291', 'Sève Amêndoas Doces (Creme Corporal Perfumado) 200g', '7909883283865', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 79.03, 112.90, 'ativo'::produto_status),
  ('ROY-0292', 'Sève Amêndoas e Orquídea Negra (Creme Corporal Perfumado) 200g', '7909883283858', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 79.03, 112.90, 'ativo'::produto_status),
  ('ROY-0293', 'La Victorie Creme Acetinado Hidratante 250g', '7891033129676', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 83.99, 119.99, 'ativo'::produto_status),
  ('ROY-0294', 'La Victorie Eau de Parfum 75ml', '7891033495436', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Eudora' limit 1), 188.93, 269.90, 'ativo'::produto_status),
  ('ROY-0295', 'Hot Wheels Speed Club 25ml', '7899952327692', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0296', 'Toy Story Woody 25ml', '7899952324509', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0297', 'Meu Malvado Favorito 4 Minions 25ml', '7899952326237', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0298', 'Toy Story Buzz 25ml', '7899952324486', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0299', 'Meu Malvado Favorito 4 Agnes 25ml', '7899952326220', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0300', 'Toy Story Betty 25ml', '7899952324516', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0301', 'Turma da Mônica Cebolinha 25ml', '7899952324523', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0302', 'Candy Land Pipoca Doce 25ml', '7899952330036', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0303', 'Barbie Sunshine 25ml', '7899952325612', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 27.93, 39.90, 'ativo'::produto_status),
  ('ROY-0304', 'Royal Madeira 25ml', '7899952327968', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 34.93, 49.90, 'ativo'::produto_status),
  ('ROY-0305', 'Carlinhos Maia 25ml', '7899952317273', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Jequiti' limit 1), 34.93, 49.90, 'ativo'::produto_status),
  ('ROY-0306', 'Kit Quasar Vision Masc (namorados)', '7891033899661', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 140.16, 164.90, 'ativo'::produto_status),
  ('ROY-0307', 'Kit Floratta Red (namorados)', '7891033899630', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 144.41, 169.90, 'ativo'::produto_status),
  ('ROY-0308', 'Kit Clash Masc (namorados)', '7891033855742', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 157.16, 184.90, 'ativo'::produto_status),
  ('ROY-0309', 'Kit Nativa Spa Orquidea Lumiére (Namorados)', '7891033899708', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 97.67, 114.90, 'ativo'::produto_status),
  ('ROY-0310', 'Kit Cuide-se bem amoruda (Namorados)', '7891033899692', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 84.92, 99.90, 'ativo'::produto_status),
  ('ROY-0311', 'Kit Floratta Red Passion (namorados)', '7891033899593', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 203.91, 239.90, 'ativo'::produto_status),
  ('ROY-0312', 'Kit Malbec Tradicional (Natal)', '7891033862016', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 50.91, 59.90, 'ativo'::produto_status),
  ('ROY-0313', 'Kit Floratta Red (Natal)', '7891033862030', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 50.91, 59.90, 'ativo'::produto_status),
  ('ROY-0314', 'Kit Lily (Mães)', '7891033893126', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 152.91, 179.90, 'ativo'::produto_status),
  ('ROY-0315', 'Kit Cuide-se Bem Deleite (Mães)', '7891033893188', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 84.92, 99.90, 'ativo'::produto_status),
  ('ROY-0316', 'Kit Her Code (Mães)', '7891033902002', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 139.31, 163.90, 'ativo'::produto_status),
  ('ROY-0317', 'Kit Elysée Tradicional (Mães)', '7891033893041', (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'O Boticário' limit 1), 339.91, 399.90, 'ativo'::produto_status),
  ('ROY-0318', 'Kit Tododia Flores Miniatura (Mães)', '7909883345907', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 93.03, 132.90, 'ativo'::produto_status),
  ('ROY-0319', 'Kit Tododia Framboesa Miniaturas Natal', '7909883279332', (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 62.93, 89.90, 'ativo'::produto_status),
  ('ROY-0320', 'Kit Tododia Flor de Pera e Melissa Mini', null, (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 30.03, 42.90, 'ativo'::produto_status),
  ('ROY-0321', 'Kit Tododia Morango e Baunilha Dourada Mini', null, (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 52.43, 74.90, 'ativo'::produto_status),
  ('ROY-0322', 'Kit Tododia Pessego e Flor de Cravo Mini', null, (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 45.43, 64.90, 'ativo'::produto_status),
  ('ROY-0323', 'Kit Essencial Oud Masc', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 164.43, 234.90, 'ativo'::produto_status),
  ('ROY-0324', 'Kit Essencial Oud Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 181.93, 259.90, 'ativo'::produto_status),
  ('ROY-0325', 'Kit Essencial Exclusivo Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 167.93, 239.90, 'ativo'::produto_status),
  ('ROY-0326', 'Kit Essencial Safran Masc', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 157.43, 224.90, 'ativo'::produto_status),
  ('ROY-0327', 'Kit Essencial Safran Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0328', 'Kit Essencial Atrai Masc', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 160.93, 229.90, 'ativo'::produto_status),
  ('ROY-0329', 'Kit Essencial Atrai Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 146.93, 209.90, 'ativo'::produto_status),
  ('ROY-0330', 'Kit Essencial Trad Masc', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 157.43, 224.90, 'ativo'::produto_status),
  ('ROY-0331', 'Kit Essencial Trad Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 157.43, 224.90, 'ativo'::produto_status),
  ('ROY-0332', 'Kit Biografia Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 136.43, 194.90, 'ativo'::produto_status),
  ('ROY-0333', 'Kit Ilia Tradicional', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 153.93, 219.90, 'ativo'::produto_status),
  ('ROY-0334', 'Kit KaiakOceano Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0335', 'Kit Kaiak Aventura Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0336', 'Kit Madeira em Flor', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 101.43, 144.90, 'ativo'::produto_status),
  ('ROY-0337', 'Kit Tododia Noz Peca e Cacau', null, (select id from categorias where nome = 'Corpo e Banho' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 83.93, 119.90, 'ativo'::produto_status),
  ('ROY-0338', 'Kit Breu Branco', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 80.43, 114.90, 'ativo'::produto_status),
  ('ROY-0339', 'Kit Miniatura  Essencial Fem', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 185.43, 264.90, 'ativo'::produto_status),
  ('ROY-0340', 'Kit Miniatura Perf Fem', null, (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 132.93, 189.90, 'ativo'::produto_status),
  ('ROY-0341', 'Kit Ekos Cacau e Cupuaçu', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), (select id from fornecedores where razao_social = 'Natura' limit 1), 118.93, 169.90, 'ativo'::produto_status),
  ('ROY-0342', 'Bolsa fem c/ trans c zíper na aba - nude', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 209.00, 418.00, 'ativo'::produto_status),
  ('ROY-0343', 'Bolsa fem tiracolo 3 divisórias - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 269.00, 538.00, 'ativo'::produto_status),
  ('ROY-0344', 'Bolsa matelassê tiracolo - preta', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 79.00, 158.00, 'ativo'::produto_status),
  ('ROY-0345', 'Bolsa alça de mão fixa - vermelha', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 142.00, 284.00, 'ativo'::produto_status),
  ('ROY-0346', 'Bolsa de ombro feminina - nude', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 59.00, 118.00, 'ativo'::produto_status),
  ('ROY-0347', 'Bolsa tiracolo bordado - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 299.00, 598.00, 'ativo'::produto_status),
  ('ROY-0348', 'Bolsa tiracolo recortes - preta', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 79.00, 158.00, 'ativo'::produto_status),
  ('ROY-0349', 'Bolsa alça adaptável - preta', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 89.00, 178.00, 'ativo'::produto_status),
  ('ROY-0350', 'Bolsa tote tiracolo - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 314.00, 628.00, 'ativo'::produto_status),
  ('ROY-0351', 'Bolsa tote tiracolo - nude', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 314.00, 628.00, 'ativo'::produto_status),
  ('ROY-0352', 'Bolsa alça ajustável - castor', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 171.00, 342.00, 'ativo'::produto_status),
  ('ROY-0353', 'Bolsa transversal matelassê - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 209.00, 418.00, 'ativo'::produto_status),
  ('ROY-0354', 'Bolsa transversal matelassê - castor', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 209.00, 418.00, 'ativo'::produto_status),
  ('ROY-0355', 'Bolsa transversal matelassê - prata', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 209.00, 418.00, 'ativo'::produto_status),
  ('ROY-0356', 'Bolsa baguete alça dupla', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 224.00, 448.00, 'ativo'::produto_status),
  ('ROY-0357', 'Bolsa fecho giratório - castor', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 224.00, 448.00, 'ativo'::produto_status),
  ('ROY-0358', 'Bolsa shopper quadrada - castor', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 89.00, 178.00, 'ativo'::produto_status),
  ('ROY-0359', 'Bolsa alça dupla croco - vermelha', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 261.00, 522.00, 'ativo'::produto_status),
  ('ROY-0360', 'Bolsa tote médio drapeada - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 261.00, 522.00, 'ativo'::produto_status),
  ('ROY-0361', 'Carteira masc. porta cartão - preta', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 76.00, 152.00, 'ativo'::produto_status),
  ('ROY-0362', 'Carteira fem clássica - preta', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 153.00, 306.00, 'ativo'::produto_status),
  ('ROY-0363', 'Carteira fem fech. ref 18348 - vermelha', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 94.00, 188.00, 'ativo'::produto_status),
  ('ROY-0364', 'Mochila feminina - cacau', null, (select id from categorias where nome = 'Bolsas e Carteiras' limit 1), null, 119.00, 238.00, 'ativo'::produto_status),
  ('ROY-0365', 'Chaveiro couro e metal', null, (select id from categorias where nome = 'Acessorios e Kits' limit 1), null, 34.00, 68.00, 'ativo'::produto_status),
  ('ROY-0366', 'PERF MA AL ATHENA 100 ML', '6290360599243', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 200.00, 400.00, 'ativo'::produto_status),
  ('ROY-0367', 'PERF LATTAFA DALAL EDP 100 ML', '6290360598925', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 260.00, 520.00, 'ativo'::produto_status),
  ('ROY-0368', 'PERF LATTAFA ASAD TRAD PRETO 100 ML', '6291108735411', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 150.00, 300.00, 'ativo'::produto_status),
  ('ROY-0369', 'PERF LATTAFA ASAD BOURBOUN 100 ML', '6290362340362', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 200.00, 400.00, 'ativo'::produto_status),
  ('ROY-0370', 'PERF AL WATAR AL WESAL 100 ML', '5055810014933', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 120.00, 240.00, 'ativo'::produto_status),
  ('ROY-0371', 'PERF ARMAF CDN ICONIC MAS 105 ML', '6294015164152', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 230.00, 460.00, 'ativo'::produto_status),
  ('ROY-0372', 'PERF ARMAF CDN INTENSE MAS 105 ML', '6085010044712', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 195.00, 390.00, 'ativo'::produto_status),
  ('ROY-0373', 'PERF LATTAFA KHAMRAH EDP TRAD', '6291108737194', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 160.00, 320.00, 'ativo'::produto_status),
  ('ROY-0374', 'PERF MA AL SALVO TRADICIONAL 100 ML', '6291107459363', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 130.00, 260.00, 'ativo'::produto_status),
  ('ROY-0375', 'PERF LATTAFA OPULENT DUBAI EDP 100 ML', '6290362341321', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 150.00, 300.00, 'ativo'::produto_status),
  ('ROY-0376', 'PERF DREAM OF HAZE EDP 100 ML', '6290362347163', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 210.00, 420.00, 'ativo'::produto_status),
  ('ROY-0377', 'PERF LATTAFA AFEEF 100 ML', null, (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 380.00, 760.00, 'ativo'::produto_status),
  ('ROY-0378', 'PERF LATTAFA MUSAMAM WHITE 100 ML', '6290360593159', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 250.00, 500.00, 'ativo'::produto_status),
  ('ROY-0379', 'PERF LATTAFA THARWAH GOLD 100 ML', '6291108738177', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 270.00, 540.00, 'ativo'::produto_status),
  ('ROY-0380', 'PERF LATTAFA FAKHAR ROSE 100 ML', '6291107456041', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 180.00, 360.00, 'ativo'::produto_status),
  ('ROY-0381', 'PERF ORIENTICA ROYAL AMBER 80 ML', '6291106811568', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 350.00, 700.00, 'ativo'::produto_status),
  ('ROY-0382', 'PERF LATTAFA VICTORIA EDP 100 ML', '6290360598789', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 180.00, 360.00, 'ativo'::produto_status),
  ('ROY-0383', 'PERF DURRAT AL AROOS 80 ML', '5055810012786', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 120.00, 240.00, 'ativo'::produto_status),
  ('ROY-0384', 'PERF LATTAFA AMEERAT AL ARAB ROSA 100 ML', '6290360590868', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 120.00, 240.00, 'ativo'::produto_status),
  ('ROY-0385', 'PERF AL WA SHAGAF AL WARD 100 ML', '5055810007720', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 140.00, 280.00, 'ativo'::produto_status),
  ('ROY-0386', 'PERF LATTAFA YARA ELIXIR 100 ML', '6290362346531', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 180.00, 360.00, 'ativo'::produto_status),
  ('ROY-0387', 'PERF LATTAFA YARA ROSE TRAD 100 ML', '6291108730515', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 150.00, 300.00, 'ativo'::produto_status),
  ('ROY-0388', 'PERF LATTAFA ECLAIRE EDP 100 ML', '6290362340638', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 170.00, 340.00, 'ativo'::produto_status),
  ('ROY-0389', 'PERF AL WA SABAH AL WARD 100 ML', '5055810013110', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 90.00, 180.00, 'ativo'::produto_status),
  ('ROY-0390', 'PERF ZAKAT WORLD EDP TRAD 80 ML COPA', '6290362711292', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 365.00, 730.00, 'ativo'::produto_status),
  ('ROY-0391', 'PERF ZAKAT WORLD VIP EDP 80 ML COPA', '6290362711308', (select id from categorias where nome = 'Perfumaria' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 365.00, 730.00, 'ativo'::produto_status),
  ('ROY-0392', 'AROMATIZADOR HAYA 450 ML', '6290360597188', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 69.00, 138.00, 'ativo'::produto_status),
  ('ROY-0393', 'AROMATIZADOR MOHRA 450 ML', '6290360597225', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 69.00, 138.00, 'ativo'::produto_status),
  ('ROY-0394', 'AROMATIZADOR SHAHD 450 ML', '6290360597249', (select id from categorias where nome = 'Cabelos' limit 1), (select id from fornecedores where razao_social = 'Perfumaria Árabe' limit 1), 69.00, 138.00, 'ativo'::produto_status)
on conflict (sku) do update set
  nome = excluded.nome, codigo_barras = excluded.codigo_barras,
  categoria_id = excluded.categoria_id, fornecedor_principal_id = excluded.fornecedor_principal_id,
  custo_aquisicao = excluded.custo_aquisicao, preco_venda_padrao = excluded.preco_venda_padrao;

-- ESTOQUE INICIAL (entrada de inventario)
delete from movimentos_estoque where origem_tipo = 'SEED_PLANILHA';
insert into movimentos_estoque (produto_id, tipo, quantidade, localizacao, custo_unitario, origem_tipo, observacao)
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0001'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0002'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0003'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0004'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0005'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0006'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0007'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0008'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0009'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0010'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0011'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0012'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0013'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0014'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0015'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0016'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0017'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0018'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0019'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0020'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0021'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0022'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0023'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0024'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0025'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0026'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0027'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0028'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0029'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0030'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0031'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0032'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0033'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0034'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0035'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0036'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0037'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0038'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0039'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0040'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0041'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0042'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0043'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0044'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0045'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0046'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0047'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0048'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0049'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0050'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0051'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0052'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0053'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0054'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0055'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0056'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0057'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0058'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0059'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0060'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0061'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0062'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0063'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0064'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0065'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0066'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0067'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0068'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0069'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0070'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0071'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0072'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0073'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0074'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0075'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0076'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0077'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0078'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0079'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0080'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0081'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0082'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0083'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0084'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0085'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0086'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0087'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0088'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0089'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0090'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0091'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0092'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0093'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0094'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0095'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0096'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0097'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0098'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0099'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0100'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0101'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0102'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0103'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0104'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0105'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0106'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0107'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0108'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0109'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0110'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0111'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0112'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0113'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0114'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0115'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0116'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0117'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0118'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0119'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0120'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0121'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0122'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0123'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0124'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0125'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0126'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0127'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0128'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0129'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0130'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0131'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0132'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0133'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0134'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0135'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0136'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0137'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0138'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0139'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0140'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0141'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0142'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0143'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0144'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0145'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0146'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0147'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0148'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0149'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0150'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0151'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0152'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0153'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0154'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0155'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0156'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0157'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0158'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0159'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0160'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0161'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0162'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0163'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0164'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0165'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0166'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0167'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0168'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0169'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0170'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0171'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0172'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0173'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0174'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0175'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0176'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0177'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0178'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0179'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0180'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0181'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0182'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0183'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0184'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0185'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0186'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0187'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0188'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0189'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0190'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0191'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0192'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0193'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0194'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0195'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0196'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0197'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 6.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0198'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0199'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 5.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0200'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0201'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0202'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0203'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0204'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0205'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0206'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0207'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0208'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0209'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0210'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0211'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0212'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0213'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0214'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0215'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0216'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0217'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0218'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0219'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0220'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0221'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0222'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0223'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0224'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0225'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0226'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0227'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0228'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0229'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0230'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0231'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0232'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0233'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0234'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0235'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0236'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0237'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0238'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0239'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0240'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0241'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0242'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0243'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0244'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0245'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0246'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0247'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0248'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0249'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0250'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0251'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0252'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0253'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0254'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0255'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0256'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0257'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0258'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0259'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0260'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0261'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0262'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0263'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0264'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0265'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0266'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0267'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0268'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0269'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0270'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0271'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0272'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0273'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0274'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0275'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0276'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0277'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0278'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0279'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0280'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0281'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0282'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0283'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0284'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0285'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0286'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0287'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0288'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0289'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0290'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0291'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0292'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0293'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0294'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0295'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0296'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0297'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0298'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0299'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0300'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 11.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0301'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0302'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0303'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0304'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0305'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0306'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0307'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0308'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0309'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0310'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0311'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 3.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0312'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0313'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 4.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0314'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 2.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0315'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0316'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0317'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0318'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0319'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0320'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0321'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0322'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0323'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0324'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0325'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0326'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0327'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0328'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0329'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0330'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0331'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0332'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0333'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0334'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0335'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0336'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0337'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0338'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0339'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0340'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0341'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0342'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0343'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0344'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0345'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0346'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0347'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0348'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0349'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0350'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0351'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0352'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0353'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0354'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0355'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0356'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0357'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0358'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0359'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0360'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0361'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0362'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0363'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0364'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0365'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0366'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0367'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0368'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0369'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0370'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0371'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0372'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0373'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0374'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0375'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0376'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0377'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0378'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0379'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0380'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0381'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0382'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0383'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0384'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0385'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0386'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0387'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0388'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0389'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0390'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0391'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0392'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0393'
union all
select id, 'ENTRADA_COMPRA'::movimento_tipo, 1.000, 'Loja'::localizacao_estoque, custo_aquisicao, 'SEED_PLANILHA', 'Saldo inicial planilha' from produtos where sku = 'ROY-0394';

commit;