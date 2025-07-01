import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import FloatingCartButton from './FloatingCartButton';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-20"> {/* Add padding to main content to avoid overlap with fixed header */}
        <Outlet /> {/* This will render the current page's component */}
      </main>
      <FloatingCartButton />
    </div>
  );
};

export default Layout;