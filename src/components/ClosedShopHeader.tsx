import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.tsx';
import { supabase } from '../lib/supabaseClient';
import LoginModal from './LoginModal';
import { Menu, X } from 'lucide-react';
// ThemeToggle removed

const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

export default function ClosedShopHeader() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    const profileDropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsProfileDropdownOpen(false);
        navigate('/');
        window.location.reload();
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-sm transition-colors duration-300">
                <div className="container mx-auto flex justify-between items-center py-2 px-4 relative">
                    {/* Brand Text - Moved to Left */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <span className="text-3xl font-black text-stone-900 dark:text-white tracking-tighter whitespace-nowrap">
                                ithrifted
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {/* ThemeToggle removed */}
                        {!loading && (
                            !user ? (
                                <button
                                    onClick={() => setIsLoginOpen(true)}
                                    className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-5 rounded-lg transition-transform duration-300 transform hover:scale-105 shadow-md"
                                >
                                    Bejelentkezés
                                </button>
                            ) : (
                                <div className="relative" ref={profileDropdownRef}>
                                    <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="w-10 h-10 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center border border-stone-200 transition-colors shadow-sm">
                                        <ProfileIcon />
                                    </button>
                                    {isProfileDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-1 z-50 border border-stone-100 ring-1 ring-black/5 animate-fadeIn">
                                            <div className="px-4 py-2 text-xs text-stone-500 border-b border-stone-100 font-medium">{user.email}</div>
                                            <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors">Profilom</Link>
                                            <Link to="/orders" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors">Rendeléseim</Link>

                                            {profile?.is_admin && (
                                                <>
                                                    <div className="border-t border-stone-100 my-1"></div>
                                                    <Link to="/admin" onClick={() => setIsProfileDropdownOpen(false)} className="block px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-stone-50 hover:text-indigo-700 transition-colors">Admin Felület</Link>
                                                </>
                                            )}

                                            <div className="border-t border-stone-100 my-1"></div>
                                            <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">Kijelentkezés</button>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-stone-900 p-2 hover:bg-stone-100 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xl p-4 animate-fadeIn">
                        <div className="flex flex-col gap-2">
                            {!user ? (
                                <button
                                    onClick={() => { setIsLoginOpen(true); setIsMobileMenuOpen(false); }}
                                    className="w-full mt-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-5 rounded-lg text-center shadow-md"
                                >
                                    Bejelentkezés
                                </button>
                            ) : (
                                <>
                                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium transition-colors">Profilom</Link>
                                    <Link to="/orders" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium transition-colors">Rendeléseim</Link>
                                    {profile?.is_admin && (
                                        <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block py-3 px-4 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50 transition-colors">Admin Felület</Link>
                                    )}
                                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left py-3 px-4 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 font-medium transition-colors">Kijelentkezés</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>
            {!user && isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
        </>
    );
}
