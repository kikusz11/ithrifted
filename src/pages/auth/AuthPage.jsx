import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/'); // Ha már be van jelentkezve, irányítsd át a főoldalra
    }
  }, [session, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Bejelentkezés / Regisztráció</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          providers={[]} // A Google-t és egyéb szolgáltatókat ide lehet majd felvenni
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email cím',
                password_label: 'Jelszó',
                button_label: 'Bejelentkezés',
                link_text: 'Már van fiókod? Jelentkezz be',
              },
              sign_up: {
                email_label: 'Email cím',
                password_label: 'Jelszó',
                button_label: 'Regisztráció',
                link_text: 'Nincs még fiókod? Regisztrálj',
              },
              forgotten_password: {
                email_label: 'Email cím',
                button_label: 'Jelszó-visszaállítási link küldése',
                link_text: 'Elfelejtetted a jelszavad?',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default AuthPage;