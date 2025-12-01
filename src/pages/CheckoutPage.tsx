import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, CreditCard, Truck, ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
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
}

export default function CheckoutPage() {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CheckoutFormData>({
        customerName: '',
        customerEmail: user?.email || '',
        customerPhone: '',
        street: '',
        city: '',
        postalCode: '',
        country: '',
    });

    // Profil adatok betöltése
    // Profil adatok betöltése
    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.warn('Profile fetch warning:', error);
                }

                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        customerName: data.full_name || '',
                        customerPhone: data.phone || '',
                        street: data.shipping_address?.street || '',
                        city: data.shipping_address?.city || '',
                        postalCode: data.shipping_address?.postal_code || '',
                        country: data.shipping_address?.country || '',
                    }));
                }
            } catch (err) {
                console.error('Error loading profile:', err);
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [user]);

    // Ha üres a kosár, visszairányítás
    useEffect(() => {
        if (cart.length === 0) {
            navigate('/');
        }
    }, [cart, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep1 = () => {
        if (!formData.customerName || !formData.customerEmail || !formData.customerPhone ||
            !formData.street || !formData.city || !formData.postalCode || !formData.country) {
            setError('Kérjük, tölts ki minden mezőt!');
            return false;
        }
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

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
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
                    },
                    total_amount: cartTotal,
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

            // 3. Siker
            clearCart();
            // Itt navigálhatnánk egy köszönő oldalra, de most csak visszaviszünk a főoldalra
            alert('Sikeres rendelés! Köszönjük a vásárlást.');
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Stepper */}
                <div className="mb-12">
                    <div className="flex items-center justify-center max-w-2xl mx-auto">
                        {/* Step 1 Indicator */}
                        <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300
                ${step >= 1 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-600 bg-gray-800'}`}>
                                <Truck size={20} />
                            </div>
                            <span className="text-sm font-medium">Szállítás</span>
                        </div>

                        {/* Connector Line */}
                        <div className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${step >= 2 ? 'bg-blue-400' : 'bg-gray-700'}`}></div>

                        {/* Step 2 Indicator */}
                        <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all duration-300
                ${step >= 2 ? 'border-blue-400 bg-blue-400/20' : 'border-gray-600 bg-gray-800'}`}>
                                <CreditCard size={20} />
                            </div>
                            <span className="text-sm font-medium">Fizetés & Áttekintés</span>
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
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fadeIn">
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

                    {/* Sidebar Summary */}
                    <div className="lg:col-span-4">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6">Összesítés</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>Részösszeg</span>
                                    <span>{cartTotal.toLocaleString()} Ft</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                    <span>Szállítás</span>
                                    <span className="text-green-400">Ingyenes</span>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-medium text-white">Végösszeg</span>
                                    <span className="text-2xl font-bold text-white">{cartTotal.toLocaleString()} Ft</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">Az árak tartalmazzák az ÁFA-t</p>
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
