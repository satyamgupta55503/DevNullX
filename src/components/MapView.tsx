import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useTracking } from '../context/TrackingContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom truck icon
const createTruckIcon = (status: string) => {
  const color = status === 'active' ? '#10b981' : status === 'idle' ? '#f59e0b' : '#ef4444';
  
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center border-2" style="border-color: ${color}">
          <div class="w-3 h-3 rounded-sm" style="background-color: ${color}"></div>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style="background-color: ${color}"></div>
      </div>
    `,
    className: 'custom-truck-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function MapController() {
  const { selectedTruck } = useTracking();
  const map = useMap();

  useEffect(() => {
    if (selectedTruck) {
      map.flyTo([selectedTruck.lat, selectedTruck.lng], 12, {
        duration: 1.5
      });
    }
  }, [selectedTruck, map]);

  return null;
}

export default function MapView() {
  const { trucks, selectedTruck, setSelectedTruck } = useTracking();
  const mapRef = useRef<any>(null);

  // Center map on India
  const center: [number, number] = [20.5937, 78.9629];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController />

        {trucks.map((truck) => (
          <React.Fragment key={truck.id}>
            <Marker
              position={[truck.lat, truck.lng]}
              icon={createTruckIcon(truck.status)}
              eventHandlers={{
                click: () => setSelectedTruck(truck),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{truck.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      truck.status === 'active' ? 'bg-green-100 text-green-800' :
                      truck.status === 'idle' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {truck.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>ID:</strong> {truck.id}</p>
                    <p><strong>Speed:</strong> {truck.speed.toFixed(0)} km/h</p>
                    <p><strong>Destination:</strong> {truck.destination}</p>
                    <p><strong>ETA:</strong> {truck.eta}</p>
                    <p><strong>Distance:</strong> {truck.distance} km</p>
                    <p><strong>Fuel:</strong> {truck.fuelLevel.toFixed(0)}%</p>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Route polyline for selected truck */}
            {selectedTruck?.id === truck.id && truck.route.length > 1 && (
              <Polyline
                positions={truck.route}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.7,
                  dashArray: '10, 10'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map overlay info */}
      <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 text-white">
        <h3 className="font-semibold mb-2">Fleet Overview</h3>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Active: {trucks.filter(t => t.status === 'active').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Idle: {trucks.filter(t => t.status === 'idle').length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Offline: {trucks.filter(t => t.status === 'offline').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}