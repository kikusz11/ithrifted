import React from 'react';

const OrdersPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Rendeléseim</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Jelenleg nincsenek rendeléseid.</p>
      </div>
    </div>
  );
};

export default OrdersPage;