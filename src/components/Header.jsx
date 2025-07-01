import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '../lib/api';
import { cn } from '../lib/utils'; // cn helper function, valószínűleg shadcn/ui-ból
import CategoryBrowser from './CategoryBrowser';
import { useAuth } from '../contexts/AuthContext';
import { Search, User, ChevronsUpDown, Settings, LogOut } from 'lucide-react';

// Segédfüggvény, ami a lapos listából fa-struktúrát épít
const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter(category => category.parent_id === parentId)
    .map(category => {
      const children = buildCategoryTree(categories, category.id);
      return {
        ...category,
        children: children.length > 0 ? children : null,
      };
    });
};

const Header = () => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isCategoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categoryTree, setCategoryTree] = useState([]);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const categoryPopoverRef = useRef(null);
  const profileMenuTimeoutRef = useRef(null);

  // Külső kattintás figyelése a popover bezárásához
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryPopoverRef.current && !categoryPopoverRef.current.contains(event.target)) {
        setCategoryPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const flatCategories = await getCategories();
      const tree = buildCategoryTree(flatCategories);
      setCategoryTree(tree);
    };
    fetchCategories();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: Implement full search page navigation
    const searchTerm = e.target.elements.search.value;
    if (searchTerm) {
      navigate(`/search?q=${searchTerm}`);
    }
  };

  const handleCategorySelect = (category) => {
    setCategoryPopoverOpen(false);
    // A navigációt a CategoryBrowser Link komponense már kezeli
  };

  const handleProfileEnter = () => {
    clearTimeout(profileMenuTimeoutRef.current);
    setProfileMenuOpen(true);
  };

  const handleProfileLeave = () => {
    profileMenuTimeoutRef.current = setTimeout(() => {
      setProfileMenuOpen(false);
    }, 200); // 200ms delay
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo/Shop Name */}
        <Link to="/" className="text-2xl font-bold text-gray-800">
          iTrifted
        </Link>

        {/* === INTEGRATED SEARCH BAR === */}
        {/* JAVÍTÁS ITT: 'hidden md:flex' helyett 'flex-1 flex justify-center' */}
        {/* Ez biztosítja, hogy mindig flex container legyen és látszódjon */}
        <div className="flex-1 flex justify-center" ref={categoryPopoverRef}>
          <form onSubmit={handleSearch} className="w-full max-w-xl relative">
            <div className={cn(
              "flex h-10 w-full items-center rounded-md border border-input bg-background text-sm ring-offset-background",
              "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}>
              {/* Category Popover Button */}
              <button
                type="button"
                onClick={() => setCategoryPopoverOpen(!isCategoryPopoverOpen)}
                className="h-full rounded-r-none border-r border-input pr-2 pl-3 gap-1 text-muted-foreground hover:bg-gray-100 flex items-center"
              >
                <span>Kategóriák</span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </button>

              {/* Search Input */}
              <div className="relative flex-1 h-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="search"
                  name="search" // Hozzáadtam a 'name' attribútumot, hogy e.target.elements.search.value működjön
                  placeholder="Keress termékre..."
                  className="w-full h-full pl-10 border-0 shadow-none focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Category Popover Content */}
            {isCategoryPopoverOpen && (
              <div className="absolute top-full mt-2 w-auto z-10">
                <CategoryBrowser categoryTree={categoryTree} onCategorySelect={handleCategorySelect} />
              </div>
            )}
          </form>
        </div>

        {/* Navigation and Profile */}
        <div className="flex items-center gap-6">
          
          {user ? (
            <div className="relative" onMouseLeave={handleProfileLeave}>
              <button
                onMouseEnter={handleProfileEnter}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
              >
                {/* user.email a user objektumból, ha létezik */}
                <span className="font-medium"></span> 
                <User className="h-5 w-5" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  onMouseEnter={handleProfileEnter}
                >
                  <Link
                    to="/profile/orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Rendeléseim
                  </Link>
                  <Link
                    to="/profile/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Beállítások
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Kijelentkezés
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="text-gray-600 hover:text-blue-600 font-medium">Bejelentkezés</Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;