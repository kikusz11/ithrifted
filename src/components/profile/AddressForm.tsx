import React from 'react';
import { Save, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import ModernButton from '../ui/ModernButton';
import ModernInput from '../ui/ModernInput';

interface Address {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

interface AddressFormProps {
  address?: Address;
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>, addressType: string) => void;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  addressType: string;
}

export default function AddressForm({ 
  address, 
  title, 
  onChange, 
  onSave, 
  onCancel,
  addressType
}: AddressFormProps) {
  return (
    <GlassCard variant="elevated" className="p-6 border-blue-500/30">
      <form onSubmit={onSave} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
              {title}
            </h3>
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Utca, házszám
            </label>
            <ModernInput
              type="text"
              name="street"
              placeholder="Pl. Váci út 123"
              value={address?.street || ''}
              onChange={(e) => onChange(e, addressType)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Város
            </label>
            <ModernInput
              type="text"
              name="city"
              placeholder="Pl. Budapest"
              value={address?.city || ''}
              onChange={(e) => onChange(e, addressType)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Irányítószám
            </label>
            <ModernInput
              type="text"
              name="postal_code"
              placeholder="Pl. 1011"
              value={address?.postal_code || ''}
              onChange={(e) => onChange(e, addressType)}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ország
            </label>
            <ModernInput
              type="text"
              name="country"
              placeholder="Pl. Magyarország"
              value={address?.country || ''}
              onChange={(e) => onChange(e, addressType)}
            />
          </div>
        </div>
        
<div className="flex justify-end gap-1 pt-6 border-t border-white/10">
  <ModernButton
    type="button"
    onClick={onCancel}
    variant="secondary"
    // ÚJ: Osztályok a gomb tartalmának középre igazításához
    className="flex justify-center items-center transition-colors duration-200 hover:bg-red-600 hover:text-white hover:border-red-600"
  >
    {/* Levesszük a felesleges 'mr-2' osztályt az ikonról */}
    <X size={30} />
  </ModernButton>
  
  <ModernButton
    type="submit"
    variant="primary"
    // ÚJ: Osztályok a gomb tartalmának középre igazításához
    className="flex justify-center items-center transition-colors duration-200 hover:bg-indigo-600 hover:text-white hover:border-emerald-600"
  >
    {/* Levesszük a felesleges 'mr-2' osztályt az ikonról */}
    <Save size={30} />
  </ModernButton>
</div>
      </form>
    </GlassCard>
  );
}