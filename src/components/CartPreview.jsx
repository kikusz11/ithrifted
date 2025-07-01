import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { Button } from './ui/button';
import { ShoppingCart, CreditCard, X, Frown } from 'lucide-react';

const CartPreview = ({ onClose }) => {
  const { cartItems, totalPrice, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h3 className="text-lg font-semibold">Kosár előnézet</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Frown className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">A kosarad jelenleg üres.</p>
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
          {cartItems.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <img src={item.image_url || 'https://via.placeholder.com/50'} alt={item.name} className="w-12 h-12 object-cover rounded" />
              <div className="flex-grow min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} x 
                  {(item.sale_price && item.sale_price > 0 ? item.sale_price : item.price).toLocaleString()} Ft
                </p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t mt-4 pt-4">
        {cartItems.length > 0 && (
          <div className="flex justify-between items-center font-bold text-md mb-4">
            <span>Összesen:</span>
            <span>{totalPrice.toLocaleString()} Ft</span>
          </div>
        )}
        <div className="space-y-2">
          <Link to="/cart" onClick={onClose} className="w-full block">
            <Button variant="outline" className="w-full">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tovább a kosárhoz
            </Button>
          </Link>
          <Button onClick={handleGoToCheckout} className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            Tovább a pénztárhoz
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPreview;