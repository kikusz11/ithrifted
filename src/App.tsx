import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'sonner';

// Komponensek
import Header from './components/Header.tsx';
import Footer from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import AdminLayout from './components/admin/AdminLayout.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { supabase } from './lib/supabaseClient';

// Oldalak
import HomePage from './pages/HomePage.tsx';
import ModernProfilePage from './pages/ModernProfilePage.tsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.tsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminDropsPage from './pages/admin/AdminDropsPage.tsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.tsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.tsx';
import AdminCouponsPage from './pages/admin/AdminCouponsPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';
import UserOrdersPage from './pages/UserOrdersPage.tsx';
import ClosedShopPage from './pages/ClosedShopPage';

function App() {
  const [isShopOpen, setIsShopOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkShopStatus = async () => {
      try {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('drops')
          .select('id')
          .eq('is_active', true)
          .lte('start_time', now)
          .gte('end_time', now)
          .limit(1);

        if (error) {
          console.error('Error checking shop status:', error);
          // Default to open in case of error to avoid locking out
          setIsShopOpen(true);
        } else {
          setIsShopOpen(data && data.length > 0);
        }
      } catch (err) {
        console.error('Unexpected error checking shop status:', err);
        setIsShopOpen(true);
      } finally {
        setLoading(false);
      }
    };

    checkShopStatus();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center">Betöltés...</div>;
  }

  return (
    <CartProvider>
      <Toaster position="bottom-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/drops" element={<AdminDropsPage />} />
                  <Route path="/products" element={<AdminProductsPage />} />
                  <Route path="/orders" element={<AdminOrdersPage />} />
                  <Route path="/users" element={<AdminUsersPage />} />
                  <Route path="/coupons" element={<AdminCouponsPage />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/*" element={
            isShopOpen ? (
              <div className="flex flex-col min-h-screen bg-stone-900 text-white">
                <Header />
                <main className="flex-grow pt-24">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ModernProfilePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/shop" element={<ShopPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/orders" element={<UserOrdersPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            ) : (
              <ClosedShopPage />
            )
          } />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;