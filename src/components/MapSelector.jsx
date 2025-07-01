import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// --- JAVÍTÁS ---
// A Leaflet alapértelmezett ikonjainak elérési útját javítjuk,
// hogy a Vite/Webpack megfelelően tudja kezelni őket.
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    ...L.Icon.Default.prototype.options,
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks and marker placement
function LocationMarker({ position, setPosition, onAddressFound }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      // Reverse geocoding to get address from coordinates
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          const address = {
            street: `${data.address.road || ''} ${data.address.house_number || ''}`.trim(),
            city: data.address.city || data.address.town || data.address.village || '',
            zip: data.address.postcode || '',
            country: data.address.country || '',
          };
          onAddressFound(address);
        })
        .catch(err => console.error("Reverse geocoding failed:", err));
    }
  }, [position, onAddressFound]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

const MapSelector = ({ address, onSelect, onClose }) => {
  const [currentAddress, setCurrentAddress] = useState(address);
  // Default to Budapest if no address is provided
  const [position, setPosition] = useState({ lat: 47.4979, lng: 19.0402 });

  const handleAddressFound = useCallback((foundAddress) => {
    setCurrentAddress(prev => ({ ...prev, ...foundAddress }));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirm = () => {
    onSelect(currentAddress); // This closes the modal via the parent component
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-[1000]">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4">Cím kiválasztása</h2>

        <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: '300px', width: '100%' }} className="rounded-md mb-4">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onAddressFound={handleAddressFound} 
          />
        </MapContainer>

        {/* Cím beviteli mezők */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">Utca, házszám</label>
            <input
              type="text"
              name="street"
              id="street"
              value={currentAddress.street || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">Város</label>
            <input
              type="text"
              name="city"
              id="city"
              value={currentAddress.city || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium text-gray-700">Irányítószám</label>
            <input
              type="text"
              name="zip"
              id="zip"
              value={currentAddress.zip || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">Ország</label>
            <input
              type="text"
              name="country"
              id="country"
              value={currentAddress.country || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Cím megerősítése
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;