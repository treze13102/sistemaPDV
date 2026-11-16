import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Shell, { NAV } from "./Shell.jsx";
import { podePagina } from "./permissoes.js";
import { StoreProvider, useStore } from "./store.jsx";
import { useRoute } from "./router.jsx";
import Checkout from "./pages/Checkout.jsx";
import Products, { ProductForm } from "./pages/Products.jsx";
import Catalog from "./pages/Catalog.jsx";
import Customers, { CustomerForm } from "./pages/Customers.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Stock from "./pages/Stock.jsx";
import Reports from "./pages/Reports.jsx";
import PurchaseOrders from "./pages/PurchaseOrders.jsx";
import Sales from "./pages/Sales.jsx";
import Finances from "./pages/Finances.jsx";
import Calendar from "./pages/Calendar.jsx";
import Analytics from "./pages/Analytics.jsx";
import Users from "./pages/Users.jsx";
import Config from "./pages/Config.jsx";

function Page({ parts, params }) {
  const [section, sub] = parts;
  switch (section) {
    case "orders":
      return <Sales />; // Pedidos saiu: a venda já é concluída e impressa na hora.
    case "products":
      return sub === "create" ? <ProductForm key={params.id || "new"} id={params.id} /> : <Products />;
    case "catalog":
      return <Catalog />;
    case "customers":
      return sub === "create" ? <CustomerForm key={params.id || "new"} id={params.id} /> : <Customers params={params} />;
    case "sales":
      return <Sales />;
    case "suppliers":
      return <Suppliers />;
    case "stock": return <Stock />;
    case "reports": return <Reports />;
    case "purchases":
      return <PurchaseOrders />;
    case "finances":
      return <Finances sub={sub} />;
    case "calendar":
      return <Calendar />;
    case "analytics":
      return <Analytics />;
    case "users":
      return <Users />;
    case "config":
      return <Config tab={sub || "general"} />;
    default:
      return <Checkout />;
  }
}

/** Sem sessão do Supabase não há dados (o banco exige usuário autenticado): manda para o login. */
function useSessao() {
  const [estado, setEstado] = useState({ carregando: true, usuario: null });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.replace("/login/");
      else setEstado({ carregando: false, usuario: data.session.user });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) window.location.replace("/login/");
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return estado;
}

function Conteudo({ parts, params }) {
  const { loading, error, recarregar, data } = useStore();
  if (loading) return <div className="page app-estado">Carregando dados da loja…</div>;
  if (error)
    return (
      <div className="page app-estado">
        <strong>Não foi possível carregar os dados.</strong>
        <span>{error.message}</span>
        <button type="button" className="kbtn kbtn--primary" onClick={recarregar}>
          Tentar de novo
        </button>
      </div>
    );
  if (data.acesso?.inativo)
    return (
      <div className="page app-estado">
        <strong>Seu acesso está desativado.</strong>
        <span>Fale com o administrador da loja.</span>
        <button type="button" className="kbtn kbtn--primary" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
    );
  const pagina = parts[0] || "checkout";
  if (!podePagina(data.acesso, pagina)) {
    const primeira = NAV.find((n) => podePagina(data.acesso, n.id));
    return (
      <div className="page app-estado">
        <strong>Seu perfil não tem acesso a esta tela.</strong>
        {primeira ? (
          <a className="kbtn kbtn--primary" href={primeira.to}>
            Ir para {primeira.label}
          </a>
        ) : (
          <span>Peça ao administrador para definir seu perfil em Usuários.</span>
        )}
      </div>
    );
  }
  return <Page parts={parts} params={params} />;
}

export default function App() {
  const { parts, params } = useRoute();
  const sessao = useSessao();
  const current = NAV.some((n) => n.id === parts[0]) ? parts[0] : "checkout";
  useEffect(() => {
    const label = { calendar: "Calendário", analytics: "Estatísticas" }[current] || NAV.find((n) => n.id === current)?.label || "Mont Royal";
    document.title = `${label} · Mont Royal`;
  }, [current]);
  if (sessao.carregando) return null;
  return (
    <StoreProvider>
      <Shell current={current} usuario={sessao.usuario}>
        <Conteudo parts={parts} params={params} />
      </Shell>
    </StoreProvider>
  );
}
