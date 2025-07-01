import React from 'react';
import { MapPin } from 'lucide-react';

const AddressForm = ({ address, onEditOnMap }) => {
  return (
    <div>
      <div className="text-gray-700 mb-4 p-4 border rounded-md bg-gray-50">
        <p className="font-semibold">{address.street || 'N/A'}</p>
        <p>{address.zip} {address.city}</p>
        <p>{address.country || ''}</p>
      </div>
      <button
        onClick={onEditOnMap}
        className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <MapPin className="mr-2 h-4 w-4" /> Szerkesztés a térképen
      </button>
    </div>
  );
};

export default AddressForm;