import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext'; // Kosár kontextus
import { useAuth } from '../../contexts/AuthContext'; // Autentikációs kontextus
import { getProfile, placeOrder } from '../../lib/api'; // API hívások
import { Button } from '../../components/ui/button';
import { Loader2, ShoppingCart, MapPin, UserCheck } from 'lucide-react'; // Ikonok

// A Packeta widget a public/index.html-ben van betöltve,
// feltételezzük, hogy a Packeta globálisan elérhető (pl. window.Packeta)

const CheckoutPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth(); // Bejelentkezett felhasználó
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fullName, setFullName] = useState(''); // Felhasználó teljes neve
  const [email, setEmail] = useState(''); // Felhasználó email címe
  const [selectedPickupPoint, setSelectedPickupPoint] = useState(null); // Packeta pont

  // Packeta API kulcs lekérése környezeti változóból
  const packetaApiKey = import.meta.env.VITE_PACKETA_API_KEY;

  // Felhasználói adatok (email, teljes név) előtöltése és profil lekérése
  useEffect(() => {
    if (user) {
      setEmail(user.email || ''); // Email a bejelentkezett felhasználótól

      const fetchProfileData = async () => {
        const profileData = await getProfile(); // Lekérjük a profilt
        if (profileData && profileData.full_name) {
          setFullName(profileData.full_name); // Előtöltjük a teljes nevet a profilból
        }
      };
      fetchProfileData();
    }
  }, [user]);

  // Ha a kosár üres, irányítsuk át a felhasználót a kosár oldalra
  useEffect(() => {
    if (cartItems.length === 0 && !loading) {
      navigate('/cart');
    }
  }, [cartItems, loading, navigate]);


  // === Packeta Widget integráció ===
  const handleOpenPacketaWidget = () => {
    // Ellenőrizzük, hogy a Packeta widget globálisan elérhető-e
    if (window.Packeta && window.Packeta.Widget) {
      window.Packeta.Widget.pick(packetaApiKey, // A Packeta API kulcs
        (packetaPoint) => {
          // Callback függvény, ami lefut, ha a felhasználó kiválaszt egy pontot
          if (packetaPoint) {
            setSelectedPickupPoint(packetaPoint);
            setError(null); // Töröljük az esetleges hibát
          }
        },
        {
          // További opciók a Packeta widget-hez (opcionális)
          // pl. defaultCountry: 'hu', language: 'hu', etc.
          country: 'hu', // Magyarországra szűrés
          language: 'hu', // Magyar nyelv
        }
      );
    } else {
      setError('A Packeta térkép nem tölthető be. Kérjük, próbálja meg később!');
      console.error('Packeta.Widget is not available.');
    }
  };

  // === Rendelés leadása ===
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (cartItems.length === 0) {
      setError('A kosár üres. Kérjük, adjon hozzá termékeket a rendelés leadásához.');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('Kérjük, jelentkezzen be a rendelés leadásához.'); // Feltételezzük, hogy bejelentkezés szükséges
      setLoading(false);
      return;
    }

    if (!fullName) {
      setError('Kérjük, adja meg teljes nevét.');
      setLoading(false);
      return;
    }

    if (!selectedPickupPoint) {
      setError('Kérjük, válasszon átvételi pontot a térképen!');
      setLoading(false);
      return;
    }

    try {
      // Összeállítjuk az 'items' tömböt a rendeléshez
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price_at_order: item.sale_price && item.sale_price > 0 ? parseFloat(item.sale_price) : parseFloat(item.price),
      }));

      const orderData = {
        user_id: user.id, // Bejelentkezett felhasználó ID-ja
        items: orderItems,
        pickup_point: selectedPickupPoint, // Packeta pont objektum JSONB-ként
        payment_status: 'pending', // Alapértelmezett: függőben
        order_status: 'new',       // Alapértelmezett: új rendelés
        total_amount: parseFloat(totalPrice.toFixed(2)), // Végösszeg 2 tizedesre kerekítve
      };

      const { data, error: placeOrderError } = await placeOrder(orderData);

      if (placeOrderError) {
        throw placeOrderError;
      }

      // Sikeres rendelés után
      clearCart(); // Kosár kiürítése
      alert('Rendelés sikeresen leadva!'); // Visszajelzés
      navigate(`/profile/orders`); // Átirányítás a felhasználó rendelései oldalra
                                   // Vagy egy rendelés visszaigazoló oldalra
    } catch (err) {
      setError(`Hiba a rendelés leadásakor: ${err.message || err.details || 'Ismeretlen hiba'}`);
      console.error('Rendelés leadási hiba:', err);
    } finally {
      setLoading(false);
    }
  };


  // Ha a kosár üres, még akkor is, ha valamiért nem irányított át
  if (cartItems.length === 0 && !loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center text-gray-600">
        <p className="text-xl font-semibold mb-4">A kosarad üres!</p>
        <p className="mb-6">Kérjük, adj hozzá termékeket, mielőtt továbblépnél a pénztárhoz.</p>
        <Link to="/" className="text-blue-600 hover:underline">Vissza a termékekhez</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Pénztár</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kosár összefoglaló */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md order-2 lg:order-1">
          <h2 className="text-2xl font-semibold mb-4">A rendelésed</h2>
          <div className="space-y-4 mb-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-b-0">
                <img src={(item.image_urls && item.image_urls[0]) || 'https://via.placeholder.com/80'} alt={item.name} className="h-20 w-20 object-cover rounded-md" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm">Mennyiség: {item.quantity}</p>
                  <p className="font-bold text-gray-800">
                    {item.sale_price && item.sale_price > 0 ? item.sale_price.toLocaleString('hu-HU') : item.price.toLocaleString('hu-HU')} Ft
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-4">
            <span className="text-xl font-bold">Összesen:</span>
            <span className="text-2xl font-bold text-blue-600">{totalPrice.toLocaleString('hu-HU')} Ft</span>
          </div>
        </div>

        {/* Rendelés adatok és leadás */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md order-1 lg:order-2">
          <h2 className="text-2xl font-semibold mb-4">Szállítási és fizetési adatok</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Felhasználó email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email cím</label>
              <input
                type="email"
                id="email"
                value={email}
                readOnly // Email nem szerkeszthető
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
              />
            </div>

            {/* Teljes név */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Teljes Név</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Packeta Átvételi Pont */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Átvételi pont</label>
              <Button type="button" onClick={handleOpenPacketaWidget} disabled={loading}>
                <MapPin className="mr-2 h-4 w-4" /> Válassz átvételi pontot
              </Button>
              {selectedPickupPoint && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="font-semibold">{selectedPickupPoint.name}</p>
                  <p className="text-sm text-gray-700">{selectedPickupPoint.address}, {selectedPickupPoint.city}</p>
                </div>
              )}
            </div>

            {/* Fizetési mód */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Fizetési mód</label>
              <p className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-800">Fizetés átvételkor</p>
            </div>

            {/* Rendelés leadása gomb */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
              {loading ? 'Rendelés leadása...' : 'Rendelés leadása'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;