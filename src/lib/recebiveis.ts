import type { FormaPagamento } from '@/types/database';

// Dias até o primeiro recebimento de cartão de crédito (padrão das adquirentes).
export const DIAS_PRIMEIRO_RECEBIMENTO_CARTAO = 30;

export interface ParcelaPlano {
  numero: number;
  valor: number;
  /** ISO yyyy-mm-dd */
  data_vencimento: string;
}

export function isoDate(d: Date): string {
  // Usa componentes locais — toISOString() converteria p/ UTC e poderia
  // "voltar" um dia dependendo do fuso.
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function addDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

export function addMeses(base: Date, meses: number): Date {
  const d = new Date(base);
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + meses);
  // Se o mês destino não tem o dia (ex.: 31/01 + 1 mês), cai no último dia do mês.
  if (d.getDate() < diaOriginal) d.setDate(0);
  return d;
}

/**
 * Divide um total em N valores de 2 casas que somam exatamente o total.
 * A diferença de arredondamento vai para a última parcela.
 */
export function distribuirValor(total: number, n: number): number[] {
  if (n <= 0) return [];
  const bruto = Math.round((total / n) * 100) / 100;
  const valores = Array.from({ length: n }, () => bruto);
  const somaParcial = Math.round(bruto * (n - 1) * 100) / 100;
  valores[n - 1] = Math.round((total - somaParcial) * 100) / 100;
  return valores;
}

/**
 * Cartão de crédito: 1x recebe em 30 dias; N parcelas recebem
 * a cada 30 dias (30, 60, 90...), conforme repasse da adquirente.
 */
export function gerarPlanoCartao(
  total: number,
  parcelas: number,
  base: Date = new Date(),
  intervaloDias: number = DIAS_PRIMEIRO_RECEBIMENTO_CARTAO,
): ParcelaPlano[] {
  const n = Math.max(Math.floor(parcelas) || 1, 1);
  const passo = intervaloDias > 0 ? intervaloDias : DIAS_PRIMEIRO_RECEBIMENTO_CARTAO;
  const valores = distribuirValor(total, n);
  return valores.map((valor, i) => ({
    numero: i + 1,
    valor,
    data_vencimento: isoDate(addDias(base, passo * (i + 1))),
  }));
}

/**
 * Crediário: parcelas mensais a partir do primeiro vencimento informado
 * (padrão: 30 dias após a venda). As datas podem ser editadas depois.
 */
export function gerarPlanoCrediario(
  totalFinanciado: number,
  parcelas: number,
  primeiroVencimento?: string,
  base: Date = new Date(),
): ParcelaPlano[] {
  const n = Math.max(Math.floor(parcelas) || 1, 1);
  const valores = distribuirValor(totalFinanciado, n);
  const inicio = primeiroVencimento ? new Date(`${primeiroVencimento}T00:00:00`) : addDias(base, 30);
  return valores.map((valor, i) => ({
    numero: i + 1,
    valor,
    data_vencimento: isoDate(addMeses(inicio, i)),
  }));
}

export type BandeiraCartao = 'mastercard' | 'visa' | 'elo' | 'amex' | 'cabal' | 'outras';

export const BANDEIRAS: { value: BandeiraCartao; label: string }[] = [
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'Amex' },
  { value: 'cabal', label: 'Cabal' },
  { value: 'outras', label: 'Outras' },
];

export interface PagamentoParaPlano {
  forma: FormaPagamento;
  valor: number;
  parcelas?: number;
  /** Crédito/débito: bandeira usada, define a taxa aplicada. */
  bandeira?: BandeiraCartao;
  /** Crediário: valor pago no ato; o restante é financiado. */
  entrada?: number;
  /** Datas/valores acordados. Quando ausente, o plano é gerado automaticamente. */
  plano?: ParcelaPlano[];
}

export interface RecebivelInsert {
  tipo: 'RECEBER';
  origem_tipo: 'VENDA';
  origem_id: string;
  descricao: string;
  data_emissao: string;
  data_vencimento: string;
  /** Líquido: o que efetivamente cai na conta, já sem a taxa da adquirente. */
  valor: number;
  valor_bruto: number;
  taxa_percentual: number;
  taxa_valor: number;
  status: 'ABERTA';
  centro_custo: 'Loja';
  cliente_id: string | null;
  numero_parcela: number;
  total_parcelas: number;
  forma_pagamento: FormaPagamento;
  bandeira: BandeiraCartao | null;
}

export interface TaxaBandeira {
  debito_pct: number;
  credito_vista_pct: number;
  /** Crédito parcelado em 2x até 6x. */
  parcelado_2a6_pct: number;
  /** Crédito parcelado em 7x ou mais. */
  parcelado_7mais_pct: number;
}

export interface TaxasRecebiveis {
  bandeiras: Record<BandeiraCartao, TaxaBandeira>;
  /** Dias entre a venda e cada repasse do crédito (30 = 30/60/90...). */
  dias_recebimento_credito: number;
  /** Dias até o repasse do débito, quando ele gera recebível. */
  dias_recebimento_debito: number;
  /** Débito conta como recebido no ato por padrão; ligar para vê-lo como D+N líquido. */
  gerar_recebivel_debito: boolean;
}

