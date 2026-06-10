import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Receipt, Package, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/pdv', label: 'PDV', icon: ShoppingCart },
  { to: '/vendas', label: 'Vendas', icon: Receipt },
  { to: '/produtos', label: 'Estoque', icon: Package },
];

const itemBase =
  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors';

export function BottomNav({ onMore }: { onMore: () => void }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--royal-line)] bg-[rgba(7,16,29,0.98)] backdrop-blur md:hidden">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(itemBase, isActive ? 'text-primary' : 'text-muted-foreground')
          }
        >
          {({ isActive }) => (
            <>
              <t.icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_rgba(212,180,111,0.5)]')} />
              {t.label}
            </>
          )}
        </NavLink>
      ))}
      <button type="button" onClick={onMore} className={cn(itemBase, 'text-muted-foreground')}>
        <Menu className="h-5 w-5" />
        Mais
      </button>
    </nav>
  );
}
