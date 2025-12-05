import { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, RefreshCw, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ModernButton from '@/components/ui/ModernButton';
import ModernInput from '@/components/ui/ModernInput';
import GlassCard from '@/components/ui/GlassCard';

interface Coupon {
    id: string;
    code: string;
    discount_percent: number;
    description: string;
    is_active: boolean;
    expires_at: string | null;
    usage_limit: number | null;
    usage_count: number;
    created_at: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_percent: 10,
        description: '',
        expires_at: '',
        usage_limit: '',
    });

    const fetchCoupons = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Hiba történt a kuponok betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Biztosan törölni szeretnéd ezt a kupont?')) return;

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Kupon sikeresen törölve');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Hiba történt a törlés során');
        }
    };

    const handleCreateCoupon = async () => {
        if (!formData.code || !formData.discount_percent) {
            toast.error('Kérjük töltsön ki minden kötelező mezőt!');
            return;
        }

        try {
            const { error } = await supabase
                .from('coupons')
                .insert({
                    code: formData.code.toUpperCase(),
                    discount_percent: formData.discount_percent,
                    description: formData.description,
                    expires_at: formData.expires_at || null,
                    usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                    is_active: true
                });

            if (error) throw error;
            toast.success('Kupon sikeresen létrehozva');
            setIsModalOpen(false);
            setFormData({ code: '', discount_percent: 10, description: '', expires_at: '', usage_limit: '' });
            fetchCoupons();
        } catch (error) {
            console.error('Error creating coupon:', error);
            toast.error('Hiba történt a létrehozás során');
        }
    };

    const handleGenerateCoupons = async () => {
        setIsGenerating(true);
        try {
            // Generate 5 random coupons
            const newCoupons = Array.from({ length: 5 }).map(() => ({
                code: `GEN${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                discount_percent: Math.floor(Math.random() * 30) + 5, // 5-35%
                description: 'Automatikusan generált kupon',
                is_active: true,
                usage_limit: 1 // Single use by default
            }));

            const { error } = await supabase
                .from('coupons')
                .insert(newCoupons);

            if (error) throw error;
            toast.success('5 db kupon sikeresen generálva');
            fetchCoupons();
        } catch (error) {
            console.error('Error generating coupons:', error);
            toast.error('Hiba történt a generálás során');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteExpired = async () => {
        if (!confirm('Biztosan törölni szeretnéd az összes lejárt kupont?')) return;

        try {
            const now = new Date().toISOString();
            const { error } = await supabase
                .from('coupons')
                .delete()
                .lt('expires_at', now);

            if (error) throw error;
            toast.success('Lejárt kuponok törölve');
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting expired coupons:', error);
            toast.error('Hiba történt a törlés során');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Kupon Kezelés</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Új Kupon
                </button>
            </div>

            {/* Bulk Operations Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Ticket className="text-indigo-400" size={24} />
                    <h2 className="text-xl font-semibold text-white">Tömeges Műveletek</h2>
                </div>
                <p className="text-gray-400 mb-4">
                    Itt végezhet tömeges műveleteket a kuponokon.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleGenerateCoupons}
                        disabled={isGenerating}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isGenerating ? <RefreshCw className="animate-spin" size={18} /> : <Ticket size={18} />}
                        Kuponok Generálása (5db)
                    </button>
                    <button
                        onClick={handleDeleteExpired}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={18} />
                        Lejárt Kuponok Törlése
                    </button>
                </div>
            </div>

            {/* Coupons List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white">Aktív Kuponok</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Betöltés...</div>
                ) : coupons.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <Ticket className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                        <p>Jelenleg nincsenek aktív kuponok.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-gray-700/50 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Kód</th>
                                    <th className="px-6 py-3">Kedvezmény</th>
                                    <th className="px-6 py-3">Leírás</th>
                                    <th className="px-6 py-3">Használat</th>
                                    <th className="px-6 py-3">Lejárat</th>
                                    <th className="px-6 py-3 text-right">Műveletek</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{coupon.code}</td>
                                        <td className="px-6 py-4 text-green-400">{coupon.discount_percent}%</td>
                                        <td className="px-6 py-4">{coupon.description}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {coupon.usage_count} / {coupon.usage_limit === null ? '∞' : coupon.usage_limit}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {coupon.expires_at
                                                ? new Date(coupon.expires_at).toLocaleDateString()
                                                : <span className="text-gray-500">Soha</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded-lg transition-colors"
                                                title="Törlés"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Coupon Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Új Kupon Létrehozása</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kupon Kód</label>
                                <ModernInput
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="PL. SUMMER2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kedvezmény (%)</label>
                                <ModernInput
                                    type="number"
                                    value={formData.discount_percent}
                                    onChange={(e) => setFormData({ ...formData, discount_percent: parseInt(e.target.value) })}
                                    min="1"
                                    max="100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Leírás</label>
                                <ModernInput
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Rövid leírás a kuponról"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Lejárat (Opcionális)</label>
                                    <ModernInput
                                        type="date"
                                        value={formData.expires_at}
                                        onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Limit (Opcionális)</label>
                                    <ModernInput
                                        type="number"
                                        value={formData.usage_limit}
                                        onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                        placeholder="∞"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <ModernButton variant="ghost" onClick={() => setIsModalOpen(false)}>
                                Mégse
                            </ModernButton>
                            <ModernButton variant="primary" onClick={handleCreateCoupon} className="flex items-center gap-2">
                                <Save size={18} />
                                Létrehozás
                            </ModernButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
