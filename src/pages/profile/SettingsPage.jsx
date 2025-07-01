import React, { useState, useEffect } from 'react';
import AddressForm from '../../components/AddressForm';
import MapSelector from '../../components/MapSelector';
import { getProfile, updateProfile } from '../../lib/api';
import { Button } from '../../components/ui/button';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Felhasználónév mező ELTÁVOLÍTVA
    first_name: '', // ÚJ: Keresztnév
    last_name: '',  // ÚJ: Vezetéknév
    shipping_address: { street: '', city: '', zip: '', country: 'Magyarország' },
    billing_address: { street: '', city: '', zip: '', country: 'Magyarország' },
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [editingAddressFor, setEditingAddressFor] = useState(null); // 'shipping' vagy 'billing'

  // Profil adatok lekérése és az űrlap feltöltése
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const profileData = await getProfile(); // getProfile() most már lekéri first_name és last_name-t is
      if (profileData) {
        setFormData({
          // username: profileData.username || '', // Felhasználónév ELTÁVOLÍTVA a betöltésből
          first_name: profileData.first_name || '', // ÚJ: first_name feltöltése
          last_name: profileData.last_name || '',   // ÚJ: last_name feltöltése
          shipping_address: profileData.shipping_address || { street: '', city: '', zip: '', country: 'Magyarország' },
          billing_address: profileData.billing_address || { street: '', city: '', zip: '', country: 'Magyarország' },
        });
        // Ellenőrizzük, hogy a számlázási cím megegyezik-e a szállításival JSON stringként
        if (JSON.stringify(profileData.shipping_address) === JSON.stringify(profileData.billing_address)) {
          setBillingSameAsShipping(true);
        } else {
          setBillingSameAsShipping(false);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Számlázási cím automatikus frissítése, ha megegyezik a szállítással
  useEffect(() => {
    if (billingSameAsShipping) {
      setFormData(prev => ({ ...prev, billing_address: prev.shipping_address }));
    }
  }, [billingSameAsShipping, formData.shipping_address]);

  // Input mezők változásának kezelése (first_name, last_name, username ha visszakerülne)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Cím módosításának kezelése a MapSelector visszatérésekor
  const handleSaveAddress = (type, newAddress) => {
    setFormData(prev => ({ ...prev, [type]: newAddress }));
    setEditingAddressFor(null); // Térkép bezárása mentés után
  };

  // Beállítások mentése a Supabase-be
  const handleSaveSettings = async () => {
    setLoading(true);
    const updates = {
      updated_at: new Date(),
      // username: formData.username, // Felhasználónév ELTÁVOLÍTVA a mentésből
      first_name: formData.first_name, // ÚJ: first_name elmentése
      last_name: formData.last_name,   // ÚJ: last_name elmentése
      shipping_address: formData.shipping_address,
      billing_address: billingSameAsShipping ? formData.shipping_address : formData.billing_address,
    };
    await updateProfile(updates);
    alert('Beállítások elmentve!');
    setLoading(false);
  };

  // === Renderelés ===

  // Ha a térképválasztó nyitva van
  if (editingAddressFor) {
    return (
      <MapSelector
        address={editingAddressFor === 'shipping' ? formData.shipping_address : formData.billing_address}
        onSelect={(newAddress) => handleSaveAddress(editingAddressFor, newAddress)}
        onClose={() => setEditingAddressFor(null)}
      />
    );
  }

  // Ha még töltődik
  if (loading && (!formData.first_name && !formData.last_name)) { // Ellenőrizzük az új mezőket
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Beállítások betöltése...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Beállítások</h1>

      {/* Alap adatok (Vezetéknév, Keresztnév) */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Alap adatok</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Vezetéknév</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">Keresztnév</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Szállítási cím */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Szállítási cím</h2>
        <AddressForm
          address={formData.shipping_address}
          onEditOnMap={() => setEditingAddressFor('shipping')}
          // Ha az AddressForm-ban van szöveges input, ide kell egy onChange prop
          // onChange={(newPartialAddress) => setFormData(prev => ({ ...prev, shipping_address: { ...prev.shipping_address, ...newPartialAddress } }))}
        />
      </div>

      {/* Számlázási cím */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Számlázási cím</h2>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="sameAsShipping"
            checked={billingSameAsShipping}
            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-900">
            A számlázási címem megegyezik a szállítási címmel.
          </label>
        </div>
        {!billingSameAsShipping && (
          <AddressForm
            address={formData.billing_address}
            onEditOnMap={() => setEditingAddressFor('billing')}
            // onChange={(newPartialAddress) => setFormData(prev => ({ ...prev, billing_address: { ...prev.billing_address, ...newPartialAddress } }))}
          />
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Mentés...' : 'Változások mentése'}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;