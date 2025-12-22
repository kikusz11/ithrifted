import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Eye, UserPlus } from 'lucide-react';

export default function AdminAnalytics() {
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [pageViews, setPageViews] = useState<any[]>([]);
    const [todayViews, setTodayViews] = useState(0);
    const [uniqueVisitors, setUniqueVisitors] = useState(0);

    useEffect(() => {
        // 1. Real-time Listeners
        const channel = supabase.channel('online-users');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // Count unique session_ids
                const uniqueSessions = new Set();
                Object.values(state).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.session_id) uniqueSessions.add(p.session_id);
                    });
                });
                setOnlineUsers(uniqueSessions.size);
            })
            .subscribe();

        // 2. Fetch Historical Data
        fetchAnalytics();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchAnalytics() {
        try {
            // Get last 7 days of views
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data, error } = await supabase
                .from('page_views')
                .select('created_at, session_id')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Process data for Chart
            // Group by date (YYYY-MM-DD)
            const grouped = (data || []).reduce((acc: any, curr: any) => {
                const date = new Date(curr.created_at).toLocaleDateString('hu-HU');
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            const chartData = Object.keys(grouped).map(date => ({
                name: date,
                views: grouped[date]
            }));

            setPageViews(chartData);

            // Set Today's Views & Unique Visitors
            const today = new Date().toLocaleDateString('hu-HU');
            setTodayViews(grouped[today] || 0);

            // Calculate Unique Visitors for Today
            const todayDateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const todayUnique = new Set(
                (data || [])
                    .filter((item: any) => item.created_at.startsWith(todayDateString))
                    .map((item: any) => item.session_id)
            );
            setUniqueVisitors(todayUnique.size);

        } catch (err) {
            console.error('Error fetching analytics:', err);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Real-time Card */}
                <div className="bg-stone-900 text-white p-6 rounded-xl shadow-lg border border-stone-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Users size={60} />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <h3 className="text-sm font-medium uppercase tracking-wider text-stone-400">Élő Látogatók</h3>
                    </div>
                    <p className="text-4xl font-bold">{onlineUsers}</p>
                </div>

                {/* Today's Views */}
                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2 text-stone-500">
                        <Eye size={20} />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Mai Megtekintések</h3>
                    </div>
                    <p className="text-3xl font-bold text-stone-900">{todayViews}</p>
                </div>

                {/* Unique Visitors */}
                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2 text-stone-500">
                        <UserPlus size={20} />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Egyéni Látogatók</h3>
                    </div>
                    <p className="text-3xl font-bold text-stone-900">{uniqueVisitors}</p>
                    <p className="text-xs text-stone-400">Mai napon</p>
                </div>

                {/* Trend */}
                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2 text-stone-500">
                        <TrendingUp size={20} />
                        <h3 className="text-sm font-medium uppercase tracking-wider">Heti Aktivitás</h3>
                    </div>
                    <p className="text-3xl font-bold text-stone-900">{pageViews.reduce((acc, curr) => acc + curr.views, 0)}</p>
                    <p className="text-xs text-stone-400">Összes megtekintés (7 nap)</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                <h3 className="text-lg font-bold text-stone-900 mb-6">Látogatottság (Utolsó 7 nap)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pageViews}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#78716c"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#78716c"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ color: '#000', fontWeight: 'bold' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="views"
                                stroke="#4f46e5"
                                strokeWidth={4}
                                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
