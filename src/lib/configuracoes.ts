import { supabase } from '@/lib/supabase';
import type { FormaPagamento, LocalizacaoEstoque, VendaCanal } from '@/types/database';

export type TamanhoPapelCupom = '58mm' | '80mm' | 'A4' | 'personalizado';
export type ModoImpressao = 'grafico' | 'termica_texto';

export interface ConfiguracoesSistema {
  loja: {
    nome_fantasia: string;
    razao_social: string;
    cnpj: string;
    inscricao_estadual: string;
    telefone: string;
    whatsapp: string;
    email: string;
    endereco: string;
    cidade: string;
    uf: string;
    site: string;
    logo_url: string;
  };
  cupom: {
    titulo: string;
    subtitulo: string;
    mensagem_rodape: string;
    texto_sem_valor_fiscal: string;
    exibir_logo: boolean;
    exibir_cnpj: boolean;
    exibir_endereco: boolean;
    exibir_telefone: boolean;
    exibir_cliente: boolean;
    exibir_vendedor: boolean;
    exibir_sku: boolean;
    exibir_desconto: boolean;
    exibir_troco: boolean;
  };
  impressao: {
    modo: ModoImpressao;
    tamanho_papel: TamanhoPapelCupom;
    largura_personalizada_mm: number;
    colunas_texto: number;
    margem_mm: number;
    fonte_px: number;
    copias: number;
    auto_abrir_impressao: boolean;
    impressao_silenciosa: boolean;
    abrir_pdf_em_a4: boolean;
  };
  pdv: {
    canal_padrao: VendaCanal;
    local_estoque_padrao: LocalizacaoEstoque;
    forma_pagamento_padrao: FormaPagamento;
    exigir_cliente_fiado: boolean;
    permitir_troco_apenas_dinheiro: boolean;
  };
  whatsapp: {
    ativo: boolean;
    ddi_padrao: string;
    mensagem_prefixo: string;
    mensagem_sufixo: string;
  };
}

const STORAGE_KEY = 'sistemaRoyal.configuracoes';
const CONFIG_EVENT = 'sistemaRoyal:configuracoes';
const CONFIG_DB_KEY = 'geral';

export const CONFIGURACOES_DEFAULT: ConfiguracoesSistema = {
  loja: {
    nome_fantasia: 'sistemaRoyal',
    razao_social: '',
    cnpj: '',
    inscricao_estadual: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    cidade: '',
    uf: '',
    site: '',
    logo_url: '',
  },
  cupom: {
    titulo: 'Comprovante de venda',
    subtitulo: '',
    mensagem_rodape: 'Obrigado pela preferencia!',
    texto_sem_valor_fiscal: 'Documento sem valor fiscal',
    exibir_logo: true,
    exibir_cnpj: true,
    exibir_endereco: true,
    exibir_telefone: true,
    exibir_cliente: true,
    exibir_vendedor: true,
    exibir_sku: false,
    exibir_desconto: true,
    exibir_troco: true,
  },
  impressao: {
    modo: 'termica_texto',
    tamanho_papel: '58mm',
    largura_personalizada_mm: 58,
    colunas_texto: 0,
    margem_mm: 2,
    fonte_px: 12,
    copias: 1,
    auto_abrir_impressao: true,
    impressao_silenciosa: false,
    abrir_pdf_em_a4: true,
  },
  pdv: {
    canal_padrao: 'Loja',
    local_estoque_padrao: 'Loja',
    forma_pagamento_padrao: 'DINHEIRO',
    exigir_cliente_fiado: true,
    permitir_troco_apenas_dinheiro: true,
  },
  whatsapp: {
    ativo: true,
    ddi_padrao: '55',
    mensagem_prefixo: 'Olá! Segue o comprovante da sua compra.',
    mensagem_sufixo: 'Obrigado pela preferência!',
  },
};

function mergeConfig(base: ConfiguracoesSistema, saved: Partial<ConfiguracoesSistema>): ConfiguracoesSistema {
  return {
    loja: { ...base.loja, ...saved.loja },
    cupom: { ...base.cupom, ...saved.cupom },
    impressao: { ...base.impressao, ...saved.impressao },
    pdv: { ...base.pdv, ...saved.pdv },
    whatsapp: { ...base.whatsapp, ...saved.whatsapp },
  };
}

export function carregarConfiguracoes(): ConfiguracoesSistema {
  if (typeof window === 'undefined') return CONFIGURACOES_DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return CONFIGURACOES_DEFAULT;
    return mergeConfig(CONFIGURACOES_DEFAULT, JSON.parse(raw) as Partial<ConfiguracoesSistema>);
  } catch {
    return CONFIGURACOES_DEFAULT;
  }
}

export function salvarConfiguracoes(config: ConfiguracoesSistema): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: config }));
}

export async function carregarConfiguracoesSupabase(): Promise<ConfiguracoesSistema> {
  const local = carregarConfiguracoes();
  const { data, error } = await supabase
    .from('configuracoes_sistema')
    .select('valor')
    .eq('chave', CONFIG_DB_KEY)
    .maybeSingle();

  if (error) {
    console.warn('Nao foi possivel carregar configuracoes do Supabase. Usando cache local.', error);
    return local;
  }

  if (!data?.valor) return local;

  const config = mergeConfig(CONFIGURACOES_DEFAULT, data.valor as Partial<ConfiguracoesSistema>);
  salvarConfiguracoes(config);
  return config;
}

export async function salvarConfiguracoesSupabase(config: ConfiguracoesSistema): Promise<void> {
  salvarConfiguracoes(config);
  const { error } = await supabase
    .from('configuracoes_sistema')
    .upsert({ chave: CONFIG_DB_KEY, valor: config }, { onConflict: 'chave' });

  if (error) throw error;
}

export function restaurarConfiguracoesPadrao(): ConfiguracoesSistema {
  salvarConfiguracoes(CONFIGURACOES_DEFAULT);
  return CONFIGURACOES_DEFAULT;
}

export async function restaurarConfiguracoesPadraoSupabase(): Promise<ConfiguracoesSistema> {
  await salvarConfiguracoesSupabase(CONFIGURACOES_DEFAULT);
  return CONFIGURACOES_DEFAULT;
}

export function onConfiguracoesChange(callback: (config: ConfiguracoesSistema) => void): () => void {
  const handler = (event: Event) => callback((event as CustomEvent<ConfiguracoesSistema>).detail);
  window.addEventListener(CONFIG_EVENT, handler);
  return () => window.removeEventListener(CONFIG_EVENT, handler);
}
