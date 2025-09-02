import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { User, Edit3, Save } from 'lucide-react';
import React from 'react';

// --- Helper Components ---

const DefaultAvatar = () => (
  <div className="w-32 h-32 bg-black/20 rounded-full flex items-center justify-center border-4 border-white/10">
    <User className="w-16 h-16 text-gray-400" />
  </div>
);

const AddressDisplay = ({ address, type, onEdit }: { address: any, type: string, onEdit: () => void }) => (
  <div className="bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-white">{type}</h3>
      <button onClick={onEdit} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 text-sm font-semibold">
        <Edit3 size={16} /> Szerkesztés
      </button>
    </div>
    {address && address.street ? (
      <div className="text-gray-300 space-y-1">
        <p>{address.street}</p>
        <p>{address.postal_code} {address.city}</p>
        <p>{address.country}</p>
      </div>
    ) : (
      <p className="text-gray-500">Nincs megadva cím.</p>
    )}
  </div>
);

const AddressForm = ({ address, type, onChange, onSave, onCancel }: { address: any, type: string, onChange: any, onSave: any, onCancel: () => void }) => (
  <form onSubmit={onSave} className="bg-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/10 space-y-4">
    <h3 className="text-xl font-bold text-white">{type}</h3>
    <input type="text" name="street" placeholder="Utca, házszám" value={address?.street || ''} onChange={(e) => onChange(e, type.startsWith('Szállítási') ? 'shipping_address' : 'billing_address')} className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    <input type="text" name="city" placeholder="Város" value={address?.city || ''} onChange={(e) => onChange(e, type.startsWith('Szállítási') ? 'shipping_address' : 'billing_address')} className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    <input type="text" name="postal_code" placeholder="Irányítószám" value={address?.postal_code || ''} onChange={(e) => onChange(e, type.startsWith('Szállítási') ? 'shipping_address' : 'billing_address')} className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    <input type="text" name="country" placeholder="Ország" value={address?.country || ''} onChange={(e) => onChange(e, type.startsWith('Szállítási') ? 'shipping_address' : 'billing_address')} className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    <div className="flex justify-end gap-4 pt-2">
      <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md">Mégse</button>
      <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2"><Save size={16} /> Mentés</button>
    </div>
  </form>
);

// --- Main Profile Page Component ---

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfileData({
          ...data,
          shipping_address: data.shipping_address || {},
          billing_address: data.billing_address || {},
        });
      }
      setLoading(false);
    }
    getProfile();
  }, [user]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, addressType: 'shipping_address' | 'billing_address') => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [addressType]: { ...prev[addressType], [name]: value },
    }));
  };

  const handleUpdateProfile = async (addressTypeToUpdate: 'shipping_address' | 'billing_address') => {
    if (!user || !profileData) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ [addressTypeToUpdate]: profileData[addressTypeToUpdate] })
      .eq('id', user.id);
      
    if (error) {
      alert('Error updating profile: ' + error.message);
    } else {
      if (addressTypeToUpdate === 'shipping_address') setIsEditingShipping(false);
      if (addressTypeToUpdate === 'billing_address') setIsEditingBilling(false);
    }
    setLoading(false);
  };
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) return;
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}.${fileExt}`;
    const filePath = `${fileName}`;
    
    setUploading(true);
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
      
    if (uploadError) {
      alert('Error uploading avatar: ' + uploadError.message);
      setUploading(false);
      return;
    }
    
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicURL = data.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: `${publicURL}?t=${new Date().getTime()}` })
      .eq('id', user.id);

    if (updateError) {
      alert('Error updating avatar URL: ' + updateError.message);
    } else {
      setProfileData(prev => ({ ...prev, avatar_url: `${publicURL}?t=${new Date().getTime()}` }));
    }
    setUploading(false);
  };

  if (loading && !profileData) {
    return <div className="bg-gray-900 min-h-screen pt-32 p-8 text-center text-white">Profil betöltése...</div>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="pt-32 pb-12 px-4 md:px-8">
        {/* EZ A FŐ GRID KONTÉNER */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Bal Oszlop: Profil Kártya (1/3 szélesség) */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-md p-6 rounded-2xl text-center border border-white/10">
              <div className="relative w-32 h-32 mx-auto mb-4">
                {profileData?.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Profile Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white/10" />
                ) : (
                  <DefaultAvatar />
                )}
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-500 transition">
                  <Edit3 size={16} className="text-white"/>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden"/>
                </label>
              </div>
              {uploading && <p className="text-sm text-indigo-400 mb-2">Feltöltés...</p>}
              <h2 className="text-2xl font-bold text-white">{profileData?.full_name || 'Your Name'}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          {/* Jobb Oszlop: Cím Kártyák (2/3 szélesség) */}
          <div className="lg:col-span-2 space-y-8">
            {isEditingShipping ? (
              <AddressForm address={profileData?.shipping_address} type="Szállítási Cím" onChange={handleAddressChange} onSave={(e) => { e.preventDefault(); handleUpdateProfile('shipping_address'); }} onCancel={() => setIsEditingShipping(false)} />
            ) : (
              <AddressDisplay address={profileData?.shipping_address} type="Szállítási Cím" onEdit={() => setIsEditingShipping(true)} />
            )}

            {isEditingBilling ? (
              <AddressForm address={profileData?.billing_address} type="Számlázási Cím" onChange={handleAddressChange} onSave={(e) => { e.preventDefault(); handleUpdateProfile('billing_address'); }} onCancel={() => setIsEditingBilling(false)} />
            ) : (
              <AddressDisplay address={profileData?.billing_address} type="Számlázási Cím" onEdit={() => setIsEditingBilling(false)} />
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}