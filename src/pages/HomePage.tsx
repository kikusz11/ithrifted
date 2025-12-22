import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import HeroStrip from '../components/HeroStrip';

// Az interfész a Drop objektum típusát definiálja
interface Drop {
  id: string;
  name: string;
  description: string;
  start_time: string;
}


export default function HomePage() {
  // Állapotok a komponens működéséhez
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [nextDrop, setNextDrop] = useState<Drop | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropActive, setIsDropActive] = useState(false);

  // Állapotok a feliratkozási űrlaphoz
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');


  // Effektus a következő drop adatainak lekérésére
  useEffect(() => {
    async function fetchNextDrop() {
      setLoading(true);
      const now = new Date().toISOString();

      // Először keressünk aktív dropot
      const { data: activeDrop, error: activeError } = await supabase
        .from('drops')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: true })
        .limit(1)
        .single();

      if (activeDrop) {
        setNextDrop(activeDrop);
        setIsDropActive(true);
      } else if (activeError && activeError.code !== 'PGRST116') { // PGRST116: 'exact one row' hiba, ami itt nem hiba, ha nincs találat
        console.error("Hiba az aktív drop lekérésekor:", activeError);
      } else {
        // Ha nincs aktív drop, keressük a legközelebbi jövőbelit a visszaszámlálóhoz
        setIsDropActive(false);
        const { data: futureDrop, error: futureError } = await supabase
          .from('drops')
          .select('*')
          .eq('is_active', true)
          .gt('start_time', now)
          .order('start_time', { ascending: true })
          .limit(1)
          .single();

        if (futureDrop) {
          setNextDrop(futureDrop);
        } else if (futureError && futureError.code !== 'PGRST116') {
          console.error("Hiba a jövőbeli drop lekérésekor:", futureError);
        }
      }
      setLoading(false);
    }
    fetchNextDrop();
  }, []);

  // Effektus a visszaszámláló működtetésére
  useEffect(() => {
    if (!nextDrop || isDropActive) return; // Ne indítsunk visszaszámlálót, ha a drop már aktív vagy nincs

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
        setIsDropActive(true); // Amikor lejár az idő, a drop aktívvá válik
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval); // Tisztítás: a komponens elhagyásakor leállítja az interval-t
  }, [nextDrop, isDropActive]);

  // E-mail feliratkozás kezelése
  const handleSubscription = async (event: FormEvent) => {
    event.preventDefault();
    setFormLoading(true);
    setFormMessage('');
    setFormError('');

    try {
      const { error } = await supabase
        .from('subscriptions') // Tegyük fel, hogy a tábla neve 'subscriptions'
        .insert({ email: email, created_at: new Date() });

      if (error) {
        // Ha az email már létezik, azt is hibaként kezeljük
        if (error.code === '23505') { // PostgreSQL unique violation error code
          throw new Error('Ezzel az e-mail címmel már feliratkoztak.');
        }
        throw error;
      }

      setFormMessage('Sikeres feliratkozás! Köszönjük!');
      setEmail(''); // Ürítjük az input mezőt siker esetén
    } catch (error: any) {
      setFormError(error.message || 'Hiba történt a feliratkozás során. Próbáld újra!');
    } finally {
      setFormLoading(false);
    }
  };


  // Segédfüggvény az idő formázására (pl. 9 -> 09)
  const formatTime = (time: number) => time.toString().padStart(2, '0');

  // A "hero" szekció tartalmának renderelése állapot alapján
  const renderHeroContent = () => {
    if (loading) {
      return <div className="text-xl text-stone-300">Következő drop keresése...</div>;
    }
    if (isDropActive && nextDrop) {
      return (
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">{nextDrop.name}</h1>
          <p className="text-lg md:text-xl text-stone-300 max-w-3xl mx-auto mb-12">{nextDrop.description || 'Ez a drop most aktív!'}</p>
        </div>
      );
    }
    if (nextDrop && timeLeft) {
      return (
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">{nextDrop.name}</h1>
          <p className="text-lg md:text-xl text-stone-300 max-w-3xl mx-auto mb-12">{nextDrop.description || 'A következő drop hamarosan érkezik.'}</p>
          <div className="flex justify-center items-center gap-4 md:gap-8 mb-12">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="text-center bg-white/10 p-4 rounded-lg min-w-[80px] md:min-w-[100px]">
                <div className="text-4xl md:text-5xl font-bold">{formatTime(value)}</div>
                <div className="text-xs md:text-sm text-stone-400 uppercase">{unit.charAt(0).toUpperCase() + unit.slice(1)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">Maradj Figyelemmel!</h1>
        <p className="text-lg md:text-xl text-stone-300 max-w-3xl mx-auto">Jelenleg nincs aktív vagy bejelentett drop.</p>
      </div>
    );
  };

  // A komponens JSX-e
  return (
    <div className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 min-h-screen">
      <section className="relative text-center py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400 dark:from-stone-800 dark:via-stone-700 dark:to-neutral-800 opacity-90"></div>
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-stone-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-neutral-700 rounded-full filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
        <div className="relative z-10">
          {renderHeroContent()}

          {/* HeroStrip komponens beillesztése */}
          <div className="mt-8">
            <HeroStrip />
          </div>
        </div>
      </section>

      <section className="bg-stone-100 dark:bg-stone-800 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-stone-900 dark:text-stone-100">Ne maradj le semmiről!</h2>
          <p className="text-stone-600 dark:text-stone-400 mb-8">
            Kérj értesítést a következő drop eseményről, és legyél az elsők között.
          </p>
          <form onSubmit={handleSubscription} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="email@cim.hu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={formLoading}
              className="flex-grow bg-stone-200 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg px-4 py-3 text-stone-900 dark:text-stone-100 placeholder-stone-500 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 transition duration-300"
            />
            <button
              type="submit"
              disabled={formLoading}
              className="bg-stone-800 dark:bg-stone-100 hover:bg-stone-900 dark:hover:bg-white text-white dark:text-stone-900 font-semibold py-3 px-6 rounded-lg transition duration-300 disabled:bg-gray-500"
            >
              {formLoading ? 'Küldés...' : 'Értesítést Kérek'}
            </button>
          </form>
          {formMessage && <p className="text-green-500 dark:text-green-400 mt-4">{formMessage}</p>}
          {formError && <p className="text-red-500 dark:text-red-400 mt-4">{formError}</p>}
          <p className="text-xs text-stone-500 mt-4">
            Nem küldünk spamet. Bármikor leiratkozhatsz.
          </p>
        </div>
      </section>
    </div>
  );
}