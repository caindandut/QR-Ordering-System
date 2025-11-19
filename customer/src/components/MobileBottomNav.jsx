import { Link, useLocation } from 'react-router-dom';
import { BookOpen, ShoppingCart, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cartStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/order', icon: BookOpen, labelKey: 'header.menu' },
  { to: '/order/cart', icon: ShoppingCart, labelKey: 'header.cart', showBadge: true },
  { to: '/order/status', icon: ClipboardList, labelKey: 'header.orders' },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background shadow-lg">
      <div className="grid grid-cols-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center py-3 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.showBadge && totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-3 text-[10px] px-1">
                    {totalItems}
                  </Badge>
                )}
              </div>
              <span className="mt-1">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

