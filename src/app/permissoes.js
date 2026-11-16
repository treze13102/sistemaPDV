/**
 * Permissões usando a tabela `perfis_acesso` do Royal.
 * matriz_permissoes: {"all": true} ou {"modulo": ["read","write"], ...}
 * (formato original do Royal, mantido para os dois sistemas lerem igual).
 */
export const MODULOS = [
  { id: "vendas", label: "Vender e histórico de vendas", paginas: ["checkout", "sales", "orders"] },
  { id: "clientes", label: "Clientes", paginas: ["customers"] },
  { id: "produtos", label: "Produtos e catálogo", paginas: ["products", "catalog"] },
  { id: "estoque", label: "Estoque, compras e fornecedores", paginas: ["stock", "purchases", "suppliers"] },
  { id: "financeiro", label: "Finanças e calendário", paginas: ["finances", "calendar"] },
  { id: "relatorios", label: "Relatórios e estatísticas", paginas: ["reports", "analytics"] },
  { id: "usuarios", label: "Usuários e ajustes da loja", paginas: ["users", "config"] },
];

export const ehAdmin = (perfil) => !!perfil?.matriz?.all;

export function podeModulo(perfil, modulo) {
  const m = perfil?.matriz || {};
  return !!m.all || (Array.isArray(m[modulo]) && m[modulo].length > 0);
}

/**
 * Enquanto ninguém for Administrador, tudo fica liberado — evita que a loja
 * se tranque fora do sistema ao começar a usar permissões.
 */
export function podePagina(acesso, pagina) {
  if (!acesso || acesso.semAdmin) return true;
  const mod = MODULOS.find((m) => m.paginas.includes(pagina));
  if (!mod) return true;
  return podeModulo(acesso.perfil, mod.id);
}

export function matrizDe(modulos, todos) {
  if (todos) return { all: true };
  return Object.fromEntries(modulos.map((m) => [m, ["read", "write"]]));
}
