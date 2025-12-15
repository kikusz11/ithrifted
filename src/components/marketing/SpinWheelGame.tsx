import { useState, useEffect } from 'react';
import { X, Gift, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface SpinPrize {
    id: string;
    code: string;
    spin_color: string;
    spin_label?: string;
    spin_probability: number;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed_cart' | 'fixed_product' | 'free_shipping';
}

interface SpinWheelGameProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SpinWheelGame({ isOpen, onClose }: SpinWheelGameProps) {
    const [prizes, setPrizes] = useState<SpinPrize[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [wonPrize, setWonPrize] = useState<SpinPrize | null>(null);
    const [canSpin, setCanSpin] = useState(true); // Check daily limit

    // Fetch prizes
    useEffect(() => {
        if (isOpen) {
            fetchPrizes();
            checkCanSpin();
        }
    }, [isOpen]);

    const fetchPrizes = async () => {
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('is_spin_prize', true)
                .eq('is_active', true)
                .order('created_at');

            if (error) throw error;

            // Normalize data (add Losing slice if total probability < 100? Or just use relative weights)
            // For simplicity, we use the raw items and let the random logic handle weights properly
            setPrizes(data || []);
        } catch (error) {
            console.error('Error fetching prizes:', error);
            toast.error('Hiba a nyeremények betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    const checkCanSpin = async () => {
        // Simple check: LocalStorage for guest/performance + DB check for auth users
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Check LS for anon limit
            const lastSpin = localStorage.getItem('last_spin_time');
            if (lastSpin && new Date().getTime() - Number(lastSpin) < 24 * 60 * 60 * 1000) {
                setCanSpin(false);
            }
            return;
        }

        // DB Check for auth users
        const { data } = await supabase
            .from('spin_history')
            .select('created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastSpinDate = new Date(data[0].created_at);
            const oneDayAgo = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
            if (lastSpinDate > oneDayAgo) {
                setCanSpin(false);
            }
        }
    };

    const handleSpin = async () => {
        if (!canSpin || isSpinning || prizes.length === 0) return;

        setIsSpinning(true);

        // Logic to determine winner based on weights
        const totalWeight = prizes.reduce((sum, item) => sum + (item.spin_probability || 0), 0);
        let random = Math.random() * totalWeight;
        let selectedIndex = -1;

        for (let i = 0; i < prizes.length; i++) {
            random -= (prizes[i].spin_probability || 0);
            if (random <= 0) {
                selectedIndex = i;
                break;
            }
        }

        // Fallback
        if (selectedIndex === -1) selectedIndex = prizes.length - 1;

        const selectedPrize = prizes[selectedIndex];

        // Calculate rotation
        // 360 degrees / num_prizes = segment size
        // We want to land on the segment of selectedIndex
        // The wheel starts at 0deg. 
        // Need to spin at least 5 times (1800deg) + angle to target
        const segmentSize = 360 / prizes.length;
        // Target angle is center of the segment?
        // If index 0 is at top (0 to segmentSize), then we need to rotate to ...
        // Wait, CSS rotate rotates clockwise.
        // To bring segment I to top pointer, we need to rotate negative angle?
        // Let's assume pointer is at Top (0deg).
        // Segment 0 is at [0, segmentSize]. To select it, we want pointer to be within that range.
        // Actually usually we align center of segment to pointer.

        const randomOffset = Math.random() * (segmentSize * 0.8) + (segmentSize * 0.1); // Add randomness within segment
        // const targetAngle = 360 - (selectedIndex * segmentSize) - (segmentSize / 2); // Center of segment

        // Let's rely on full spins + segment offset
        const fullSpins = 5 + Math.floor(Math.random() * 5); // 5-10 spins
        // To convert index to angle:
        // Index 0: 0deg
        // Index 1: segmentSize deg
        // ...
        // To land on Index 0 (top): rotation should be 360 - 0?
        // Visual Wheel: 0 starts at Top or Right? css conic-gradient starts at top (0deg) going clockwise.
        // Pointer is usually at Top.
        // So if we rotate the WHEEL, the data moves clockwise.
        // To bring Index X to top, we need to rotate Counter-Clockwise X*Size? 
        // Or 360 - (X * Size).
        // Let's calculate:
        // Target Rotation = FullSpins * 360 + (360 - (selectedIndex * segmentSize) - (segmentSize/2)); 
        // Added some randomness:
        const baseRotation = fullSpins * 360;
        const targetWedgeAngle = (selectedIndex * segmentSize) + randomOffset; // Random position in the wedge
        const finalRotation = baseRotation + (360 - targetWedgeAngle);

        setRotation(finalRotation);

        // Wait for animation
        setTimeout(async () => {
            setIsSpinning(false);
            setWonPrize(selectedPrize);

            // Save to DB
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('spin_history').insert({
                    user_id: user.id,
                    coupon_id: selectedPrize.id
                });

                await supabase.from('user_coupons').insert({
                    user_id: user.id,
                    coupon_id: selectedPrize.id,
                    is_used: false
                });
            } else {
                localStorage.setItem('last_spin_time', new Date().getTime().toString());
            }

            toast.success('Gratulálunk! Nyereményedet jóváírtuk!');
            setCanSpin(false); // Disable after spin
        }, 5000); // 5s transition
    };

    const getSectorColor = (index: number, prize: SpinPrize) => {
        return prize.spin_color || `hsl(${index * (360 / prizes.length)}, 70%, 50%)`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center animate-scaleIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-3xl font-bold text-white mb-2 text-center drop-shadow-lg">
                    Szerencsekerék
                </h2>
                <p className="text-indigo-200 mb-6 text-center text-sm">
                    Pörgess és nyerj exkluzív kuponokat!
                    {!canSpin && !wonPrize && <br /> && <span className="text-red-300 font-bold block mt-1">Ma már pörgettél! Térj vissza holnap.</span>}
                </p>

                {/* Loading State */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-white">
                        <Loader2 className="animate-spin w-12 h-12" />
                    </div>
                ) : prizes.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-300 text-center">
                        <Gift className="w-16 h-16 mb-4 opacity-50" />
                        <p>Jelenleg nincsenek elérhető nyeremények.</p>
                    </div>
                ) : !wonPrize ? (
                    /* The Wheel */
                    <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8">
                        {/* External Ring */}
                        <div className="absolute inset-[-10px] rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-lg border-4 border-yellow-700 z-0"></div>

                        {/* Pointer */}
                        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-20 w-8 h-10">
                            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[25px] border-t-red-600 border-r-[15px] border-r-transparent drop-shadow-md"></div>
                        </div>

                        {/* Spinning Part */}
                        <div
                            className="w-full h-full rounded-full overflow-hidden relative shadow-inner z-10"
                            style={{
                                transform: `rotate(${rotation}deg)`,
                                transition: isSpinning ? 'transform 5s cubic-bezier(0.1, 0, 0.1, 1)' : 'none',
                                background: `conic-gradient(${prizes.map((p, i) =>
                                    `${getSectorColor(i, p)} ${i * (100 / prizes.length)}% ${(i + 1) * (100 / prizes.length)}%`
                                ).join(', ')
                                    })`
                            }}
                        >
                            {/* Labels */}
                            {prizes.map((prize, i) => {
                                const angle = (i * (360 / prizes.length)) + (360 / prizes.length / 2);
                                return (
                                    <div
                                        key={prize.id}
                                        className="absolute top-1/2 left-1/2 w-full h-[1px] origin-left"
                                        style={{
                                            transform: `rotate(${angle - 90}deg) translate(20px, 0)`, /* -90 to align with top? no conic gradient 0 is top. */
                                        }}
                                    >
                                        <div
                                            className="text-white font-bold text-xs md:text-sm whitespace-nowrap pl-8 md:pl-10"
                                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                        >
                                            {prize.spin_label || prize.code}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Center Cap */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg z-20 flex items-center justify-center border-4 border-gray-200">
                            <Sparkles className="text-yellow-500 w-6 h-6" />
                        </div>
                    </div>
                ) : (
                    /* Success / Winner View */
                    <div className="flex flex-col items-center animate-scaleIn text-center py-8">
                        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce">
                            <Gift className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">GRATULÁLUNK!</h3>
                        <p className="text-indigo-200 mb-4">A nyereményed:</p>
                        <div className="bg-white text-indigo-900 font-bold text-xl px-6 py-3 rounded-xl shadow-lg border-2 border-indigo-500 mb-6 border-dashed">
                            {wonPrize.spin_label || wonPrize.code}
                        </div>
                        <p className="text-sm text-gray-300 mb-6 max-w-xs">
                            A kupon automatikusan hozzáadásra került a profilodhoz!
                        </p>
                        <button
                            onClick={onClose}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-colors"
                        >
                            Rendben, köszi!
                        </button>
                    </div>
                )}

                {/* Spin Button */}
                {!wonPrize && prizes.length > 0 && (
                    <button
                        onClick={handleSpin}
                        disabled={!canSpin || isSpinning}
                        className={`
                            px-8 py-3 rounded-full font-bold text-lg shadow-xl transform transition-all 
                            ${canSpin && !isSpinning
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:scale-105 hover:from-yellow-300 hover:to-orange-400 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed grayscale'}
                        `}
                    >
                        {isSpinning ? 'Pörgetés...' : canSpin ? 'PÖRGESS!' : 'Mára ennyi volt :('}
                    </button>
                )}
            </div>
        </div>
    );
}

// Add Tailwind keyframes for scaleIn if needed or rely on existing animations
// Using generic class animate-scaleIn assuming it might exist or generic CSS.
// We can inject a style tag for specific animation if needed, but 'transition-transform' handles most.
