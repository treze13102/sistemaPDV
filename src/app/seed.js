// Sample business data for the demo. Generated deterministically so every visitor sees the same start.

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const CATEGORIES = ["Bebidas", "Lanches", "Doces", "Acessórios"];

// Ids = valores do enum forma_pagamento do banco Royal (gravados em pagamentos_venda).
export const PAYMENT_METHODS = [
  { id: "DINHEIRO", label: "Dinheiro" },
  { id: "PIX", label: "Pix" },
  { id: "CARTAO_DEBITO", label: "Cartão de débito" },
  { id: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { id: "CREDIARIO", label: "Crediário" },
  { id: "FIADO", label: "Fiado" },
  { id: "VALE_PRESENTE", label: "Vale presente" },
];

// Order statuses as the original lists them: three fixed ones, then editable ones that can be switched off.
export const ORDER_STATUSES = [
  { id: "pending", label: "Pendente", color: "#363f4d", fixed: true, active: true, description: "Aparece quando seu cliente realizar o pedido. Este status NÃO movimenta estoque." },
  { id: "confirmed", label: "Confirmado", color: "#2dd1ac", fixed: true, active: true, description: "Aparece quando o vendedor confirmar o pedido. A partir deste status o estoque é movimentado." },
  { id: "paid", label: "Pago", color: "#2dd1ac", fixed: true, active: true, money: true, description: "Aparece após o pedido ser pago." },
  { id: "production", label: "Em produção", color: "#fe0000", active: true },
  { id: "shipping", label: "Em expedição", color: "#ff8552", active: true },
  { id: "delivering", label: "Saiu para entrega", color: "#f4c138", active: true },
  { id: "ready", label: "Pronto para retirar", color: "#89bbfe", active: true },
];

export const PERMISSIONS = [
  { id: "sell", label: "Vender" },
  { id: "orders", label: "Gerenciar pedidos" },
  { id: "products", label: "Gerenciar produtos e estoque" },
  { id: "customers", label: "Gerenciar clientes" },
  { id: "history", label: "Ver histórico de todas as vendas" },
  { id: "analytics", label: "Ver estatísticas" },
  { id: "finances", label: "Ver finanças" },
  { id: "config", label: "Alterar configurações" },
];

const PRODUCTS = [
  ["Café espresso", "Bebidas", 6, 1.8, 120, 20, "#8a5a44"],
  ["Cappuccino", "Bebidas", 9.5, 3.1, 80, 15, "#c49a6c"],
  ["Suco de laranja", "Bebidas", 8, 2.6, 40, 10, "#f6a522"],
  ["Água mineral", "Bebidas", 3.5, 1.1, 6, 12, "#89bbfe"],
  ["Pão de queijo", "Lanches", 5, 1.4, 64, 20, "#fdca40"],
  ["Sanduíche natural", "Lanches", 14.9, 5.5, 18, 8, "#82d173"],
  ["Croissant", "Lanches", 9, 3, 0, 6, "#e0b26b"],
  ["Coxinha", "Lanches", 7, 2.2, 35, 10, "#ff8552"],
  ["Brigadeiro", "Doces", 3, 0.8, 90, 30, "#5b3a29"],
  ["Bolo de cenoura (fatia)", "Doces", 8.5, 2.4, 22, 8, "#ff9a3c"],
  ["Cookie", "Doces", 6.5, 1.9, null, null, "#b07d4f"],
  ["Caneca personalizada", "Acessórios", 39.9, 15, 9, 5, "#0d3b66"],
];

const OWNER = { id: "u1", name: "Usuário Demo", email: "demo@minhaloja.com", role: "owner", active: true, permissions: PERMISSIONS.map((p) => p.id) };

/** A brand-new account: what the original shows right after signing up. */
export function createEmpty() {
  return { products: [], customers: [], users: [OWNER], sales: [], orders: [], finances: [], categories: [], nextNumber: 1, nextOrder: 1 };
}

export function createSeed() {
  const r = rng(42);
  const now = Date.now();
  const day = 86400000;
  const products = PRODUCTS.map(([name, category, price, cost, stock, minStock, color], i) => ({
    id: `p${i + 1}`,
    name,
    code: String(7890000 + i * 37),
    category,
    price,
    cost,
    promoPrice: null,
    description: "",
    stockActive: stock != null,
    stock: stock ?? 0,
    minStock: minStock ?? 0,
    color,
    showOnCatalog: i !== 11,
    highlight: i === 1 || i === 8,
    createdAt: now - (60 - i) * day,
  }));

  const customers = [
    ["Ana Souza", "+55 11 98888-1010", "ana@exemplo.com", "Rua das Flores, 120", 0],
    ["Bruno Lima", "+55 11 97777-2020", "", "Av. Central, 45", -32.5],
    ["Carla Mendes", "+55 21 96666-3030", "carla@exemplo.com", "", 0],
    ["Diego Rocha", "+55 31 95555-4040", "", "Rua Sete, 700", 15],
    ["Eduarda Alves", "+55 11 94444-5050", "duda@exemplo.com", "Praça da Sé, 1", 0],
    ["Felipe Costa", "", "felipe@exemplo.com", "", 0],
  ].map(([name, phone, email, address, balance], i) => ({
    id: `c${i + 1}`,
    name,
    phone,
    email,
    address,
    document: "",
    note: "",
    balance,
    createdAt: now - (90 - i * 7) * day,
  }));

  const users = [
    OWNER,
    { id: "u2", name: "Marina", email: "marina@minhaloja.com", role: "seller", active: true, permissions: ["sell", "orders", "customers"] },
    { id: "u3", name: "Rafael", email: "rafael@minhaloja.com", role: "seller", active: false, permissions: ["sell"] },
  ];

  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const makeItems = () => {
    const n = 1 + Math.floor(r() * 3);
    const items = [];
    for (let k = 0; k < n; k++) {
      const p = pick(products);
      const ex = items.find((x) => x.productId === p.id);
      if (ex) ex.qty += 1;
      else items.push({ productId: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1 + Math.floor(r() * 2) });
    }
    return items;
  };

  const sales = [];
  for (let i = 0; i < 64; i++) {
    const items = makeItems();
    const total = items.reduce((s, x) => s + x.price * x.qty, 0);
    const created = now - Math.floor(r() * 30) * day - Math.floor(r() * 10) * 3600000 - 2 * 3600000;
    const method = pick(["money", "credit", "debit", "pix", "pix", "credit"]);
    sales.push({
      id: `s${1000 + i}`,
      number: 1000 + i,
      items,
      discount: 0,
      total,
      payments: [{ method, value: total }],
      customerId: r() < 0.4 ? pick(customers).id : null,
      userId: pick(["u1", "u1", "u2", "u3"]),
      status: r() < 0.06 ? "canceled" : "closed",
      createdAt: created,
      closedAt: created,
      isOrder: false,
    });
  }
  sales.sort((a, b) => b.createdAt - a.createdAt);

  const orders = ORDER_STATUSES.flatMap((st, i) =>
    Array.from({ length: i === 0 ? 2 : 1 }, (_, k) => {
      const items = makeItems();
      return {
        id: `o${i}${k}`,
        number: 200 + i * 2 + k,
        items,
        discount: 0,
        total: items.reduce((s, x) => s + x.price * x.qty, 0),
        customerId: pick(customers).id,
        userId: "u1",
        status: st.id,
        paid: i >= 3,
        delivery: i % 2 === 0 ? "delivery" : "pickup",
        origin: k === 0 && i < 3 ? "catalog" : "store",
        note: i === 0 ? "Sem açúcar, por favor." : "",
        createdAt: now - (i * 3 + k) * 3600000 - 1800000,
      };
    })
  );

  const finances = [
    { id: "f1", kind: "payables", description: "Aluguel", category: "Imóvel", value: 2200, due: now + 5 * day, paid: false },
    { id: "f2", kind: "payables", description: "Fornecedor de café", category: "Fornecedores", value: 640, due: now - 2 * day, paid: false },
    { id: "f3", kind: "payables", description: "Internet", category: "Serviços", value: 119.9, due: now - 10 * day, paid: true },
    { id: "f4", kind: "expenses", description: "Embalagens", category: "Materiais", value: 86.4, due: now - 3 * day, paid: true },
    { id: "f5", kind: "expenses", description: "Energia elétrica", category: "Serviços", value: 312.7, due: now - 8 * day, paid: true },
    { id: "f6", kind: "expenses", description: "Manutenção da máquina", category: "Equipamentos", value: 150, due: now - 15 * day, paid: true },
  ];

  return { products, customers, users, sales, orders, finances, categories: CATEGORIES.slice(), nextNumber: 1064, nextOrder: 212 };
}
