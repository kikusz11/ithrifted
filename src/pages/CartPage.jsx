// src/pages/CartPage.jsx
// Ez a komponens felel a kosár tartalmának megjelenítéséért és kezeléséért.

import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';

// Ikonok a kezelőgombokhoz
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const MinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

const CartPage = () => {
  const { cart, cartTotal, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
      {cart.length === 0 ? (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">A kosarad üres</h2>
          <p className="text-slate-400">Nézz körül termékeink között és tegyél valamit a kosárba a folytatáshoz!</p>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold">Bevásárlókosár</h1>
            <p className="text-slate-400 mt-2">{cart.length} tétel a kosaradban</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 md:p-8">
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-700 pb-6 last:border-b-0 last:pb-0">
                    <img 
                      src={item.image || 'https://placehold.co/100x120/1e293b/94a3b8?text=Termék'} 
                      alt={item.name} 
                      className="w-24 h-30 object-cover rounded-lg"
                    />
                    <div className="flex-grow text-center sm:text-left">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-slate-400 text-sm">{item.price.toLocaleString()} Ft / db</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-600 rounded-lg">
                        <button onClick={() => decreaseQuantity(item.id)} className="p-2 hover:bg-slate-700 rounded-l-lg transition-colors"><MinusIcon /></button>
                        <span className="px-4 font-semibold">{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)} className="p-2 hover:bg-slate-700 rounded-r-lg transition-colors"><PlusIcon /></button>
                      </div>
                      <p className="font-bold w-24 text-center">{(item.price * item.quantity).toLocaleString()} Ft</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 md:p-8 flex flex-col sticky top-24">
              <h2 className="text-2xl font-semibold mb-6 border-b border-slate-700 pb-4">Összesítés</h2>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between text-slate-300">
                  <span>Részösszeg:</span>
                  <span>{cartTotal.toLocaleString()} Ft</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Szállítás:</span>
                  <span>Ingyenes</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-slate-700 pt-4 mt-4">
                  <span>Végösszeg:</span>
                  <span>{cartTotal.toLocaleString()} Ft</span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/checkout')} 
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
              >
                Tovább a pénztárhoz
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
