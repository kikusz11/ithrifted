import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Drop {
    id: string;
    name: string;
    description: string;
    start_time: string;
}

export default function ClosedShopPage() {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [nextDrop, setNextDrop] = useState<Drop | null>(null);
    const [loading, setLoading] = useState(true);

    // Email subscription states
    const [email, setEmail] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formMessage, setFormMessage] = useState('');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        async function fetchNextDrop() {
            setLoading(true);
            const now = new Date().toISOString();

            const { data: futureDrop, error } = await supabase
                .from('drops')
                .select('*')
                .eq('is_active', true)
                .gt('start_time', now)
                .order('start_time', { ascending: true })
                .limit(1)
                .single();

            if (futureDrop) {
                setNextDrop(futureDrop);
            } else if (error && error.code !== 'PGRST116') {
                console.error("Error fetching future drop:", error);
            }
            setLoading(false);
        }
        fetchNextDrop();
    }, []);

    useEffect(() => {
        if (!nextDrop) return;

        const dropDate = new Date(nextDrop.start_time).getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const difference = dropDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            } else {
                setTimeLeft(null);
                // Reload page to check if shop should be open now
                window.location.reload();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextDrop]);

    const handleSubscription = async (event: FormEvent) => {
        event.preventDefault();
        setFormLoading(true);
        setFormMessage('');
        setFormError('');

        try {
            // 1. Save to Supabase first (as backup/database record)
            const { error: dbError } = await supabase
                .from('subscriptions')
                .insert({ email: email, created_at: new Date() });

            if (dbError) {
                if (dbError.code === '23505') {
                    throw new Error('Ezzel az e-mail címmel már feliratkoztak.');
                }
                throw dbError;
            }

            // 2. Send email via Netlify Function
            const response = await fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                console.warn('Email sending failed, but subscription saved.');
                // We don't throw here to avoid confusing the user if the DB save worked
            }

            setFormMessage('Sikeres feliratkozás! Küldtünk egy megerősítő emailt.');
            setEmail('');
        } catch (error: any) {
            setFormError(error.message || 'Hiba történt a feliratkozás során. Próbáld újra!');
        } finally {
            setFormLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-stone-800 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-800 via-stone-700 to-neutral-800 opacity-90 z-0"></div>
            <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-stone-600 rounded-full filter blur-3xl opacity-10 animate-pulse z-0"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-neutral-700 rounded-full filter blur-3xl opacity-10 animate-pulse delay-2000 z-0"></div>

            <div className="relative z-10 max-w-4xl w-full text-center">
                {loading ? (
                    <div className="text-xl text-stone-300">Betöltés...</div>
                ) : nextDrop && timeLeft ? (
                    <>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-stone-100">
                            {nextDrop.name}
                        </h1>
                        <p className="text-lg md:text-xl text-stone-300 mb-12">
                            A következő drop hamarosan érkezik.
                        </p>

                        <div className="flex justify-center items-baseline gap-4 text-stone-200 mb-16">
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                                    {String(timeLeft.days).padStart(2, '0')}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium mt-1">Nap</span>
                            </div>
                            <span className="text-2xl md:text-3xl text-stone-600 font-light self-start mt-2">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                                    {String(timeLeft.hours).padStart(2, '0')}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium mt-1">Óra</span>
                            </div>
                            <span className="text-2xl md:text-3xl text-stone-600 font-light self-start mt-2">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                                    {String(timeLeft.minutes).padStart(2, '0')}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium mt-1">Perc</span>
                            </div>
                            <span className="text-2xl md:text-3xl text-stone-600 font-light self-start mt-2">:</span>
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-5xl font-bold tabular-nums tracking-tight">
                                    {String(timeLeft.seconds).padStart(2, '0')}
                                </span>
                                <span className="text-xs uppercase tracking-widest text-stone-500 font-medium mt-1">Mp</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mb-16">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-stone-100">
                            Üzlet Zárva
                        </h1>
                        <p className="text-lg md:text-xl text-stone-300">
                            Jelenleg nincs aktív drop. Iratkozz fel az értesítésekre!
                        </p>
                    </div>
                )}

                <div className="max-w-md mx-auto bg-stone-800/50 p-8 rounded-2xl backdrop-blur-sm border border-stone-700 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-stone-500 hover:bg-stone-800/80">
                    <h2 className="text-2xl font-bold mb-2 text-stone-100">Ne maradj le!</h2>
                    <p className="text-stone-400 mb-6 text-sm">
                        Kérj értesítést a nyitásról, és legyél az elsők között.
                    </p>

                    <form onSubmit={handleSubscription} className="flex flex-col gap-3">
                        <input
                            type="email"
                            placeholder="email@cim.hu"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={formLoading}
                            className="bg-stone-900/80 border border-stone-600 rounded-lg px-4 py-3 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500 transition duration-300 w-full"
                        />
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="bg-stone-100 hover:bg-white text-stone-900 font-bold py-3 px-6 rounded-lg transition duration-300 disabled:bg-stone-500 w-full"
                        >
                            {formLoading ? 'Küldés...' : 'Értesítést Kérek'}
                        </button>
                    </form>

                    {formMessage && <p className="text-green-400 mt-4 text-sm font-medium">{formMessage}</p>}
                    {formError && <p className="text-red-400 mt-4 text-sm font-medium">{formError}</p>}
                </div>
            </div>
        </div>
    );
}
