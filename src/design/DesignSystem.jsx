import { useState } from "react";
import { RadioRow, SearchSelect, Switch, TextField, Tip, Icon } from "../config/ui.jsx";
import { CURRENCIES } from "../config/data.js";
import { HelpIcon, ProviderMark } from "../shared/icons.jsx";
import { Spinner } from "../shared/Spinner.jsx";

const COLOR_GROUPS = [
  {
    name: "Primária (verde)",
    items: [
      ["--c-green-00", "#2fae94", "Links, ícones ativos"],
      ["--c-green-01", "#25bf97", "Botão primário pressionado"],
      ["--c-green-02", "#2fc79f", "Botão primário hover"],
      ["--c-primary", "#2dd1ac", "Cor da marca, botão primário"],
      ["--c-green-04", "#5bd7bb", ""],
      ["--c-green-05", "#8cd7c6", "Barra de carregamento"],
      ["--c-green-06", "#ddf7f2", ""],
      ["--c-green-07", "#e3f6f1", ""],
      ["--c-primary-dark", "#1f8f75", ""],
      ["--c-primary-ultra-light", "#eefbf8", "Fundo de item ativo"],
    ],
  },
  {
    name: "Neutros",
    items: [
      ["--c-gray-01", "#2a323f", ""],
      ["--c-text", "#363f4d", "Texto principal"],
      ["--c-gray-03", "#444e5e", ""],
      ["--c-text-secondary", "#535d6e", "Texto secundário, ícones"],
      ["--c-gray-05", "#808c9e", "Placeholders"],
      ["--c-gray-06", "#a9b1be", "Bordas de radio"],
      ["--c-gray-07", "#d9dce2", "Bordas de campos"],
      ["--c-gray-08", "#e8e9ea", "Divisores"],
      ["--c-gray-09", "#eff1f3", "Pílula de ajuda, área de upload"],
      ["--c-gray-10", "#f7f7f8", "Fundo da página, botões secundários"],
      ["--c-white", "#ffffff", "Superfícies"],
    ],
  },
  {
    name: "Feedback",
    items: [
      ["--c-alert", "#f5a623", "Alerta"],
      ["--c-alert-light", "#fdebce", ""],
      ["--c-error", "#fe0000", "Erro de campo"],
      ["--c-error-dark", "#983939", ""],
      ["--c-red", "#ff4e4e", "Perigo"],
      ["--c-red-light", "#ffd5d5", ""],
      ["--c-info", "#0e65f1", "Informação"],
      ["--c-link", "#4286f4", "Link"],
    ],
  },
  {
    name: "Temas do catálogo",
    items: [
      ["--c-theme-0", "#fdca40", ""],
      ["--c-theme-1", "#ff8552", ""],
      ["--c-theme-2", "#ff4e4e", ""],
      ["--c-theme-3", "#ce7da5", ""],
      ["--c-theme-4", "#89bbfe", ""],
      ["--c-theme-5", "#0d3b66", ""],
      ["--c-theme-6", "#444e5e", ""],
      ["--c-theme-7", "#2d2d2a", ""],
      ["--c-theme-8", "#82d173", ""],
    ],
  },
];

const TYPE = [
  ["36px · 500", "var(--fs-36)", 500, "Título do carrossel (desktop)"],
  ["24px · 500", "var(--fs-24)", 500, "Título do carrossel (celular), título de página"],
  ["18px · 500", "18px", 500, "Título de cartão"],
  ["16px · 500", "var(--fs-16)", 500, "Título de seção, botões grandes"],
  ["16px · 400", "var(--fs-16)", 400, "Subtítulo, campos"],
  ["14px · 500", "var(--fs-14)", 500, "Rótulos, abas, botões de login"],
  ["14px · 400", "var(--fs-14)", 400, "Texto corrido"],
  ["12px · 600", "var(--fs-12)", 600, "Pílula de ajuda"],
  ["12px · 400", "var(--fs-12)", 400, "Legendas, erros"],
];

