import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/ui/GlassCard';
import ModernButton from '@/components/ui/ModernButton';
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    products: {
        name: string;
        image_url: string;
    };
}

interface Order {
    id: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
    shipping_address: {
        street: string;
        city: string;
        postal_code: string;
        country: string;
    };
    order_items: OrderItem[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    async function fetchOrders() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(orderId: string, newStatus: string) {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus as any } : order
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Hiba történt a státusz frissítésekor');
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'shipped': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'delivered': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock size={16} />;
            case 'shipped': return <Truck size={16} />;
            case 'delivered': return <CheckCircle size={16} />;
            case 'cancelled': return <XCircle size={16} />;
            default: return <Package size={16} />;
        }
    };

    const filteredOrders = orders.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Rendelések Kezelése</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Keresés..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 w-64"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <GlassCard key={order.id} className="overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-sm text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status === 'pending' && 'Függőben'}
                                            {order.status === 'shipped' && 'Szállítás alatt'}
                                            {order.status === 'delivered' && 'Kézbesítve'}
                                            {order.status === 'cancelled' && 'Törölve'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{order.customer_name}</h3>
                                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString('hu-HU')}</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Végösszeg</p>
                                        <p className="text-xl font-bold text-white">{order.total_amount?.toLocaleString()} Ft</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="pending">Függőben</option>
                                            <option value="shipped">Szállítás alatt</option>
                                            <option value="delivered">Kézbesítve</option>
                                            <option value="cancelled">Törölve</option>
                                        </select>

                                        <ModernButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                            className="!p-2"
                                        >
                                            {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </ModernButton>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrderId === order.id && (
                                <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Szállítási Adatok</h4>
                                            <div className="bg-white/5 rounded-xl p-4 space-y-2">
                                                <p className="text-white"><span className="text-gray-400">Email:</span> {order.customer_email}</p>
                                                <p className="text-white"><span className="text-gray-400">Telefon:</span> {order.customer_phone}</p>
                                                <p className="text-white"><span className="text-gray-400">Cím:</span> {order.shipping_address?.postal_code} {order.shipping_address?.city}, {order.shipping_address?.street}</p>
                                                <p className="text-white"><span className="text-gray-400">Ország:</span> {order.shipping_address?.country}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Rendelt Termékek</h4>
                                            <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                                {order.order_items?.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                            {item.products?.image_url ? (
                                                                <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                    <Package size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-white font-medium">{item.products?.name || 'Ismeretlen termék'}</p>
                                                            <p className="text-sm text-gray-400">{item.quantity} db x {item.price?.toLocaleString()} Ft</p>
                                                        </div>
                                                        <p className="text-white font-medium">{(item.quantity * item.price)?.toLocaleString()} Ft</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        Nincs a keresésnek megfelelő rendelés.
                    </div>
                )}
            </div>
        </div>
    );
}
