import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Truck,
  ShoppingCart,
  Receipt,
  BarChart3,
  DollarSign,
  LogOut,
  Boxes,
  ClipboardList,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pdv', label: 'PDV', icon: ShoppingCart },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
  { to: '/produtos', label: 'Estoque', icon: Package },
  { to: '/categorias', label: 'Categorias', icon: Tag },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/pedidos-compra', label: 'Pedidos compra', icon: ClipboardList },
  { to: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'border border-primary/30 bg-primary/15 text-primary shadow-sm shadow-primary/10'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--royal-line)] bg-primary/10">
        <Boxes className="h-5 w-5 text-primary" />
      </div>
      <div className="leading-tight">
        <span className="block font-semibold text-primary">MONT ROYAL</span>
        <span className="block text-[10px] uppercase text-muted-foreground">sistema PDV</span>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, perfil, signOut } = useAuth();
  const nav2 = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    setMobileOpen(false);
    await signOut();
    nav2('/login', { replace: true });
  }

  const userInfo = (
    <div className="border-t border-[var(--royal-line)] p-3 safe-bottom">
      <div className="mb-2 px-3 text-xs">
        <div className="font-medium text-foreground">{perfil?.nome ?? user?.email}</div>
        <div className="text-muted-foreground">{perfil?.perfil?.nome ?? 'Sem perfil'}</div>
      </div>
      <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 flex-col border-r border-[var(--royal-line)] bg-[rgba(7,16,29,0.94)] shadow-2xl shadow-black/20 backdrop-blur md:flex">
        <div className="flex h-16 items-center border-b border-[var(--royal-line)] px-6">
          <Brand />
        </div>
        <NavLinks />
        {userInfo}
      </aside>

      {/* Coluna conteudo (com top bar mobile) */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar mobile */}
        <header className="safe-top sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-[var(--royal-line)] bg-[rgba(7,16,29,0.96)] px-4 py-3 backdrop-blur md:hidden">
          <Brand />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto safe-bottom">
          <Outlet />
        </main>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="safe-top relative flex h-full w-[78%] max-w-xs flex-col border-r border-[var(--royal-line)] bg-[rgba(7,16,29,0.98)] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-[var(--royal-line)] px-4">
              <Brand />
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            {userInfo}
          </div>
        </div>
      )}
    </div>
  );
}
