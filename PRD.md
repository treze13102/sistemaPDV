# PRD — sistemaRoyal

> Este documento é vivo. Qualquer pessoa pode editar diretamente as seções abaixo
> (metas, escopo, funcionalidades) quando o entendimento do produto mudar.
> Para pedir uma mudança sem editar o documento você mesmo, use a seção
> **[Solicitações de mudança](#solicitações-de-mudança)** no final — adicione uma
> linha na tabela e alguém (ou o assistente de IA do projeto) revisa e incorpora
> ao PRD numa próxima revisão.

**Versão:** 1.0
**Última atualização:** 2026-08-20
**Dono do produto:** Cristiane (loja)

---

## 1. Problema

Loja física de presentes, perfumes, folheados, bolsas e itens de impressão 3D,
com venda também por WhatsApp/Instagram. A operação hoje depende de caderno,
planilha e memória para controlar estoque, fiado/crediário e financeiro — o que
gera três pontos cegos recorrentes:

1. **Lucro aparente ≠ lucro real.** Vendas parceladas no cartão escondem taxa
   de adquirente e prazo de recebimento; o "vendi X este mês" não corresponde
   ao dinheiro que efetivamente entra no caixa.
2. **Cobrança de crediário depende de lembrar.** Sem data de vencimento
   automática, parcelas atrasam ou são esquecidas.
3. **Perda de estoque por validade não rastreada.** Produtos vencem sem aviso,
   inclusive unidades diferentes do mesmo lote com validades diferentes.

## 2. Objetivo

Permitir que o dono da loja responda, a qualquer momento e sem depender de
memória ou papel, três perguntas:

- **Quanto eu tenho** (caixa e estoque reais, hoje)
- **Quanto eu vou ter** (recebíveis projetados por dia/semana/mês)
- **O que está prestes a estragar** (validade de estoque)

## 3. Persona

**Cristiane — dona de loja.** Vende no balcão e por WhatsApp/Instagram. Já
perdeu produto por validade vencida sem aviso, já esqueceu de cobrar parcela
de crediário, e não confia nos números de lucro que calculava sem descontar
taxa de cartão. Não é usuária avançada de tecnologia — precisa de telas
diretas, sem jargão técnico.

## 4. Escopo — módulos e funcionalidades

### 4.1 Estoque
- Cadastro de produto (custo, preço, categoria, fornecedor, canal de venda)
- Saldo por localização (Loja / Depósito / Fábrica 3D / Consignado)
- Custo médio de compra
- Data de validade por movimento de entrada — única para o lote ou
  **individual por unidade**, quando o usuário optar
- Divisão retroativa de um lote em validades individuais
- Alertas de lotes vencidos ou a vencer nos próximos 30 dias

### 4.2 PDV (ponto de venda)
- Busca de produto por nome/SKU/código de barras, carrinho, desconto
- Desconto extra em **percentual** (não valor fixo) sobre o total
- Formas de pagamento: dinheiro, PIX, cartão débito, cartão crédito
  (parcelado), crediário, fiado, vale-presente
- Seleção de **bandeira do cartão** para aplicar a taxa correta
- Planejamento de parcelas do crediário: entrada, quantidade, datas e valores
  editáveis por parcela
- Emissão de comprovante/cupom, incluindo carnê de parcelas do crediário

### 4.3 Vendas
- Histórico de vendas com filtro por status/data
- Detalhe de venda com recebíveis gerados (bruto, taxa, líquido, status)
- Edição de venda concluída (itens, pagamento, cliente) com recálculo
  automático de estoque e recebíveis — bloqueada se já houver parcela paga
- Cancelamento de venda com estorno de estoque e parcelas

### 4.4 Financeiro
- Contas a pagar/receber com baixa parcial ou total
- Taxas de cartão configuráveis **por bandeira e por faixa de parcelas**
  (débito, crédito à vista, parcelado 2–6x, parcelado 7x+)
- Geração retroativa de recebíveis para vendas antigas sem lançamento

### 4.5 Calendário financeiro
- Grade mensal com entradas e saídas previstas por dia
- Projeção de recebíveis dos próximos 12 meses, com quebra por forma de
  pagamento e saldo acumulado

### 4.6 Dashboard
- Faturamento do mês, ticket médio
- Lucro bruto (com CMV real) e lucro líquido (descontando taxas de cartão e
  despesas pagas)
- Recebido no mês vs. a receber vs. faturamento projetado
- Entradas previstas: hoje, 7 dias, restante do mês

### 4.7 Cadastros de apoio
- Clientes, fornecedores, categorias, variações de produto
- Pedidos de compra com recebimento parcial/total
- Configurações do sistema (loja, cupom, impressão, PDV, taxas, WhatsApp)

## 5. Fora de escopo (por enquanto)

- Emissão fiscal (NF-e/NFC-e)
- Integração direta com adquirente/maquininha (as taxas são configuradas
  manualmente, não lidas automaticamente do extrato)
- Multi-loja / múltiplos CNPJs
- App mobile nativo (hoje é web responsivo)

## 6. Métricas de sucesso

- Dono consegue responder "quanto vou ter em caixa nos próximos 30 dias" sem
  abrir planilha ou caderno
- Zero venda registrada sem gerar o lançamento financeiro correspondente
- Redução de perda de estoque por validade vencida não avisada

---

## Solicitações de mudança

Use esta tabela para pedir um ajuste no PRD sem editar as seções acima
diretamente. Preencha uma linha nova; o status começa como `Aberta`.

| Data | Solicitado por | Descrição da mudança | Motivo | Status |
|---|---|---|---|---|
| _(exemplo)_ 2026-08-20 | Cristiane | Adicionar suporte a múltiplas lojas | Vou abrir uma segunda unidade em 2027 | Aberta |

<!--
Para adicionar uma solicitação, copie a linha de exemplo acima e preencha:
- Data: quando foi pedido
- Solicitado por: quem pediu
- Descrição: o que deveria mudar, o mais concreto possível
- Motivo: por que isso importa (ajuda a priorizar)
- Status: Aberta / Em análise / Incorporada / Recusada (com justificativa)
-->
