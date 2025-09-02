// src/pages/CheckoutPage.jsx
// Ezen az oldalon adja meg a felhasználó az adatait és véglegesíti a rendelést.

import { useState, useEffect } from 'react';
// JAVÍTVA: Az import útvonalak a projekt struktúrájához igazítva
import { supabase } from '../lib/supabaseClient'; 
import { useCart } from '../contexts/CartContext'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; 

// Ikonok az űrlaphoz
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth(); // A bejelentkezett felhasználó adatai
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Ha a kosár üres, irányítsuk át a felhasználót a főoldalra
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/');
    }
  }, [cart, navigate]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!customerName || !customerEmail || !customerPhone) {
      setError('Kérjük, tölts ki minden adatot!');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          total_price: cartTotal,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      alert('Sikeres rendelés!');
      clearCart();
      navigate('/koszonjuk'); // Ide érdemes egy külön "Köszönjük a rendelést" oldalt létrehozni

    } catch (err) {
      console.error('Hiba a rendelés leadásakor:', err);
      setError('Hiba történt a rendelés feldolgozása közben.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Visszairányítás...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Pénztár</h1>
        <p className="text-slate-400 mt-2">Add meg az adataidat a rendelés véglegesítéséhez</p>
      </div>
      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Bal oldal: Személyes adatok */}
        <div className="lg:col-span-3 bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6">Számlázási és szállítási adatok</h2>
          <div className="space-y-5">
            <div className="relative">
              <UserIcon />
              <input type="text" placeholder="Teljes név" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full bg-slate-900/50 border border-slate-700 rounded-lg shadow-sm py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="relative">
              <MailIcon />
              <input type="email" placeholder="E-mail cím" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} required className="w-full bg-slate-900/50 border border-slate-700 rounded-lg shadow-sm py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="relative">
              <PhoneIcon />
              <input type="tel" placeholder="Telefonszám" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required className="w-full bg-slate-900/50 border border-slate-700 rounded-lg shadow-sm py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
          </div>
        </div>

        {/* Jobb oldal: Összesítés */}
        <div className="lg:col-span-2 bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 flex flex-col sticky top-24">
          <h2 className="text-2xl font-semibold mb-6 border-b border-white/20 pb-4">Rendelés összesítő</h2>
          <div className="flex-grow space-y-3 mb-6">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-300">{item.name} x {item.quantity}</span>
                <span className="font-medium">{(item.price * item.quantity).toLocaleString()} Ft</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-white/20 pt-4 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Részösszeg:</span>
              <span>{cartTotal.toLocaleString()} Ft</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Szállítás:</span>
              <span>Ingyenes</span>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Végösszeg:</span>
              <span>{cartTotal.toLocaleString()} Ft</span>
            </div>
          </div>
          
          {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center">
            {isSubmitting ? 'Feldolgozás...' : 'Megrendelés elküldése'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
