import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();

  // Amíg a bejelentkezési állapotot ellenőrizzük, egy üzenetet mutatunk
  if (loading) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Jogosultság ellenőrzése...</div>;
  }


  const isAdmin = profile?.is_admin || profile?.role === 'admin';

  // Ha a felhasználó nincs bejelentkezve VAGY nem admin, átirányítjuk a főoldalra.
  if (!user || !isAdmin) {
    console.warn('[ProtectedRoute] Hozzáférés megtagadva. Nincs bejelentkezve vagy nem admin.');
    return <Navigate to="/" replace />;
  }

  // Ha minden rendben, megjelenítjük a védett tartalmat (az admin oldalakat).
  return <>{children}</>;
};

