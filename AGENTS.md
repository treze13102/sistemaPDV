# Mont Royal (app Kyte) — plano e regras para agentes

Este app é a **migração do sistema Royal** (`../../14 - ROYAL`, React + TS + Supabase) para o **design system Kyte** (esta pasta). A prioridade é o design system e as funcionalidades deste app, **usando o banco de dados do Royal sem alterações destrutivas**.

## Regras inegociáveis

1. **Banco de dados do Royal intacto.** Mesmo projeto Supabase do Royal. Só migrations **aditivas** (novas tabelas/colunas com default, novas funções). Nunca `drop`, `rename`, `alter type` destrutivo, nem `delete` em massa. Migrations ficam em `../../14 - ROYAL/supabase/migrations/` e terminam com `notify pgrst, 'reload schema';`. O usuário roda no SQL Editor.
2. **Nunca colocar `SUPABASE_SECRET_KEY`/service role em `.env` do Vite.** Só `VITE_SUPABASE_URL` e a anon key.
3. **Não fazer `git commit`/`push`** — o usuário usa GitHub Desktop. Só se pedido explicitamente.
4. **Nada pode ser digitado e perdido.** Se uma tela ainda não grava no banco, ela chama `update()` do store, que mostra o aviso "Esta função ainda não está ligada ao banco". Campos sem coluna correspondente ficam escondidos.
5. Textos da interface em **português do Brasil**, moeda BRL (`readPrefs().currency === "BR"`).
6. Marca: **"Mont Royal" no layout Kyte, com as cores do Kyte** (verde `#2dd1ac`, rail `#363f4d`).
7. **Atualizar este `AGENTS.md` ao final de cada etapa implementada**, registrando o que foi concluído, as verificações feitas, as pendências e o próximo passo. Não marcar migrations como aplicadas sem confirmação.

## Arquitetura

- Vite 5, **multipágina**: cada rota é um HTML estático (`routes.json` → `scripts/pages.mjs`, build em `scripts/build.mjs`). Ao criar rota nova, adicione em `routes.json` e trate em `src/app/App.jsx` (`switch` por `page`/`sub`). Reinicie o dev server depois.
- Dev: `node node_modules/vite/bin/vite.js . --port 5175 --strictPort` (config `montroyal-kyte` em `../../14 - ROYAL/.claude/launch.json`). Build: `npm run build`.
- Alias **`@` → `src/royal`**: cópia da `lib`, `hooks`, `types` e `contexts` do Royal (TypeScript). **Reaproveite os hooks do Royal** (`@/hooks/useFinanceiro`, `useFornecedores`, `usePedidosCompra`, `useEstoque`, `useRelatorios`, `useFluxoCaixa`...) em vez de reescrever queries. Ao alterar algo em `src/royal`, considere replicar no Royal.
- `src/app/store.jsx`: React Query + `Provider`. `carregarLoja()` lê o banco e converte para o formato Kyte (`products`, `categories`, `customers`, `sales`, `users`...). Escritas ficam em `actions` (todas chamam `recarregar()` no fim). `update()` é stub de aviso.
- Utilitários exportados do store: `useStore`, `useMoney`, `fmtDate`, `fmtTime`, `fmtDateTime`, `fmtDia` (data `YYYY-MM-DD` sem fuso), `parseMoney`, `semAcento`, `initials`, `uid`, `readPrefs`.
- Estatísticas usa `@/hooks/useEstatisticas` (vendas concluídas paginadas no período + taxas registradas) e `@/lib/estatisticas` (intervalos locais com fim exclusivo, rateio de descontos, pagamentos mistos e troco). Não usar `data.sales` nessa tela: a carga resumida da loja só traz as últimas 1000 vendas. O lucro é explicitamente estimado pelo custo atual dos produtos, pois os itens não guardam custo histórico. Alterações da loja invalidam `['relatorios']`.
- UI: componentes em `src/app/Shell.jsx` (`PageHeader`, `Toolbar`, `SearchInput`, `SidePanel`, `Field`, `Switch`, `PillTabs`, `GreenButton`, `TextAction`, `EmptyState`) e `src/config/ui.jsx` (`Icon`, `Modal`). Estilos em `src/app/kyte.css` e `src/config/config.css`. **Use as classes existentes**; não introduza Tailwind/outra lib.
- **Layout de todas as telas:** `.page` usa `width: 100%`, `max-width: var(--k-page-max)` (1593px) e `margin: 0 auto`, centralizado na área útil depois do rail. Não remover o limite da tela Vender. A grade preenche a largura com até cinco colunas; grade e carrinho dividem a altura disponível, com rolagem própria, e se empilham em telas menores. Formulários, tabelas, cabeçalhos e barras de ação devem se ajustar sem ultrapassar a área da página.
- Login real via `supabase.auth` (`src/login/Login.jsx`); `App.jsx` redireciona para `/login/` sem sessão.

