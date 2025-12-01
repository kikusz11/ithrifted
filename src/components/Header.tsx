import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { supabase } from '../lib/supabaseClient';
import LoginModal from './LoginModal';
import { useCart } from '../contexts/CartContext';
import logo from '../assets/logo.png';
import { Search } from 'lucide-react';

onClick = {() => setIsLoginOpen(true)}
className = "bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-transform duration-300 transform hover:scale-105"
  >
  Bejelentkezés
                </button >
              ) : (
  <>
    {/* --- KOSÁR IKON ÉS LENYÍLÓ MENÜ --- */}
    <div className="relative" ref={cartDropdownRef}>
      <button onClick={() => setIsCartOpen(!isCartOpen)} className="relative text-white/80 hover:text-white transition-colors">
        <CartIcon />
        {totalItemsInCart > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {totalItemsInCart}
          </span>
        )}
      </button>
      {isCartOpen && (
        <div className="absolute right-0 mt-2 w-72 md:w-80 bg-black/98 rounded-lg shadow-lg z-50 border border-white/20 text-white">
          <div className="p-4">
            <h3 className="font-bold text-lg mb-3">Kosár tartalma</h3>
            {cart.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <img src={item.image || 'https://placehold.co/64x64/1f2937/9ca3af?text=Kép'} alt={item.name} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-200">{item.name}</p>
                      <p className="text-gray-400">{item.quantity} x {item.price.toLocaleString()} Ft</p>
                    </div>
                    <p className="font-semibold text-gray-200">{(item.quantity * item.price).toLocaleString()} Ft</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 py-8">A kosarad üres.</p>
            )}
          </div>
          <div className="border-t border-white/20 p-4">
            {cart.length > 0 && (
              <div className="flex justify-between font-bold text-lg mb-4 text-white">
                <span>Végösszeg:</span>
                <span>{cartTotal.toLocaleString()} Ft</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Link to="/cart" onClick={() => setIsCartOpen(false)} className="w-full text-center block px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700/50 hover:bg-gray-600/50 rounded-md transition">Tovább a kosárhoz</Link>
              <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="w-full text-center block px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition">Tovább a pénztárhoz</Link>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* --- PROFIL IKON ÉS LENYÍLÓ MENÜ --- */}
    <div className="relative" ref={profileDropdownRef}>
      <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center border-2 border-transparent hover:border-indigo-500 transition">
        <ProfileIcon />
      </button>
      {isProfileDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black/50 backdrop-blur-xl rounded-md shadow-lg py-1 z-50 border border-white/20">
          <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">{user.email}</div>
          <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-indigo-600 transition">Profilom</Link>
          <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-indigo-600 transition">Rendeléseim</Link>

          {profile?.is_admin && (
            <>
              <div className="border-t border-gray-700 my-1"></div>
              <Link to="/admin" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm font-bold text-indigo-400 hover:bg-indigo-600 hover:text-white transition">Admin Felület</Link>
            </>
          )}

          <div className="border-t border-gray-700 my-1"></div>
          <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white transition">Kijelentkezés</button>
        </div>
      )}
    </div>
  </>
)
            )}
          </div >
        </div >
      </header >
  {!user && isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}