import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { buscarTodos } from "@/lib/buscarTodos";
import { conferirPlanos, construirRecebiveis, NUMERO_PLACEHOLDER } from "@/lib/recebiveis";
import { carregarConfiguracoes, carregarConfiguracoesSupabase } from "@/lib/configuracoes";
import { getUsuarioAtualId } from "@/lib/usuarioAtual";
import { traduzirErroRpc } from "@/lib/erroRpc";
import { CURRENCIES, DEFAULT_VALUES, NO_CURRENCY } from "../config/data.js";

/**
 * Ponte entre as telas (formato de dados do design original) e o banco do
 * sistemaRoyal no Supabase.
 *
 * LEITURA: `data` tem o mesmo formato que as telas sempre usaram
 * (products, customers, sales...), só que montado a partir das tabelas reais.
 *
 * ESCRITA: nada é gravado localmente. Cada operação é uma ação em `actions`
 * que grava no banco e recarrega os dados. Vendas passam pelas funções
 * transacionais (finalizar_venda / cancelar_venda).
 */

const Ctx = createContext(null);
const KEY = ["loja"];

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

export const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- Preferências da loja (Configurações › Geral) ---------- */
export function readPrefs() {
  let g = {};
  try {
    g = JSON.parse(localStorage.getItem("pdv.config.general") || "{}");
  } catch {
    g = {};
  }
  // A loja opera em reais: sem moeda escolhida, assume BRL em vez do "$" genérico.
  // `code` da lista de moedas é o país ("BR"), não o código ISO da moeda.
  const remote = carregarConfiguracoes().loja;
  const p = { ...DEFAULT_VALUES, ...g, name: remote.nome_fantasia || g.name || "Mont Royal", imageURL: remote.logo_url || "", address: [remote.endereco, remote.cidade, remote.uf].filter(Boolean).join(" · "), phone: remote.telefone || "", whatsapp: remote.whatsapp || "", email: remote.email || "", currency: g.currency || "BR" };
  const cur = CURRENCIES.find((c) => c.code === p.currency) || CURRENCIES.find((c) => c.code === "BR") || NO_CURRENCY;
  return { ...p, cur };
}

/* ---------- Conversões banco → tela ---------- */
const PALETA = ["#535d6e", "#2dd1ac", "#fdca40", "#ff8552", "#ff4e4e", "#ce7da5", "#89bbfe", "#0d3b66", "#82d173", "#2d2d2a"];
function corAutomatica(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETA[h % PALETA.length];
}
const ms = (iso) => (iso ? new Date(iso).getTime() : Date.now());
const um = (rel) => (Array.isArray(rel) ? rel[0] ?? null : rel ?? null);

function paraProduto(p, saldo) {
  const categoria = um(p.categoria);
  return {
    id: p.id,
    name: p.nome,
    code: p.codigo_barras || p.sku || "",
    sku: p.sku || "",
    barcode: p.codigo_barras || "",
    category: categoria?.nome || "",
    price: Number(p.preco_venda_padrao ?? 0),
    cost: Number(p.custo_aquisicao ?? 0),
    promoPrice: p.preco_promocional == null ? null : Number(p.preco_promocional),
    description: p.descricao_curta || "",
    labelName: p.nome_etiqueta || "",
    // O Royal controla estoque de todo produto pelo razão de movimentos.
    stockActive: true,
    stock: saldo,
    minStock: Number(p.estoque_minimo ?? 0),
    color: p.cor_etiqueta || corAutomatica(p.id),
    image: p.imagem_url || "",
    showOnCatalog: !!p.canal_ecommerce,
    highlight: !!p.destaque,
    active: p.status === "ativo",
    createdAt: ms(p.created_at),
  };
}

function paraCliente(c, emAberto) {
  return {
    id: c.id,
    name: c.nome,
    phone: c.telefone || "",
    email: c.email || "",
    address: c.endereco || "",
    document: c.cpf_cnpj || "",
    note: c.observacao || "",
    birthday: c.data_aniversario ? c.data_aniversario.split("-").reverse().join("/") : "",
    // Saldo negativo = o cliente deve (parcelas de crediário/fiado em aberto).
    balance: emAberto ? -emAberto : 0,
    allowAccount: true,
    createdAt: ms(c.created_at),
  };
}

