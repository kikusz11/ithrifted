import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

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
  const navigate = useNavigate();

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
  
  // Navigálás a shop oldalra, ha a drop aktív
  const handleGoToShop = () => {
    if (isDropActive) {
      navigate('/shop');
    }
  };

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
      return <div className="text-xl text-indigo-200">Következő drop keresése...</div>;
    }
    if (isDropActive && nextDrop) {
        return (
            <div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">{nextDrop.name}</h1>
                <p className="text-lg md:text-xl text-indigo-200 max-w-3xl mx-auto mb-12">{nextDrop.description || 'Ez a drop most aktív!'}</p>
            </div>
        );
    }
    if (nextDrop && timeLeft) {
      return (
        <div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">{nextDrop.name}</h1>
          <p className="text-lg md:text-xl text-indigo-200 max-w-3xl mx-auto mb-12">{nextDrop.description || 'A következő drop hamarosan érkezik.'}</p>
          <div className="flex justify-center items-center gap-4 md:gap-8 mb-12">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="text-center bg-white/10 p-4 rounded-lg min-w-[80px] md:min-w-[100px]">
                <div className="text-4xl md:text-5xl font-bold">{formatTime(value)}</div>
                <div className="text-xs md:text-sm text-indigo-300 uppercase">{unit.charAt(0).toUpperCase() + unit.slice(1)}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4">Maradj Figyelemmel!</h1>
        <p className="text-lg md:text-xl text-indigo-200 max-w-3xl mx-auto">Jelenleg nincs aktív vagy bejelentett drop.</p>
      </div>
    );
  };

  // A komponens JSX-e
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <section className="relative text-center py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 opacity-60"></div>
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-600 rounded-full filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        <div className="relative z-10">
          {renderHeroContent()}
          <button 
            onClick={handleGoToShop} 
            disabled={!isDropActive}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Legújabb Dropok
          </button>
        </div>
      </section>
      
      <section className="bg-gray-800 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Ne maradj le semmiről!</h2>
          <p className="text-gray-400 mb-8">
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
              className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
            />
            <button
              type="submit"
              disabled={formLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 disabled:bg-gray-500"
            >
              {formLoading ? 'Küldés...' : 'Értesítést Kérek'}
            </button>
          </form>
          {formMessage && <p className="text-green-400 mt-4">{formMessage}</p>}
          {formError && <p className="text-red-400 mt-4">{formError}</p>}
          <p className="text-xs text-gray-500 mt-4">
            Nem küldünk spamet. Bármikor leiratkozhatsz.
          </p>
        </div>
      </section>
    </div>
  );
}
