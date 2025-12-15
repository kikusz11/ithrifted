import { useState } from 'react';
import { Gift } from 'lucide-react';
import SpinWheelGame from './SpinWheelGame';

export default function SpinWheelWidget() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Widget Bubble - Messenger Style */}
            <div
                className="fixed bottom-24 right-4 z-40 cursor-pointer group hover:z-50"
                onClick={() => setIsOpen(true)}
            >
                {/* Ping Animation for Attention */}
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 duration-1000"></div>

                {/* Main Icon */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-3 md:p-4 rounded-full shadow-2xl border-2 border-white/20 hover:scale-110 transition-transform duration-300 ease-out flex items-center justify-center">
                    <Gift className="text-white w-6 h-6 md:w-8 md:h-8 animate-bounce-slight" />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full mb-3 right-0 md:right-1/2 md:translate-x-1/2 bg-white text-gray-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap transform translate-y-2 group-hover:translate-y-0 duration-200">
                    Pörgess és Nyerj!
                    <div className="absolute -bottom-1 right-3 md:right-1/2 md:translate-x-1/2 w-2 h-2 bg-white transform rotate-45"></div>
                </div>
            </div>

            {/* Game Modal */}
            <SpinWheelGame isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
