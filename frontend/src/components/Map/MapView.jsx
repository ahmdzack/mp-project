import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk icon marker Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component untuk tombol "Lokasi Saya"
function LocationButton({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    const locationButton = L.control({ position: 'topright' });

    locationButton.onAdd = function () {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <button 
          style="
            background: white;
            border: 2px solid rgba(0,0,0,0.2);
            border-radius: 4px;
            width: 34px;
            height: 34px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          "
          title="Lokasi Saya"
        >
          📍
        </button>
      `;

      const button = div.querySelector('button');
      button.onclick = function () {
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
              alert('Tidak dapat mengakses lokasi Anda. Pastikan izin lokasi diaktifkan.');
              button.innerHTML = '📍';
              button.disabled = false;
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        } else {
          alert('Browser Anda tidak mendukung geolocation.');
          button.innerHTML = '📍';
          button.disabled = false;
        }
      };

      return div;
    };

    locationButton.addTo(map);

    return () => {
      locationButton.remove();
    };
  }, [map, onLocationFound]);

  return null;
}

// Custom icon untuk lokasi kost
const kostIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon untuk lokasi pengguna
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component untuk mengupdate center peta
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Fungsi untuk menghitung jarak antara dua koordinat (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapView = ({ 
  kosts = [], 
  center = [-5.1477, 119.4327], // Default: Makassar
  zoom = 13,
  height = '400px',
  showUserLocation = true,
  onKostClick = null,
  singleKost = null
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [kostsWithDistance, setKostsWithDistance] = useState([]);

  // Dapatkan lokasi pengguna
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userCoords);
          
          // Jika tidak ada single kost, center ke lokasi pengguna
          if (!singleKost) {
            setMapCenter(userCoords);
          }
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [showUserLocation, singleKost]);

  // Hitung jarak kost dari lokasi pengguna
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

  // Tentukan center peta
  const finalCenter = singleKost && singleKost.latitude && singleKost.longitude
    ? [parseFloat(singleKost.latitude), parseFloat(singleKost.longitude)]
    : mapCenter;

  return (
    <div style={{ width: '100%', height }}>
      <MapContainer
        center={finalCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={finalCenter} zoom={zoom} />
        
        {/* Tombol Lokasi Saya */}
        <LocationButton onLocationFound={(coords) => {
          setUserLocation(coords);
          setMapCenter(coords);
        }} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker untuk lokasi pengguna */}
        {showUserLocation && userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong>📍 Lokasi Anda</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker untuk single kost */}
        {singleKost && singleKost.latitude && singleKost.longitude && (
          <Marker
            position={[parseFloat(singleKost.latitude), parseFloat(singleKost.longitude)]}
            icon={kostIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{singleKost.name}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  📍 {singleKost.address}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  🏙️ {singleKost.city}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold', color: '#9333ea' }}>
                  💰 Rp {singleKost.price_monthly?.toLocaleString('id-ID')}/bulan
                </p>
                {userLocation && (
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    📏 {calculateDistance(
                      userLocation[0],
                      userLocation[1],
                      parseFloat(singleKost.latitude),
                      parseFloat(singleKost.longitude)
                    ).toFixed(2)} km dari lokasi Anda
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker untuk multiple kosts */}
        {!singleKost && kostsWithDistance.map((kost) => {
          if (!kost.latitude || !kost.longitude) return null;
          
          return (
            <Marker
              key={kost.id}
              position={[parseFloat(kost.latitude), parseFloat(kost.longitude)]}
              icon={kostIcon}
              eventHandlers={{
                click: () => {
                  if (onKostClick) {
                    onKostClick(kost);
                  }
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{kost.name}</h3>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    📍 {kost.address}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    🏙️ {kost.city}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', fontWeight: 'bold', color: '#9333ea' }}>
                    💰 Rp {kost.price_monthly?.toLocaleString('id-ID')}/bulan
                  </p>
                  {kost.distance && (
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                      📏 {kost.distance.toFixed(2)} km dari lokasi Anda
                    </p>
                  )}
                  {onKostClick && (
                    <button
                      onClick={() => onKostClick(kost)}
                      style={{
                        marginTop: '10px',
                        padding: '5px 10px',
                        backgroundColor: '#9333ea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Lihat Detail
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
