// Labels and options for the Settings > General page, as defined by the original app's code
// (Portuguese is the original's default language here).

export const T = {
  pageTitle: "Configurações",
  tabs: [
    { id: "general", label: "Geral" },
    { id: "orders-and-sales", label: "Pedidos e vendas" },
    { id: "receipt", label: "Recibo" },
    { id: "payments", label: "Pagamentos" },
    { id: "pickup-and-delivery", label: "Entrega e retirada" },
    { id: "integrations", label: "Integrações" },
  ],
  generalTitle: "Informações gerais",
  generalSubtitle: "Forneça detalhes sobre seu negócio",
  identification: "Identificação",
  legalInstructions:
    "Informar o CPF ou CNPJ ajuda a validar sua conta e proteger sua privacidade. Os dados de identificação não são exibidos no catálogo online.",
  storeName: "Nome da Loja",
  corporateName: "Nome do responsável ou Razão Social",
  documentNumber: "CPF ou CNPJ",
  contactData: "Dados de contato",
  phone: "Telefone",
  whatsapp: "Celular/WhatsApp",
  instagram: "Instagram",
  email: "Email",
  address: "Endereço",
  addressComplement: "Complemento",
  viewOnMap: "Ver no mapa",
  chooseImage: "Escolher imagem",
  uploadLogo: "Upload da sua marca",
  removeImage: "Remover imagem",
  aboutStore: "Sobre a loja",
  extraInfo: "Informações extras",
  extraInfoHelp:
    "Neste campo você pode adicionar o endereço do seu negócio, horário de funcionamento e o que mais precisar.",
  currency: "Moeda",
  currencySearch: "Procurar moedas",
  decimalParts: "Casas decimais",
  displayOptions: "Opções de exibição",
  canceledTitle: "Transações canceladas",
  showCrossedOut: "Exibir riscadas",
  hide: "Ocultar",
  tipDisplayed: "Exibido em recibos e no catálogo",
  tipNotDisplayed: "Não será exibido",
  tipCatalog: "Exibido no catálogo online",
  discard: "Descartar",
  save: "Salvar alterações",
  saving: "Salvando...",
  saved: "As alterações foram salvas!",
  saveError: "Erro ao salvar alterações",
  tryAgain: "Tente novamente",
  attention: "Atenção",
  removeWhatsapp:
    "Ao apagar seu número, os pedidos por WhatsApp do catálogo online serão desativados.",
  cancel: "Cancelar",
  confirm: "Confirmar",
  errStoreName: "Informe o nome da loja",
  errEmail: "Email inválido",
  errEmailMin: "O email precisa ter ao menos 3 caracteres",
  errDocument: "CPF ou CNPJ inválido",
  errInstagram: "Comece com @ (exemplo: @minhaloja)",
};

export const MENU = [
  { id: "sell", label: "Vender", icon: "cart" },
  { id: "orders", label: "Pedidos", icon: "bag" },
  { id: "products", label: "Produtos", icon: "box" },
  { id: "customers", label: "Clientes", icon: "customer" },
  { id: "sales", label: "Histórico", icon: "history" },
  { id: "statistics", label: "Estatísticas", icon: "chart" },
  { id: "users", label: "Usuários", icon: "users" },
  { id: "config", label: "Configurações", icon: "gear", active: true },
];

export const MENU_FOOTER = [
  { id: "help", label: "Ajuda", icon: "help" },
  { id: "exit", label: "Sair", icon: "logout" },
];

// Short descriptions of the other settings tabs (their full forms are not rebuilt yet).
export const OTHER_TABS = {
  "orders-and-sales": {
    title: "Pedidos e vendas",
    text: "Configure suas taxas de venda e status de seus pedidos.",
    items: ["Taxas de venda", "Status de pedidos personalizados", "Pedido mínimo"],
  },
  receipt: {
    title: "Recibo",
    text: "Personalize o recibo enviado aos clientes.",
    items: ["Texto do cabeçalho", "Texto do rodapé", "Adicionar dados do cliente", "Impressora"],
  },
  payments: {
    title: "Pagamentos",
    text: "Formas de pagamento aceitas na loja e no catálogo.",
    items: ["Pagamentos online", "Outras formas de pagamento", "Maquininhas de pagamento", "Link de pagamento"],
  },
  "pickup-and-delivery": {
    title: "Entrega e retirada",
    text: "Configure entrega e retirada para os pedidos do catálogo.",
    items: ["Retirada na loja", "Entrega com taxas", "Descrição de dias e horários"],
  },
  integrations: {
    title: "Integrações",
    text: "Conecte sua loja a outros serviços.",
    items: ["Integrar com redes sociais", "Exportar relatórios"],
  },
};

export const CURRENCIES = [
  { code: "BR", currency: "BRL", name: "Brasil", symbol: "R$", decimal: "," },
  { code: "US", currency: "USD", name: "Estados Unidos", symbol: "$", decimal: "." },
  { code: "PT", currency: "EUR", name: "Portugal", symbol: "€", decimal: "," },
  { code: "ES", currency: "EUR", name: "Espanha", symbol: "€", decimal: "," },
  { code: "AR", currency: "ARS", name: "Argentina", symbol: "$", decimal: "," },
  { code: "CL", currency: "CLP", name: "Chile", symbol: "$", decimal: "," },
  { code: "CO", currency: "COP", name: "Colômbia", symbol: "$", decimal: "," },
  { code: "MX", currency: "MXN", name: "México", symbol: "$", decimal: "." },
  { code: "PE", currency: "PEN", name: "Peru", symbol: "S/", decimal: "." },
  { code: "UY", currency: "UYU", name: "Uruguai", symbol: "$U", decimal: "," },
  { code: "PY", currency: "PYG", name: "Paraguai", symbol: "₲", decimal: "," },
  { code: "BO", currency: "BOB", name: "Bolívia", symbol: "Bs", decimal: "," },
  { code: "GB", currency: "GBP", name: "Reino Unido", symbol: "£", decimal: "." },
  { code: "CA", currency: "CAD", name: "Canadá", symbol: "$", decimal: "." },
  { code: "AO", currency: "AOA", name: "Angola", symbol: "Kz", decimal: "," },
  { code: "MZ", currency: "MZN", name: "Moçambique", symbol: "MT", decimal: "," },
].sort((a, b) => a.name.localeCompare(b.name));

/** A new account has no currency chosen yet: the original shows "- $" and "$0.00". */
export const NO_CURRENCY = { code: "", currency: "", name: "", symbol: "$", decimal: "." };

export const DEFAULT_VALUES = {
  name: "",
  corporateName: "",
  documentNumber: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  email: "",
  address: "",
  addressComplement: "",
  imageURL: "",
  infoExtra: "",
  currency: "",
  decimalCurrency: true,
  showCanceledSales: true,
};

// The demo store has WhatsApp ordering switched on in its catalog,
// so clearing the WhatsApp number asks for confirmation (as the original does).
export const STORE_FLAGS = { catalogWhatsappOrder: true };