const SPACING = [2, 3, 5, 6, 8, 10, 14, 15, 16, 24, 30, 32, 36, 40, 48, 90, 110];
const RADII = [["5px", "Logo"], ["6px", "Botões"], ["8px", "Pílulas, campos, cartão no celular"], ["12px", "Cartão no desktop, modal"], ["50%", "Pontos, avatares"]];
const SHADOWS = [
  ["Cartão", "0 0 40px 0 rgba(54, 63, 77, 0.12)"],
  ["Ponto do carrossel", "1px 1px 2px 0 rgba(0, 0, 0, 0.9)"],
  ["Pop-over (estimada)", "0 4px 16px rgba(21, 24, 30, 0.12)"],
];
const BREAKPOINTS = [
  ["≤ 768px", "Celular/tablet: painel de 380px, cabeçalho centralizado, cartão cinza, sem ilustração", "JS (Tablet 769)"],
  ["≤ 1006px", "Menu lateral vira gaveta", "JS (Web 1007)"],
  ["≤ 1239px", "Fonte raiz 90%; margens 16px 24px", "CSS"],
  ["≥ 1240px", "Margens 24px 32px (configurações 24px 28px); duas colunas", "CSS / JS (Medium)"],
  ["≥ 1500px", "Fonte raiz 110%; margens 32px 48px", "CSS / JS (Large)"],
  ["≥ 1921px", "Extra large", "JS"],
];

const FEATURES = [
  {
    area: "Login",
    items: [
      "Cabeçalho: logo, pílula “Ajuda” (abre a central de ajuda), seletor de idioma com bandeiras (Português, English, Español) que traduz a tela na hora",
      "Carrossel com 5 slides (título, subtítulo, ilustração), pontos clicáveis, arrastar para trocar; no celular sem ilustração",
      "Cartão “Escolha uma opção para continuar” com Google, Facebook, Apple e E-mail; cada botão mostra carregamento enquanto entra",
      "E-mail: formulário com e-mail e senha, validação, botão voltar",
      "Usuário não autenticado em qualquer página interna é levado ao login",
    ],
  },
  {
    area: "Configurações › Geral",
    items: [
      "Abas: Geral, Pedidos e vendas, Recibo, Pagamentos, Entrega e retirada, Integrações (cada uma com endereço próprio /config/<aba>; /config leva a Geral)",
      "Identificação: Nome da Loja (obrigatório se o catálogo estiver ativo), Nome do responsável ou Razão Social, CPF ou CNPJ com máscara e validação",
      "Dados de contato: Telefone e Celular/WhatsApp com código do país, Instagram (deve começar com @), Email (3–128 caracteres, formato válido)",
      "Endereço e complemento, com link “Ver no mapa” quando há endereço",
      "Logo da loja: área de 180px para enviar/remover imagem",
      "Sobre a loja: Informações extras (texto livre) com explicação",
      "Moeda: lista pesquisável de países/moedas com bandeira; mostra “código - símbolo”; chave “Casas decimais”",
      "Opções de exibição: Transações canceladas — Exibir riscadas / Ocultar",
      "Ícones de informação explicam onde cada dado aparece (recibo, catálogo, ou “Não será exibido”)",
      "Barra fixa “Descartar / Salvar alterações” aparece só quando algo mudou; “Salvando...” durante o envio",
      "Avisos: “As alterações foram salvas!” (4s) ou erro com botão de tentar novamente",
      "Apagar o WhatsApp com pedidos por WhatsApp ativos pede confirmação (Atenção)",
    ],
  },
  {
    area: "Dados salvos (Geral)",
    items: [
      "Loja: name, legalId { id, name, type }, phone, whatsapp, instagram, email, address, addressComplement, image/imageURL, infoExtra, catalog.whatsappOrder",
      "Preferências: currency, countryCode, decimalCurrency, checkoutSort, showCanceledSales",
      "Telefones são salvos só com dígitos e “+”",
    ],
  },
  {
    area: "Menu lateral (app logado)",
    items: [
      "Escuro, 280px aberto / 74px recolhido, item ativo em gray03; botão para recolher",
      "Vender, Pedidos (com contador), Produtos, Kai, Catálogo Online, Clientes, Histórico, Finanças, Estatísticas, Usuários, Configurações, Ajuda, Sair",
    ],
  },
  {
    area: "Vender",
    items: ["Grade de produtos com busca e categorias/destaques", "Carrinho: quantidade, desconto, cliente, total", "Pagamento: dinheiro (com troco), crédito, débito, Pix, fiado, outros", "Salvar como pedido; tela de venda concluída com recibo e impressão; baixa de estoque"],
  },
  {
    area: "Pedidos",
    items: ["Lista com filtros por status e contagem", "Detalhe: itens, cliente, origem (loja/catálogo), entrega/retirada", "Trocar status, finalizar como venda, cancelar"],
  },
  {
    area: "Produtos",
    items: ["Busca, filtro de estoque (sem estoque, abaixo do mínimo, em estoque, sem controle), ordenação (A-Z, Z-A, estoque, destaques)", "Ações em lote: destacar, mostrar/ocultar no catálogo, excluir", "Cadastro/edição: nome, código, categoria (com nova categoria), preços, custo, promoção, controle de estoque e mínimo, catálogo, destaque"],
  },
  {
    area: "Catálogo Online, Clientes, Histórico",
    items: ["Catálogo: ativar, link, cor do tema, modo Lista/Instaview, regras de pedido, prévia no celular", "Clientes: lista, busca, fiado a receber, detalhe com compras e recebimento, cadastro", "Histórico: período, forma de pagamento, vendedor, ordenação, totais, recibo, enviar, cancelar (devolve estoque); canceladas riscadas ou ocultas conforme a configuração"],
  },
  {
    area: "Finanças, Estatísticas, Usuários, Kai",
    items: ["Finanças: contas a pagar e despesas, vencidas, marcar pago", "Estatísticas: faturamento, lucro, vendas, ticket; por dia/hora/dia da semana; pagamentos; vendedores; rankings", "Usuários: convite, ativo/inativo, permissões", "Kai: assistente que responde sobre vendas, estoque e clientes"],
  },
];

