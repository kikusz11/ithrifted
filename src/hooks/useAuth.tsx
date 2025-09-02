import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Típusdefiníciók
export interface Profile {
  id: string;
  is_admin?: boolean;
  // Itt adhatsz meg további profil mezőket, pl. username, avatar_url
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Figyeljük a bejelentkezési állapot változásait
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // --- A JAVÍTÁS LÉNYEGE ---
        // Nincs többé külön adatbázis-lekérdezés a profilhoz!
        // A profilt közvetlenül a bejelentkezett felhasználó meta-adataiból építjük fel.
        if (currentUser) {
          const userProfile: Profile = {
            id: currentUser.id,
            is_admin: currentUser.user_metadata?.role === 'admin',
            // Itt további adatokat is hozzáadhatsz a meta-adatokból, ha szükséges
            // pl. fullName: currentUser.user_metadata?.full_name
          };
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = { user, profile, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
