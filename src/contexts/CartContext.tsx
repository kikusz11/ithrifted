import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Definiáljuk a kosárban lévő termék típusát
interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  image?: string; // JAVÍTVA: Hozzáadva a kép URL-je a termékhez
}

// Definiáljuk a kontextus által biztosított értékek típusát
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  clearCart: () => void;
  cartTotal: number;
  // JAVÍTVA: Új funkciók a kosár kezeléséhez
  increaseQuantity: (itemId: number | string) => void;
  decreaseQuantity: (itemId: number | string) => void;
  removeFromCart: (itemId: number | string) => void;
}

// Létrehozzuk a kontextust egy alapértelmezett értékkel
const CartContext = createContext<CartContextType | undefined>(undefined);

// Létrehozzuk a "Provider" komponenst
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Termék hozzáadása a kosárhoz
  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  // JAVÍTVA: Új funkció a mennyiség növelésére
  const increaseQuantity = (itemId: number | string) => {
    setCart(cart =>
      cart.map(item =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  // JAVÍTVA: Új funkció a mennyiség csökkentésére
  const decreaseQuantity = (itemId: number | string) => {
    setCart(cart =>
      cart.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  };

  // JAVÍTVA: Új funkció a termék eltávolítására
  const removeFromCart = (itemId: number | string) => {
    setCart(cart => cart.filter(item => item.id !== itemId));
  };

  // Kosár ürítése
  const clearCart = () => {
    setCart([]);
  };

  // Kosár végösszegének számítása
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = {
    cart,
    addToCart,
    clearCart,
    cartTotal,
    // JAVÍTVA: Az új funkciók hozzáadása a kontextushoz
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Létrehozzuk és exportáljuk a "useCart" hook-ot
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
