import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AddressCard from '@/components/profile/AddressCard';
import AddressForm from '@/components/profile/AddressForm';
import { Phone } from 'lucide-react';
import ModernButton from '@/components/ui/ModernButton';

// 1. JAVÍTÁS: A telefonszámot kivettük a címből, mert az a felhasználóhoz tartozik, nem egy helyhez.
interface Address {
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  // phone?: string; // Ezt a sort kivettük
}

// A telefonszám a fő profiladat része lett.
interface ProfileData {
  full_name?: string;
  avatar_url?: string;
  phone?: string; // A telefonszám itt van, egy helyen.
  shipping_address?: Address;
  billing_address?: Address;
}

export default function ModernProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingShipping, setIsEditingShipping] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);

  useEffect(() => {
    async function getProfile() {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      console.log('Fetching profile for user:', user.id);
      try {
        // JAVÍTÁS: Kivettük a .single()-t a hibakereséshez, és logolunk
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id);

        console.log('Fetch result:', { data, error });

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data && data.length > 0) {
          // Ha van találat, az elsőt használjuk
          const profile = data[0];
          setProfileData({
            ...profile,
            shipping_address: profile.shipping_address || {},
            billing_address: profile.billing_address || {},
          });
        } else {
          console.log('No profile found, initializing empty.');
          // Ha nincs profil adat (pl. új user), inicializáljuk üres objektummal
          setProfileData({
            shipping_address: {},
            billing_address: {},
          });
        }
      } catch (e) { console.error("Hiba a profil lekérésekor:", e); }
      finally { setLoading(false); }
    }
    getProfile();
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev!, [name]: value }));
  };

  const handleUpdateMainProfile = async () => {
    if (!user || !profileData) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        updated_at: new Date()
      }, { onConflict: 'user_id' }); // JAVÍTÁS: onConflict megadása

    if (error) { alert('Hiba a profil mentésekor: ' + error.message); }
    else { setIsEditingProfile(false); }
    setLoading(false);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>, addressType: 'shipping_address' | 'billing_address') => {
    const { name, value } = e.target;
    setProfileData(prev => {
      if (!prev) return { [addressType]: { [name]: value } };
      return {
        ...prev,
        [addressType]: { ...prev[addressType], [name]: value },
      };
    });
  };

  const handleUpdateAddress = async (addressTypeToUpdate: 'shipping_address' | 'billing_address') => {
    if (!user || !profileData) return;
    setLoading(true);
    console.log('Updating address:', addressTypeToUpdate, profileData[addressTypeToUpdate]);

    // Használjunk upsert-et, hogy ha nincs sor, akkor létrehozza
    const { error, data } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        [addressTypeToUpdate]: profileData[addressTypeToUpdate],
        updated_at: new Date()
      }, { onConflict: 'user_id' }) // JAVÍTÁS: onConflict megadása
      .select();

    console.log('Update result:', { data, error });

    if (error) { alert('Hiba a cím mentésekor: ' + error.message); }
    else {
      if (addressTypeToUpdate === 'shipping_address') setIsEditingShipping(false);
      if (addressTypeToUpdate === 'billing_address') setIsEditingBilling(false);
    }
    setLoading(false);
  };

  // 2. JAVÍTÁS: A cím másolása függvény most már ment is az adatbázisba.
  const handleCopyAddress = async () => {
    if (!user || !profileData?.shipping_address) return;

    const addressToCopy = { ...profileData.shipping_address };

    // 1. Frissítjük a képernyőt (azonnali visszajelzés)
    setProfileData(prev => ({ ...prev!, billing_address: addressToCopy }));

    // 2. Elküldjük a frissítést a Supabase-nek is
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        billing_address: addressToCopy,
        updated_at: new Date()
      }, { onConflict: 'user_id' }); // JAVÍTÁS: onConflict megadása

    if (error) {
      alert('Hiba a cím másolásakor: ' + error.message);
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
      .eq('user_id', user.id); // JAVÍTÁS: user_id alapján frissítünk
    if (updateError) {
      alert('Error updating avatar URL: ' + updateError.message);
    } else {
      setProfileData(prev => ({ ...prev!, avatar_url: `${publicURL}?t=${new Date().getTime()}` }));
    }
    setUploading(false);
  };

  if (loading && !profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300 font-medium">Profil betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">{/* ...dekoráció... */}</div>
      <div className="relative pt-32 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">{/* ...fejléc... */}</div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <GlassCard variant="elevated" className="p-8 text-center sticky top-8">
                {isEditingProfile ? (
                  <div className='space-y-4 text-left'>
                    <h3 className='text-xl font-bold'>Profil szerkesztése</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Teljes név</label>
                      <input type="text" name="full_name" value={profileData?.full_name || ''} onChange={handleProfileChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">Telefonszám</label>
                      <input type="tel" name="phone" value={profileData?.phone || ''} onChange={handleProfileChange} className="mt-1 w-full bg-white/5 border border-white/10 rounded-md py-2 px-3 text-white" />
                    </div>
                    <div className='flex gap-4 pt-4'>
                      <ModernButton onClick={() => setIsEditingProfile(false)} variant="secondary" className='w-full'>Mégse</ModernButton>
                      <ModernButton onClick={handleUpdateMainProfile} className='w-full'>Mentés</ModernButton>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-6 right-6">
                      <ModernButton onClick={() => setIsEditingProfile(true)} variant="ghost" size="sm" className="text-blue-400">Szerkesztés</ModernButton>
                    </div>
                    <AvatarUpload avatarUrl={profileData?.avatar_url} onUpload={handleAvatarUpload} uploading={uploading} size="xl" />
                    {uploading && (<p>Feltöltés...</p>)}
                    <div className="mt-6 space-y-2">
                      <h2 className="text-3xl font-bold ...">{profileData?.full_name || 'Your Name'}</h2>
                      <p className="text-gray-400 text-lg">{user?.email}</p>
                    </div>
                    <div className="text-left mt-6 border-t border-white/10 pt-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <Phone size={18} />
                        <span>{profileData?.phone || 'Nincs megadva telefonszám'}</span>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">{/* ...statisztikák... */}</div>
                  </>
                )}
              </GlassCard>
            </div>

            <div className="lg:col-span-8 space-y-8">
              {isEditingShipping ? (
                <AddressForm address={profileData?.shipping_address} title="Szállítási Cím" onChange={handleAddressChange} onSave={(e) => { e.preventDefault(); handleUpdateAddress('shipping_address'); }} onCancel={() => setIsEditingShipping(false)} addressType="shipping_address" />
              ) : (
                <AddressCard address={profileData?.shipping_address} title="Szállítási Cím" onEdit={() => setIsEditingShipping(true)} />
              )}
              {isEditingBilling ? (
                <AddressForm address={profileData?.billing_address} title="Számlázási Cím" onChange={handleAddressChange} onSave={(e) => { e.preventDefault(); handleUpdateAddress('billing_address'); }} onCancel={() => setIsEditingBilling(false)} addressType="billing_address" />
              ) : (
                <AddressCard address={profileData?.billing_address} title="Számlázási Cím" onEdit={() => setIsEditingBilling(true)} onCopyAddress={handleCopyAddress} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
