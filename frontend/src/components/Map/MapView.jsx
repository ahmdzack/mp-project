import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk icon marker Leaflet agar tidak error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Component Tombol Lokasi Saya ---
function LocationButton({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    // Membuat custom control Leaflet
    const locationButton = L.control({ position: 'topright' });

    locationButton.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <button 
          style="background: white; border: 2px solid rgba(0,0,0,0.2); border-radius: 4px; width: 34px; height: 34px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px;"
          title="Lokasi Saya"
        >
          📍
        </button>
      `;

      const button = div.querySelector('button');
      
      // Mencegah klik tembus ke peta
      L.DomEvent.disableClickPropagation(div);

      button.onclick = function (e) {
        L.DomEvent.stopPropagation(e);
        button.innerHTML = '⏳';
        button.disabled = true;

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userCoords = [position.coords.latitude, position.coords.longitude];
              map.setView(userCoords, 15, { animate: true });
              
              if (onLocationFound) {
                onLocationFound(userCoords);
              }

              button.innerHTML = '📍';
              button.disabled = false;
            },
            (error) => {
              console.error('Geolocation error:', error);
              alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
              button.innerHTML = '📍';
              button.disabled = false;
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          alert('Browser tidak mendukung geolocation.');
        }
      };

      return div;
    };

    locationButton.addTo(map);

    // CLEANUP: Hapus tombol saat component unmount
    return () => {
      try {
        locationButton.remove();
      } catch (e) {
        // Abaikan error jika map sudah destroyed
      }
    };
  }, [map, onLocationFound]);

  return null;
}

// --- Custom Icons ---
const kostIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- Component Helper Update View ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// --- Helper Jarak ---
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- MAIN COMPONENT ---
const MapView = ({ 
  kosts = [], 
  center = [-5.1477, 119.4327], 
  zoom = 13,
  height = '400px',
  showUserLocation = true,
  onKostClick = null,
  singleKost = null
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [kostsWithDistance, setKostsWithDistance] = useState([]);

  // PERBAIKAN UTAMA DI SINI (Geolocation Cleanup)
  useEffect(() => {
    let isMounted = true; // Penanda apakah halaman masih aktif

    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return; // STOP jika halaman sudah pindah!
          
          const userCoords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userCoords);
          
          if (!singleKost) {
            setMapCenter(userCoords);
          }
        },
        (error) => {
          if (!isMounted) return;
          console.log('Geolocation silent error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    // Fungsi ini dijalankan otomatis saat Anda pindah halaman
    return () => {
      isMounted = false; 
    };
  }, [showUserLocation, singleKost]);

  // Hitung jarak (juga dilindungi cleanup secara implisit oleh React)
  useEffect(() => {
    if (userLocation && kosts.length > 0) {
      const kostsWithDist = kosts
        .map(kost => ({
          ...kost,
          distance: kost.latitude && kost.longitude
            ? calculateDistance(
                userLocation[0],
                userLocation[1],
                parseFloat(kost.latitude),
                parseFloat(kost.longitude)
              )
            : null
        }))
        .filter(kost => kost.distance !== null)
        .sort((a, b) => a.distance - b.distance);
      
      setKostsWithDistance(kostsWithDist);
    } else {
      setKostsWithDistance(kosts);
    }
  }, [userLocation, kosts]);

  const finalCenter = singleKost && singleKost.latitude && singleKost.longitude
    ? [parseFloat(singleKost.latitude), parseFloat(singleKost.longitude)]
    : mapCenter;

  return (
    <div style={{ width: '100%', height, position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={finalCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={finalCenter} zoom={zoom} />
        
        <LocationButton onLocationFound={(coords) => {
          setUserLocation(coords);
          setMapCenter(coords);
        }} />
        
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showUserLocation && userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>📍 Lokasi Anda</Popup>
          </Marker>
        )}

        {singleKost && singleKost.latitude && singleKost.longitude && (
          <Marker
            position={[parseFloat(singleKost.latitude), parseFloat(singleKost.longitude)]}
            icon={kostIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{singleKost.name}</h3>
                <p style={{ margin: '0' }}>{singleKost.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render multiple kosts logic here if needed... */}
        {!singleKost && kostsWithDistance.map(kost => (
           kost.latitude && kost.longitude && (
            <Marker
              key={kost.id}
              position={[parseFloat(kost.latitude), parseFloat(kost.longitude)]}
              icon={kostIcon}
              eventHandlers={{
                click: () => onKostClick && onKostClick(kost)
              }}
            >
             {/* Popup content */}
            </Marker>
           )
        ))}

      </MapContainer>
    </div>
  );
};

export default MapView;