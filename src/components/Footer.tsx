import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, FileText, Shield, AlertCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Impresszum */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Impresszum</h3>
                        <div className="space-y-2 text-sm text-stone-400">
                            <p className="font-semibold text-white">iThrifted Webshop</p>
                            <p className="flex items-start gap-2">
                                <MapPin size={16} className="mt-1 flex-shrink-0" />
                                <span>1132 Budapest Victor Hugo utca 2</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-4 text-center font-mono">#</span>
                                <span>Adószám: 12345678-1-42</span>
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="w-4 text-center font-mono">#</span>
                                <span>Nyilvántartási szám: 123456</span>
                            </p>
                            <div className="pt-2 space-y-1">
                                <a href="mailto:info@ithrifted.hu" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <Mail size={16} />
                                    <span>info@ithrifted.hu</span>
                                </a>
                                <a href="tel:+36301234567" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <Phone size={16} />
                                    <span>+36 30 123 4567</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Jogi nyilatkozatok */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Jogi információk</h3>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li>
                                <Link to="/aszf" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <FileText size={16} />
                                    <span>Általános Szerződési Feltételek (ÁSZF)</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/adatkezeles" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <Shield size={16} />
                                    <span>Adatkezelési Tájékoztató (GDPR)</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Vásárlói információk */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Vásárlói információk</h3>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li>
                                <Link to="/elallasi-jog" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <AlertCircle size={16} />
                                    <span>Elállási jog (14 nap)</span>
                                </Link>
                            </li>
                            <li>
                                <a href="https://bekeltetes.hu/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-stone-300 transition-colors">
                                    <Shield size={16} />
                                    <span>Panaszkezelés / Békéltető testület</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Tipp / Megjegyzés (Optional or Branding) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Rólunk</h3>
                        <p className="text-sm text-stone-400">
                            Az iThrifted a legjobb hely a minőségi használt ruhák beszerzésére. Célunk a fenntartható divat népszerűsítése.
                        </p>
                        <div className="pt-4">
                            <p className="text-xs text-stone-500">
                                &copy; {new Date().getFullYear()} iThrifted Webshop. Minden jog fenntartva.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </footer>
    );
}
