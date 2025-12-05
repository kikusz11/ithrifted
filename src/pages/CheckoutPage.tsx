import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, CreditCard, Truck, ChevronRight, ChevronLeft, ShoppingBag, MapPin, Smartphone } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import ModernButton from '@/components/ui/ModernButton';
import ModernInput from '@/components/ui/ModernInput';

interface CheckoutFormData {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    taxId?: string;
}

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [shippingMethod, setShippingMethod] = useState<'home' | 'packeta'>('home');
    const [isCorporate, setIsCorporate] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

    const [formData, setFormData] = useState<CheckoutFormData>({
        customerName: '',
        customerEmail: user?.email || '',
        customerPhone: '',
        street: '',
        city: '',
        postalCode: '',
        country: '',
        taxId: '',
    });

    // Fetch active coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('is_active', true);

            if (error) {
                console.error('Error fetching coupons:', error);
            } else {
                // Client-side filtering
                const now = new Date();
                const validCoupons = (data || []).filter(coupon => {
                    const isNotExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
                    const hasRemainingUsage = coupon.usage_limit === null || coupon.usage_count < coupon.usage_limit;
                    return isNotExpired && hasRemainingUsage;
                });
                setAvailableCoupons(validCoupons);
            }
        };

        fetchCoupons();
    }, []);

    // ... (Profile loading and Cart check remain same)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyCoupon = () => {
        setCouponError(null);
        setCouponSuccess(null);
        setDiscountPercent(0);

        const code = couponCode.trim().toUpperCase();

        if (!code) {
            setCouponError('Kérjük, adjon meg egy kuponkódot!');
            return;
        }

        const coupon = availableCoupons.find(c => c.code === code);

        if (coupon) {
            setDiscountPercent(coupon.discount_percent);
            setCouponSuccess(`${coupon.discount_percent}% kedvezmény érvényesítve!`);
        } else {
            setCouponError('Érvénytelen, lejárt vagy betelt kuponkód.');
        }
    };

    const validateStep1 = () => {
        if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
            setError('Kérjük, tölts ki minden mezőt!');
            return false;
        }

        if (shippingMethod === 'home') {
            if (!formData.street || !formData.city || !formData.postalCode || !formData.country) {
                setError('Kérjük, tölts ki minden cím mezőt!');
                return false;
            }
        }
        // Packeta validation would go here (check if point selected)

        setError(null);
        return true;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
                window.scrollTo(0, 0);
            }
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const discountAmount = Math.round(cartTotal * (discountPercent / 100));
    const finalTotal = cartTotal - discountAmount;

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // 0. Check coupon validity again if applied
            let appliedCoupon = null;
            if (discountPercent > 0 && couponCode) {
                const { data: couponData, error: couponError } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('code', couponCode)
                    .single();

                if (couponError || !couponData) throw new Error('Érvénytelen kupon.');

                if (couponData.usage_limit !== null && couponData.usage_count >= couponData.usage_limit) {
                    throw new Error('A kupon elérte a felhasználási limitet.');
                }
                appliedCoupon = couponData;
            }

            // 1. Rendelés létrehozása
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user?.id,
                    customer_name: formData.customerName,
                    customer_email: formData.customerEmail,
                    customer_phone: formData.customerPhone,
                    shipping_address: {
                        street: formData.street,
                        city: formData.city,
                        postal_code: formData.postalCode,
                        country: formData.country,
                        tax_id: formData.taxId,
                        payment_method: paymentMethod,
                        shipping_method: shippingMethod,
                        packeta_point_id: shippingMethod === 'packeta' ? 'MOCK-POINT-ID' : null,
                    },
                    total_amount: finalTotal, // Use discounted total
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Rendelés tételeinek mentése
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Increment Coupon Usage
            if (appliedCoupon) {
                await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id });
                // Fallback if RPC doesn't exist (though RPC is safer for concurrency)
                // For now, simple update since we might not have RPC
                await supabase
                    .from('coupons')
                    .update({ usage_count: appliedCoupon.usage_count + 1 })
                    .eq('id', appliedCoupon.id);
            }

            // 4. Siker
            clearCart();
            // Itt navigálhatnánk egy köszönő oldalra, de most csak visszaviszünk a főoldalra
            alert(`Sikeres rendelés! Végösszeg: ${finalTotal.toLocaleString()} Ft. Köszönjük a vásárlást.`);
            navigate('/');

        } catch (err: any) {
            console.error('Order error:', err);
            setError('Hiba történt a rendelés feldolgozása közben: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20 md:pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Stepper */}
                <div className="mb-8 md:mb-12">
                    <div className="flex items-center justify-center max-w-2xl mx-auto">
                        {/* Step 1 Indicator */}
                        <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300
                ${step >= 1 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-600 bg-gray-800'}`}>
                                <Truck size={16} className="md:w-5 md:h-5" />
                            </div>
                            <span className="text-xs md:text-sm font-medium">Szállítás</span>
                        </div>

                        {/* Connector Line */}
                        <div className={`flex-1 h-0.5 mx-2 md:mx-4 transition-all duration-500 ${step >= 2 ? 'bg-blue-400' : 'bg-gray-700'}`}></div>

                        {/* Step 2 Indicator */}
                        <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300
                ${step >= 2 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-600 bg-gray-800'}`}>
                                <CreditCard size={16} className="md:w-5 md:h-5" />
                            </div>
                            <span className="text-xs md:text-sm font-medium">Fizetés</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        <GlassCard className="p-8 min-h-[500px]">
                            {step === 1 ? (
                                <div className="space-y-6 animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Truck className="text-blue-400" />
                                        Szállítási Mód
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        <div
                                            onClick={() => setShippingMethod('home')}
                                            className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all
                                                ${shippingMethod === 'home'
                                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <Truck size={24} />
                                            <span className="font-medium">Házhozszállítás</span>
                                        </div>
                                        <div
                                            onClick={() => setShippingMethod('packeta')}
                                            className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all
                                                ${shippingMethod === 'packeta'
                                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <MapPin size={24} />
                                            <span className="font-medium">Packeta Csomagpont</span>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <Truck className="text-blue-400" />
                                        Szállítási Adatok
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Teljes név</label>
                                            <ModernInput
                                                name="customerName"
                                                value={formData.customerName}
                                                onChange={handleInputChange}
                                                placeholder="Pl. Kiss János"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Email cím</label>
                                            <ModernInput
                                                name="customerEmail"
                                                value={formData.customerEmail}
                                                onChange={handleInputChange}
                                                placeholder="janos@example.com"
                                                type="email"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-400 mb-1">Telefonszám</label>
                                            <ModernInput
                                                name="customerPhone"
                                                value={formData.customerPhone}
                                                onChange={handleInputChange}
                                                placeholder="+36 30 123 4567"
                                                type="tel"
                                            />
                                        </div>

                                        {shippingMethod === 'home' ? (
                                            <>
                                                <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                                                    <h3 className="text-lg font-semibold text-white mb-4">Cím</h3>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Utca, házszám</label>
                                                    <ModernInput
                                                        name="street"
                                                        value={formData.street}
                                                        onChange={handleInputChange}
                                                        placeholder="Fő utca 1."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Város</label>
                                                    <ModernInput
                                                        name="city"
                                                        value={formData.city}
                                                        onChange={handleInputChange}
                                                        placeholder="Budapest"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Irányítószám</label>
                                                    <ModernInput
                                                        name="postalCode"
                                                        value={formData.postalCode}
                                                        onChange={handleInputChange}
                                                        placeholder="1052"
                                                    />
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-400 mb-1">Ország</label>
                                                    <ModernInput
                                                        name="country"
                                                        value={formData.country}
                                                        onChange={handleInputChange}
                                                        placeholder="Magyarország"
                                                    />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                                                <h3 className="text-lg font-semibold text-white mb-4">Csomagpont Kiválasztása</h3>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                                                    <MapPin className="mx-auto text-gray-400 mb-3" size={32} />
                                                    <p className="text-gray-300 mb-4">Válassz egy Packeta átvevőhelyet a térképen.</p>
                                                    <ModernButton
                                                        variant="secondary"
                                                        onClick={() => alert('Packeta widget megnyitása... (Mock)')}
                                                        className="w-full md:w-auto"
                                                    >
                                                        Csomagpont kiválasztása
                                                    </ModernButton>
                                                    {/* Mock selected point */}
                                                    <p className="text-sm text-green-400 mt-3 font-medium">Kiválasztva: Budapest, Teszt utca 1. (Mock)</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="md:col-span-2 border-t border-white/10 pt-6 mt-2">
                                            <h3 className="text-lg font-semibold text-white mb-4">Számlázási Adatok</h3>

                                            <label className="flex items-center gap-2 cursor-pointer mb-4 group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isCorporate ? 'bg-blue-500 border-blue-500' : 'border-gray-600 bg-black/30 group-hover:border-gray-500'}`}>
                                                    {isCorporate && <CheckCircle size={14} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isCorporate}
                                                    onChange={(e) => setIsCorporate(e.target.checked)}
                                                    className="hidden"
                                                />
                                                <span className="text-gray-300 group-hover:text-white transition-colors">Céges vásárlás (ÁFA-s számla igény)</span>
                                            </label>
                                        </div>

                                        {isCorporate && (
                                            <div className="md:col-span-2 animate-fadeIn">
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Adószám</label>
                                                <ModernInput
                                                    name="taxId"
                                                    value={formData.taxId || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="12345678-1-42"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fadeIn">
                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <CreditCard className="text-blue-400" />
                                        Fizetési Mód
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                        {[
                                            { id: 'credit_card', name: 'Bankkártya', icon: CreditCard },
                                            { id: 'google_pay', name: 'Google Pay', icon: Smartphone },
                                            { id: 'transfer', name: 'Átutalás', icon: CheckCircle },
                                            { id: 'cod', name: 'Utánvét', icon: Truck },
                                        ].map((method) => (
                                            <div
                                                key={method.id}
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all
                                                    ${paymentMethod === method.id
                                                        ? 'bg-blue-500/20 border-blue-500 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                <method.icon size={24} />
                                                <span className="font-medium">{method.name}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                        <CheckCircle className="text-green-400" />
                                        Rendelés Áttekintése
                                    </h2>

                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                                        <div className="flex justify-between border-b border-white/10 pb-4">
                                            <div>
                                                <p className="text-gray-400 text-sm">Szállítási cím</p>
                                                <p className="text-white font-medium mt-1">{formData.customerName}</p>
                                                <p className="text-gray-300 text-sm">{formData.street}</p>
                                                <p className="text-gray-300 text-sm">{formData.postalCode} {formData.city}, {formData.country}</p>
                                                <p className="text-gray-300 text-sm mt-1">{formData.customerPhone}</p>
                                                {formData.taxId && <p className="text-gray-300 text-sm mt-1">Adószám: {formData.taxId}</p>}
                                            </div>
                                            <button onClick={() => setStep(1)} className="text-blue-400 text-sm hover:text-blue-300 h-fit">
                                                Módosítás
                                            </button>
                                        </div>

                                        <div>
                                            <p className="text-gray-400 text-sm mb-3">Termékek</p>
                                            <div className="space-y-3">
                                                {cart.map(item => (
                                                    <div key={item.id} className="flex items-center gap-4 bg-black/20 p-3 rounded-lg">
                                                        <div className="w-12 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                    <ShoppingBag size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-white text-sm font-medium">{item.name}</p>
                                                            <p className="text-gray-400 text-xs">{item.quantity} db</p>
                                                        </div>
                                                        <p className="text-white font-medium">{(item.price * item.quantity).toLocaleString()} Ft</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GlassCard>

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex justify-between">
                            {step > 1 ? (
                                <ModernButton onClick={handleBack} variant="secondary" className="flex items-center gap-2">
                                    <ChevronLeft size={18} /> Vissza
                                </ModernButton>
                            ) : (
                                <div></div> // Spacer
                            )}

                            {step === 1 ? (
                                <ModernButton onClick={handleNext} className="flex items-center gap-2">
                                    Tovább a fizetéshez <ChevronRight size={18} />
                                </ModernButton>
                            ) : (
                                <ModernButton onClick={handlePlaceOrder} disabled={isSubmitting} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-green-500/50 shadow-green-500/25">
                                    {isSubmitting ? 'Feldolgozás...' : 'Megrendelés elküldése'} <CheckCircle size={18} />
                                </ModernButton>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Summary - Order changed for mobile: Summary first on mobile? No, usually last or collapsible. Keeping it last but ensuring spacing. */}
                    <div className="lg:col-span-4 order-first lg:order-last mb-8 lg:mb-0">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6">Összesítés</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>Részösszeg</span>
                                    <span>{cartTotal.toLocaleString()} Ft</span>
                                </div>
                                {discountPercent > 0 && (
                                    <div className="flex justify-between text-green-400">
                                        <span>Kedvezmény ({discountPercent}%)</span>
                                        <span>-{discountAmount.toLocaleString()} Ft</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-300">
                                    <span>Szállítás</span>
                                    <span className="text-green-400">Ingyenes</span>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-medium text-white">Végösszeg</span>
                                    <span className="text-2xl font-bold text-white">{finalTotal.toLocaleString()} Ft</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">Az árak tartalmazzák az ÁFA-t</p>
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Kuponkód</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Kód megadása"
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <ModernButton onClick={handleApplyCoupon} variant="secondary" size="sm">
                                        Beváltás
                                    </ModernButton>
                                </div>
                                {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                                {couponSuccess && <p className="text-green-400 text-xs mt-1">{couponSuccess}</p>}

                                {/* Available Coupons List */}
                                {availableCoupons.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Elérhető kuponok:</p>
                                        {availableCoupons.map(coupon => (
                                            <div
                                                key={coupon.id}
                                                onClick={() => setCouponCode(coupon.code)}
                                                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 cursor-pointer transition-colors flex justify-between items-center group"
                                            >
                                                <div>
                                                    <p className="text-blue-400 font-bold text-sm">{coupon.code}</p>
                                                    <p className="text-gray-400 text-xs">{coupon.description}</p>
                                                </div>
                                                <div className="text-white text-sm font-medium bg-blue-500/20 px-2 py-1 rounded">
                                                    -{coupon.discount_percent}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Truck className="text-blue-400 flex-shrink-0 mt-1" size={18} />
                                    <div>
                                        <p className="text-sm text-blue-200 font-medium">Ingyenes kiszállítás</p>
                                        <p className="text-xs text-blue-300/70 mt-1">Minden rendelést ingyenesen szállítunk házhoz az egész ország területén.</p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