## Regras de negócio do Royal (não quebrar)

- **Paginação**: PostgREST corta em 1000 linhas. Use `buscarTodos` (`@/lib/buscarTodos`, `.range()`) para listas grandes (produtos ~1070).
- **Estoque é um razão** (`movimentos_estoque`). Saldo vem da view `v_estoque_saldo` (que nega `SAIDA_*`). Quantidade de saída é sempre positiva; só `AJUSTE_INVENTARIO` aceita delta com sinal. Mudar estoque no cadastro = inserir `AJUSTE_INVENTARIO` com o delta.
- **Vendas são transacionais** via RPC: `finalizar_venda`, `editar_venda`, `cancelar_venda` (migration `20261114000001_venda_transacional.sql`). Totais calculados no servidor; pagamentos têm que cobrir o total e parcelas somar o valor financiado. Erros traduzidos por `traduzirErroRpc`.
- **Recebíveis**: `construirRecebiveis` + `conferirPlanos` (`@/lib/recebiveis`), placeholder `'{numero}'`, taxas por bandeira. Formas de pagamento: `DINHEIRO, PIX, CARTAO_DEBITO, CARTAO_CREDITO, CREDIARIO, FIADO, VALE_PRESENTE`.
- Produto com vendas não é excluído: vira `status = 'inativo'` (erro 23503).
- Parcelas financeiras de venda (`origem_tipo = 'VENDA'` com `origem_id`) não são excluídas pela tela de Finanças — cancela-se a venda.
- Saldo do cliente = soma das parcelas CREDIARIO/FIADO em aberto (somente leitura).

## Status

### Feito
- Ponte de dados e login real; marca Mont Royal; Kai removido.
- **Vender** (pagamento com bandeira, parcelado, crediário com entrada/plano editável, leitor de código com Enter, aviso de estoque), **Recibo** com carnê, **Produtos** (CRUD, duplicar, importar, categorias, foto reduzida, ativo/inativo, promo), **Clientes** (CRUD, importar, busca), **Histórico** (cancelamento com motivo), **Finanças** (a pagar / a receber / lançamentos, baixa, desfazer, repetir).
- Revisão de layout: telas centralizadas como na referência Kyte, largura limitada em monitores grandes e ajuste automático com o menu aberto/recolhido; grade fluida, carrinho sempre acessível, formulários, tabelas, login e configurações adaptados. As 22 rotas foram conferidas em 390, 800, 1440 e 2560px com dados simulados; modal de pagamento e carrinho com itens também conferidos, sem gravações no banco.
- **Calendário financeiro** (`/calendar/`, rail e atalho em Finanças): vencimentos por dia, valores restantes após baixas, detalhes de parcelas, navegação mensal/Hoje e projeção de 12 meses por forma de pagamento. Cada conta em aberto tem **Pagar/Receber**, com valor parcial ou total, data e prévia do saldo, sem sair do calendário. A baixa compara o saldo lido com o banco para impedir sobrescrita concorrente e atualiza agenda, projeção e saldos. Consulta/baixa compartilhadas com o Royal. Fluxos verificados em PostgreSQL isolado, sem gravar dados de teste em produção.
- **Estatísticas** no layout da referência: painel branco contínuo, indicadores em lista lateral rolável, detalhe à direita e estado vazio com lupa. Períodos Dia, Semana, Mês, Trimestre, Semestre, Anual, Todo o período e Personalizado (datas inicial/final inclusivas); gráficos, rankings, pagamentos mistos e taxas reais registradas. Consultas e cálculos compartilhados com o Royal; conferência em 390, 800, 1440 e 2560px e testes com mais de 1000 vendas.
- **Fornecedores** (`/suppliers/`, item no rail): listagem paginada, busca sem acentos por nome/documento/contato, cadastro e edição dos campos existentes no Royal, máscaras CPF/CNPJ e telefone, validação, confirmação ao descartar e ao excluir, bloqueio de exclusão quando há vínculos. Usa `useFornecedores`, `useUpsertFornecedor`, `useDeleteFornecedor`. Fluxos CRUD e falhas verificados somente em banco simulado; nenhuma migração nova necessária.
- **Pedidos de compra** (`/purchases/`, Compras no rail): listagem paginada, busca/status, criação com fornecedor e produtos, recebimento parcial/total com local e validade, conta a pagar ao concluir e cancelamento com motivo. Cancelar pedido parcial preserva o estoque recebido e provisiona somente seu valor. Formulários preservados em falhas e confirmam descarte. Usa `usePedidosCompra` com RPCs transacionais da migration abaixo: criação com UUID estável, bloqueios e conferência de saldo no recebimento, estoque/financeiro atômicos. UI, migração e rollback testados com PostgreSQL isolado; **ativação das gravações em produção aguarda o usuário executar a migration**. O hook de compras do Royal antigo foi preservado; somente a cópia Kyte depende dos novos RPCs. Layout conferido em 390, 800, 1440 e 2560px.

