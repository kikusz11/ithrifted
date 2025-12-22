import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

export default function ClosedShopFooter() {
    return (
        <footer className="bg-stone-100 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 mt-auto py-12 transition-colors duration-300">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">

                {/* Brand & Address */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-stone-900 dark:text-white tracking-wider">ithrifted</h3>
                    <div className="text-stone-600 dark:text-stone-400 text-sm space-y-2">
                        <p className="flex items-center justify-center md:justify-start gap-2">
                            <MapPin size={16} className="text-stone-500" />
                            <span>1132 Budapest Victor Hugo utca 2</span>
                        </p>
                        <p>Adószám: 12345678-1-42</p>
                    </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                    <h4 className="text-stone-900 dark:text-white font-semibold uppercase tracking-widest text-sm">Kapcsolat</h4>
                    <div className="space-y-2">
                        <a href="mailto:info@ithrifted.hu" className="flex items-center justify-center md:justify-start gap-2 text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Mail size={18} className="text-stone-400 group-hover:text-indigo-600" />
                            <span>info@ithrifted.hu</span>
                        </a>
                        <a href="tel:+36306090401" className="flex items-center justify-center md:justify-start gap-2 text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Phone size={18} className="text-stone-400 group-hover:text-indigo-600" />
                            <span>+36 30 609 0401</span>
                        </a>
                    </div>
                </div>

                {/* Socials */}
                <div className="space-y-4">
                    <h4 className="text-stone-900 dark:text-white font-semibold uppercase tracking-widest text-sm">Kövess minket</h4>
                    <div className="flex gap-4 justify-center md:justify-start">
                        <a href="https://www.instagram.com/i_thrifted_/" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-stone-500 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 transition-all shadow-sm">
                            <Instagram size={20} />
                        </a>
                        <a href="https://www.tiktok.com/@danibertok1" target="_blank" rel="noopener noreferrer" className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-full text-stone-500 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 transition-all shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-stone-200 dark:border-stone-800 mt-12 pt-8 text-center text-stone-500 dark:text-stone-500 text-xs">
                &copy; {new Date().getFullYear()} iThrifted. Minden jog fenntartva.
            </div>
        </footer>
    );
}
