# sistemaRoyal

Sistema de Gestão para Loja de Presentes, Perfumes, Folheados, Bolsas e Itens 3D — MVP (Fase 1).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router v6 + TanStack Query v5
- React Hook Form + Zod
- Supabase (Auth + Postgres)

## Setup

```bash
npm install
```

Crie `.env` na raiz (já criado neste projeto):

```
VITE_SUPABASE_URL=https://SEU_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_OR_PUBLISHABLE_KEY
```

### Aplicar schema no Supabase

Duas opções:

**Via SQL editor (web):** Dashboard Supabase → SQL Editor → cole e execute em ordem:

1. `supabase/migrations/20260525000001_schema_mvp.sql`
2. `supabase/migrations/20260525000002_rls.sql`

**Via CLI:**

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

### Rodar

```bash
npm run dev     # dev server  → http://localhost:5173
npm run build   # build produção
```

## Estado atual — Fase 1

Implementado:
- [x] Scaffold Vite + Tailwind + shadcn primitives (Button, Input, Label, Card, Dialog, Table, Select, Textarea, Checkbox)
- [x] Schema Postgres completo (categorias, produtos, variações, clientes, fornecedores, estoque, vendas, financeiro, pedidos compra, auditoria, metas)
- [x] RLS básico (authenticated) + trigger auto-vincular auth.users → usuarios
- [x] Auth (login/cadastro/logout) com Supabase
- [x] Layout + sidebar + rotas protegidas
- [x] Dashboard com KPIs (faturamento mês, produtos ativos, a receber, a pagar)
- [x] CRUD Categorias (hierárquico, tipos enum)
- [x] CRUD Produtos (todos campos SPEC: custos, preços, estoque, canais, flag 3D)
- [x] CRUD Clientes (com busca)
- [x] CRUD Fornecedores

- [x] Módulo Estoque (saldo por produto/local, alertas mínimo, registro de movimentos entrada/saída/ajuste)
- [x] PDV (busca produto, carrinho, múltiplas formas pagamento incl. fiado parcelado, geração automática de movimentos estoque + parcelas RECEBER, orçamento)
- [x] Módulo Financeiro (contas a pagar/receber, filtros, baixa de pagamento parcial/total, KPIs saldo projetado/realizado mês)

- [x] Pedidos de compra (criar + receber parcial/total, gera ENTRADA_COMPRA + parcela PAGAR)
- [x] Listagem de vendas + cancelamento (estorno estoque via AJUSTE_INVENTARIO + cancela parcelas RECEBER abertas)

- [x] Variações de produto (CRUD UI completo: cor/tamanho/fragrância/voltagem + barcode + preço/custo adicional)
- [x] Histórico de preço automático com justificativa obrigatória (>20% aviso especial)
- [x] Comprovante venda HTML print-friendly (A4 + impressora térmica 58mm via @media)
- [x] Leitor de código de barras USB (BarcodeInput) em Produtos / PDV / Estoque
- [x] Cálculo automático de preço (custo × margem) com markup default por categoria
- [x] Máscaras CPF/CNPJ/telefone em Clientes/Fornecedores

Pendente (próximas iterações):
- [ ] Relatórios e metas avançados (dashboard básico já existe)
- [ ] Refinar RLS por perfil de acesso
- [ ] Code-splitting (bundle atual ~830KB)
- [ ] Aprovação digital de override de preço (atualmente só justificativa em prompt)
- [ ] Variações no PDV (carrinho ainda usa produto base)

## Estrutura

```
src/
  components/        AppLayout, ProtectedRoute, PageHeader, ui/* (shadcn)
  contexts/          AuthContext
  hooks/             useCategorias, useProdutos, useClientes, useFornecedores
  lib/               supabase client, utils (cn, formatCurrency, formatDate)
  pages/             Login, Dashboard, Categorias, Produtos, Clientes, Fornecedores, Placeholder
  types/             database (tipos manuais, regenerar via supabase gen types)
supabase/migrations/ SQL versionado
```

## Notas

- Cliente Supabase está **não-tipado** (`createClient` sem generic `<Database>`) para acelerar MVP. Para regenerar tipos quando schema estabilizar: `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`.
- Senha mínima configurada via Zod schema (6 chars). Política de senha no Supabase deve ser configurada no dashboard.
- Confirmação de e-mail no signup depende da config do projeto Supabase.
