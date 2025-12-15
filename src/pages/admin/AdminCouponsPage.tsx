import { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, RefreshCw, Save, X, Search, Gift, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import ModernButton from '@/components/ui/ModernButton';
import ModernInput from '@/components/ui/ModernInput';
import GlassCard from '@/components/ui/GlassCard';

interface Coupon {
    id: string;
    code: string;
    name: string; // New
    description: string;
    is_active: boolean;
    is_public: boolean; // New
    discount_percent?: number; // Backward compatibility

    // Validity
    start_date: string | null; // New
    expires_at: string | null;
    usage_limit: number | null; // Global limit
    usage_limit_per_user: number | null; // New
    usage_count: number;
    is_stackable: boolean; // New

    // Conditions
    min_order_value: number | null; // New
    min_quantity: number | null; // New
    target_products: string[] | null; // New (JSONB)
    excluded_products: string[] | null; // New (JSONB)
    target_categories: string[] | null; // New (JSONB)
    exclude_sale_items: boolean; // New
    allowed_user_groups: string[] | null; // New (JSONB)

    // Actions
    discount_type: 'percentage' | 'fixed_cart' | 'fixed_product' | 'free_shipping' | 'buy_x_get_y'; // New
    discount_amount: number; // New (replaces discount_percent logic)
    max_discount_amount: number | null; // New
    apply_to_shipping: boolean; // New

    // Spin Wheel
    is_spin_prize: boolean;
    spin_probability: number;
    spin_color: string;
    spin_label?: string;

    created_at: string;
}

interface Profile {
    id: string;
    user_id: string;
    display_name: string;
    email?: string;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
    const [isWheelSettingsOpen, setIsWheelSettingsOpen] = useState(false);
    const [wheelCoupons, setWheelCoupons] = useState<Coupon[]>([]);

    // Assignment Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [users, setUsers] = useState<Profile[]>([]);
    const [selectedCouponId, setSelectedCouponId] = useState('');
    const [assignmentTarget, setAssignmentTarget] = useState<'all' | 'selected'>('all');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Form State
    const [activeTab, setActiveTab] = useState('basic'); // basic, validity, conditions, actions
    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        name: '',
        description: '',
        is_active: true,
        is_public: true,

        start_date: '',
        expires_at: '',
        usage_limit: 100,
        usage_limit_per_user: 1,
        is_stackable: false,

        min_order_value: 0,
        min_quantity: 0,
        target_products: [],
        excluded_products: [],
        target_categories: [],
        exclude_sale_items: false,
        allowed_user_groups: [],

        discount_type: 'percentage',
        discount_amount: 10,
        max_discount_amount: null,

    });

    // Wheel Settings Custom Logic
    const [expandedSpinPrizeId, setExpandedSpinPrizeId] = useState<string | null>(null);
    const [activeSpinTab, setActiveSpinTab] = useState<'list' | 'add'>('list');
    const [createSpinPrizeForm, setCreateSpinPrizeForm] = useState({
        code: '',
        discount_amount: 10,
        discount_type: 'percentage' as 'percentage' | 'fixed_cart',
        spin_probability: 50,
        spin_color: '#3B82F6',
        spin_label: ''
    });

    const handleCreateSpinPrize = async (): Promise<boolean> => {
        if (!createSpinPrizeForm.code) {
            toast.error('A kód megadása kötelező!');
            return false;
        }

        try {
            const couponData = {
                code: createSpinPrizeForm.code.toUpperCase(),
                name: createSpinPrizeForm.code.toUpperCase(),
                description: `Szerencsekerék nyeremény: ${createSpinPrizeForm.code}`,
                is_active: true,
                is_public: false,

                usage_limit: null,
                usage_limit_per_user: 1,
                is_stackable: false,

                discount_type: createSpinPrizeForm.discount_type,
                discount_amount: createSpinPrizeForm.discount_amount,
                // Ensure discount_percent is 0 for fixed amounts, or matches amount for percentage (capped at 100)
                discount_percent: createSpinPrizeForm.discount_type === 'percentage'
                    ? Math.min(createSpinPrizeForm.discount_amount, 100)
                    : 1, // DB constraint requires 1-100 range, 0 and NULL are not allowed

                is_spin_prize: true,
                spin_probability: createSpinPrizeForm.spin_probability,
                spin_color: createSpinPrizeForm.spin_color,
                spin_label: createSpinPrizeForm.spin_label || createSpinPrizeForm.code
            };

            const { data, error } = await supabase
                .from('coupons')
                .insert(couponData)
                .select()
                .single();

            if (error) {
                console.error('Supabase error details:', error);
                throw error;
            }

            toast.success('Nyeremény sikeresen létrehozva!');

            if (data) {
                setWheelCoupons(prev => [...prev, data]);
                // Refresh global coupons list so it appears on the dashboard immediately
                fetchCoupons();

                // Reset form
                setCreateSpinPrizeForm({
                    code: '',
                    discount_amount: 10,
                    discount_type: 'percentage',
                    spin_probability: 50,
                    spin_color: '#3B82F6',
                    spin_label: ''
                });
                return true;
            } else {
                console.warn('Spin prize created but no data returned. Possible RLS policy issue.');
                // Try fetching anyway
                fetchCoupons();
                return true; // Still return true as it didn't error out
            }
        } catch (err: any) {
            console.error('Error creating spin prize:', err);
            toast.error(`Hiba a létrehozás során: ${err.message || 'Ismeretlen hiba'}`);
            return false;
        }
    };

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

    useEffect(() => {
        if (isWheelSettingsOpen) {
            // When opening settings, we can just use the already fetched coupons
            // or filter them. We'll derive state from 'coupons' initially
            // But we want a local editable state for the modal
            setWheelCoupons(coupons.map(c => ({ ...c }))); // deep copy to avoid mutations
        }
    }, [isWheelSettingsOpen, coupons]);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, user_id, display_name')
                .order('display_name');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Hiba a felhasználók betöltésekor');
        }
    };

    useEffect(() => {
        if (isAssignModalOpen) {
            fetchUsers();
        }
    }, [isAssignModalOpen]);

    const handleDelete = async (id: string) => {
        if (!confirm('Biztosan törölni szeretnéd ezt a kupont?')) return;

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setCoupons(prev => prev.filter(c => c.id !== id));
            toast.success('Kupon sikeresen törölve');
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Hiba történt a törlés során');
            fetchCoupons();
        }
    };

    const handleEditClick = (coupon: Coupon) => {
        setEditingCouponId(coupon.id);
        setFormData({
            code: coupon.code,
            name: coupon.name,
            description: coupon.description,
            is_active: coupon.is_active,
            is_public: coupon.is_public !== undefined ? coupon.is_public : true,
            start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().slice(0, 16) : '',
            expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
            usage_limit: coupon.usage_limit,
            usage_limit_per_user: coupon.usage_limit_per_user,
            is_stackable: coupon.is_stackable,
            min_order_value: coupon.min_order_value,
            min_quantity: coupon.min_quantity,
            target_products: coupon.target_products || [],
            excluded_products: coupon.excluded_products || [],
            target_categories: coupon.target_categories || [],
            exclude_sale_items: coupon.exclude_sale_items,
            allowed_user_groups: coupon.allowed_user_groups || [],
            discount_type: coupon.discount_type,
            discount_amount: coupon.discount_amount,
            max_discount_amount: coupon.max_discount_amount,
            apply_to_shipping: coupon.apply_to_shipping,
            is_spin_prize: coupon.is_spin_prize || false,
            spin_probability: coupon.spin_probability || 0,
            spin_color: coupon.spin_color || '#EF4444',
            spin_label: coupon.spin_label || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveCoupon = async () => {
        if (!formData.code || !formData.discount_amount) {
            toast.error('Kérjük töltsön ki minden kötelező mezőt!');
            return;
        }

        try {
            const couponData = {
                code: formData.code.toUpperCase(),
                name: formData.name || formData.code,
                description: formData.description,
                is_active: formData.is_active,
                is_public: formData.is_public,

                start_date: formData.start_date || null,
                expires_at: formData.expires_at || null,
                usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                usage_limit_per_user: formData.usage_limit_per_user ? Number(formData.usage_limit_per_user) : 1,
                is_stackable: formData.is_stackable,

                min_order_value: formData.min_order_value ? Number(formData.min_order_value) : null,
                min_quantity: formData.min_quantity ? Number(formData.min_quantity) : null,
                target_products: formData.target_products,
                excluded_products: formData.excluded_products,
                target_categories: formData.target_categories,
                exclude_sale_items: formData.exclude_sale_items,
                allowed_user_groups: formData.allowed_user_groups,

                discount_type: formData.discount_type,
                discount_amount: Number(formData.discount_amount),
                // Backward compatibility: populate discount_percent
                discount_percent: formData.discount_type === 'percentage' ? Number(formData.discount_amount) : 1,
                max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
                apply_to_shipping: formData.apply_to_shipping,

                is_spin_prize: formData.is_spin_prize,
                spin_probability: formData.is_spin_prize ? Number(formData.spin_probability) : 0,
                spin_color: formData.spin_color,
                spin_label: formData.spin_label
            };

            let error;
            if (editingCouponId) {
                const { error: updateError } = await supabase
                    .from('coupons')
                    .update(couponData)
                    .eq('id', editingCouponId);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('coupons')
                    .insert(couponData);
                error = insertError;
            }

            if (error) throw error;
            toast.success(editingCouponId ? 'Kupon sikeresen frissítve' : 'Kupon sikeresen létrehozva');
            setIsModalOpen(false);
            setEditingCouponId(null);

            // Reset form
            setFormData({
                code: '',
                name: '',
                description: '',
                is_active: true,
                is_public: true,
                start_date: '',
                expires_at: '',
                usage_limit: 100,
                usage_limit_per_user: 1,
                is_stackable: false,
                min_order_value: 0,
                min_quantity: 0,
                target_products: [],
                excluded_products: [],
                target_categories: [],
                exclude_sale_items: false,
                allowed_user_groups: [],
                discount_type: 'percentage',
                discount_amount: 10,
                max_discount_amount: null,
                apply_to_shipping: false,
                is_spin_prize: false,
                spin_probability: 0,
                spin_color: '#EF4444',
                spin_label: ''
            });
            fetchCoupons();
        } catch (error) {
            console.error('Error saving coupon:', error);
            toast.error('Hiba történt a mentés során');
        }
    };

    const handleAssignCoupons = async () => {
        if (!selectedCouponId) {
            toast.error('Kérjük válasszon egy kupont!');
            return;
        }

        if (assignmentTarget === 'selected' && selectedUserIds.length === 0) {
            toast.error('Kérjük válasszon legalább egy felhasználót!');
            return;
        }

        setIsAssigning(true);
        try {
            let targetUsers: Profile[] = [];

            if (assignmentTarget === 'all') {
                targetUsers = users;
            } else {
                targetUsers = users.filter(user => selectedUserIds.includes(user.user_id));
            }

            if (targetUsers.length === 0) {
                toast.error('Nincs kiválasztott felhasználó');
                return;
            }

            // Prepare inserts
            const inserts = targetUsers.map(user => ({
                user_id: user.user_id,
                coupon_id: selectedCouponId,
                is_used: false
            }));

            // Check existing assignments
            const { data: existingAssignments } = await supabase
                .from('user_coupons')
                .select('user_id')
                .eq('coupon_id', selectedCouponId);

            const existingUserIds = new Set(existingAssignments?.map(a => a.user_id) || []);

            const newInserts = inserts.filter(i => !existingUserIds.has(i.user_id));

            if (newInserts.length === 0) {
                toast.info('Minden kiválasztott felhasználónak már megvan ez a kupon.');
                setIsAssignModalOpen(false);
                return;
            }

            const { error } = await supabase
                .from('user_coupons')
                .insert(newInserts);

            if (error) throw error;

            toast.success(`${newInserts.length} felhasználónak sikeresen kiosztva a kupon!`);
            setIsAssignModalOpen(false);
            setSelectedUserIds([]);
            setAssignmentTarget('all');
        } catch (error) {
            console.error('Error assigning coupons:', error);
            toast.error('Hiba történt a kiosztás során');
        } finally {
            setIsAssigning(false);
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
    }

    const handleSaveWheelSettings = async () => {
        try {
            // 1. Update all coupons in DB with the new spin values from `wheelCoupons`.
            const updates = wheelCoupons.map(c => ({
                id: c.id,
                code: c.code, // Required for UPSERT acting as INSERT
                name: c.name || c.code, // Required if not nullable
                description: c.description,
                // Constraint Fix: Only set discount_percent if type is percentage, otherwise sets to 1 (dummy valid value)
                discount_percent: c.discount_type === 'percentage' ? (c.discount_percent || c.discount_amount || 0) : 1,
                discount_amount: c.discount_amount || 0,
                discount_type: c.discount_type || 'percentage',
                usage_limit: c.usage_limit,
                expires_at: c.expires_at,
                min_order_value: c.min_order_value,
                is_spin_prize: c.is_spin_prize,
                spin_probability: Math.round(Number(c.spin_probability || 0)),
                spin_color: c.spin_color || '#EF4444',
                spin_label: c.spin_label || null
            }));

            const { error } = await supabase
                .from('coupons')
                .upsert(updates);

            if (error) throw error;

            toast.success('Szerencsekerék beállítások mentve');
            setIsWheelSettingsOpen(false);
            fetchCoupons(); // Refresh main list
        } catch (error: any) {
            console.error('Error saving wheel settings:', error);
            toast.error(`Hiba a mentés során: ${error.message || 'Ismeretlen hiba'} `);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Kupon Kezelés</h1>
            </div>

            {/* Bulk Operations Section */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Ticket size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Tömeges Műveletek</h2>
                        <p className="text-sm text-gray-400">
                            Gyorsműveletek a kuponok kezeléséhez
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <Gift size={16} className="text-indigo-400" />
                        Kupon Kiosztása
                    </button>
                    <button
                        onClick={handleDeleteExpired}
                        className="bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-white hover:text-red-400 px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Lejárt Kuponok Törlése
                    </button>
                </div>
            </div>

            {/* Spin Wheel Prizes Section - Separated */}
            <GlassCard className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Szerencsekerék Nyeremények</h2>
                            <p className="text-sm text-gray-400">Aktív nyeremények a pörgetéshez</p>
                        </div>
                    </div>
                    <ModernButton
                        variant="secondary"
                        onClick={() => setIsWheelSettingsOpen(true)}
                        className="bg-white/5 hover:bg-white/10 border-white/10"
                    >
                        Beállítások Kezelése
                    </ModernButton>
                </div>

                <div className="bg-gray-900/50 rounded-xl border border-white/5 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-4">Nyeremény</div>
                        <div className="col-span-2 text-center">Típus</div>
                        <div className="col-span-2 text-center">Esély</div>
                        <div className="col-span-2 text-center">Szín</div>
                        <div className="col-span-2 text-right">Művelet</div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {coupons.filter(c => c.is_spin_prize).map((coupon) => (
                            <div key={coupon.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/5 transition-colors">
                                <div className="col-span-4">
                                    <div className="font-medium text-white text-sm">{coupon.code}</div>
                                    {coupon.spin_label && <div className="text-xs text-gray-500">{coupon.spin_label}</div>}
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `${coupon.discount_amount} Ft`}
                                    </span>
                                </div>
                                <div className="col-span-2 text-center text-sm text-gray-300">
                                    {coupon.spin_probability}
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="w-6 h-6 rounded border border-white/10 shadow-sm" style={{ backgroundColor: coupon.spin_color }}></div>
                                </div>
                                <div className="col-span-2 text-right">
                                    <button
                                        onClick={() => setIsWheelSettingsOpen(true)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {coupons.filter(c => c.is_spin_prize).length === 0 && (
                            <div className="px-6 py-8 text-center text-gray-500">
                                <Gift size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Nincs aktív szerencsekerék nyeremény.</p>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>

            {/* Coupons List */}
            <div className="bg-gray-800/50 rounded-xl border border-white/5 shadow-lg overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Aktív Kuponok</h2>
                        <div className="text-sm text-gray-400">
                            {coupons.filter(c => !c.is_spin_prize).length} db kupon
                        </div>
                    </div>
                    <ModernButton
                        variant="primary"
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Új Kupon
                    </ModernButton>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400 animate-pulse">Betöltés...</div>
                ) : coupons.filter(c => !c.is_spin_prize).length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Ticket className="mx-auto h-12 w-12 text-gray-600 mb-3 opacity-50" />
                        <p>Jelenleg nincsenek aktív kuponok.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-xs font-medium text-gray-500 uppercase tracking-wider bg-black/20">
                                <div className="col-span-3">Kód</div>
                                <div className="col-span-2">Kedvezmény</div>
                                <div className="col-span-3">Leírás</div>
                                <div className="col-span-2 text-center">Használat</div>
                                <div className="col-span-2 text-right">Műveletek</div>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-white/5">
                                {coupons.filter(c => !c.is_spin_prize).map((coupon) => (
                                    <div key={coupon.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors">
                                        <div className="col-span-3">
                                            <div className="font-bold text-white tracking-wide">{coupon.code}</div>
                                            {coupon.expires_at && (
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${new Date(coupon.expires_at) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                    {new Date(coupon.expires_at).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `${coupon.discount_amount} Ft`}
                                            </span>
                                        </div>
                                        <div className="col-span-3 text-sm text-gray-400 truncate pr-4" title={coupon.description || ''}>
                                            {coupon.description || '-'}
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <div className="text-sm text-gray-300">
                                                {coupon.usage_count} <span className="text-gray-500">/</span> {coupon.usage_limit === null ? '∞' : coupon.usage_limit}
                                            </div>
                                            <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="bg-indigo-500 h-full rounded-full"
                                                    style={{ width: coupon.usage_limit ? `${Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}%` : '0%' }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(coupon)}
                                                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                title="Szerkesztés"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="text-gray-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Törlés"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Coupon Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <GlassCard className="w-full max-w-4xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {editingCouponId ? 'Kupon Szerkesztése' : 'Új Kupon Létrehozása'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
                                {['basic', 'validity', 'conditions', 'actions'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px - 4 py - 2 text - sm font - medium transition - colors relative ${activeTab === tab ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                                            } `}
                                    >
                                        {tab === 'basic' && 'Alapadatok'}
                                        {tab === 'validity' && 'Érvényesség'}
                                        {tab === 'conditions' && 'Feltételek'}
                                        {tab === 'actions' && 'Kedvezmény'}

                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6 min-h-[300px]">
                                {/* BASIC TAB */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Kupon Kód *</label>
                                                <ModernInput
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                    placeholder="PL. SUMMER2024"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Belső Név</label>
                                                <ModernInput
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="Pl. Nyári Kampány"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Publikus Leírás</label>
                                            <ModernInput
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Ez jelenik meg a vásárlónak"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label className="text-white text-sm">Kupon aktív</label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_public}
                                                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label className="text-white text-sm">Publikus (mindenki számára elérhető)</label>
                                        </div>
                                    </div>
                                )}

                                {/* VALIDITY TAB */}
                                {activeTab === 'validity' && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Érvényesség Kezdete</label>
                                                <ModernInput
                                                    type="datetime-local"
                                                    value={formData.start_date || ''}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Lejárat</label>
                                                <ModernInput
                                                    type="datetime-local"
                                                    value={formData.expires_at || ''}
                                                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Globális Limit (Használat)</label>
                                                <ModernInput
                                                    type="number"
                                                    value={formData.usage_limit || ''}
                                                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                                                    placeholder="∞"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Limit / Felhasználó</label>
                                                <ModernInput
                                                    type="number"
                                                    value={formData.usage_limit_per_user || ''}
                                                    onChange={(e) => setFormData({ ...formData, usage_limit_per_user: parseInt(e.target.value) })}
                                                    placeholder="1"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_stackable}
                                                onChange={(e) => setFormData({ ...formData, is_stackable: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label className="text-white text-sm">Összevonható más kuponokkal</label>
                                        </div>
                                    </div>
                                )}

                                {/* CONDITIONS TAB */}
                                {activeTab === 'conditions' && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Minimum Rendelési Érték (Ft)</label>
                                                <ModernInput
                                                    type="number"
                                                    value={formData.min_order_value || ''}
                                                    onChange={(e) => setFormData({ ...formData, min_order_value: parseInt(e.target.value) })}
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Minimum Termék Darabszám</label>
                                                <ModernInput
                                                    type="number"
                                                    value={formData.min_quantity || ''}
                                                    onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.exclude_sale_items}
                                                onChange={(e) => setFormData({ ...formData, exclude_sale_items: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label className="text-white text-sm">Akciós termékek kizárása</label>
                                        </div>

                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <p className="text-yellow-400 text-sm">
                                                A termék és kategória alapú szűrés fejlesztés alatt áll. Jelenleg minden termékre érvényes a kupon, ha a fenti feltételek teljesülnek.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ACTIONS TAB */}
                                {activeTab === 'actions' && (
                                    <div className="space-y-4 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Kedvezmény Típusa</label>
                                            <select
                                                value={formData.discount_type}
                                                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="percentage">Százalékos (%)</option>
                                                <option value="fixed_cart">Fix összeg a kosárból (Ft)</option>
                                                <option value="free_shipping">Ingyenes Szállítás</option>
                                            </select>
                                        </div>

                                        {formData.discount_type !== 'free_shipping' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">
                                                        {formData.discount_type === 'percentage' ? 'Kedvezmény (%)' : 'Kedvezmény (Ft)'}
                                                    </label>
                                                    <ModernInput
                                                        type="number"
                                                        value={formData.discount_amount || ''}
                                                        onChange={(e) => setFormData({ ...formData, discount_amount: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                                {formData.discount_type === 'percentage' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-1">Maximális Kedvezmény (Ft)</label>
                                                        <ModernInput
                                                            type="number"
                                                            value={formData.max_discount_amount || ''}
                                                            onChange={(e) => setFormData({ ...formData, max_discount_amount: parseInt(e.target.value) })}
                                                            placeholder="Opcionális"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.apply_to_shipping}
                                                onChange={(e) => setFormData({ ...formData, apply_to_shipping: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <label className="text-white text-sm">Szállítási költségre is vonatkozik</label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <ModernButton variant="ghost" onClick={() => setIsModalOpen(false)}>
                                    Mégse
                                </ModernButton>
                                <ModernButton variant="primary" onClick={handleSaveCoupon} className="flex items-center gap-2">
                                    <Save size={18} />
                                    {editingCouponId ? 'Mentés' : 'Létrehozás'}
                                </ModernButton>
                            </div>
                        </GlassCard>
                    </div>
                )
            }


            {/* Assignment Modal */}

            {
                isAssignModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <GlassCard className="w-full max-w-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Kupon Kiosztása</h2>
                                <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* 1. Select Coupon */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">1. Válassz Kupont</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                                        {coupons.filter(c => c.is_active).map(coupon => (
                                            <div
                                                key={coupon.id}
                                                onClick={() => setSelectedCouponId(coupon.id)}
                                                className={`p - 3 rounded - lg border cursor - pointer transition - all ${selectedCouponId === coupon.id
                                                    ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                    } `}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-white">{coupon.code}</span>
                                                    <span className="text-green-400 text-sm">{coupon.discount_percent}%</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 truncate">{coupon.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Select Target */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">2. Kinek szeretnéd kiosztani?</label>
                                    <div className="flex gap-4 mb-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="target"
                                                checked={assignmentTarget === 'all'}
                                                onChange={() => setAssignmentTarget('all')}
                                                className="form-radio text-indigo-600"
                                            />
                                            <span className="text-white">Minden Felhasználónak ({users.length})</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="target"
                                                checked={assignmentTarget === 'selected'}
                                                onChange={() => setAssignmentTarget('selected')}
                                                className="form-radio text-indigo-600"
                                            />
                                            <span className="text-white">Kiválasztott Felhasználóknak</span>
                                        </label>
                                    </div>

                                    {assignmentTarget === 'selected' && (
                                        <div className="space-y-3 animate-fadeIn">
                                            {/* Selected Users Tags */}
                                            {selectedUserIds.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {selectedUserIds.map(userId => {
                                                        const user = users.find(u => u.user_id === userId);
                                                        return (
                                                            <div key={userId} className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                                                <span>{user?.display_name || userId}</span>
                                                                <button
                                                                    onClick={() => setSelectedUserIds(prev => prev.filter(id => id !== userId))}
                                                                    className="hover:text-white"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Search Input */}
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    placeholder="Felhasználó hozzáadása..."
                                                    value={userSearchTerm}
                                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>

                                            {/* Dropdown Results - Only show when searching */}
                                            {userSearchTerm && (
                                                <div className="border border-white/10 rounded-lg max-h-60 overflow-y-auto bg-black/40 mt-1">
                                                    {users
                                                        .filter(u =>
                                                            !selectedUserIds.includes(u.user_id) &&
                                                            (u.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                                                u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                                                        )
                                                        .map(user => (
                                                            <div
                                                                key={user.user_id}
                                                                onClick={() => {
                                                                    setSelectedUserIds(prev => [...prev, user.user_id]);
                                                                    setUserSearchTerm(''); // Clear search after selection
                                                                }}
                                                                className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/10 transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-white">{user.display_name}</p>
                                                                </div>
                                                                <Plus size={16} className="text-gray-400" />
                                                            </div>
                                                        ))}
                                                    {users.filter(u => !selectedUserIds.includes(u.user_id) && (u.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))).length === 0 && (
                                                        <div className="p-3 text-center text-gray-500 text-sm">Nincs találat</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <ModernButton variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
                                    Mégse
                                </ModernButton>
                                <ModernButton
                                    variant="primary"
                                    onClick={handleAssignCoupons}
                                    disabled={isAssigning || !selectedCouponId || (assignmentTarget === 'selected' && selectedUserIds.length === 0)}
                                    className="flex items-center gap-2"
                                >
                                    {isAssigning ? <RefreshCw className="animate-spin" size={18} /> : <Gift size={18} />}
                                    {assignmentTarget === 'all' ? 'Kiosztás Mindenkinek' : `Kiosztás(${selectedUserIds.length})`}
                                </ModernButton>
                            </div>
                        </GlassCard>
                    </div>
                )
            }

            {/* Wheel Settings Modal */}
            {
                isWheelSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <GlassCard className="w-full max-w-5xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                <div className="flex items-center gap-3">
                                    <Gift className="text-indigo-400" size={24} />
                                    <h2 className="text-2xl font-bold text-white">Szerencsekerék Beállítások</h2>
                                </div>
                                <button onClick={() => setIsWheelSettingsOpen(false)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <p className="text-gray-300">
                                    Itt kezelheted az összes kupon megjelenését a szerencsekeréken.
                                    Adj hozzá kuponokat a listához, állítsd be az esélyüket és színüket.
                                </p>

                                <div className="flex gap-4 border-b border-white/10 mb-6">
                                    <button
                                        onClick={() => setActiveSpinTab('list')}
                                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeSpinTab === 'list'
                                            ? 'text-white'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Aktív Nyeremények
                                        {activeSpinTab === 'list' && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveSpinTab('add')}
                                        className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeSpinTab === 'add'
                                            ? 'text-white'
                                            : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Új Nyeremény
                                        {activeSpinTab === 'add' && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {activeSpinTab === 'list' ? (
                                        <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5 animate-fadeIn">
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider text-gray-500 font-medium px-4 pb-2 border-b border-white/5">
                                                    <div className="col-span-1"></div>
                                                    <div className="col-span-3">Kupon</div>
                                                    <div className="col-span-1 text-center">Szín</div>
                                                    <div className="col-span-3">Esély</div>
                                                    <div className="col-span-3">Címke</div>
                                                    <div className="col-span-1 text-right">Törlés</div>
                                                </div>

                                                {wheelCoupons.filter(c => c.is_spin_prize).map(coupon => (
                                                    <div key={coupon.id} className="bg-white/5 rounded-lg border border-white/5 overflow-hidden transition-all duration-200 hover:border-white/10">
                                                        {/* Header Row */}
                                                        <div
                                                            className="grid grid-cols-12 gap-2 items-center px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                                                            onClick={() => setExpandedSpinPrizeId(expandedSpinPrizeId === coupon.id ? null : coupon.id)}
                                                        >
                                                            <div className="col-span-1">
                                                                <button
                                                                    className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
                                                                >
                                                                    {expandedSpinPrizeId === coupon.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                </button>
                                                            </div>
                                                            <div className="col-span-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-white font-medium text-sm">{coupon.code}</span>
                                                                    <span className="text-xs text-green-400">
                                                                        {coupon.discount_type === 'percentage' ? `${coupon.discount_amount}%` : `${coupon.discount_amount} Ft`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                <input
                                                                    type="color"
                                                                    value={coupon.spin_color || '#EF4444'}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, spin_color: val } : p));
                                                                    }}
                                                                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0"
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <div
                                                                    className="flex items-center gap-2 bg-black/20 rounded-lg px-2 py-1 border border-white/5"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <span className="text-xs text-gray-400">Súly:</span>
                                                                    <input
                                                                        type="number"
                                                                        value={coupon.spin_probability || 0}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value);
                                                                            setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, spin_probability: val } : p));
                                                                        }}
                                                                        className="w-full bg-transparent border-none text-white text-sm text-right focus:ring-0 p-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="text"
                                                                    value={coupon.spin_label || ''}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, spin_label: val } : p));
                                                                    }}
                                                                    placeholder={coupon.code}
                                                                    className="w-full bg-black/20 border border-white/5 rounded px-2 py-1 text-white text-sm focus:border-indigo-500/50 transition-colors"
                                                                />
                                                            </div>
                                                            <div className="col-span-1 text-right">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, is_spin_prize: false } : p));
                                                                    }}
                                                                    className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-400/10 rounded transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Content */}
                                                        {expandedSpinPrizeId === coupon.id && (
                                                            <div className="px-4 py-4 bg-black/20 border-t border-white/5 space-y-4 animate-fadeIn">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-1.5 ml-1">Leírás</label>
                                                                        <input
                                                                            type="text"
                                                                            value={coupon.description || ''}
                                                                            onChange={(e) => setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, description: e.target.value } : p))}
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 transition-colors"
                                                                        />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="block text-xs text-gray-400 mb-1.5 ml-1">Érték</label>
                                                                            <input
                                                                                type="number"
                                                                                value={coupon.discount_amount || 0}
                                                                                onChange={(e) => {
                                                                                    const val = Number(e.target.value);
                                                                                    setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? {
                                                                                        ...p,
                                                                                        discount_amount: val,
                                                                                        discount_percent: p.discount_type === 'percentage' ? val : 0
                                                                                    } : p));
                                                                                }}
                                                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 transition-colors"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-gray-400 mb-1.5 ml-1">Típus</label>
                                                                            <div className="relative">
                                                                                <select
                                                                                    value={coupon.discount_type}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value as 'percentage' | 'fixed_cart';
                                                                                        setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? {
                                                                                            ...p,
                                                                                            discount_type: val,
                                                                                            discount_percent: val === 'percentage' ? p.discount_amount : 0
                                                                                        } : p))
                                                                                    }}
                                                                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none focus:border-indigo-500/50 transition-colors"
                                                                                >
                                                                                    <option value="percentage">%</option>
                                                                                    <option value="fixed_cart">Ft</option>
                                                                                </select>
                                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                                    <ChevronDown size={14} />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-1.5 ml-1">Darab Limit</label>
                                                                        <input
                                                                            type="number"
                                                                            value={coupon.usage_limit || ''}
                                                                            onChange={(e) => setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, usage_limit: e.target.value ? parseInt(e.target.value) : null } : p))}
                                                                            placeholder="Végtelen"
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 transition-colors"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-1.5 ml-1">Lejárat</label>
                                                                        <input
                                                                            type="date"
                                                                            value={coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : ''}
                                                                            onChange={(e) => setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null } : p))}
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 transition-colors"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-gray-400 mb-1.5 ml-1">Minimum Kosár</label>
                                                                        <input
                                                                            type="number"
                                                                            value={coupon.min_order_value || ''}
                                                                            onChange={(e) => setWheelCoupons(prev => prev.map(p => p.id === coupon.id ? { ...p, min_order_value: e.target.value ? parseInt(e.target.value) : null } : p))}
                                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50 transition-colors"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                {wheelCoupons.filter(c => c.is_spin_prize).length === 0 && (
                                                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                                                        <Gift size={32} className="mx-auto mb-3 opacity-50" />
                                                        <p>Jelenleg egyetlen kupon sincs a szerencsekeréken.</p>
                                                        <button
                                                            onClick={() => setActiveSpinTab('add')}
                                                            className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 font-medium"
                                                        >
                                                            Kupon hozzáadása
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-800/50 rounded-xl p-6 border border-white/5 animate-fadeIn">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                                                    <Plus size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">Új Nyeremény Hozzáadása</h3>
                                                    <p className="text-sm text-gray-400">Hozz létre egy új kupont kifejezetten a szerencséhez</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 max-w-2xl">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Kód *</label>
                                                        <ModernInput
                                                            value={createSpinPrizeForm.code}
                                                            onChange={(e) => setCreateSpinPrizeForm({ ...createSpinPrizeForm, code: e.target.value })}
                                                            placeholder="PL. HERO_WIN_15"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Típus</label>
                                                        <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                                                            <button
                                                                onClick={() => setCreateSpinPrizeForm({ ...createSpinPrizeForm, discount_type: 'percentage' })}
                                                                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${createSpinPrizeForm.discount_type === 'percentage' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Százalék (%)
                                                            </button>
                                                            <button
                                                                onClick={() => setCreateSpinPrizeForm({ ...createSpinPrizeForm, discount_type: 'fixed_cart' })}
                                                                className={`flex-1 py-1.5 rounded text-sm font-medium transition-all ${createSpinPrizeForm.discount_type === 'fixed_cart' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
                                                            >
                                                                Fix (Ft)
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">
                                                            {createSpinPrizeForm.discount_type === 'percentage' ? 'Kedvezmény (%)' : 'Kedvezmény (Ft)'}
                                                        </label>
                                                        <ModernInput
                                                            type="number"
                                                            value={createSpinPrizeForm.discount_amount}
                                                            onChange={(e) => setCreateSpinPrizeForm({ ...createSpinPrizeForm, discount_amount: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Esély (Súly)</label>
                                                        <ModernInput
                                                            type="number"
                                                            value={createSpinPrizeForm.spin_probability}
                                                            onChange={(e) => setCreateSpinPrizeForm({ ...createSpinPrizeForm, spin_probability: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-400 mb-2">Szín</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="color"
                                                                value={createSpinPrizeForm.spin_color}
                                                                onChange={(e) => setCreateSpinPrizeForm({ ...createSpinPrizeForm, spin_color: e.target.value })}
                                                                className="h-10 w-12 rounded cursor-pointer border-none bg-transparent"
                                                            />
                                                            <div className="flex-1">
                                                                <ModernInput
                                                                    value={createSpinPrizeForm.spin_label}
                                                                    onChange={(e) => setCreateSpinPrizeForm({ ...createSpinPrizeForm, spin_label: e.target.value })}
                                                                    placeholder="Címke"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex justify-end">
                                                    <ModernButton
                                                        variant="primary"
                                                        onClick={async () => {
                                                            try {
                                                                if (createSpinPrizeForm.discount_amount > 100 && createSpinPrizeForm.discount_type === 'percentage') {
                                                                    toast.error('Százalékos kedvezmény nem lehet nagyobb, mint 100!');
                                                                    return;
                                                                }
                                                                const success = await handleCreateSpinPrize();
                                                                if (success) {
                                                                    setActiveSpinTab('list');
                                                                }
                                                            } catch (e) {
                                                                console.error("Caught in onClick", e);
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto px-8"
                                                    >
                                                        <Plus size={18} className="mr-2" />
                                                        Nyeremény Létrehozása
                                                    </ModernButton>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <ModernButton variant="ghost" onClick={() => setIsWheelSettingsOpen(false)}>
                                    Mégse
                                </ModernButton>
                                <ModernButton variant="primary" onClick={handleSaveWheelSettings} className="flex items-center gap-2">
                                    <Save size={18} />
                                    Beállítások Mentése
                                </ModernButton>
                            </div>
                        </GlassCard>
                    </div>
                )
            }
        </div>

    );
};


