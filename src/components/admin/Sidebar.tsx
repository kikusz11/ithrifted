import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Droplets, ShoppingBag, ShoppingCart } from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Irányítópult', icon: LayoutDashboard },
  { href: '/admin/drops', label: 'Drop Kezelés', icon: Droplets },
  { href: '/admin/products', label: 'Termék Kezelés', icon: ShoppingBag },
  { href: '/admin/orders', label: 'Rendelés Kezelés', icon: ShoppingCart },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-gray-300 flex flex-col p-4">
      <div className="text-2xl font-bold text-white mb-8 text-center">
        iThrifted <span className="text-indigo-400">Admin</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-700 hover:text-white'
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}