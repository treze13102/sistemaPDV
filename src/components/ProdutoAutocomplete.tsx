import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { BarcodeInput } from '@/components/BarcodeInput';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Busca de produto com sugestões conforme se digita.
 *
 * O produto selecionado é mantido pelo pai como objeto (não como id solto),
 * então ele continua visível mesmo quando a lista ainda não recarregou —
 * é isso que faz um produto recém-cadastrado aparecer na hora.
 */

export interface ProdutoBusca {
  id: string;
  nome: string;
  sku?: string | null;
  codigo_barras?: string | null;
  descricao_curta?: string | null;
  descricao_detalhada?: string | null;
}

interface Props {
  produtos: ProdutoBusca[];
  selecionado: ProdutoBusca | null;
  onSelecionar: (p: ProdutoBusca | null) => void;
  /** Mostra o botão "Novo produto" ao lado do campo. */
  onCriarNovo?: () => void;
  /** Chamado quando o leitor de código de barras dispara. */
  onScan?: (codigo: string) => void;
  carregando?: boolean;
  placeholder?: string;
  limite?: number;
}

/** Remove acentos p/ que "cafe" encontre "café" e vice-versa. */
export function normalizarBusca(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

interface Sugestao {
  produto: ProdutoBusca;
  /** Menor = mais relevante. */
  score: number;
  /** Onde bateu, quando não foi no nome — ajuda o usuário a entender o resultado. */
  contexto: string | null;
}

function pontuar(p: ProdutoBusca, termo: string): Sugestao | null {
  const nome = normalizarBusca(p.nome);
  const sku = normalizarBusca(p.sku ?? '');
  const barras = normalizarBusca(p.codigo_barras ?? '');
  const curta = normalizarBusca(p.descricao_curta ?? '');
  const detalhada = normalizarBusca(p.descricao_detalhada ?? '');

  // Ordem de relevância: nome no início > nome contém > código exato >
  // código contém > descrição. Quem procura "cam" quer "Camiseta" no topo.
  if (nome.startsWith(termo)) return { produto: p, score: 0, contexto: null };
  if (sku === termo || barras === termo) return { produto: p, score: 1, contexto: p.sku ?? p.codigo_barras ?? null };
  if (nome.includes(termo)) return { produto: p, score: 2, contexto: null };
  if (sku.includes(termo)) return { produto: p, score: 3, contexto: `SKU ${p.sku}` };
  if (barras.includes(termo)) return { produto: p, score: 4, contexto: `Cód. ${p.codigo_barras}` };
  if (curta.includes(termo)) return { produto: p, score: 5, contexto: p.descricao_curta ?? null };
  if (detalhada.includes(termo)) return { produto: p, score: 6, contexto: p.descricao_detalhada ?? null };
  return null;
}

export function ProdutoAutocomplete({
  produtos,
  selecionado,
  onSelecionar,
  onCriarNovo,
  onScan,
  carregando,
  placeholder = 'Digite nome, SKU, descrição ou escaneie o código...',
  limite = 8,
}: Props) {
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sugestoes = useMemo(() => {
    const t = normalizarBusca(termo);
    if (!t) return [];
    return produtos
      .map((p) => pontuar(p, t))
      .filter((s): s is Sugestao => s !== null)
      .sort((a, b) => a.score - b.score || a.produto.nome.localeCompare(b.produto.nome))
      .slice(0, limite);
  }, [produtos, termo, limite]);

  // Novo termo recomeça o destaque no topo.
  useEffect(() => {
    setDestaque(0);
  }, [termo]);

  // Clique fora fecha a lista.
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  function escolher(p: ProdutoBusca) {
    onSelecionar(p);
    setTermo('');
    setAberto(false);
  }

  function limpar() {
    onSelecionar(null);
    setTermo('');
    setAberto(false);
  }

  /**
   * Captura no container: roda antes do handler do BarcodeInput. Com a lista
   * aberta, Enter escolhe o item destacado em vez de disparar o scanner.
   */
  function aoTeclarCaptura(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestaque((d) => (d + 1) % sugestoes.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaque((d) => (d - 1 + sugestoes.length) % sugestoes.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      escolher(sugestoes[destaque].produto);
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDownCapture={aoTeclarCaptura}>
      {selecionado ? (
        <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 p-2.5">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{selecionado.nome}</div>
            {(selecionado.sku || selecionado.codigo_barras) && (
              <div className="truncate text-xs text-muted-foreground">
                {[selecionado.sku && `SKU ${selecionado.sku}`, selecionado.codigo_barras]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            title="Trocar produto"
            onClick={limpar}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[var(--royal-line)] bg-background/45">
          <div className="grid sm:grid-cols-[1fr_auto]">
            <BarcodeInput
              containerClassName="border-b border-[var(--royal-line)] sm:border-b-0 sm:border-r"
              className="rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={placeholder}
              value={termo}
              onChange={(v) => {
                setTermo(v);
                setAberto(true);
              }}
              onFocus={() => setAberto(true)}
              onScan={(codigo) => onScan?.(codigo)}
              clearOnScan={false}
            />
            {onCriarNovo && (
              <Button type="button" variant="ghost" className="h-10 rounded-none px-5" onClick={onCriarNovo}>
                <Plus className="mr-2 h-4 w-4" /> Novo produto
              </Button>
            )}
          </div>
        </div>
      )}

      {!selecionado && aberto && termo.trim() !== '' && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[var(--royal-line)] bg-background shadow-lg">
          {carregando && <div className="px-3 py-2 text-sm text-muted-foreground">Carregando produtos...</div>}

          {!carregando && sugestoes.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Nenhum produto encontrado para “{termo.trim()}”.
              {onCriarNovo && (
                <button
                  type="button"
                  className="ml-1 text-primary underline underline-offset-2"
                  onClick={onCriarNovo}
                >
                  Cadastrar novo
                </button>
              )}
            </div>
          )}

          {!carregando && sugestoes.length > 0 && (
            <ul className="max-h-64 overflow-y-auto">
              {sugestoes.map((s, idx) => (
                <li key={s.produto.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center justify-between gap-3 border-b border-[var(--royal-line)] px-3 py-2 text-left text-sm last:border-b-0',
                      idx === destaque ? 'bg-accent' : 'hover:bg-accent/60',
                    )}
                    onMouseEnter={() => setDestaque(idx)}
                    onClick={() => escolher(s.produto)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.produto.nome}</span>
                      {s.contexto && (
                        <span className="block truncate text-xs text-muted-foreground">{s.contexto}</span>
                      )}
                    </span>
                    {s.produto.sku && !s.contexto && (
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.produto.sku}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!selecionado && termo.trim() === '' && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Search className="h-3 w-3" /> Busca por nome, SKU, código de barras ou descrição
        </p>
      )}
    </div>
  );
}
