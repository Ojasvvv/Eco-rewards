import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useLanguage } from '../../context/LanguageContext';
import 'leaflet/dist/leaflet.css';
import './SmartBinFinder.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user location icon
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3B82F6" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Custom smart bin icon using trash bin emoji with green box
const binIcon = new L.DivIcon({
  html: `<div style="
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 2px solid white;
  ">🗑️</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
  className: 'bin-emoji-icon'
});

// Component to recenter map when location changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

// Generate random smart bins around user location
const generateRandomBins = (userLat, userLng, count = 10) => {
  const bins = [];
  const radius = 0.01; // ~1km radius
  
  const binNames = [
    'McDonald\'s Main Street',
    'Starbucks Coffee Plaza',
    'City Park Central',
    'Shopping Mall West',
    'Metro Station North',
    'KFC Downtown',
    'Pizza Hut Avenue',
    'Subway Terminal',
    'Community Center',
    'University Campus',
    'Public Library',
    'Hospital Complex',
    'Sports Stadium',
    'Airport Terminal',
    'Railway Station'
  ];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radius;
    
    const lat = userLat + (distance * Math.cos(angle));
    const lng = userLng + (distance * Math.sin(angle));
    
    // Calculate distance in meters
    const distanceInMeters = Math.round(
      calculateDistance(userLat, userLng, lat, lng) * 1000
    );
    
    bins.push({
      id: i + 1,
      name: binNames[i % binNames.length],
      code: `BIN${String(i + 1).padStart(3, '0')}`,
      lat,
      lng,
      distance: distanceInMeters,
      capacity: Math.round(Math.random() * 100)
    });
  }
  
  // Set status based on capacity
  bins.forEach(bin => {
    bin.status = bin.capacity >= 80 ? 'full' : 'available';
  });
  
  // Sort by distance
  return bins.sort((a, b) => a.distance - b.distance);
};

// Calculate distance using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const SmartBinFinder = () => {
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const [smartBins, setSmartBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBin, setSelectedBin] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);
        setMapCenter(location);
        
        // Generate random smart bins around user location
        const bins = generateRandomBins(latitude, longitude);
        setSmartBins(bins);
        
        setLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please enable location services.');
        
        // Fallback to a default location (e.g., Times Square, NYC)
        const defaultLocation = { lat: 40.7580, lng: -73.9855 };
        setUserLocation(defaultLocation);
        setMapCenter(defaultLocation);
        
        const bins = generateRandomBins(defaultLocation.lat, defaultLocation.lng);
        setSmartBins(bins);
        
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleBinClick = (bin) => {
    setSelectedBin(bin);
    setMapCenter({ lat: bin.lat, lng: bin.lng });
  };

  const getDirections = (bin) => {
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.lat},${bin.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="smart-bin-finder">
      <div className="bin-finder-header">
        <h2>🗺️ Smart Bin Finder</h2>
        <p>Find the nearest smart recycling bins near you</p>
        {error && (
          <div className="location-warning">
            ⚠️ {error} (Showing default location)
          </div>
        )}
      </div>

      <div className="bin-finder-content">
        {/* Map Section */}
        <div className="map-section">
          {loading ? (
            <div className="map-loading">
              <div className="spinner"></div>
              <p>Getting your location...</p>
            </div>
          ) : (
            <MapContainer
              center={mapCenter || [0, 0]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="leaflet-map"
              scrollWheelZoom={true}
              dragging={true}
              touchZoom={true}
              doubleClickZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* User Location */}
              {userLocation && (
                <>
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                      <div className="popup-content">
                        <strong>📍 Your Location</strong>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Radius circle */}
                  <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={1000}
                    pathOptions={{ 
                      color: '#3B82F6', 
                      fillColor: '#3B82F6',
                      fillOpacity: 0.1,
                      weight: 2,
                      dashArray: '5, 5'
                    }}
                  />
                </>
              )}
              
              {/* Smart Bins */}
              {smartBins.map((bin) => (
                <Marker
                  key={bin.id}
                  position={[bin.lat, bin.lng]}
                  icon={binIcon}
                  eventHandlers={{
                    click: () => handleBinClick(bin),
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3>{bin.name}</h3>
                      <p><strong>Code:</strong> {bin.code}</p>
                      <p><strong>Distance:</strong> {bin.distance}m away</p>
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={`status-badge ${bin.status}`}>
                          {bin.status === 'available' ? '✅ Available' : '🔴 Full'}
                        </span>
                      </p>
                      <p><strong>Capacity:</strong> {bin.capacity}% used</p>
                      <button 
                        className="directions-btn"
                        onClick={() => getDirections(bin)}
                      >
                        📍 Get Directions
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              <MapRecenter center={mapCenter} />
            </MapContainer>
          )}
        </div>

        {/* Bins List Section */}
        <div className="bins-list-section">
          <div className="bins-list-header">
            <h3>📍 Nearby Smart Bins</h3>
            <button className="refresh-btn" onClick={getUserLocation}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="bins-list">
            {smartBins.length === 0 ? (
              <div className="no-bins">
                <p>No smart bins found nearby</p>
              </div>
            ) : (
              smartBins.map((bin) => (
                <div
                  key={bin.id}
                  className={`bin-item ${selectedBin?.id === bin.id ? 'selected' : ''}`}
                  onClick={() => handleBinClick(bin)}
                >
                  <div className="bin-item-header">
                    <div className="bin-icon">🗑️</div>
                    <div className="bin-info">
                      <h4>{bin.name}</h4>
                      <p className="bin-code">{bin.code}</p>
                    </div>
                    <span className={`status-indicator ${bin.status}`}>●</span>
                  </div>
                  
                  <div className="bin-item-details">
                    <div className="detail-item">
                      <span className="detail-icon">📏</span>
                      <span className="detail-text">{bin.distance}m away</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-icon">📊</span>
                      <span className="detail-text">{bin.capacity}% full</span>
                    </div>
                  </div>

                  <div className="bin-item-actions">
                    <button
                      className="action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(bin);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Directions
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMapCenter({ lat: bin.lat, lng: bin.lng });
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon user">📍</span>
          <span>Your Location</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon bin">🗑️</span>
          <span>Smart Bin</span>
        </div>
        <div className="legend-item">
          <span className="status-indicator available">●</span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="status-indicator full">●</span>
          <span>Full</span>
        </div>
      </div>
    </div>
  );
};

export default SmartBinFinder;

