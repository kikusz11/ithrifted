import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Mail, Phone, Clock, ArrowDown } from 'lucide-react';
import heroBg from '../assets/hero_bg.jpg';
import SEO from '../components/SEO';

interface Drop {
    id: string;
    name: string;
    description: string;
    start_time: string;
}

// Simple reveal component for scroll animations
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
    const [isVisible, setIsVisible] = useState(false);
    const [ref, setRef] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (!ref) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(ref);
        return () => observer.disconnect();
    }, [ref]);

    return (
        <div
            ref={setRef}
            className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

export default function ClosedShopPage() {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [nextDrop, setNextDrop] = useState<Drop | null>(null);
    const [loading, setLoading] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        <div className="font-sans selection:bg-stone-300 selection:text-stone-900 bg-stone-50 text-stone-900">
            <SEO
                title="iThrifted - Prémium Vintage & Streetwear | Budapest"
                description="Fedezd fel Budapest prémium vintage és streetwear üzletét. Egyedi, válogatott márkás használt ruhák (Nike, Adidas, Ralph Lauren, Carhartt) a belváros szívében, a Victor Hugo utcában."
                scripts={[
                    {
                        type: 'application/ld+json',
                        innerHTML: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ClothingStore",
                            "name": "iThrifted",
                            "image": [
                                "https://ithrifted.hu/logo.png"
                            ],
                            "address": {
                                "@type": "PostalAddress",
                                "streetAddress": "Victor Hugo utca 2",
                                "addressLocality": "Budapest",
                                "postalCode": "1132",
                                "addressCountry": "HU"
                            },
                            "geo": {
                                "@type": "GeoCoordinates",
                                "latitude": 47.514789,
                                "longitude": 19.055848
                            },
                            "url": "https://ithrifted.hu",
                            "telephone": "+36306090401",
                            "openingHoursSpecification": [
                                {
                                    "@type": "OpeningHoursSpecification",
                                    "dayOfWeek": [
                                        "Tuesday",
                                        "Wednesday",
                                        "Thursday",
                                        "Friday"
                                    ],
                                    "opens": "14:00",
                                    "closes": "20:00"
                                }
                            ],
                            "sameAs": [
                                "https://www.instagram.com/i_thrifted_",
                                "https://www.tiktok.com/@danibertok1"
                            ]
                        })
                    }
                ]}
            />

            {/* BRAND HERO SECTION */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-20">
                {/* Background Image - Refined stone overlay */}
                <div className="absolute top-0 left-0 w-full h-full bg-stone-100 z-0 text-stone-900">
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-transparent to-stone-50 z-10"></div>
                    <img
                        src={heroBg}
                        alt="Vintage Clothes Background"
                        className="w-full h-[120%] object-cover opacity-90"
                        style={{
                            transform: `translateY(${scrollY * 0.4}px)`,
                        }}
                    />
                </div>

                <div className="relative z-20 max-w-5xl w-full">
                    <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-black tracking-widest md:tracking-[0.25em] mb-4 lowercase drop-shadow-[0_0_25px_rgba(255,255,255,1)] animate-fadeInUp w-full px-2">
                        ithrifted
                    </h1>
                    <p className="text-lg md:text-2xl text-black font-bold tracking-wide max-w-3xl mx-auto mb-10 animate-fadeInUp [animation-delay:200ms]">
                        Vintage/streetwear secondhand clothing store
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center animate-fadeInUp [animation-delay:400ms]">
                        <a
                            href="#location"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('location')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-8 py-3 bg-white text-stone-900 font-bold text-lg rounded-none hover:bg-stone-100 transition-transform transform hover:scale-105 shadow-xl border border-white"
                        >
                            Látogass el hozzánk
                        </a>
                        <a
                            href="#online-drop"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('online-drop')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-8 py-3 bg-black/40 backdrop-blur-md border border-white/50 text-white font-medium text-lg rounded-none hover:bg-black/60 transition-colors"
                        >
                            Online Drop Info
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-20 opacity-80">
                    <ArrowDown size={32} className="text-stone-800" />
                </div>
            </section>

            {/* ABOUT SECTION (Philosophy & Vision) */}
            <section className="py-24 bg-stone-50 overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Left Column: Text Content */}
                        <div className="text-left space-y-8">
                            <ScrollReveal>
                                <span className="text-stone-500 font-bold tracking-widest text-sm uppercase block mb-4">Filozófiánk</span>
                                <h2 className="text-4xl md:text-6xl font-black text-stone-900 leading-[1.1] tracking-tighter">
                                    Több mint ruha. <br />
                                    <span className="text-indigo-600">Stílus és Jövő.</span>
                                </h2>
                            </ScrollReveal>

                            <ScrollReveal delay={200}>
                                <div className="space-y-6 text-lg md:text-xl text-stone-800 leading-relaxed font-normal">
                                    <p>
                                        Az <strong className="text-stone-900 font-bold">iThrifted</strong> küldetése egyszerű: bebizonyítani, hogy a fenntartható divat nem jelent kompromisszumot az esztétika terén.
                                    </p>
                                    <p>
                                        Minden egyes darabot <span className="text-stone-900 font-medium">kézzel válogatunk, tisztítunk és gondozunk</span>, hogy a legértékesebb vintage kincsek új életet kaphassanak a te ruhatáradban is.
                                    </p>
                                    <p className="pt-4 border-l-4 border-indigo-100 pl-6 italic text-stone-600">
                                        "Hiszünk abban, hogy az öltözködés a legerősebb önkifejezési forma. Boltunkban nem tömegtermékeket, hanem történeteket találsz."
                                    </p>
                                    <p className="text-stone-900 font-bold">
                                        Légy te is a tudatos változás része!
                                    </p>
                                </div>
                            </ScrollReveal>
                        </div>

                        {/* Right Column: Aesthetic Image */}
                        <ScrollReveal delay={400}>
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-indigo-50 rounded-[2rem] -z-10 group-hover:scale-105 transition-transform duration-700"></div>
                                <div className="rounded-3xl overflow-hidden shadow-2xl border-8 border-white bg-stone-200 aspect-[4/5]">
                                    {/* Placeholder image - Replace this URL with your Supabase storage URL later */}
                                    <img
                                        src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop"
                                        alt="Vintage curation"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent"></div>
                                </div>
                                {/* Floating Badge */}
                                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl hidden md:block animate-bounce [animation-duration:3s]">
                                    <p className="text-stone-900 font-black text-2xl tracking-tighter">100%</p>
                                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Handmade Selection</p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* LOCATION & CONTACT SECTION (Light Grey Theme) */}
            <section id="location" className="py-24 bg-whitish relative border-t border-stone-200 overflow-hidden">
                <div className="absolute inset-0 bg-stone-100/50 skew-y-3 origin-top-left -z-10 h-full w-full"></div>

                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        {/* Map */}
                        <ScrollReveal>
                            <div className="rounded-2xl overflow-hidden shadow-xl border border-stone-200 h-[500px] relative bg-stone-200 group">
                                <iframe
                                    title="iThrifted Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.163687353683!2d19.05584851582234!3d47.51478967917859!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dbedd5c5b4df%3A0x6b2b6b2b6b2b6b2b!2sBudapest%2C%20Victor%20Hugo%20u.%202%2C%201132!5e0!3m2!1shu!2shu!4v1620000000000!5m2!1shu!2shu"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </ScrollReveal>

                        {/* Contact Info */}
                        <div className="space-y-10">
                            <ScrollReveal delay={100}>
                                <div>
                                    <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">Találkozzunk Személyesen!</h2>
                                    <p className="text-stone-600 text-lg leading-relaxed">
                                        Gyere el üzletünkbe, ahol személyesen felpróbálhatod a legújabb szerzeményeket.
                                        Az üzlet nyitva tart, gyere bátran!
                                    </p>
                                </div>
                            </ScrollReveal>

                            <div className="space-y-6">
                                <ScrollReveal delay={200}>
                                    <div className="flex items-start gap-6 p-6 rounded-2xl bg-white shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                        <div className="p-3 bg-stone-100 rounded-xl text-stone-800">
                                            <MapPin size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-stone-900 font-bold text-lg mb-1">Címünk</h3>
                                            <p className="text-stone-600 text-base">1132 Budapest, Victor Hugo utca 2.</p>
                                        </div>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal delay={300}>
                                    <div className="flex items-start gap-6 p-6 rounded-2xl bg-white shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                        <div className="p-3 bg-stone-100 rounded-xl text-stone-800">
                                            <Clock size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-stone-900 font-bold text-lg mb-1">Nyitvatartás</h3>
                                            <p className="text-stone-600 text-base">Hétfő: Zárva</p>
                                            <p className="text-stone-600 text-base">Kedd - Péntek: 14:00 - 20:00</p>
                                            <p className="text-stone-600 text-base">Szombat: Zárva</p>
                                            <p className="text-stone-600 text-base">Vasárnap: Zárva</p>
                                        </div>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal delay={400}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                            <div className="p-2 bg-stone-100 rounded-lg text-stone-800">
                                                <Mail size={20} />
                                            </div>
                                            <a href="mailto:info@ithrifted.hu" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                                                info@ithrifted.hu
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                                            <div className="p-2 bg-stone-100 rounded-lg text-stone-800">
                                                <Phone size={20} />
                                            </div>
                                            <a href="tel:+36306090401" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                                                06 30 609 0401
                                            </a>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ONLINE DROP / COUNTDOWN SECTION (Light Theme Adaptation) */}
            <section id="online-drop" className="relative py-24 px-4 bg-stone-50 border-t border-stone-200 text-center overflow-hidden">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="animate-pulse flex justify-center"><div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : nextDrop && timeLeft ? (
                        <div className="animate-fadeIn">
                            <ScrollReveal>
                                <span className="inline-block py-1 px-4 rounded-full bg-stone-200 text-stone-700 text-sm font-bold tracking-wider mb-8 border border-stone-300">
                                    KÖVETKEZŐ ONLINE DROP
                                </span>
                                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-stone-900">
                                    {nextDrop.name}
                                </h2>
                            </ScrollReveal>
                            <ScrollReveal delay={200}>
                                <div className="flex justify-center flex-wrap items-baseline gap-6 md:gap-12 text-stone-900 mb-16">
                                    {[
                                        { label: 'Nap', value: timeLeft.days },
                                        { label: 'Óra', value: timeLeft.hours },
                                        { label: 'Perc', value: timeLeft.minutes },
                                        { label: 'Mp', value: timeLeft.seconds }
                                    ].map((item) => (
                                        <div key={item.label} className="flex flex-col items-center">
                                            <span className="text-4xl md:text-6xl font-black tabular-nums tracking-tighter text-stone-800 bg-white px-6 py-4 rounded-2xl shadow-sm border border-stone-100">
                                                {String(item.value).padStart(2, '0')}
                                            </span>
                                            <span className="text-xs uppercase tracking-widest text-stone-500 font-bold mt-4">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </ScrollReveal>
                        </div>
                    ) : (
                        <div className="mb-16 animate-fadeIn">
                            <ScrollReveal>
                                <h2 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">
                                    Online Webshop
                                </h2>
                                <p className="text-xl md:text-2xl text-stone-600 mb-2 font-light">
                                    <span className="text-stone-900 font-medium">Drop Rendszerben</span> működünk.
                                </p>
                            </ScrollReveal>
                            <ScrollReveal delay={200}>
                                <p className="text-lg text-stone-500 max-w-2xl mx-auto">
                                    Jelenleg nincs aktív online drop, de üzletünk nyitva tart! <br />
                                    Iratkozz fel, és értesítünk a következő online nyitásról.
                                </p>
                            </ScrollReveal>
                        </div>
                    )}

                    {/* Subscription Form */}
                    <ScrollReveal delay={300}>
                        <div className="max-w-md mx-auto relative group mt-12">
                            <div className="absolute -inset-1 bg-gradient-to-r from-stone-300 to-stone-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                            <div className="relative bg-white p-8 rounded-2xl border border-stone-100 shadow-xl text-left">
                                <h3 className="text-xl font-bold mb-2 text-stone-900">Értesítést kérek</h3>
                                <p className="text-stone-500 mb-6 text-sm">
                                    Ne maradj le a limitált darabokról. Csak akkor írunk, ha drop van.
                                </p>
                                <form onSubmit={handleSubscription} className="flex flex-col gap-3">
                                    <input
                                        type="email"
                                        placeholder="email@cim.hu"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={formLoading}
                                        className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white transition-all w-full"
                                    />
                                    <button
                                        type="submit"
                                        disabled={formLoading}
                                        className="bg-stone-900 hover:bg-black text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full shadow-lg"
                                    >
                                        {formLoading ? 'Feliratkozás...' : 'Feliratkozás'}
                                    </button>
                                </form>
                                {formMessage && <p className="text-green-600 mt-4 text-sm font-medium">{formMessage}</p>}
                                {formError && <p className="text-red-500 mt-4 text-sm font-medium">{formError}</p>}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </div>
    );
}
