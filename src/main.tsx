import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CartProvider } from './contexts/CartContext.tsx';
// JAVÍTVA: Pontosítjuk az importot a .tsx kiterjesztéssel, hogy a Vite biztosan megtalálja.
import { AuthProvider } from './hooks/useAuth.tsx'; 

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);

