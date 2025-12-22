import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/ui/GlassCard';
import ModernButton from '@/components/ui/ModernButton';
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Search, FileText } from 'lucide-react';
import { generateInvoice } from '@/utils/invoiceGenerator';

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    products: {
        id: string;
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
        tax_id?: string;
        payment_method?: string;
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
              image_url,
              id
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
            case 'pending': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
            case 'shipped': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'delivered': return 'text-green-700 bg-green-50 border-green-200';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-gray-700 bg-gray-50 border-gray-200';
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-stone-900">Rendelések Kezelése</h1>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Keresés..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-indigo-500 w-full md:w-64 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredOrders.map((order) => (
                    <GlassCard key={order.id} className="overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md transition-all">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="text-sm text-stone-500 font-mono">#{order.id.slice(0, 8)}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status === 'pending' && 'Függőben'}
                                            {order.status === 'shipped' && 'Szállítás alatt'}
                                            {order.status === 'delivered' && 'Kézbesítve'}
                                            {order.status === 'cancelled' && 'Törölve'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-stone-900 mb-1">{order.customer_name}</h3>
                                    <p className="text-sm text-stone-500">{new Date(order.created_at).toLocaleString('hu-HU')}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
                                    <div className="text-left sm:text-right w-full sm:w-auto">
                                        <p className="text-sm text-stone-500">Végösszeg</p>
                                        <p className="text-xl font-bold text-stone-900">{order.total_amount?.toLocaleString()} Ft</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                        <ModernButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => generateInvoice(order)}
                                            className="text-indigo-600 hover:text-indigo-800 hover:bg-stone-50 flex items-center gap-2 flex-1 sm:flex-none justify-center"
                                        >
                                            <FileText size={16} />
                                            <span className="sm:hidden">Számla</span>
                                        </ModernButton>

                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className="bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 flex-1 sm:flex-none"
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
                                            className="!p-2 bg-stone-100 text-stone-600 hover:text-stone-900"
                                        >
                                            {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </ModernButton>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrderId === order.id && (
                                <div className="mt-6 pt-6 border-t border-stone-200 animate-fadeIn bg-stone-50/50 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-sm font-semibold text-stone-600 mb-4 uppercase tracking-wider">Szállítási & Számlázási Adatok</h4>
                                            <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-2">
                                                <p className="text-stone-800"><span className="text-stone-500">Email:</span> {order.customer_email}</p>
                                                <p className="text-stone-800"><span className="text-stone-500">Telefon:</span> {order.customer_phone}</p>
                                                <p className="text-stone-800"><span className="text-stone-500">Cím:</span> {order.shipping_address?.postal_code} {order.shipping_address?.city}, {order.shipping_address?.street}</p>
                                                <p className="text-stone-800"><span className="text-stone-500">Ország:</span> {order.shipping_address?.country}</p>
                                                {/* @ts-ignore */}
                                                {order.shipping_address?.tax_id && (
                                                    <p className="text-stone-800"><span className="text-stone-500">Adószám:</span> {/* @ts-ignore */}{order.shipping_address.tax_id}</p>
                                                )}
                                                {/* @ts-ignore */}
                                                <p className="text-stone-800"><span className="text-stone-500">Fizetési mód:</span> {/* @ts-ignore */}{order.shipping_address?.payment_method === 'cod' ? 'Utánvét' : order.shipping_address?.payment_method === 'transfer' ? 'Átutalás' : 'Bankkártya'}</p>
                                                <p className="text-stone-800"><span className="text-stone-500">Kiállítás dátuma:</span> {new Date(order.created_at).toLocaleDateString('hu-HU')}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-stone-600 mb-4 uppercase tracking-wider">Rendelt Termékek</h4>
                                            <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-3">
                                                {order.order_items?.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-4 border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                                                        <div className="w-12 h-12 bg-stone-100 rounded-lg overflow-hidden flex-shrink-0 border border-stone-200">
                                                            {item.products?.image_url ? (
                                                                <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                                    <Package size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-stone-900 font-medium">{item.products?.name || 'Ismeretlen termék'}</p>
                                                            <p className="text-xs text-stone-500">Cikkszám: {item.products?.id || 'N/A'}</p>
                                                            <p className="text-sm text-stone-500">{item.quantity} db x {item.price?.toLocaleString()} Ft</p>
                                                        </div>
                                                        <p className="text-stone-900 font-medium">{(item.quantity * item.price)?.toLocaleString()} Ft</p>
                                                    </div>
                                                ))}
                                                <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                                                    <span className="text-sm text-stone-500">ÁFA Kód</span>
                                                    <span className="text-stone-900 font-mono">AAM (Alanyi Adómentes)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12 text-stone-400">
                        Nincs a keresésnek megfelelő rendelés.
                    </div>
                )}
            </div>
        </div>
    );
}
