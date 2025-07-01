import React from 'react';
import { Button } from '../ui/button';
import { X, User, MapPin, CreditCard, ShoppingBag, Calendar, CheckCircle, XCircle as XCircleIcon } from 'lucide-react';

const OrderDetailModal = ({ order, onClose, onUpdateStatus, onDelete, loading, orderStatuses }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6">Rendelés részletei #{order.id.substring(0, 8)}...</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Rendelés összefoglaló */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><ShoppingBag className="h-5 w-5 mr-2 text-blue-600" />Rendelés adatai</h3>
            <p><span className="font-medium">Dátum:</span> {new Date(order.created_at).toLocaleString('hu-HU')}</p>
            <p><span className="font-medium">Végösszeg:</span> {order.total_amount.toLocaleString('hu-HU')} Ft</p>
            <p><span className="font-medium">Státusz:</span> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.order_status)}`}>{order.order_status}</span></p>
            <p><span className="font-medium">Fizetés:</span> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{order.payment_status}</span></p>
          </div>

          {/* Felhasználó adatai */}
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center"><User className="h-5 w-5 mr-2 text-blue-600" />Felhasználó</h3>
            <p><span className="font-medium">Felhasználónév:</span> {order.profiles?.username || order.profiles?.full_name || 'N/A'}</p>
            <p><span className="font-medium">UserID:</span> {order.user_id.substring(0,8)}...</p>
          </div>

          {/* Átvételi pont */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-2 flex items-center"><MapPin className="h-5 w-5 mr-2 text-blue-600" />Átvételi pont</h3>
            <p className="text-gray-700">{order.pickup_point}</p>
          </div>
        </div>

        {/* Rendelt termékek */}
        <h3 className="text-lg font-semibold mb-3 flex items-center"><ShoppingCart className="h-5 w-5 mr-2 text-blue-600" />Rendelt termékek</h3>
        <div className="space-y-4 mb-6">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 border-b pb-2 last:border-b-0">
                <img
                  src={item.product_image_url || 'https://via.placeholder.com/64'}
                  alt={item.product_name || 'Termék'}
                  className="h-16 w-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{item.product_name || 'Ismeretlen termék'}</p>
                  <p className="text-sm text-gray-600">Mennyiség: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-700">Ár: {item.product_price?.toLocaleString('hu-HU') || item.price_at_order?.toLocaleString('hu-HU') || 'N/A'} Ft</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">Nincsenek termékek a rendelésben.</p>
          )}
        </div>

        {/* Státusz módosítása */}
        <div className="mb-6">
          <label htmlFor="order_status" className="block text-sm font-medium text-gray-700 mb-2">Rendelés státusz módosítása:</label>
          <select
            id="order_status"
            value={order.order_status}
            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={loading}
          >
            {orderStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Műveleti gombok */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onDelete(order.id)} className="text-red-600 hover:text-red-700" disabled={loading}>
            <Trash2 className="mr-2 h-4 w-4" /> Rendelés törlése
          </Button>
          <Button onClick={onClose} disabled={loading}>Bezárás</Button>
        </div>
      </div>
    </div>
  );
};

// Segédfüggvény a státusz színeihez (ugyanaz, mint OrderManagement-ben)
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'processing': return 'bg-yellow-100 text-yellow-800';
    case 'ready_for_pickup': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default OrderDetailModal;