import { Copy, SquarePen } from 'lucide-react'; // A 'Copy' ikont is importáljuk
import GlassCard from '../ui/GlassCard';
import ModernButton from '../ui/ModernButton';

// --- JAVÍTVA 1. ---
// Hozzáadtuk a 'phone' mezőt az adatszerkezethez
interface Address {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string; // ÚJ MEZŐ
}

interface AddressCardProps {
  address?: Address;
  title: string;
  onEdit: () => void;
  onCopyAddress?: () => void;
}

export default function AddressCard({ title, address, onEdit, onCopyAddress }: AddressCardProps) {
  const hasAddress = address && (address.street || address.city || address.postal_code || address.country || address.phone);

  return (
    <GlassCard variant="elevated" className="p-6 group hover:bg-white/10 transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
            {title}
          </h3>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </div>
        
        {/* --- JAVÍTVA 2. --- */}
        {/* A gombokat egy közös konténerbe tettük a jobb elrendezésért */}
        <div className="flex items-center gap-2">
          {/* A másolás gomb csak akkor jelenik meg, ha megkapja az 'onCopyAddress' prop-ot */}
          {onCopyAddress && (
            <ModernButton
              onClick={onCopyAddress}
              variant="secondary"
              size="sm"
              className="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Copy size={1} className="mr-2" />
              Megegyezik a szállítási címmel
            </ModernButton>
          )}

          <ModernButton
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className="opacity-70 group-hover:opacity-100 transition-opacity duration-300"
          >
            <SquarePen size={1} className="mr-2" />
            Szerkesztés
          </ModernButton>
        </div>
      </div>
      
      {hasAddress ? (
        <div className="space-y-3"> {/* Növeltük a sortávolságot egy kicsit */}
          <div className="text-gray-200 space-y-1">
            <p className="text-lg font-medium">{address.street}</p>
            <p className="text-gray-300">{address.postal_code} {address.city}</p>
            <p className="text-gray-400">{address.country}</p>
            
            {/* --- JAVÍTVA 3. --- */}
            {/* Megjelenítjük a telefonszámot, ha van */}
            
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
            <SquarePen size={24} className="text-gray-400" />
          </div>
          
          <p className="text-gray-500 text-sm">Kattints a szerkesztés gombra a cím hozzáadásához</p>
        </div>
      )}
    </GlassCard>
  );
}