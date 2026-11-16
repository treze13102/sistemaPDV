/**
 * Converte erros das funções do banco (RPC) em mensagens que o operador
 * entenda e saiba resolver.
 *
 * - Função ausente (migration não aplicada): o PostgREST responde PGRST202
 *   com uma frase técnica em inglês. Trocamos por uma instrução direta.
 * - `raise exception` das próprias funções já vem em português e claro —
 *   repassamos a mensagem como está.
 */
interface ErroPostgrest {
  code?: string;
  message?: string;
}

const MIGRATION_VENDA = '20261114000001_venda_transacional.sql';

export function traduzirErroRpc(erro: unknown): Error {
  const e = (erro ?? {}) as ErroPostgrest;
  const msg = e.message ?? String(erro);

  if (e.code === 'PGRST202' || /could not find the function/i.test(msg)) {
    return new Error(
      `O banco ainda não tem as funções de venda. Rode a migration ${MIGRATION_VENDA} no SQL Editor do Supabase e tente de novo.`,
    );
  }
  return new Error(msg);
}
