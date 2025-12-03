import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function MapPicker({ latitude, longitude, onLocationChange }) {
  // Default center: Makassar, Indonesia
  const defaultCenter = [-5.1477, 119.4327];
  const [position, setPosition] = useState(null);

  useEffect(() => {
    // Set initial position if lat/lng provided
    if (latitude && longitude) {
      setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    } else {
      // Try to get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newPos = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            };
            setPosition(newPos);
            onLocationChange(newPos.lat, newPos.lng);
          },
          () => {
            // If geolocation fails, use default Makassar coordinates
            const newPos = {
              lat: defaultCenter[0],
              lng: defaultCenter[1]
            };
            setPosition(newPos);
            onLocationChange(newPos.lat, newPos.lng);
          }
        );
      } else {
        // Geolocation not supported, use default
        const newPos = {
          lat: defaultCenter[0],
          lng: defaultCenter[1]
        };
        setPosition(newPos);
        onLocationChange(newPos.lat, newPos.lng);
      }
    }
  }, []);

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
    onLocationChange(newPosition.lat, newPosition.lng);
  };

  const center = position 
    ? [position.lat, position.lng] 
    : defaultCenter;

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-gray-300" style={{ height: '400px' }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>
      
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">📍 Cara menggunakan:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Klik pada peta untuk memilih lokasi kost</li>
          <li>Marker akan muncul di lokasi yang Anda pilih</li>
          <li>Koordinat akan otomatis tersimpan</li>
        </ul>
      </div>

      {position && (
        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Koordinat terpilih:</p>
          <p>Latitude: <span className="font-mono">{position.lat.toFixed(6)}</span></p>
          <p>Longitude: <span className="font-mono">{position.lng.toFixed(6)}</span></p>
        </div>
      )}
    </div>
  );
}

export default MapPicker;
