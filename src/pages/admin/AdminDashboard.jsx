import React from 'react';
import { Link } from 'react-router-dom';
// Hozzáadtam a ClipboardList ikont
import { PackagePlus, Settings, Users, ClipboardList } from 'lucide-react'; 

const AdminCard = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200">
    <div className="flex items-center gap-4 mb-3">
      <Icon className="h-8 w-8 text-blue-600" />
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    <p className="text-gray-600">{description}</p>
  </Link>
);

const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Admin Felület</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AdminCard
          to="/admin/product-management"
          icon={PackagePlus}
          title="Termékkezelés"
          description="Új termékek hozzáadása a bolthoz, meglévők szerkesztése."
        />
        <AdminCard
          to="/admin/drop-settings"
          icon={Settings}
          title="Bolt Beállítások"
          description="A bolt nyitvatartásának és egyéb általános beállításainak módosítása."
        />
        {/* ÚJ RENDELÉSKEZELÉS KÁRTYA */}
        <AdminCard
          to="/admin/orders" 
          icon={ClipboardList} // Megfelelő ikon a rendelésekhez
          title="Rendeléskezelés"
          description="Megrendelések áttekintése, státuszok módosítása, törlése."
        />
        {/* Felhasználók kártya (Hamarosan) */}
        <AdminCard
          to="#"
          icon={Users}
          title="Felhasználók (Hamarosan)"
          description="Felhasználói fiókok és jogosultságok kezelése."
        />
      </div>
    </div>
  );
};

export default AdminDashboard;