import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { supabase } from '../lib/supabaseClient';
import LoginModal from './LoginModal';
import { useCart } from '../contexts/CartContext';
// ThemeToggle removed
import logo from '../assets/logo.png';
import { Search, Menu, X, ChevronDown, ChevronRight } from 'lucide-react';

// Ikon a kosárhoz
const CartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Filter States
  const [gender, setGender] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]); // Dynamic categories objects
  const [menuGroups, setMenuGroups] = useState<string[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Live Search State
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);

  const { user, profile, loading } = useAuth();
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  // Sync state with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setGender(params.get('gender') || '');
    setCategory(params.get('category') || '');
    // Always sync search query (clear it if not in URL)
    setSearchQuery(params.get('search') || '');
  }, [location.search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileDropdownOpen(false);
    navigate('/');
    window.location.reload();
  };

  const getGroupLabel = (key: string) => {
    const map: Record<string, string> = {
      'male': 'Férfi',
      'female': 'Női',
      'unisex': 'Unisex',
      'sales': 'Akciós',
      'new': 'Újdonságok',
      'bestsellers': 'Népszerű'
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, image_url, description, category');

      if (productsData) {
        setAllProducts(productsData);
      }

      // Fetch Categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesData) {
        setCategories(categoriesData);
        // Calculate dynamic groups
        const distinct = Array.from(new Set(categoriesData.map(c => c.assigned_gender).filter(g => g !== 'all')));
        const standard = ['male', 'female', 'unisex'];
        // Merge standard first, then others
        const others = distinct.filter(d => !standard.includes(d));
        setMenuGroups([...standard, ...others]);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Independent Search: Always Global (ignores selected category)
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setShowResults(false);
    // Note: State (gender, category) will be synced via useEffect on location change
  };

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
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }

      // Check both desktop and mobile search refs
      const isClickInsideDesktop = searchRef.current && searchRef.current.contains(event.target as Node);
      const isClickInsideMobile = mobileSearchRef.current && mobileSearchRef.current.contains(event.target as Node);

      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-stone-900/80 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="container mx-auto flex justify-between items-center p-4">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="iThrifted Logo"
              className="h-16 w-auto"
            />
            <span className="hidden md:block text-2xl font-bold text-white tracking-wider">
              ithrifted
            </span>
          </Link>

          {/* Search Bar with Integrated Category Dropdown */}
          <form ref={searchRef} onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-2xl mx-8 relative bg-white/10 border border-white/20 rounded-full focus-within:ring-1 focus-within:ring-stone-500 transition-all">

            {/* Combined Custom Filter Dropdown */}
            <div
              className="relative h-full"
              ref={categoryDropdownRef}
              onMouseEnter={() => setIsCategoryOpen(true)}
              onMouseLeave={() => setIsCategoryOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-2 h-full px-4 py-2.5 text-white hover:bg-white/5 transition-all text-sm border-r border-white/10 rounded-l-full shrink-0"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              >
                <span className="truncate font-medium">
                  {gender ? (category ? `${getGroupLabel(gender)} ${category}` : getGroupLabel(gender)) : 'Kategóriák'}
                </span>
                <ChevronDown size={14} className={`text-stone-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 pt-3 w-64 z-[100] animate-fadeIn">
                  <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-3xl ring-1 ring-black/5 py-2">
                    {menuGroups.map((g) => {
                      const groupCats = categories.filter(c =>
                        c.assigned_gender === g || (['male', 'female', 'unisex'].includes(g) && c.assigned_gender === 'all')
                      );

                      if (groupCats.length === 0) return null;

                      return (
                        <div
                          key={g}
                          className="group/item relative"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setGender(g);
                              setCategory('');
                              navigate(`/shop?gender=${g}`);
                              setIsCategoryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-5 py-3 text-sm text-left hover:bg-white/10 transition-colors ${gender === g ? 'text-white font-medium' : 'text-stone-300'}`}
                          >
                            <span className="flex-1">{getGroupLabel(g)}</span>
                            <ChevronRight size={14} className="text-stone-500" />
                          </button>

                          {/* Flyout Submenu */}
                          <div className="hidden group-hover/item:block absolute left-full top-0 w-56 ml-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl backdrop-blur-3xl overflow-hidden z-[100]">
                            <div className="py-2">
                              {/* Option to select just the group */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGender(g);
                                  setCategory('');
                                  navigate(`/shop?gender=${g}`);
                                  setIsCategoryOpen(false);
                                }}
                                className="w-full text-left px-5 py-2 text-sm font-medium text-white hover:bg-white/10 border-b border-white/5 mb-1"
                              >
                                Összes {getGroupLabel(g)}
                              </button>

                              {groupCats.map(cat => (
                                <button
                                  key={`${g}-${cat.id}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setGender(g);
                                    setCategory(cat.name);
                                    navigate(`/shop?gender=${g}&category=${cat.name}`);
                                    setIsCategoryOpen(false);
                                  }}
                                  className={`w-full text-left px-5 py-2 text-sm text-stone-400 hover:text-white hover:bg-white/10 transition-colors ${gender === g && category === cat.name ? 'text-white bg-white/10' : ''}`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-stone-400 py-2.5 px-4 text-sm rounded-r-full outline-none"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors p-1">
                <Search className="w-4 h-4" />
              </button>
            </div>

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
                  className="w-full p-2 text-center text-xs font-medium text-stone-400 hover:bg-stone-800 transition-colors"
                >
                  Összes találat megtekintése ({searchResults.length}+)
                </button>
              </div>
            )}
          </form>

          <div className="hidden md:flex items-center gap-4">
            {/* ThemeToggle removed */}
            {!loading && (
              !user ? (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="bg-stone-100 hover:bg-white text-stone-900 font-semibold py-2 px-5 rounded-lg transition-transform duration-300 transform hover:scale-105"
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
                    <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center border-2 border-transparent hover:border-stone-500 transition">
                      <ProfileIcon />
                    </button>
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-black/50 backdrop-blur-xl rounded-md shadow-lg py-1 z-50 border border-white/20">
                        <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-700">{user.email}</div>
                        <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-stone-600 transition">Profilom</Link>
                        <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-stone-600 transition">Rendeléseim</Link>

                        {profile?.is_admin && (
                          <>
                            <div className="border-t border-gray-700 my-1"></div>
                            <Link to="/admin" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm font-bold text-indigo-400 hover:bg-stone-600 hover:text-white transition">Admin Felület</Link>
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

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>


        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gray-900 border-b border-white/10 shadow-xl p-4 animate-fadeIn">
            <form ref={mobileSearchRef} onSubmit={(e) => { handleSearch(e); setIsMobileMenuOpen(false); }} className="relative mb-4">
              <input
                type="text"
                placeholder="Keresés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim()) setShowResults(true); }}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-4 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </button>

              {/* Mobile Live Search Results */}
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {searchResults.map(product => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={() => {
                        setShowResults(false);
                        setSearchQuery('');
                        setIsMobileMenuOpen(false);
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
                    onClick={(e) => {
                      handleSearch(e);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full p-2 text-center text-xs font-medium text-stone-400 hover:bg-stone-800 transition-colors"
                  >
                    Összes találat megtekintése ({searchResults.length}+)
                  </button>
                </div>
              )}
            </form>

            <div className="flex flex-col gap-2">
              {/* ThemeToggle removed */}
              <div className="border-t border-white/10 my-2"></div>

              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-stone-400 hover:text-stone-300">Főoldal</Link>
              <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-stone-400 hover:text-stone-300">Bolt</Link>

              {!user ? (
                <button
                  onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full mt-2 bg-stone-100 hover:bg-white text-stone-900 font-semibold py-2 px-5 rounded-lg text-center"
                >
                  Bejelentkezés
                </button>
              ) : (
                <>
                  <div className="border-t border-white/10 my-2"></div>
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-stone-400 hover:text-stone-300">Profilom</Link>
                  <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-stone-400 hover:text-stone-300">Rendeléseim</Link>
                  <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-stone-400 hover:text-stone-300 flex justify-between items-center">
                    Kosár
                    {totalItemsInCart > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {totalItemsInCart}
                      </span>
                    )}
                  </Link>
                  {profile?.is_admin && (
                    <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-indigo-400 font-bold">Admin Felület</Link>
                  )}
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left py-2 text-red-400 hover:text-red-300">Kijelentkezés</button>
                </>
              )}
            </div>
          </div>
        )}
      </header >
      {!user && isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />
      }
    </>
  );
}