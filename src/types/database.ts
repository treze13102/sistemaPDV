// Tipos do banco - gerados manualmente conforme schema MVP.
// Para regenerar via CLI: npx supabase gen types typescript --project-id <ID>
// (substitui este arquivo)

export type CategoriaTipo =
  | 'Presentes'
  | 'Perfumes'
  | 'Folheados'
  | 'Bolsas'
  | 'Itens_3D'
  | 'Insumos_3D'
  | 'Outros';

export type ProdutoStatus = 'ativo' | 'inativo';

export type MovimentoTipo =
  | 'ENTRADA_COMPRA'
  | 'ENTRADA_PRODUCAO'
  | 'SAIDA_VENDA'
  | 'SAIDA_PERDA'
  | 'AJUSTE_INVENTARIO';

export type LocalizacaoEstoque = 'Loja' | 'Deposito' | 'Fabrica3D' | 'Consignado';

export type VendaCanal = 'Loja' | 'WhatsApp' | 'Instagram' | 'Marketplace' | 'Site';
export type VendaStatus = 'CONCLUIDA' | 'CANCELADA' | 'ORCAMENTO';

export type FormaPagamento =
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'PIX'
  | 'FIADO'
  | 'VALE_PRESENTE';

export type ParcelaTipo = 'PAGAR' | 'RECEBER';
export type ParcelaStatus = 'ABERTA' | 'PAGA' | 'PARCIAL' | 'ATRASADA' | 'CANCELADA';
export type ParcelaOrigem =
  | 'COMPRA'
  | 'VENDA'
  | 'DESPESA_FIXA'
  | 'DESPESA_VARIAVEL'
  | 'IMPOSTO'
  | 'COMISSAO';
export type CentroCusto = 'Loja' | 'Producao3D' | 'Administrativo' | 'Marketing';

export interface PerfilAcesso {
  id: string;
  nome: string;
  matriz_permissoes: Record<string, unknown>;
  created_at: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil_acesso_id: string | null;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  categoria_pai_id: string | null;
  tipo: CategoriaTipo;
  markup_minimo_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface Fornecedor {
  id: string;
  razao_social: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  condicoes_comerciais_padrao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Produto {
  id: string;
  nome: string;
  descricao_curta: string | null;
  descricao_detalhada: string | null;
  categoria_id: string | null;
  sku: string | null;
  codigo_barras: string | null;
  unidade_medida: string;
  fornecedor_principal_id: string | null;
  custo_aquisicao: number;
  preco_venda_padrao: number;
  margem_desejada_percentual: number | null;
  estoque_minimo: number | null;
  estoque_maximo: number | null;
  ponto_reposicao: number | null;
  status: ProdutoStatus;
  canal_loja_fisica: boolean;
  canal_ecommerce: boolean;
  canal_marketplace_x: boolean;
  canal_marketplace_y: boolean;
  is_item_3d: boolean;
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VariacaoProduto {
  id: string;
  produto_id: string;
  nome: string;
  sku: string | null;
  codigo_barras: string | null;
  cor: string | null;
  tamanho: string | null;
  fragrancia: string | null;
  voltagem: string | null;
  custo_adicional: number;
  preco_adicional: number;
  created_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  data_aniversario: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovimentoEstoque {
  id: string;
  produto_id: string;
  variacao_id: string | null;
  tipo: MovimentoTipo;
  quantidade: number;
  localizacao: LocalizacaoEstoque;
  custo_unitario: number | null;
  data_hora: string;
  usuario_id: string | null;
  origem_tipo: string | null;
  origem_id: string | null;
  observacao: string | null;
  created_at: string;
}

export interface Venda {
  id: string;
  numero: number;
  data_hora: string;
  usuario_id: string | null;
  cliente_id: string | null;
  canal: VendaCanal;
  total_bruto: number;
  desconto_total: number;
  total_liquido: number;
  forma_pagamento_principal: FormaPagamento | null;
  status: VendaStatus;
  observacao: string | null;
  cancelada_em: string | null;
  cancelada_motivo: string | null;
  validade_orcamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemVenda {
  id: string;
  venda_id: string;
  produto_id: string;
  variacao_id: string | null;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  total: number;
  created_at: string;
}

export interface PagamentoVenda {
  id: string;
  venda_id: string;
  forma: FormaPagamento;
  valor: number;
  parcelas: number | null;
  created_at: string;
}

export interface ParcelaFinanceira {
  id: string;
  tipo: ParcelaTipo;
  origem_tipo: ParcelaOrigem;
  origem_id: string | null;
  descricao: string;
  data_emissao: string;
  data_vencimento: string;
  valor: number;
  valor_pago: number;
  data_pagamento: string | null;
  status: ParcelaStatus;
  centro_custo: CentroCusto | null;
  cliente_id: string | null;
  fornecedor_id: string | null;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

