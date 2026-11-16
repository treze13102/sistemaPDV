// Interface strings for the sign-in screen in the three languages the original offers.
// Slide copy is short sample text in the same spirit as the original.
export const LANGS = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

export const STRINGS = {
  pt: {
    help: "Ajuda",
    choose: "Escolha uma opção para continuar",
    email: "E-mail",
    back: "Voltar",
    emailLabel: "E-mail",
    passwordLabel: "Senha",
    enter: "Entrar",
    emailInvalid: "Digite um e-mail válido",
    passwordShort: "A senha precisa ter ao menos 6 caracteres",
    slides: [
      ["Transforme seu telefone em um Sistema de PDV", "Lance vendas, pedidos, produtos e clientes."],
      ["Gerencie seu negócio de qualquer lugar", "Controle estoque e pedidos, envie recibos por WhatsApp e mais...."],
      ["Gerencie toda a equipe\nde forma fácil", "Sua loja em tempo real na mão de cada vendedor."],
      ["Crie um Catálogo Online em 5 minutos", "Venda online, no Instagram, Facebook, WhatsApp e Google."],
      ["Gere relatórios simples \ne fáceis de entender", "Faturamento, lucro, produtos mais vendidos e muito mais."],
    ],
  },
  en: {
    help: "Help",
    choose: "Select one to continue",
    email: "Email",
    back: "Back",
    emailLabel: "Email",
    passwordLabel: "Password",
    enter: "Sign in",
    emailInvalid: "Enter a valid email",
    passwordShort: "Password must have at least 6 characters",
    slides: [
      ["Turn your phone into a Point of Sale System", "Ring up sales, orders, products and customers."],
      ["Run your business on the go", "Track stock and orders, send receipts and more."],
      ["Create staff accounts easily", "Keep everyone in sync in real time."],
      ["Create an online catalog in minutes", "Sell online and on social media."],
      ["Simple reports and analytics", "Revenue, profit and best-selling products."],
    ],
  },
  es: {
    help: "Ayuda",
    choose: "Seleccione una opción para continuar",
    email: "E-mail",
    back: "Volver",
    emailLabel: "E-mail",
    passwordLabel: "Contraseña",
    enter: "Entrar",
    emailInvalid: "Ingrese un e-mail válido",
    passwordShort: "La contraseña debe tener al menos 6 caracteres",
    slides: [
      ["Registra productos y controla tu stock", "Son solo unos pocos pasos para comenzar."],
      ["Registra ventas y envía recibos", "Comparte recibos por mensaje o imprímelos."],
      ["Administrar tu personal es muy fácil", "Tu tienda en tiempo real para cada vendedor."],
      ["Crea un catálogo online de tus productos", "Y recibe tus pedidos directo en la app."],
      ["Informes sencillos que vas a amar", "Una radiografía de tu negocio."],
    ],
  },
};