function paraVenda(v) {
  const itens = v.itens ?? [];
  const pagamentos = v.pagamentos ?? [];
  return {
    id: v.id,
    number: v.numero,
    items: itens.map((i) => {
      const prod = um(i.produto);
      return {
        productId: i.produto_id,
        variationId: i.variacao_id ?? null,
        name: (prod?.nome ?? "—") + (um(i.variacao)?.nome ? ` — ${um(i.variacao).nome}` : ""),
        price: Number(i.preco_unitario),
        sku: prod?.sku || "",
        discount: Number(i.desconto ?? 0),
        total: Number(i.total),
        cost: Number(prod?.custo_aquisicao ?? 0),
        qty: Number(i.quantidade),
      };
    }),
    discount: Number(v.desconto_total ?? 0),
    total: Number(v.total_liquido ?? 0),
    payments: pagamentos.length
      ? pagamentos.map((p) => ({ method: p.forma, value: Number(p.valor), parcelas: p.parcelas, bandeira: p.bandeira }))
      : v.forma_pagamento_principal
        ? [{ method: v.forma_pagamento_principal, value: Number(v.total_liquido ?? 0) }]
        : [],
    entrada: Number(v.entrada_valor ?? 0),
    customerId: v.cliente_id,
    userId: v.usuario_id,
    status: v.status === "CANCELADA" ? "canceled" : "closed",
    note: v.observacao || "",
    canceledReason: v.cancelada_motivo || "",
    createdAt: ms(v.data_hora),
    closedAt: ms(v.data_hora),
    isOrder: false,
  };
}

/* ---------- Carga ---------- */
async function carregarLoja() {
  const [produtos, saldos, categorias, clientes, vendasRes, emAberto, usuariosRes] = await Promise.all([
    buscarTodos(() => supabase.from("produtos").select("*, categoria:categorias(id,nome)").order("nome").order("id")),
    buscarTodos(() => supabase.from("v_estoque_saldo").select("produto_id, saldo").order("produto_id").order("localizacao")),
    buscarTodos(() => supabase.from("categorias").select("id, nome").order("nome").order("id")),
    buscarTodos(() => supabase.from("clientes").select("*").order("nome").order("id")),
    supabase
      .from("vendas")
      .select(
        "*, itens:itens_venda(produto_id, variacao_id, quantidade, preco_unitario, desconto, total, produto:produtos(nome, sku, custo_aquisicao), variacao:variacoes_produto(nome)), pagamentos:pagamentos_venda(forma, valor, parcelas, bandeira)",
      )
      .in("status", ["CONCLUIDA", "CANCELADA"])
      .order("data_hora", { ascending: false })
      .limit(1000),
    buscarTodos(() =>
      supabase
        .from("parcelas_financeiras")
        .select("id, cliente_id, valor, valor_pago")
        .eq("tipo", "RECEBER")
        .in("status", ["ABERTA", "PARCIAL", "ATRASADA"])
        .in("forma_pagamento", ["CREDIARIO", "FIADO"])
        .not("cliente_id", "is", null)
        .order("id"),
    ),
    supabase.from("usuarios").select("id, nome, email, status, perfil_acesso_id").order("nome"),
  ]);
  const variacoes = await buscarTodos(() => supabase.from("variacoes_produto").select("id, produto_id, nome, sku, codigo_barras, preco_adicional, custo_adicional").order("produto_id").order("nome").order("id"));
  const varPorProduto = new Map();
  for (const v of variacoes) {
    if (!varPorProduto.has(v.produto_id)) varPorProduto.set(v.produto_id, []);
    varPorProduto.get(v.produto_id).push({ id: v.id, name: v.nome, sku: v.sku || "", barcode: v.codigo_barras || "", priceAdd: Number(v.preco_adicional || 0), costAdd: Number(v.custo_adicional || 0) });
  }
  const [perfisRes, sessao] = await Promise.all([supabase.from("perfis_acesso").select("id, nome, matriz_permissoes").order("nome"), supabase.auth.getSession()]);
  if (perfisRes.error) throw perfisRes.error;
  const perfis = (perfisRes.data ?? []).map((p) => ({ id: p.id, nome: p.nome, matriz: p.matriz_permissoes || {} }));
  const meuId = sessao.data.session?.user?.id ?? null;
  if (vendasRes.error) throw vendasRes.error;
  if (usuariosRes.error) throw usuariosRes.error;

  const saldoPorProduto = new Map();
  for (const s of saldos) saldoPorProduto.set(s.produto_id, (saldoPorProduto.get(s.produto_id) ?? 0) + Number(s.saldo ?? 0));

  const devidoPorCliente = new Map();
  for (const p of emAberto) {
    const resto = Math.max(Number(p.valor) - Number(p.valor_pago ?? 0), 0);
    devidoPorCliente.set(p.cliente_id, (devidoPorCliente.get(p.cliente_id) ?? 0) + resto);
  }

  return {
    products: produtos.map((p) => ({ ...paraProduto(p, saldoPorProduto.get(p.id) ?? 0), variations: varPorProduto.get(p.id) ?? [] })),
    categories: categorias.map((c) => c.nome),
    categoryIds: Object.fromEntries(categorias.map((c) => [c.nome, c.id])),
    customers: clientes.map((c) => paraCliente(c, devidoPorCliente.get(c.id) ?? 0)),
    sales: (vendasRes.data ?? []).map(paraVenda),
    users: (usuariosRes.data ?? []).map((u) => ({
      id: u.id,
      name: u.nome,
      email: u.email,
      role: perfis.find((p) => p.id === u.perfil_acesso_id)?.matriz.all ? "owner" : "seller",
      active: u.status === "ativo",
      perfilId: u.perfil_acesso_id,
      permissions: [],
    })),
    perfis,
    acesso: (() => {
      const eu = (usuariosRes.data ?? []).find((u) => u.id === meuId);
      const perfil = perfis.find((p) => p.id === eu?.perfil_acesso_id) ?? null;
      const admins = perfis.filter((p) => p.matriz.all).map((p) => p.id);
      const semAdmin = !(usuariosRes.data ?? []).some((u) => u.status === "ativo" && admins.includes(u.perfil_acesso_id));
      return { meuId, perfil, semAdmin, inativo: eu?.status === "inativo" };
    })(),
    // Colunas extras do cadastro (migration 20261115000001). Se ainda não
    // existirem, o app funciona — só não grava cor/destaque/promoção.
    camposExtras: produtos.length === 0 || "cor_etiqueta" in produtos[0],
    // Telas ainda não ligadas ao banco (próximas fases).
    orders: [],
    finances: [],
  };
}

