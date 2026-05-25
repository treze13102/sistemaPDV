import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  Truck,
  Warehouse,
  ShoppingCart,
  Receipt,
  BarChart3,
  DollarSign,
  LogOut,
  Boxes,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pdv', label: 'PDV', icon: ShoppingCart },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/categorias', label: 'Categorias', icon: Tag },
  { to: '/estoque', label: 'Estoque', icon: Warehouse },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/pedidos-compra', label: 'Pedidos compra', icon: ClipboardList },
  { to: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function AppLayout() {
  const { user, perfil, signOut } = useAuth();
  const nav2 = useNavigate();

  async function handleLogout() {
    await signOut();
    nav2('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-64 flex-col border-r border-[var(--royal-line)] bg-[rgba(7,16,29,0.94)] shadow-2xl shadow-black/20 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--royal-line)] px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--royal-line)] bg-primary/10">
            <Boxes className="h-5 w-5 text-primary" />
          </div>
          <div className="leading-tight">
            <span className="block font-semibold text-primary">MONT ROYAL</span>
            <span className="block text-[10px] uppercase text-muted-foreground">sistema PDV</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
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
        <div className="border-t border-[var(--royal-line)] p-3">
          <div className="mb-2 px-3 text-xs">
            <div className="font-medium text-foreground">{perfil?.nome ?? user?.email}</div>
            <div className="text-muted-foreground">{perfil?.perfil?.nome ?? 'Sem perfil'}</div>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
