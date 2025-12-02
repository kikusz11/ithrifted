import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Droplets, ShoppingBag, ShoppingCart, Users, LucideProps } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    newOrders: 0,
    activeDrops: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalUnreadedMessages: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch new orders (pending)
        const { count: newOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Fetch active drops
        const { count: activeDrops } = await supabase
          .from('drops')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Fetch total products
        const { count: totalProducts } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        // Fetch total users (profiles)
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch total orders
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        setStats({
          newOrders: newOrders || 0,
          activeDrops: activeDrops || 0,
          totalProducts: totalProducts || 0,
          totalUsers: totalUsers || 0,
          totalUnreadedMessages: 0, // Placeholder until messages system is implemented
          totalOrders: totalOrders || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

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
        <StatCard title="Új Rendelések" value={loading ? '...' : stats.newOrders} icon={ShoppingCart} />
        <StatCard title="Aktív Dropok" value={loading ? '...' : stats.activeDrops} icon={Droplets} />
        <StatCard title="Összes Termék" value={loading ? '...' : stats.totalProducts} icon={ShoppingBag} />
        <StatCard title="Felhasználók" value={loading ? '...' : stats.totalUsers} icon={Users} />
        <StatCard title="Olvasatlan Üzenetek" value={loading ? '...' : stats.totalUnreadedMessages} icon={Users} />
        <StatCard title="Összes eddigi rendelés" value={loading ? '...' : stats.totalOrders} icon={Users} />
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
