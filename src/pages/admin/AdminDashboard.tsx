import { useAuth } from '@/hooks/useAuth';
import { Droplets, ShoppingBag, ShoppingCart, Users, LucideProps } from 'lucide-react';
import React from 'react';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = {
    newOrders: 12,
    activeDrops: 2,
    totalProducts: 150,
    totalUsers: 48,
    totalUnreadedMessages: 5,
    totalOrders: 200,
  };

  return (
    // Ez a fő konténer kapja meg a belső térközt
    <div className="grid grid-closl-1 sm:grid-cols-1 lg:grid-cols-1 gap-8 p-4 md:p-8">
      {/* Üdvözlő kártya */}
      <div className="mb-8 p-6 bg-gradient-to-br from-indigo-800 to-purple-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-white items-center justify-center text-center mb-4">Irányítópult</h1>
        <p className="text-indigo-200 itmes-center justify-center text-center mt-4">Üdv újra, {user?.email || 'Admin'}!</p>
      </div>

      {/* Statisztikai kártyák - A grid osztályok itt vannak a wrapper div-en */}
      <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" >
        <StatCard title="Új Rendelések" value={stats.newOrders} icon={ShoppingCart} />
        <StatCard title="Aktív Dropok" value={stats.activeDrops} icon={Droplets} />
        <StatCard title="Összes Termék" value={stats.totalProducts} icon={ShoppingBag} />
        <StatCard title="Felhasználók" value={stats.totalUsers} icon={Users} />
        <StatCard title="Olvasatlan Üzenetek" value={stats.totalUnreadedMessages} icon={Users} />
        <StatCard title="Összes eddigi rendelés" value={stats.totalOrders} icon={Users} />
      </div>

    </div>
  );
}

// A segédkomponensek változatlanok, de a sötét témához már jól illeszkednek
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType<LucideProps>;
}

const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
  <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-3 border border-white/10 text-center">
    <div className="p-3 bg-indigo-600/30 rounded-full">
      <Icon className="w-7 h-7 text-indigo-300" />
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-gray-400">{title}</p>
    </div>
  </div>
);

