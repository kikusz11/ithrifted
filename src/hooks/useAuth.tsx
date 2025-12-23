import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

// Típusdefiníciók
export interface Profile {
  id: string;
  is_admin?: boolean;
  role?: string;
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
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            // Create a promise for the profile fetch
            const profilePromise = supabase
              .from('profiles')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();

            // Create a timeout promise (3 seconds)
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            );

            // Race them
            const { data: profileData, error } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]) as any;

            if (error) {
              console.error('Error fetching profile:', error);
              // Fail-safe: Keep existing profile if valid, otherwise fail to non-admin
              setProfile(prev => (prev && prev.id === currentUser.id ? prev : { id: currentUser.id, is_admin: false }));
            } else if (profileData) {
              setProfile({
                id: currentUser.id,
                is_admin: profileData.role === 'admin',
                ...profileData
              });
            }
          } catch (err) {
            console.warn('Profile check failed or timed out:', err);
            // Fail-safe: Keep existing profile if valid, otherwise fail to non-admin
            setProfile(prev => (prev && prev.id === currentUser.id ? prev : { id: currentUser.id, is_admin: false }));
          }
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
