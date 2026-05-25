import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { getUsuarioAtualId } from '@/lib/usuarioAtual';
import type { Produto } from '@/types/database';

const KEY = ['produtos'];

export function useProdutos(search?: string) {
  return useQuery({
    queryKey: [...KEY, search ?? ''],
    queryFn: async () => {
      let q = supabase
        .from('produtos')
        .select('*, categoria:categorias(id,nome), fornecedor:fornecedores(id,razao_social)')
        .order('nome');
      if (search) q = q.or(`nome.ilike.%${search}%,sku.ilike.%${search}%,codigo_barras.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as (Produto & {
        categoria: { id: string; nome: string } | null;
        fornecedor: { id: string; razao_social: string } | null;
      })[];
    },
  });
}

// Variante com variações embarcadas — usado pelo PDV
export function useProdutosComVariacoes(search?: string) {
  return useQuery({
    queryKey: [...KEY, 'with-variacoes', search ?? ''],
    queryFn: async () => {
      let q = supabase
        .from('produtos')
        .select('*, variacoes:variacoes_produto(id,nome,sku,codigo_barras,cor,tamanho,fragrancia,voltagem,custo_adicional,preco_adicional)')
        .eq('status', 'ativo')
        .order('nome');
      if (search) q = q.or(`nome.ilike.%${search}%,sku.ilike.%${search}%,codigo_barras.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as (Produto & {
        variacoes: {
          id: string; nome: string; sku: string | null; codigo_barras: string | null;
          cor: string | null; tamanho: string | null; fragrancia: string | null; voltagem: string | null;
          custo_adicional: number; preco_adicional: number;
        }[];
      })[];
    },
  });
}

export function useUpsertProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Produto> & { nome: string; _justificativa?: string }) => {
      const { _justificativa, ...data } = payload;
      const usuarioId = await getUsuarioAtualId();
      if (data.id) {
        // Buscar preço anterior para histórico
        const { data: prev } = await supabase
          .from('produtos')
          .select('preco_venda_padrao')
          .eq('id', data.id)
          .maybeSingle();
        const precoAnterior = Number(prev?.preco_venda_padrao ?? 0);
        const precoNovo = Number(data.preco_venda_padrao ?? precoAnterior);

        const { error } = await supabase.from('produtos').update(data).eq('id', data.id);
        if (error) throw error;

        if (precoNovo !== precoAnterior && precoAnterior > 0) {
          const variacao_pct = ((precoNovo - precoAnterior) / precoAnterior) * 100;
          await supabase.from('historico_preco').insert({
            produto_id: data.id,
            preco_anterior: precoAnterior,
            preco_novo: precoNovo,
            variacao_pct: +variacao_pct.toFixed(2),
            justificativa: _justificativa ?? null,
            usuario_id: usuarioId,
          });
        }
      } else {
        const { error } = await supabase.from('produtos').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useHistoricoPreco(produtoId: string | null) {
  return useQuery({
    queryKey: ['historico_preco', produtoId],
    enabled: !!produtoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_preco')
        .select('*, usuario:usuarios(nome)')
        .eq('produto_id', produtoId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as {
        id: string;
        preco_anterior: number;
        preco_novo: number;
        variacao_pct: number;
        justificativa: string | null;
        created_at: string;
        usuario: { nome: string } | null;
      }[];
    },
  });
}

// PostgREST .or() parser usa vírgula como separador e ponto como . — chars no value
// quebram o filtro. Para barcode/SKU validamos formato e usamos eq() direto (sem .or).
function safeBarcode(codigo: string): string | null {
  const t = (codigo ?? '').trim();
  if (!t) return null;
  // Aceita letras, dígitos, hífen, underscore (cobre EAN, Code128, SKUs internos)
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(t)) return null;
  return t;
}

export async function lookupProdutoByBarcode(codigo: string) {
  const safe = safeBarcode(codigo);
  if (!safe) return null;
  // Duas queries paralelas (eq em vez de or, sem risco de injeção PostgREST)
  const [byBarcode, bySku] = await Promise.all([
    supabase.from('produtos').select('*').eq('codigo_barras', safe).eq('status', 'ativo').limit(1).maybeSingle(),
    supabase.from('produtos').select('*').eq('sku', safe).eq('status', 'ativo').limit(1).maybeSingle(),
  ]);
  if (byBarcode.error) throw byBarcode.error;
  if (bySku.error) throw bySku.error;
  return (byBarcode.data ?? bySku.data) as Produto | null;
}

// Lookup que também busca em variações
export async function lookupVariacaoByBarcode(codigo: string) {
  const safe = safeBarcode(codigo);
  if (!safe) return null;
  const [byBarcode, bySku] = await Promise.all([
    supabase
      .from('variacoes_produto')
      .select('*, produto:produtos!inner(*)')
      .eq('codigo_barras', safe)
      .eq('produto.status', 'ativo')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('variacoes_produto')
      .select('*, produto:produtos!inner(*)')
      .eq('sku', safe)
      .eq('produto.status', 'ativo')
      .limit(1)
      .maybeSingle(),
  ]);
  if (byBarcode.error) throw byBarcode.error;
  if (bySku.error) throw bySku.error;
  return (byBarcode.data ?? bySku.data) as null | {
    id: string; produto_id: string; nome: string;
    custo_adicional: number; preco_adicional: number;
    produto: Produto;
  };
}

export function useDeleteProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
