import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { supabase } from '../lib/supabaseClient';
import LoginModal from './LoginModal';
import { useCart } from '../contexts/CartContext';
import logo from '../assets/logo.png';
import { Search } from 'lucide-react';

// Ikon a kosárhoz
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Search State
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const { user, profile, loading } = useAuth();
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileDropdownOpen(false);
    navigate('/');
    window.location.reload();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowResults(false);
    }
  };

  // Fetch products for live search
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url, description, category');

      if (data) {
        setAllProducts(data);
      }
    };
    fetchProducts();
  }, []);

  // Filter products on search query change
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const normalizeText = (text: string) => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    };

    const normalizedQuery = normalizeText(searchQuery);
    const filtered = allProducts.filter(product => {
      const normalizedName = normalizeText(product.name);
      const normalizedDescription = normalizeText(product.description || '');
      const normalizedCategory = normalizeText(product.category || '');

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedDescription.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    }).slice(0, 5); // Limit to 5 results

    setSearchResults(filtered);
    setShowResults(true);
  }, [searchQuery, allProducts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="iThrifted Logo"
              className="h-16 w-auto"
            />
            <span className="text-2xl font-bold text-white tracking-wider">
              i_Thrifted_
            </span>
          </Link>

          {/* Search Bar */}
          <form ref={searchRef} onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Keresés..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
              className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-4 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button type="submit" className="absolute right-3 text-gray-400 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Live Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                {searchResults.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={() => {
                      setShowResults(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
                  >
                    <img
                      src={product.image_url || 'https://placehold.co/40x40'}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.price.toLocaleString()} Ft</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={handleSearch}
                  className="w-full p-2 text-center text-xs font-medium text-indigo-400 hover:bg-gray-800 transition-colors"
                >
                  Összes találat megtekintése ({searchResults.length}+)
                </button>
              </div>
            )}
          </form>

          <div className="flex items-center gap-4">
            {!loading && (
              !user ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-transform duration-300 transform hover:scale-105"
                >
                  Bejelentkezés
                </button>
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
          </div>
        </div>
      </header>
      {!user && isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
    </>
  );
}