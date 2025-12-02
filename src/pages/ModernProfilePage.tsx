import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import AvatarUpload from '@/components/profile/AvatarUpload';
import AddressCard from '@/components/profile/AddressCard';
import AddressForm from '@/components/profile/AddressForm';
import { Phone, Ticket, Copy, Edit2, X } from 'lucide-react';
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
  display_name?: string;
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
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id);

        if (error) {
          console.error('Error fetching profile:', error);
        }

        // 3. JAVÍTÁS: Automatikus kitöltés Google metaadatokból
        let profile = data && data.length > 0 ? data[0] : null;
        let shouldSave = false;

        if (!profile) {
          // Ha nincs profil, létrehozunk egy újat
          profile = { user_id: user.id };
          shouldSave = true;
        }

        const metadata = user.user_metadata;
        // Ha nincs név, és van a Google fiókban
        if (!profile.display_name && metadata.full_name) {
          profile.display_name = metadata.full_name;
          shouldSave = true;
        }
        // Ha nincs avatar, és van a Google fiókban
        if (!profile.avatar_url && (metadata.avatar_url || metadata.picture)) {
          profile.avatar_url = metadata.avatar_url || metadata.picture;
          shouldSave = true;
        }

        // Ha változott valami (vagy új a profil), elmentjük
        if (shouldSave) {
          console.log('Auto-filling profile from metadata:', profile);
          const { error: saveError } = await supabase
            .from('profiles')
            .upsert({
              ...profile,
              updated_at: new Date()
            }, { onConflict: 'user_id' });

          if (saveError) console.error('Error auto-saving profile:', saveError);
        }

        setProfileData({
          ...profile,
          shipping_address: profile.shipping_address || {},
          billing_address: profile.billing_address || {},
        });

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
        display_name: profileData.display_name,
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
      <div className="relative pt-24 md:pt-32 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">{/* ...fejléc... */}</div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <GlassCard variant="elevated" className="p-6 md:p-8 sticky top-24">
                {isEditingProfile ? (
                  <div className='space-y-6 animate-fadeIn'>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className='text-xl font-bold text-white'>Profil szerkesztése</h3>
                      <ModernButton onClick={() => setIsEditingProfile(false)} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <X size={20} />
                      </ModernButton>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Teljes név</label>
                        <input
                          type="text"
                          name="display_name"
                          value={profileData?.display_name || ''}
                          onChange={handleProfileChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="Pl. Kiss János"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Telefonszám</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profileData?.phone || ''}
                          onChange={handleProfileChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                          placeholder="+36 30 123 4567"
                        />
                      </div>
                    </div>

                    <div className='flex gap-3 pt-2'>
                      <ModernButton onClick={() => setIsEditingProfile(false)} variant="secondary" className='flex-1'>Mégse</ModernButton>
                      <ModernButton onClick={handleUpdateMainProfile} className='flex-1 bg-blue-600 hover:bg-blue-500'>Mentés</ModernButton>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center animate-fadeIn">
                    <div className="relative mb-6 group">
                      <AvatarUpload avatarUrl={profileData?.avatar_url} onUpload={handleAvatarUpload} uploading={uploading} size="xl" />
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer shadow-lg group-hover:scale-110 transition-transform" title="Kép módosítása">
                        <label htmlFor="single" className="cursor-pointer">
                          <Edit2 size={16} className="text-white" />
                        </label>
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-1">{profileData?.display_name || 'Névtelen Felhasználó'}</h2>
                    <p className="text-gray-400 text-sm mb-6">{user?.email}</p>

                    <div className="w-full space-y-4">
                      <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3 border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Phone size={20} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Telefonszám</p>
                          <p className="text-white font-medium">{profileData?.phone || 'Nincs megadva'}</p>
                        </div>
                      </div>
                    </div>

                    <ModernButton
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-8 flex items-center justify-center gap-2"
                      variant="secondary"
                    >
                      <Edit2 size={16} />
                      Profil szerkesztése
                    </ModernButton>
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="lg:col-span-8 space-y-8">
              {/* Coupons Section */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Ticket className="text-blue-400" size={24} />
                  <h3 className="text-xl font-bold text-white">Kuponjaim</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { code: 'ITHRIFTED20', discount: '20%', desc: 'Nyitási akció' },
                    { code: 'SAVE10', discount: '10%', desc: 'Hűségkedvezmény' }
                  ].map((coupon, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">{coupon.desc}</p>
                        <p className="text-xl font-mono font-bold text-white tracking-wider">{coupon.code}</p>
                        <p className="text-green-400 text-sm font-medium">{coupon.discount} kedvezmény</p>
                      </div>
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(coupon.code);
                          alert('Kuponkód másolva!');
                        }}
                        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={16} />
                      </ModernButton>
                    </div>
                  ))}
                </div>
              </GlassCard>

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