const VAZIO = { perfis: [], acesso: null, products: [], categories: [], categoryIds: {}, customers: [], sales: [], users: [], orders: [], finances: [], camposExtras: true };

/** Erros do Postgres/PostgREST em linguagem do operador. */
function traduzir(e) {
  const msg = e?.message ?? String(e);
  if (e?.code === "23505") {
    if (/sku/i.test(msg)) return new Error("Já existe um produto com este SKU.");
    if (/codigo_barras/i.test(msg)) return new Error("Já existe um produto com este código de barras.");
    return new Error("Já existe um registro com esses dados.");
  }
  return traduzirErroRpc(e);
}
const ou = (res) => {
  if (res.error) throw traduzir(res.error);
  return res.data;
};

function Provider({ children }) {
  const qc = useQueryClient();
  const loja = useQuery({ queryKey: KEY, queryFn: carregarLoja });
  const settings = useQuery({ queryKey: ["configuracoes"], queryFn: () => carregarConfiguracoesSupabase(true), staleTime: 30_000 });
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((title, level = "success", subtitle) => {
    const id = uid("t");
    setToasts((l) => [...l, { id, title, level, subtitle }]);
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), level === "danger" ? 7000 : 4000);
  }, []);
  const dismiss = useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), []);

  const data = loja.data ?? VAZIO;
  const recarregar = useCallback(() => Promise.all([
    qc.invalidateQueries({ queryKey: ["configuracoes"] }),
    qc.invalidateQueries({ queryKey: ["estoque"] }),
    qc.invalidateQueries({ queryKey: KEY }),
    qc.invalidateQueries({ queryKey: ["fluxo-caixa"] }),
    qc.invalidateQueries({ queryKey: ["parcelas"] }),
    qc.invalidateQueries({ queryKey: ["relatorios"] }),
  ]), [qc]);

  const actions = useMemo(() => {
    const localPadrao = () => carregarConfiguracoes().pdv.local_estoque_padrao || "Loja";

    /** Garante a categoria e devolve o id (null quando vazia). */
    async function idDaCategoria(nome) {
      const n = (nome || "").trim();
      if (!n) return null;
      if (data.categoryIds[n]) return data.categoryIds[n];
      const criada = ou(await supabase.from("categorias").insert({ nome: n, tipo: "Outros" }).select("id").single());
      return criada.id;
    }

    /** O estoque é um razão: mudar o número no cadastro vira um ajuste de inventário. */
    async function ajustarEstoque(produtoId, saldoAtual, saldoNovo, motivo, validade = null) {
      const delta = +(Number(saldoNovo) - Number(saldoAtual)).toFixed(3);
      if (!delta) return;
      ou(
        await supabase.from("movimentos_estoque").insert({
          produto_id: produtoId,
          tipo: "AJUSTE_INVENTARIO",
          quantidade: delta,
          localizacao: localPadrao(),
          usuario_id: await getUsuarioAtualId(),
          observacao: motivo,
          // Só entradas carregam validade (o relatório de validade lê AJUSTE_INVENTARIO com data).
          data_validade: delta > 0 && validade ? validade : null,
        }),
      );
    }

    function camposProduto(v) {
      const base = {
        nome: v.name.trim(),
        codigo_barras: (v.code || "").trim() || null,
        preco_venda_padrao: Number(v.price) || 0,
        custo_aquisicao: Number(v.cost) || 0,
        descricao_curta: (v.description || "").trim() || null,
        estoque_minimo: Number(v.minStock) || 0,
        canal_ecommerce: !!v.showOnCatalog,
        status: v.active === false ? "inativo" : "ativo",
        imagem_url: v.image || null,
      };
      if (!data.camposExtras) return base;
      return {
        ...base,
        cor_etiqueta: v.color || null,
        nome_etiqueta: (v.labelName || "").trim() || null,
        preco_promocional: v.promoPrice == null || v.promoPrice === "" ? null : Number(v.promoPrice),
        destaque: !!v.highlight,
      };
    }

    return {
      recarregar,

      /* ----- Produtos ----- */
      async saveProduct(v, existing) {
        const payload = { ...camposProduto(v), categoria_id: await idDaCategoria(v.category) };
        let id = existing?.id;
        if (existing) {
          // Mudança de preço entra no histórico, como no Royal.
          if (Number(existing.price) > 0 && Number(existing.price) !== payload.preco_venda_padrao) {
            const pct = ((payload.preco_venda_padrao - existing.price) / existing.price) * 100;
            await supabase.from("historico_preco").insert({
              produto_id: id,
              preco_anterior: existing.price,
              preco_novo: payload.preco_venda_padrao,
              variacao_pct: +pct.toFixed(2),
              usuario_id: await getUsuarioAtualId(),
            });
          }
          ou(await supabase.from("produtos").update(payload).eq("id", id));
        } else {
          id = ou(await supabase.from("produtos").insert(payload).select("id").single()).id;
        }
        await ajustarEstoque(id, existing?.stock ?? 0, Number(v.stock) || 0, existing ? "Ajuste pelo cadastro do produto" : "Estoque inicial do cadastro", v.expiry || null);
        await recarregar();
        return id;
      },

      /** Produto com histórico não pode ser apagado (o banco protege): nesse caso é inativado. */
      async deleteProduct(id) {
        const res = await supabase.from("produtos").delete().eq("id", id);
        if (res.error?.code === "23503") {
          ou(await supabase.from("produtos").update({ status: "inativo" }).eq("id", id));
          await recarregar();
          return "inativado";
        }
        ou(res);
        await recarregar();
        return "excluido";
      },

      async duplicateProduct(p) {
        // SKU e código de barras são únicos — a cópia nasce sem eles e sem estoque.
        const payload = { ...camposProduto({ ...p, name: `${p.name} (cópia)`, code: "" }), categoria_id: await idDaCategoria(p.category) };
        const id = ou(await supabase.from("produtos").insert(payload).select("id").single()).id;
        await recarregar();
        return id;
      },

      async importProducts(rows) {
        let n = 0;
        for (const r of rows) {
          const payload = {
            nome: r.name,
            codigo_barras: r.code || null,
            preco_venda_padrao: r.price,
            custo_aquisicao: r.cost,
            categoria_id: await idDaCategoria(r.category),
            status: "ativo",
          };
          const id = ou(await supabase.from("produtos").insert(payload).select("id").single()).id;
          await ajustarEstoque(id, 0, r.stock, "Estoque inicial da importação");
          n += 1;
        }
        await recarregar();
        return n;
      },

      async addCategory(nome) {
        ou(await supabase.from("categorias").insert({ nome: nome.trim(), tipo: "Outros" }));
        await recarregar();
      },

      async removeCategory(nome) {
        const id = data.categoryIds[nome];
        if (!id) return;
        // Solta os produtos da categoria antes de apagar (o banco não deixa apagar categoria em uso).
        ou(await supabase.from("produtos").update({ categoria_id: null }).eq("categoria_id", id));
        ou(await supabase.from("categorias").delete().eq("id", id));
        await recarregar();
      },

      /* ----- Clientes ----- */
      async saveCustomer(v, id) {
        const [d, m, a] = (v.birthday || "").split("/");
        const payload = {
          nome: v.name.trim(),
          telefone: (v.phone || "").trim() || null,
          email: (v.email || "").trim() || null,
          cpf_cnpj: (v.document || "").trim() || null,
          endereco: (v.address || "").trim() || null,
          observacao: (v.note || "").trim() || null,
          data_aniversario: d && m && a && a.length === 4 ? `${a}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : null,
        };
        if (id) ou(await supabase.from("clientes").update(payload).eq("id", id));
        else ou(await supabase.from("clientes").insert(payload));
        await recarregar();
      },

      async deleteCustomer(id) {
        const res = await supabase.from("clientes").delete().eq("id", id);
        if (res.error?.code === "23503") throw new Error("Este cliente tem vendas ou parcelas registradas e não pode ser excluído.");
        ou(res);
        await recarregar();
      },

      async importCustomers(rows) {
        ou(await supabase.from("clientes").insert(rows.map((r) => ({ nome: r.name, telefone: r.phone || null, email: r.email || null, endereco: r.address || null }))));
        await recarregar();
        return rows.length;
      },

      /* ----- Vendas ----- */
      /**
       * Finaliza a venda pela função transacional do banco: venda, itens,
       * pagamentos, baixa de estoque e parcelas entram juntos ou nada entra.
       * `pagamentos` no formato do Royal: { forma, valor, parcelas, bandeira, entrada, plano }.
       */
      async finalizeSale({ items, discount, customerId, pagamentos, note }) {
        const erroPlano = conferirPlanos(pagamentos);
        if (erroPlano) throw new Error(erroPlano);
        const config = await carregarConfiguracoesSupabase(true);
        const usuarioId = await getUsuarioAtualId();
        const recebiveis = construirRecebiveis({
          vendaId: null,
          numeroVenda: NUMERO_PLACEHOLDER,
          clienteId: customerId || null,
          pagamentos,
          taxas: config.recebiveis,
        });
        const res = await supabase.rpc("finalizar_venda", {
          p_venda: {
            cliente_id: customerId || null,
            usuario_id: usuarioId,
            canal: config.pdv.canal_padrao || "Loja",
            status: "CONCLUIDA",
            desconto_extra: Number(discount) || 0,
            observacao: note || null,
            localizacao_estoque: localPadrao(),
          },
          p_itens: items.map((i) => ({ produto_id: i.productId, variacao_id: i.variationId || null, quantidade: i.qty, preco_unitario: i.price, desconto: 0 })),
          p_pagamentos: pagamentos.map((p) => ({ forma: p.forma, valor: p.valor, parcelas: p.parcelas ?? 1, bandeira: p.bandeira ?? null, entrada: p.entrada ?? 0 })),
          p_recebiveis: recebiveis,
        });
        const venda = ou(res);
        await recarregar();
        return {
          id: venda.id,
          userId: usuarioId,
          number: venda.numero,
          createdAt: ms(venda.data_hora),
          // Carnê mostra o bruto: o que o cliente paga, não o líquido da loja.
          parcelas: recebiveis.map((r) => ({ numero: r.numero_parcela, valor: r.valor_bruto, data_vencimento: r.data_vencimento, forma: r.forma_pagamento })),
        };
      },

      async cancelSale(sale, motivo) {
        ou(await supabase.rpc("cancelar_venda", { p_venda_id: sale.id, p_motivo: motivo, p_usuario_id: await getUsuarioAtualId() }));
        await recarregar();
      },

      /** Usuário: nome, perfil e ativo. Conta (e-mail/senha) é criada pelo próprio cadastro no login. */
      async saveUser({ id, name, perfilId, active }) {
        const admins = data.perfis.filter((p) => p.matriz.all).map((p) => p.id);
        const outrosAdmins = data.users.filter((u) => u.id !== id && u.active && admins.includes(u.perfilId));
        const viraAdmin = active && admins.includes(perfilId);
        const eraAdmin = data.users.some((u) => u.id === id && u.active && admins.includes(u.perfilId));
        if (eraAdmin && !viraAdmin && outrosAdmins.length === 0)
          throw new Error("Este é o único administrador ativo. Defina outro administrador antes de mudar este.");
        ou(await supabase.from("usuarios").update({ nome: name.trim(), perfil_acesso_id: perfilId || null, status: active ? "ativo" : "inativo" }).eq("id", id));
        await recarregar();
      },

      async saveProfile({ id, nome, matriz }) {
        if (id && !matriz.all && data.perfis.find((p) => p.id === id)?.matriz.all) {
          const outros = data.perfis.filter((p) => p.id !== id && p.matriz.all).map((p) => p.id);
          if (!data.users.some((u) => u.active && outros.includes(u.perfilId)))
            throw new Error("Nenhum outro usuário ativo tem acesso total. Mantenha 'Acesso total' neste perfil.");
        }
        const linha = { nome: nome.trim(), matriz_permissoes: matriz };
        if (id) ou(await supabase.from("perfis_acesso").update(linha).eq("id", id));
        else ou(await supabase.from("perfis_acesso").insert(linha));
        await recarregar();
      },

      async deleteProfile(id) {
        if (data.users.some((u) => u.perfilId === id)) throw new Error("Há usuários com este perfil. Troque o perfil deles antes de excluir.");
        ou(await supabase.from("perfis_acesso").delete().eq("id", id));
        await recarregar();
      },
    };
  }, [data, recarregar]);

  // Compatibilidade: telas ainda não migradas chamam update(); não há mais estado local para alterar.
  const update = useCallback(() => {
    notify("Esta função ainda não está ligada ao banco", "danger");
  }, [notify]);

  const value = useMemo(
    () => ({ data, actions, update, notify, toasts, dismiss, config: settings.data, loading: loja.isLoading || settings.isLoading, error: settings.error || loja.error, recarregar }),
    [data, actions, update, notify, toasts, dismiss, loja.isLoading, loja.error, settings.data, settings.isLoading, settings.error, recarregar],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function StoreProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider>{children}</Provider>
    </QueryClientProvider>
  );
}

export const useStore = () => useContext(Ctx);

/* ---------- Formatação ---------- */
export function useMoney() {
  const prefs = readPrefs();
  return useCallback(
    (v) => {
      const { cur, decimalCurrency } = prefs;
      const n = Number(v) || 0;
      const fixed = Math.abs(n).toFixed(decimalCurrency ? 2 : 0);
      const [int, dec] = fixed.split(".");
      const group = cur.decimal === "," ? "." : ",";
      const intG = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
      return `${n < 0 ? "-" : ""}${cur.symbol}${intG}${dec ? cur.decimal + dec : ""}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs.currency, prefs.decimalCurrency]
  );
}

export const fmtDate = (t) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
export const fmtTime = (t) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (t) => `${fmtDate(t)} ${fmtTime(t)}`;
/** Data pura 'AAAA-MM-DD' → 'DD/MM/AAAA' sem passar por Date (evita o recuo de um dia por fuso). */
export const fmtDia = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
export const initials = (s) =>
  (s || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/** Converte "12,50" ou "12.50" em número. */
export const parseMoney = (s) => {
  if (typeof s === "number") return s;
  const clean = String(s).replace(/[^\d,.-]/g, "");
  const norm = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = parseFloat(norm);
  return Number.isFinite(n) ? n : 0;
};

/** Busca sem diferenciar acento nem maiúscula: "cafe" encontra "Café". */
export const semAcento = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
