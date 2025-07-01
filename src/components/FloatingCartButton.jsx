import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import CartPreview from './CartPreview';

const FloatingCartButton = () => {
  const { itemCount } = useCart();
  const [isCartPreviewVisible, setCartPreviewVisible] = useState(false);
  const cartRef = useRef(null);

  // Ablakon kívülre kattintva bezárja az előnézetet
  useEffect(() => {
    function handleClickOutside(event) {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartPreviewVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cartRef]);

  return (
    <div
      className="fixed bottom-6 right-6 z-40"
      ref={cartRef}
    >
      {isCartPreviewVisible && <CartPreview onClose={() => setCartPreviewVisible(false)} />}
      <button
        onClick={() => setCartPreviewVisible(!isCartPreviewVisible)}
        className="relative flex items-center justify-center bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Kosár megtekintése"
      >
        <ShoppingCart size={24} />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingCartButton;