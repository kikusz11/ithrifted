import React, { useState, useEffect, useCallback } from 'react';
import {
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from '../../lib/api'; // Importáljuk a rendelés API függvényeket
import { Button } from '../../components/ui/button';
import { Eye, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'; // Ikonok
import OrderDetailModal from '../../components/admin/OrderDetailModal'; // Ezt a komponenst külön hozzuk létre

// Rendelés státuszok, ahogy megbeszéltük
const ORDER_STATUSES = [
  'new',
  'processing',
  'ready_for_pickup',
  'completed',
  'cancelled',
];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null); // A modalban megjelenítendő rendelés
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Rendelések lekérése
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError('Hiba a rendelések betöltésekor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Rendelés részleteinek megtekintése modalban
  const handleViewDetails = async (orderId) => {
    setLoading(true); // Töltési állapot amíg a részleteket lekérjük
    setError(null);
    try {
      const orderDetails = await getOrderById(orderId);
      if (orderDetails) {
        setSelectedOrder(orderDetails);
        setIsDetailModalOpen(true);
      } else {
        setError('A rendelés részletei nem találhatók.');
      }
    } catch (err) {
      setError(`Hiba a rendelés részleteinek lekérésekor: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rendelés státuszának frissítése
  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Biztosan módosítod a rendelés #${orderId} státuszát erre: ${newStatus}?`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await updateOrder(orderId, { order_status: newStatus });
      if (updateError) throw updateError;
      await fetchOrders(); // Frissítjük a listát
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, order_status: newStatus })); // Frissítjük a modalban is
      }
    } catch (err) {
      setError(`Hiba a státusz frissítésekor: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Rendelés törlése
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Biztosan törölni szeretnéd a rendelést #${orderId}? Ez a művelet nem vonható vissza.`)) {
      setLoading(true);
      setError(null);
      try {
        const { error: deleteError } = await deleteOrder(orderId);
        if (deleteError) throw deleteError;
        await fetchOrders(); // Frissítjük a listát
        setIsDetailModalOpen(false); // Bezárjuk a modalt, ha az volt nyitva
        setSelectedOrder(null);
      } catch (err) {
        setError(`Hiba a törlés során: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Státusz badge színeinek segédfüggvénye
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Rendeléskezelés</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Rendelés ID</th>
                <th scope="col" className="px-6 py-3">Dátum</th>
                <th scope="col" className="px-6 py-3">Felhasználó</th>
                <th scope="col" className="px-6 py-3">Termékek</th>
                <th scope="col" className="px-6 py-3">Állapot</th>
                <th scope="col" className="px-6 py-3">Fizetés</th>
                <th scope="col" className="px-6 py-3">Összeg</th>
                <th scope="col" className="px-6 py-3 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {loading && !orders.length ? (
                <tr><td colSpan="8" className="text-center p-8">Rendelések betöltése...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-8">Nincsenek még rendelések.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {order.id.substring(0, 8)}... {/* Rövidített ID */}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(order.created_at).toLocaleString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      {order.profiles ? (order.profiles.username || order.profiles.full_name) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {order.items ? `${order.items.length} termék` : '0 termék'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {order.total_amount.toLocaleString('hu-HU')} Ft
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Státusz módosító dropdown */}
                        <select
                          value={order.order_status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="block rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                          disabled={loading}
                        >
                          {ORDER_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteOrder(order.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDeleteOrder}
          loading={loading}
          orderStatuses={ORDER_STATUSES}
        />
      )}
    </div>
  );
};

export default OrderManagement;