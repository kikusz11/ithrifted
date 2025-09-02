import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Komponensek
import Header from './components/Header.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import AdminLayout from './components/admin/AdminLayout.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
 
// Oldalak
import HomePage from './pages/HomePage.tsx';
import ModernProfilePage from './pages/ModernProfilePage.tsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import AdminDropsPage from './pages/admin/AdminDropsPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import ProductDetailPage from './pages/ProductDetailPage.tsx';

// Placeholder komponens
const PlaceholderPage = ({ title }: { title: string }) => {
  return <div className="p-8 text-3xl font-bold">{title}</div>;
};

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/drops" element={<AdminDropsPage />} />
                  <Route path="/products" element={<AdminProductsPage />} />
                  <Route path="/orders" element={<PlaceholderPage title="Rendelés Kezelés" />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/*" element={
            <>
              <Header />
              <main className="bg-gray-900 text-white min-h-screen pt-24">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/profile" element={<ModernProfilePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/orders" element={<PlaceholderPage title="Rendeléseim" />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;