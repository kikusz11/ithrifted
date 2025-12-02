import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/ui/GlassCard';
import ModernButton from '@/components/ui/ModernButton';
import ModernInput from '@/components/ui/ModernInput';
import { Users, Trash2, Shield, Gift, Search, ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react';
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
    discount_percent: number;
    valid_from: string;
    valid_to: string;
    status: 'active' | 'used' | 'expired';
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(10);
    const [couponValidFrom, setCouponValidFrom] = useState(new Date().toISOString().split('T')[0]);
    const [couponValidTo, setCouponValidTo] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*');

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
        if (!window.confirm('Biztosan törölni szeretnéd ezt a felhasználót? Ez a művelet nem visszavonható.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            setUsers(users.filter(user => user.user_id !== userId));
            toast.success('Felhasználó sikeresen törölve');
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Hiba a felhasználó törlésekor');
        }
    };

    const handleToggleRole = async (userId: string, currentRole?: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('user_id', userId);

            if (error) throw error;

            setUsers(users.map(user =>
                user.user_id === userId
                    ? { ...user, role: newRole }
                    : user
            ));
            toast.success(`Felhasználó jogosultsága módosítva: ${newRole}`);
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Hiba a jogosultság módosításakor');
        }
    };

    const toggleExpand = (userId: string) => {
        if (expandedUserId === userId) {
            setExpandedUserId(null);
        } else {
            setExpandedUserId(userId);
            // Mock fetch coupons for the user
            const mockCoupons: Coupon[] = [
                { id: '1', code: 'WELCOME20', discount_percent: 20, valid_from: '2023-01-01', valid_to: '2023-12-31', status: 'active' },
                { id: '2', code: 'SUMMER10', discount_percent: 10, valid_from: '2023-06-01', valid_to: '2023-08-31', status: 'expired' },
            ];
            setUserCoupons(mockCoupons);
        }
    };

    const handleRevokeCoupon = (couponId: string) => {
        if (!window.confirm('Biztosan vissza szeretnéd vonni ezt a kupont?')) return;
        setUserCoupons(prev => prev.filter(c => c.id !== couponId));
        toast.success('Kupon sikeresen visszavonva');
    };

    const handleOpenCouponModal = (user: Profile) => {
        setSelectedUser(user);
        setCouponCode(`SAVE${Math.floor(Math.random() * 1000)}`);
        setIsCouponModalOpen(true);
    };

    const handleSendCoupon = () => {
        if (!selectedUser) return;
        toast.success(`Kupon elküldve ${selectedUser.display_name} részére! (${couponValidFrom} - ${couponValidTo})`);
        setIsCouponModalOpen(false);
    };

    const filteredUsers = users.filter(user =>
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-white">Felhasználók Kezelése</h1>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Keresés..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredUsers.map((user) => (
                    <GlassCard key={user.id} className="overflow-hidden transition-all duration-300">
                        <div className="p-4">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(user.user_id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Users size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {user.display_name || <span className="text-gray-500 italic">Nincs megadva név</span>}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${user.role === 'admin'
                                                ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                                                : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                                                }`}>
                                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-gray-400">
                                    {expandedUserId === user.user_id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>

                            {expandedUserId === user.user_id && (
                                <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Adatok</h4>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-gray-300 flex items-center gap-2">
                                                    <span className="text-gray-500 w-20">ID:</span>
                                                    <span className="font-mono text-xs">{user.user_id}</span>
                                                </p>
                                                <p className="text-gray-300 flex items-center gap-2">
                                                    <span className="text-gray-500 w-20">Telefon:</span>
                                                    {user.phone ? (
                                                        <span className="flex items-center gap-1"><Phone size={12} /> {user.phone}</span>
                                                    ) : (
                                                        <span className="text-gray-600 italic">Nincs megadva</span>
                                                    )}
                                                </p>
                                                <p className="text-gray-300 flex items-center gap-2">
                                                    <span className="text-gray-500 w-20">Hely:</span>
                                                    {user.shipping_address?.city ? (
                                                        <span className="flex items-center gap-1"><MapPin size={12} /> {user.shipping_address.city}, {user.shipping_address.country}</span>
                                                    ) : (
                                                        <span className="text-gray-600 italic">Nincs megadva</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Aktív Kuponok</h4>
                                            {userCoupons.length > 0 ? (
                                                <div className="space-y-2">
                                                    {userCoupons.map(coupon => (
                                                        <div key={coupon.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-white">{coupon.code}</span>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded ${coupon.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                                                        {coupon.status === 'active' ? 'Aktív' : 'Lejárt'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-400">{coupon.discount_percent}% kedvezmény • {coupon.valid_to}-ig</p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRevokeCoupon(coupon.id)}
                                                                className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                                                                title="Kupon visszavonása"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">Nincs aktív kupon.</p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Műveletek</h4>
                                            <div className="flex flex-wrap gap-3">
                                                <ModernButton
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleToggleRole(user.user_id, user.role)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Shield size={16} />
                                                    <span>Jogosultság: {user.role === 'admin' ? 'Legyen User' : 'Legyen Admin'}</span>
                                                </ModernButton>

                                                <ModernButton
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleOpenCouponModal(user)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Gift size={16} />
                                                    <span>Kupon küldése</span>
                                                </ModernButton>

                                                <ModernButton
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user.user_id)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Trash2 size={16} />
                                                    <span>Felhasználó törlése</span>
                                                </ModernButton>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        Nincs a keresésnek megfelelő felhasználó.
                    </div>
                )}
            </div>

            {/* Coupon Modal */}
            {isCouponModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 space-y-6">
                        <h2 className="text-2xl font-bold text-white">Kupon Küldése</h2>
                        <p className="text-gray-300">
                            Kupon küldése <strong>{selectedUser?.display_name || 'a felhasználó'}</strong> részére.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kupon Kód</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                    />
                                    <ModernButton onClick={() => setCouponCode(`SAVE${Math.floor(Math.random() * 1000)}`)} variant="secondary" size="sm">
                                        Generálás
                                    </ModernButton>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Kedvezmény (%)</label>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    max="100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Érvényesség kezdete</label>
                                    <ModernInput
                                        type="date"
                                        value={couponValidFrom}
                                        onChange={(e) => setCouponValidFrom(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Érvényesség vége</label>
                                    <ModernInput
                                        type="date"
                                        value={couponValidTo}
                                        onChange={(e) => setCouponValidTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <ModernButton variant="ghost" onClick={() => setIsCouponModalOpen(false)}>
                                Mégse
                            </ModernButton>
                            <ModernButton variant="primary" onClick={handleSendCoupon}>
                                Küldés
                            </ModernButton>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