- **Estoque** (`/stock/`, rail): saldos paginados por produto, variação e local; busca e filtros, custo estimado, entradas/saídas/ajustes avulsos com custo/validade/observação e histórico completo por produto. Reutiliza `useEstoque`; saídas guardam quantidade positiva, ajustes aceitam delta com sinal; movimento com UUID estável protege repetição após falha de rede. Atualiza estoque, loja e relatórios. Movimentos avulsos não criam conta a pagar; receber compras pelo módulo Compras.
- **Variações**: CRUD persistido em `variacoes_produto` no cadastro do produto e no detalhe do Estoque, com SKU/código, atributos e adicionais. Movimentos permitem escolher variação ou produto base; exclusão com vínculo é bloqueada. A seleção de variação no carrinho e nas compras ainda está pendente, conforme próximos passos.
- **Relatórios** (`/reports/`): Estoque por produto/variação/local e Validade, do vencimento mais próximo ao mais distante; busca, filtros e CSV. Lotes e histórico paginados além de 1000 registros. A validade mostra a quantidade original da entrada e seu valor original, não saldo restante por lote: o Royal não faz baixa por lote específico.
- **Ajustes compartilhados com o Royal**: Geral, Pagamentos e Recibo usam `configuracoes_sistema`, chave `geral`. Nome/dados da loja, logotipo, local padrão, taxas por bandeira e prazos são carregados do banco na abertura; a finalização recarrega as taxas antes de gerar recebíveis. Falha de leitura impede usar taxas presumidas. Salvar atualiza o cache apenas após sucesso no banco; falhas preservam o formulário. Navegação por abas/menu/Voltar e fechamento confirmam descarte dos novos formulários.
- **Cupom original integrado**: Vender e Histórico usam `@/lib/comprovante` (mesmo gerador do Royal), com prévia, Imprimir e Gerar PDF; papel 58/80 mm, A4 ou personalizado, modos gráfico/térmico, logotipo, título, dados configuráveis e carnê de crediário/fiado com valores brutos. Logo funciona também no térmico (tons de cinza). PDF respeita preferência A4 sem alterar o papel do cupom, e impressão respeita o título salvo. Impressão silenciosa depende do navegador/computador; impressão física não testada.
- **Verificações desta etapa**: build de produção aprovado, TypeScript dos hooks/libs sem erros; PostgreSQL isolado com 1105 produtos e mais de 1000 entradas; UI de entrada/saída/variações, taxas e falhas de gravação; cupom em 8 combinações de papel/modo, escape de conteúdo, logo, SKU, carnê e PDF. Cinco telas em 390/800/1440/2560px sem rolagem horizontal da página. Conferência real somente de leitura confirmou Estoque, configurações Mont Royal, logo e cupom térmico de 80 mm. Nenhum dado falso ou alteração de configuração foi gravado em produção. Sem migration nova nesta etapa.

### Migrations que o usuário precisa ter rodado
- `20261114000001_venda_transacional.sql` (obrigatória)
- `20261115000001_kyte_campos_produto.sql` (cor_etiqueta, nome_etiqueta, preco_promocional, destaque)
- `20261115000002_compras_transacionais.sql` (novos RPCs de criar, receber e cancelar compras; obrigatória para gravar pelo módulo Compras do Kyte). A baixa no calendário funciona sem esta migration.
- `CORRIGIR_SAIDA_PERDA.sql`, `APLICAR_PENDENTES.sql`

