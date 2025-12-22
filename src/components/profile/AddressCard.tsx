import { Copy, SquarePen } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import ModernButton from '../ui/ModernButton';

interface Address {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
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
    <GlassCard variant="elevated" className="p-6 group hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          {/* Changed from gradient text to solid dark text for valid contrast on white card */}
          <h3 className="text-2xl font-bold text-stone-900 mb-2">
            {title}
          </h3>
          <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        </div>

        <div className="flex items-center gap-2">
          {onCopyAddress && (
            <ModernButton
              onClick={onCopyAddress}
              variant="secondary"
              size="sm"
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 bg-stone-100 text-stone-700 hover:bg-stone-200"
            >
              <Copy size={16} className="mr-2" />
              Megegyezik a szállítási címmel
            </ModernButton>
          )}

          <ModernButton
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className="opacity-100 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all"
          >
            <SquarePen size={16} className="mr-2" />
            Szerkesztés
          </ModernButton>
        </div>
      </div>

      {hasAddress ? (
        <div className="space-y-3">
          <div className="text-stone-600 space-y-1">
            <p className="text-lg font-bold text-stone-800">{address.street}</p>
            <p className="text-stone-600 font-medium">{address.postal_code} {address.city}</p>
            <p className="text-stone-500">{address.country}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center border border-stone-200">
            <SquarePen size={24} className="text-stone-400" />
          </div>

          <p className="text-stone-500 text-sm">Kattints a szerkesztés gombra a cím hozzáadásához</p>
        </div>
      )}
    </GlassCard>
  );
}