function Swatch({ v, hex, use }) {
  const dark = ["#2a323f", "#363f4d", "#444e5e", "#535d6e", "#0d3b66", "#2d2d2a", "#983939", "#1f8f75", "#0e65f1"].includes(hex);
  return (
    <div className="ds-swatch">
      <div className="ds-swatch__chip" style={{ background: `var(${v})`, color: dark ? "#fff" : "var(--c-text)" }}>
        {hex}
      </div>
      <code>{v}</code>
      {use && <span>{use}</span>}
    </div>
  );
}

export default function DesignSystem() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(true);
  const [radio, setRadio] = useState(true);
  const [cur, setCur] = useState("BR");
  return (
    <div className="ds">
      <header className="ds-header">
        <div className="logo-tile"><span>pdv</span></div>
        <div>
          <h1>Design system</h1>
          <p>Tokens e componentes extraídos do original. Os valores aqui são os mesmos usados no login e nas configurações.</p>
        </div>
        <nav className="ds-nav">
          <a href="/">Login</a>
          <a href="/config/general/">Configurações</a>
        </nav>
      </header>

      <section className="ds-block">
        <h2>Cores</h2>
        {COLOR_GROUPS.map((g) => (
          <div key={g.name} className="ds-group">
            <h3>{g.name}</h3>
            <div className="ds-swatches">
              {g.items.map(([v, hex, use]) => (
                <Swatch key={v} v={v} hex={hex} use={use} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ds-block">
        <h2>Tipografia</h2>
        <p className="ds-note">Família: Graphik (pesos 300, 400, 500, 600, 700) com Helvetica Neue, Helvetica, sans-serif como reserva. A fonte raiz é 90% abaixo de 1240px e 110% a partir de 1500px.</p>
        <div className="ds-type">
          {TYPE.map(([name, size, weight, use]) => (
            <div key={name + use} className="ds-type__row">
              <span className="ds-type__meta">{name}</span>
              <span style={{ fontSize: size, fontWeight: weight }}>Gerencie seu negócio</span>
              <span className="ds-type__use">{use}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-block ds-grid-2">
        <div>
          <h2>Espaçamento</h2>
          <div className="ds-spacing">
            {SPACING.map((s) => (
              <div key={s} className="ds-spacing__row">
                <code>{s}px</code>
                <span style={{ width: s }} />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2>Cantos</h2>
          <div className="ds-radii">
            {RADII.map(([r, use]) => (
              <div key={r} className="ds-radii__item">
                <span style={{ borderRadius: r }} />
                <code>{r}</code>
                <small>{use}</small>
              </div>
            ))}
          </div>
          <h2>Sombras</h2>
          <div className="ds-shadows">
            {SHADOWS.map(([n, s]) => (
              <div key={n} className="ds-shadows__item">
                <span style={{ boxShadow: s }} />
                <strong>{n}</strong>
                <code>{s}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ds-block">
        <h2>Pontos de quebra</h2>
        <table className="ds-table">
          <tbody>
            {BREAKPOINTS.map(([w, what, src]) => (
              <tr key={w}>
                <td><code>{w}</code></td>
                <td>{what}</td>
                <td className="ds-muted">{src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="ds-block">
        <h2>Componentes</h2>
        <div className="ds-components">
          <div className="ds-card">
            <h3>Botões</h3>
            <div className="ds-row">
              <button className="btn btn--primary">Salvar alterações</button>
              <button className="btn btn--secondary">Descartar</button>
              <button className="btn btn--tertiary">Terciário</button>
              <button className="btn btn--primary"><Spinner light /> Salvando...</button>
            </div>
            <div className="ds-row">
              <button className="btn btn--primary btn--small">Pequeno</button>
              <button className="btn btn--secondary btn--small">Pequeno</button>
              <button className="btn btn--ghost"><Icon name="pin" size={16} /> Ver no mapa</button>
            </div>
          </div>
          <div className="ds-card">
            <h3>Botões de login</h3>
            <div className="providers" style={{ maxWidth: 303 }}>
              {[["google", "Google"], ["facebook", "Facebook"], ["apple", "Apple"], ["email", "E-mail"]].map(([k, l]) => (
                <button key={k} className={`provider provider--${k}`}>
                  <span className="provider__mark"><ProviderMark kind={k} /></span>
                  <span className="provider__label">{l}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="ds-card">
            <h3>Pílula, dica e pontos</h3>
            <div className="ds-row" style={{ alignItems: "center" }}>
              <span className="help-pill">Ajuda <HelpIcon size={16} color="var(--c-text-secondary)" /></span>
              <Tip text="Exibido em recibos e no catálogo" />
              <Tip text="Não será exibido" icon="padlock" />
              <span className="ds-dots">
                <button className="dot is-selected" aria-label="1" />
                <button className="dot" aria-label="2" />
                <button className="dot" aria-label="3" />
              </span>
            </div>
          </div>
          <div className="ds-card">
            <h3>Campos</h3>
            <div className="ds-stack">
              <TextField label="Nome da Loja" value={text} onChange={setText} right={<Tip text="Exibido em recibos e no catálogo" />} />
              <TextField label="Email" value="nome@" onChange={() => {}} error="Email inválido" />
              <SearchSelect
                options={CURRENCIES}
                value={cur}
                onChange={setCur}
                placeholder="Procurar moedas"
                renderValue={(c) => `${c.currency} - ${c.symbol}`}
                renderOption={(c) => (
                  <span className="cur-option">
                    <span>
                      <strong>{c.currency}</strong>
                      <small>{c.name}</small>
                    </span>
                  </span>
                )}
              />
            </div>
          </div>
          <div className="ds-card">
            <h3>Chave e opções</h3>
            <div className="ds-stack">
              <Switch label="Casas decimais" checked={on} onChange={setOn} />
              <div>
                <RadioRow name="ds-radio" label="Exibir riscadas" checked={radio} onSelect={() => setRadio(true)} />
                <RadioRow name="ds-radio" label="Ocultar" checked={!radio} onSelect={() => setRadio(false)} />
              </div>
            </div>
          </div>
          <div className="ds-card">
            <h3>Aviso</h3>
            <div className="toast toast--success" style={{ animation: "none" }}>
              <Icon name="check" size={18} />
              <div className="toast__text"><strong>As alterações foram salvas!</strong></div>
            </div>
            <div className="toast toast--danger" style={{ animation: "none", marginTop: 10 }}>
              <Icon name="close" size={18} />
              <div className="toast__text"><strong>Erro ao salvar alterações</strong><span>Tente novamente</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-block">
        <h2>Funcionalidades</h2>
        <div className="ds-features">
          {FEATURES.map((f) => (
            <div key={f.area} className="ds-card">
              <h3>{f.area}</h3>
              <ul>
                {f.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
