import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ModernButton from '@/components/ui/ModernButton';
import { Users, Trash2, Shield, Gift, Search, ChevronDown, ChevronUp, Phone, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
    id: string;
    user_id: string;
    display_name: string;
    avatar_url: string;
    phone: string;
    role?: string;
    is_admin?: boolean;
    email?: string;
    shipping_address?: {
        city?: string;
        country?: string;
    };
}

interface Coupon {
    id: string;
    code: string;
    discount_percent?: number;
    discount_type: 'percentage' | 'fixed_cart' | 'fixed_product' | 'free_shipping' | 'buy_x_get_y';
    discount_amount: number;
    description: string;
    expires_at: string | null;
    usage_limit: number | null;
    usage_count: number;
}

interface UserCoupon {
    id: string;
    coupon: Coupon;
    assigned_at: string;
    is_used: boolean;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

    // Coupon Assignment State
    const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
    const [selectedCouponId, setSelectedCouponId] = useState('');
    const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            const enhancedData = data?.map(user => ({
                ...user,
                role: user.role || (user.is_admin ? 'admin' : 'user'),
            })) || [];
            setUsers(enhancedData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Hiba a felhasználók betöltésekor');
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
            if (error) throw error;
            setUsers(users.filter(user => user.user_id !== userId));
            toast.success('Felhasználó törölve');
        } catch (error) {
            console.error(error); toast.error('Hiba a törléskor');
        }
    };

    const handleToggleRole = async (userId: string, currentRole?: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('user_id', userId);
            if (error) throw error;
            setUsers(users.map(user => user.user_id === userId ? { ...user, role: newRole } : user));
            toast.success(`Jogosultság módosítva: ${newRole}`);
        } catch (error) {
            console.error(error); toast.error('Hiba a módosításkor');
        }
    };

    const toggleExpand = async (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
            try {
                const { data, error } = await supabase.from('user_coupons')
                    .select(`id, assigned_at, is_used, coupon:coupons(*)`)
                    .eq('user_id', userId);
                if (error) throw error;
                setUserCoupons(data as any || []);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleOpenCouponModal = async (user: Profile) => {
        setSelectedUser(user);
        setIsCouponModalOpen(true);
        try {
            const { data } = await supabase.from('coupons').select('*').eq('is_active', true).order('created_at', { ascending: false });
            setAvailableCoupons(data || []);
            if (data && data.length > 0) setSelectedCouponId(data[0].id);
        } catch (error) { console.error(error); }
    };

    const handleSendCoupon = async () => {
        if (!selectedUser || !selectedCouponId) return;
        try {
            const { error } = await supabase.from('user_coupons').insert({ user_id: selectedUser.user_id, coupon_id: selectedCouponId });
            if (error) throw error;
            toast.success(`Kupon hozzárendelve`);
            setIsCouponModalOpen(false);
            if (expandedUserId === selectedUser.user_id) toggleExpand(selectedUser.user_id);
        } catch (error) {
            console.error(error); toast.error('Hiba a hozzárendeléskor');
        }
    };

    const handleRemoveCoupon = async (userCouponId: string) => {
        if (!confirm('Kupon eltávolítása?')) return;
        try {
            const { error } = await supabase.from('user_coupons').delete().eq('id', userCouponId);
            if (error) throw error;
            setUserCoupons(prev => prev.filter(uc => uc.id !== userCouponId));
            toast.success('Kupon eltávolítva');
        } catch (error) { console.error(error); }
    };

    const filteredUsers = users.filter(user =>
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-stone-500">Betöltés...</div>;

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-stone-900">Felhasználók Kezelése</h1>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                    <input
                        type="text"
                        placeholder="Keresés..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                        <div className="p-4">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(user.user_id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                <Users size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">
                                            {user.display_name || <span className="text-stone-400 italic">Nincs megadva név</span>}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${user.role === 'admin'
                                                ? 'text-purple-700 bg-purple-100 border-purple-200'
                                                : 'text-blue-700 bg-blue-100 border-blue-200'
                                                }`}>
                                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-stone-400">
                                    {expandedUserId === user.user_id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>

                            {expandedUserId === user.user_id && (
                                <div className="mt-6 pt-6 border-t border-stone-100 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Adatok</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-stone-700 flex items-center gap-2">
                                                    <span className="text-stone-400 w-20">ID:</span>
                                                    <span className="font-mono text-xs text-stone-500">{user.user_id}</span>
                                                </p>
                                                <p className="text-stone-700 flex items-center gap-2">
                                                    <span className="text-stone-400 w-20">Telefon:</span>
                                                    {user.phone ? (
                                                        <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>
                                                    ) : <span className="text-stone-400 italic">Nincs megadva</span>}
                                                </p>
                                                <p className="text-stone-700 flex items-center gap-2">
                                                    <span className="text-stone-400 w-20">Hely:</span>
                                                    {user.shipping_address?.city ? (
                                                        <span className="flex items-center gap-1"><MapPin size={12} /> {user.shipping_address.city}, {user.shipping_address.country}</span>
                                                    ) : <span className="text-stone-400 italic">Nincs megadva</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Hozzárendelt Kuponok</h4>
                                            {userCoupons.length > 0 ? (
                                                <div className="space-y-2">
                                                    {userCoupons.map(uc => (
                                                        <div key={uc.id} className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-stone-800">{uc.coupon.code}</span>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${uc.is_used ? 'bg-stone-200 text-stone-500' : 'bg-green-100 text-green-700'}`}>
                                                                        {uc.is_used ? 'Felhasznált' : 'Aktív'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-stone-500">
                                                                    {uc.coupon.discount_type === 'percentage'
                                                                        ? `${uc.coupon.discount_amount}%`
                                                                        : `${uc.coupon.discount_amount} Ft`}
                                                                </p>
                                                            </div>
                                                            <button onClick={() => handleRemoveCoupon(uc.id)} className="p-2 text-red-400 hover:text-red-600 rounded-lg" title="Eltávolítás">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-sm text-stone-400 italic">Nincs hozzárendelt kupon.</p>}
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Műveletek</h4>
                                            <div className="flex flex-wrap gap-3">
                                                <ModernButton variant="secondary" size="sm" onClick={() => handleToggleRole(user.user_id, user.role)} className="flex items-center gap-2">
                                                    <Shield size={16} />
                                                    <span>Jogosultság: {user.role === 'admin' ? 'Legyen User' : 'Legyen Admin'}</span>
                                                </ModernButton>
                                                <ModernButton variant="secondary" size="sm" onClick={() => handleOpenCouponModal(user)} className="flex items-center gap-2">
                                                    <Gift size={16} />
                                                    <span>Kupon hozzárendelése</span>
                                                </ModernButton>
                                                <ModernButton variant="danger" size="sm" onClick={() => handleDeleteUser(user.user_id)} className="flex items-center gap-2">
                                                    <Trash2 size={16} />
                                                    <span>Törlés</span>
                                                </ModernButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Coupon Modal */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-stone-900">Kupon Hozzárendelése</h2>
                            <button onClick={() => setIsCouponModalOpen(false)}><X size={24} className="text-stone-400 hover:text-stone-900" /></button>
                        </div>
                        <p className="text-stone-600">Kupon hozzárendelése <strong>{selectedUser?.display_name || 'ismeretlen'}</strong> részére.</p>
                        <div>
                            <select value={selectedCouponId} onChange={(e) => setSelectedCouponId(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:border-indigo-500">
                                {availableCoupons.map(coupon => (
                                    <option key={coupon.id} value={coupon.id}>{coupon.code} - ({coupon.description})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <ModernButton variant="secondary" onClick={() => setIsCouponModalOpen(false)}>Mégse</ModernButton>
                            <ModernButton variant="primary" onClick={handleSendCoupon}>Hozzárendelés</ModernButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
