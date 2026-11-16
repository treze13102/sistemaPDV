/**
 * Busca TODAS as linhas de uma consulta, paginando de 1000 em 1000.
 *
 * O Supabase (PostgREST) corta qualquer resposta no `max-rows` do projeto —
 * 1000 por padrão — sem erro e sem aviso, mesmo que o código peça
 * `.limit(5000)`. Com mais de 1000 produtos, a lista ordenada por nome
 * perdia tudo depois do milésimo item (ex.: produtos começando com "T").
 *
 * `montar` deve devolver a consulta SEM .range()/.limit(): ela é recriada a
 * cada página porque os builders do supabase-js não são reutilizáveis.
 * A consulta precisa de ordenação estável para as páginas não se sobreporem.
 */
const PAGINA = 1000;

// O builder do supabase-js é "thenable" e expõe .range(); tipamos só o que usamos.
interface ConsultaPaginavel<T> {
  range(from: number, to: number): PromiseLike<{ data: T[] | null; error: unknown }>;
}

export async function buscarTodos<T>(montar: () => ConsultaPaginavel<T>, maxPaginas = 50): Promise<T[]> {
  const todos: T[] = [];
  for (let pagina = 0; pagina < maxPaginas; pagina += 1) {
    const inicio = pagina * PAGINA;
    const { data, error } = await montar().range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const lote = data ?? [];
    todos.push(...lote);
    if (lote.length < PAGINA) break; // última página
  }
  return todos;
}
