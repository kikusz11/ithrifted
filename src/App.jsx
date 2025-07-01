import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/home/HomePage';
import ProductDetailPage from './pages/product/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import CheckoutPage from './pages/checkout/CheckoutPage';
import SettingsPage from './pages/profile/SettingsPage';
import OrdersPage from './pages/profile/OrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import DropSettings from './pages/admin/DropSettings';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement'; // <-- ÚJ: Importáld az OrderManagement komponenst
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/auth/AuthPage';
import NotFoundPage from './pages/NotFoundPage'; // Create this
import './index.css'; // Tailwind styles

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes that use the main layout (Header, Floating Cart Button) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          
          {/* Védett útvonalak, amelyek a fő layoutot használják */}
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile/settings" element={<SettingsPage />} />
            <Route path="/profile/orders" element={<OrdersPage />} />
            
            {/* Admin útvonalak */}
            {/* A ProtectedRoute-nak kell kezelnie az admin jogosultságot is, ha ezt az útvonalat használja */}
            <Route path="/admin" element={<AdminDashboard />} /> {/* /admin */}
            <Route path="/admin/drop-settings" element={<DropSettings />} /> {/* /admin/drop-settings */}
            <Route path="/admin/product-management" element={<ProductManagement />} /> {/* /admin/product-management */}
            <Route path="/admin/orders" element={<OrderManagement />} /> {/* <-- ÚJ ÚTVONAL IDE */}
          </Route>

          {/* The 404 page should also have the layout for consistency */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Routes without the main layout (e.g., login, register) */}
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;