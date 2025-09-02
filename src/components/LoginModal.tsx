import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  // ÚJ: Állapot a "Regisztráció" mód követésére
  const [isSignUp, setIsSignUp] = useState(false); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null); // ÚJ: Üzenetek (pl. "Erősítsd meg az emailed!")
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Itt már csak a bejelentkezést figyeljük, a regisztráció utáni teendőt külön kezeljük.
      if (event === 'SIGNED_IN') {
        onClose();
        window.location.reload();
      }
    });
    return () => subscription.unsubscribe();
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    if (isSignUp) {
      // Regisztrációs logika
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.user && data.user.identities?.length === 0) {
        setError("This user already exists.");
      } else {
        setMessage("Registration successful! Please check your email to confirm your account.");
      }

    } else {
      // Bejelentkezési logika
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" onClick={onClose}>
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ÚJ: A cím a módtól függően változik */}
        <h1 className="text-3xl font-bold text-center mb-4 text-white">
          {isSignUp ? 'Regisztráció' : 'Bejelentkezés'}
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email cím</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Jelszó</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          
          {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
          {message && <p className="text-green-400 text-center text-sm mb-4">{message}</p>}

          {/* ÚJ: A gomb szövege a módtól függ */}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition disabled:bg-gray-500">
            {loading ? 'Folyamatban...' : (isSignUp ? 'Regisztráció' : 'Bejelentkezés')}
          </button>
        </form>

        {/* ÚJ: Módváltó szöveg */}
        <div className="text-center mt-4">
            <p className="text-sm text-gray-400">
                {isSignUp ? 'Már van fiókod?' : 'Nincs még fiókod?'}
                <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }} className="font-medium text-indigo-400 hover:text-indigo-300 ml-1">
                    {isSignUp ? 'Jelentkezz be' : 'Regisztrálj'}
                </button>
            </p>
        </div>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400">vagy</span>
            <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <button onClick={handleGoogleLogin} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.591 44 30.134 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
          Bejelentkezés Google-lel
        </button>
      </div>
    </div>
  );
}