const TAXA_ZERADA: TaxaBandeira = { debito_pct: 0, credito_vista_pct: 0, parcelado_2a6_pct: 0, parcelado_7mais_pct: 0 };

export const TAXAS_ZERADAS: TaxasRecebiveis = {
  bandeiras: {
    mastercard: TAXA_ZERADA,
    visa: TAXA_ZERADA,
    elo: TAXA_ZERADA,
    amex: TAXA_ZERADA,
    cabal: TAXA_ZERADA,
    outras: TAXA_ZERADA,
  },
  dias_recebimento_credito: DIAS_PRIMEIRO_RECEBIMENTO_CARTAO,
  dias_recebimento_debito: 1,
  gerar_recebivel_debito: false,
};

/** Percentual que a adquirente retém, conforme forma, bandeira e nº de parcelas. */
export function taxaAplicavel(
  forma: FormaPagamento,
  parcelas: number,
  bandeira: BandeiraCartao | undefined,
  taxas: TaxasRecebiveis,
): number {
  const linha = taxas.bandeiras[bandeira ?? 'outras'] ?? TAXA_ZERADA;
  if (forma === 'CARTAO_DEBITO') return linha.debito_pct;
  if (forma === 'CARTAO_CREDITO') {
    if (parcelas <= 1) return linha.credito_vista_pct;
    if (parcelas <= 6) return linha.parcelado_2a6_pct;
    return linha.parcelado_7mais_pct;
  }
  return 0; // crediário e fiado são recebidos direto do cliente, sem intermediário
}

/**
 * Converte as formas de pagamento de uma venda nas parcelas a receber.
 * Fonte única usada tanto ao criar quanto ao editar a venda, para que o
 * fluxo financeiro nunca divirja entre os dois caminhos.
 */
export function construirRecebiveis(params: {
  vendaId: string;
  numeroVenda: number;
  clienteId: string | null;
  pagamentos: PagamentoParaPlano[];
  taxas?: TaxasRecebiveis;
  base?: Date;
}): RecebivelInsert[] {
  const base = params.base ?? new Date();
  const emissao = isoDate(base);
  const taxas = params.taxas ?? TAXAS_ZERADAS;

  return params.pagamentos.flatMap((p) => {
    const parcelas = p.parcelas ?? 1;
    let plano: ParcelaPlano[];
    let rotulo: string;

    if (p.forma === 'CARTAO_CREDITO') {
      // 1x recebe no prazo configurado; N parcelas a cada intervalo.
      plano = p.plano?.length
        ? p.plano
        : gerarPlanoCartao(p.valor, parcelas, base, taxas.dias_recebimento_credito);
      rotulo = 'cartão';
    } else if (p.forma === 'CARTAO_DEBITO') {
      // Só vira recebível quando a loja quer enxergar o D+N líquido.
      if (!taxas.gerar_recebivel_debito) return [];
      plano = [{
        numero: 1,
        valor: p.valor,
        data_vencimento: isoDate(addDias(base, Math.max(taxas.dias_recebimento_debito, 0))),
      }];
      rotulo = 'débito';
    } else if (p.forma === 'CREDIARIO' || p.forma === 'FIADO') {
      // A entrada é paga no ato — só o restante é financiado.
      const financiado = +(p.valor - (p.entrada ?? 0)).toFixed(2);
      if (financiado <= 0) return [];
      plano = p.plano?.length ? p.plano : gerarPlanoCrediario(financiado, parcelas, undefined, base);
      rotulo = 'crediário';
    } else {
      return []; // dinheiro, pix, vale: liquidado no ato
    }

    const ehCartao = p.forma === 'CARTAO_CREDITO' || p.forma === 'CARTAO_DEBITO';
    const taxaPct = taxaAplicavel(p.forma, parcelas, p.bandeira, taxas);
    const total = plano.length;

    return plano.map((parcela) => {
      const bruto = parcela.valor;
      const taxaValor = +(bruto * (taxaPct / 100)).toFixed(2);
      const liquido = +(bruto - taxaValor).toFixed(2);
      return {
        tipo: 'RECEBER' as const,
        origem_tipo: 'VENDA' as const,
        origem_id: params.vendaId,
        descricao: `Venda #${params.numeroVenda} — ${rotulo} ${parcela.numero}/${total}`,
        data_emissao: emissao,
        data_vencimento: parcela.data_vencimento,
        valor: liquido,
        valor_bruto: bruto,
        taxa_percentual: taxaPct,
        taxa_valor: taxaValor,
        status: 'ABERTA' as const,
        centro_custo: 'Loja' as const,
        cliente_id: params.clienteId,
        numero_parcela: parcela.numero,
        total_parcelas: total,
        forma_pagamento: p.forma,
        bandeira: ehCartao ? (p.bandeira ?? 'outras') : null,
      };
    });
  });
}

export const FORMA_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO_CREDITO: 'Cartão Crédito',
  CARTAO_DEBITO: 'Cartão Débito',
  PIX: 'PIX',
  FIADO: 'Fiado',
  CREDIARIO: 'Crediário',
  VALE_PRESENTE: 'Vale Presente',
};
