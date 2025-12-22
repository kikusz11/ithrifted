import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import { Droplets, ShoppingBag, ShoppingCart, Users, LucideProps } from 'lucide-react';
import AdminAnalytics from './AdminAnalytics';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    newOrders: 0,
    activeDrops: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalUnreadedMessages: 0,
    totalOrders: 0,
    totalPageViews: 0,
    totalUniqueVisitors: 0,
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

        // Fetch Total Page Views
        const { count: totalPageViews } = await supabase
          .from('page_views')
          .select('*', { count: 'exact', head: true });

        // Fetch Total Unique Visitors (Distinct session_id)
        // Note: For large datasets, this should be an RPC function. 
        // For now, doing it client-side is acceptable for smaller scale.
        const { data: uniqueData } = await supabase
          .from('page_views')
          .select('session_id');

        const uniqueVisitors = new Set(uniqueData?.map(d => d.session_id).filter(Boolean)).size;

        setStats({
          newOrders: newOrders || 0,
          activeDrops: activeDrops || 0,
          totalProducts: totalProducts || 0,
          totalUsers: totalUsers || 0,
          totalUnreadedMessages: 0, // Placeholder until messages system is implemented
          totalOrders: totalOrders || 0,
          totalPageViews: totalPageViews || 0,
          totalUniqueVisitors: uniqueVisitors || 0,
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
    <div className="grid grid-cols-1 gap-8 p-4 md:p-8">
      {/* Üdvözlő kártya */}
      <div className="mb-8 p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-white items-center justify-center text-center mb-4">Irányítópult</h1>
        <p className="text-indigo-100 itmes-center justify-center text-center mt-4">Üdv újra, {user?.email || 'Admin'}!</p>
      </div>

      {/* Statisztikai kártyák - A grid osztályok itt vannak a wrapper div-en */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" >
        <StatCard title="Új Rendelések" value={loading ? '...' : stats.newOrders} icon={ShoppingCart} />
        <StatCard title="Aktív Dropok" value={loading ? '...' : stats.activeDrops} icon={Droplets} />
        <StatCard title="Összes Termék" value={loading ? '...' : stats.totalProducts} icon={ShoppingBag} />
        <StatCard title="Felhasználók" value={loading ? '...' : stats.totalUsers} icon={Users} />
        <StatCard title="Olvasatlan Üzenetek" value={loading ? '...' : stats.totalUnreadedMessages} icon={Users} />
        <StatCard title="Összes eddigi rendelés" value={loading ? '...' : stats.totalOrders} icon={Users} />

        {/* New Analytics Cards */}
        <StatCard title="Összes Látogatás" value={loading ? '...' : stats.totalPageViews} icon={Users} />
        <StatCard title="Összes Egyéni Látogató" value={loading ? '...' : stats.totalUniqueVisitors} icon={Users} />
      </div>

      {/* Analytics Section */}
      <AdminAnalytics />

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
  <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center justify-center gap-3 border border-stone-200 text-center hover:shadow-lg transition-shadow">
    <div className="p-3 bg-indigo-50 rounded-full">
      <Icon className="w-7 h-7 text-indigo-600" />
    </div>
    <div>
      <p className="text-3xl font-bold text-stone-900">{value}</p>
      <p className="text-sm font-medium text-stone-500">{title}</p>
    </div>
  </div>
);