### Rodada de 15/11/2026 (feito)
- **Menu agrupado**: Calendário virou aba de Finanças (`SECOES.finances` em `Shell.jsx`, componente `SecaoTabs`); Estatísticas + Relatórios viraram a seção **Relatórios** (abas Estatísticas / Estoque e validade). Finanças abre em **A receber**.
- **Pedidos removido** (decisão do usuário: o cupom sai na hora da venda, sem status de pedido). `/orders/` mostra o Histórico. Rota e página do Kai removidas.
- **Ajustes**: abas Pedidos e vendas, Entrega e Integrações removidas (só gravavam no navegador).
- **Usuários e permissões** ligados a `usuarios` e `perfis_acesso` (`src/app/permissoes.js`). Módulos: vendas, clientes, produtos, estoque, financeiro, relatorios, usuarios (formato da matriz do Royal; chaves desconhecidas como `producao` são preservadas). Menu e páginas filtrados por perfil; usuário inativo é bloqueado. **Enquanto nenhum usuário ativo tiver perfil com acesso total, tudo fica liberado** (evita trancar a loja). Proteções: não remover o último administrador. Novos usuários se cadastram no login; o admin escolhe o perfil. Permissão é só na interface — RLS continua aberta para autenticados (mudar RLS afeta o Royal; decidir com o usuário).
- **Variações no Vender e em Compras**: produtos carregam `variations`; ao tocar num produto com variações abre a escolha; código de barras/SKU da variação adiciona direto; item do carrinho é `produto|variação`, preço = preço + `preco_adicional`; `variacao_id` vai para `finalizar_venda` e para o RPC de compras. Histórico mostra "Produto — Variação".
- **Imagens**: 0 de 1069 produtos têm `imagem_url`; não há bucket no Storage. Open Beauty/Food Facts não cobrem os itens (0 de 40 na amostra). Próximo passo depende do usuário (ver abaixo).

### Rodada de 16/11/2026 (feito)
- **Repositório**: o app novo substituiu o Royal no `treze13102/sistemaPDV` (pasta `14 - ROYAL`), publicado pela Vercel (`vercel.json` → `npm run build`, saída `dist`). O último Royal antigo ficou no commit `0f02f5b`. **Trabalhar nesta pasta**; `22 - KYTE DESIGN SYSTEM/app` é cópia antiga e não vai para o site.
- Menu: logo da loja em branco no topo (canvas → PNG transparente em `Shell.jsx`); removida a divisória `.rail__top::after` que cortava a logo.
- Desconto em R$ ou % no carrinho; histórico de preços (Estoque e cadastro); leitor de código com Enter no Novo movimento e em Compras; barras de filtro e campos lado a lado alinhados.
- **Validade no cadastro do produto**: campo opcional gravado em `movimentos_estoque.data_validade` no lote que entra (estoque inicial ou aumento pelo cadastro, `AJUSTE_INVENTARIO` positivo), lido pelo relatório de validade. Sem aumento de estoque o formulário avisa. Verificado por build; tela não testada logada nesta porta.

### Próximos passos (em ordem)
1. **Ativar Compras** — usuário executa `20261115000002_compras_transacionais.sql`.
2. **Definir administrador** — usuário marca o próprio usuário com perfil Administrador em Usuários.
3. **Imagens dos produtos** — opção A: API Cosmos (Bluesoft, base brasileira de GTIN; exige token do usuário, chamar por função de servidor, não expor token no front) para buscar por código de barras e gravar `imagem_url`; opção B: upload manual (já existe no cadastro, grava base64 reduzido). Antes de gravar em massa, mostrar prévia e pedir confirmação.
4. **Catálogo Online** — decidir com o usuário se fica (exige página pública + políticas RLS para anônimos) ou sai do menu. Hoje grava só no navegador.
5. Permissões no banco (RLS por perfil), se o usuário quiser, testando o Royal junto.
6. Conferir impressão física do cupom.

## Como verificar
- `npm run build` sem erros.
- Abrir `http://localhost:5175`, logar, testar a tela em ~800px e em desktop: sem sobreposição, sem rolagem horizontal, sem erros no console.
- Nunca testar gravando dados falsos em produção sem avisar o usuário (o banco é o real da loja).
