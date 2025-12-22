import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Droplets, ShoppingBag, ShoppingCart, Home, Users, Ticket, Tags } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Irányítópult', icon: LayoutDashboard },
  { href: '/admin/drops', label: 'Drop Kezelés', icon: Droplets },
  { href: '/admin/products', label: 'Termék Kezelés', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Rendelés Kezelés', icon: ShoppingCart },
  { href: '/admin/users', label: 'Felhasználók', icon: Users },
  { href: '/admin/coupons', label: 'Kuponok', icon: Ticket },
  { href: '/admin/categories', label: 'Kategóriák', icon: Tags },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 h-full flex-shrink-0 bg-white border-r border-stone-200 text-stone-600 flex flex-col p-4">
      <div className="text-2xl font-bold text-stone-900 mb-8 text-center">
        iThrifted <span className="text-indigo-600">Admin</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'hover:bg-stone-100 hover:text-stone-900'
                }`}
            >
              <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-stone-200">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Vissza a főoldalra</span>
        </Link>
      </div>
    </aside>
  );
}