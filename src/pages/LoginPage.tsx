// src/pages/LoginPage.tsx
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Sikeres bejelentkezés után irányítsd át a főoldalra
        // A böngésző újratöltése után a useAuth hook már az új adatokat látja
        navigate('/');
        window.location.reload(); // Force a reload to update auth state everywhere
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Bejelentkezés</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // Opcionális: közösségi bejelentkezések
          theme="dark"
          redirectTo={window.location.origin}
        />
      </div>
    </div>
  );
}