import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';
import { Truck, Geofence } from '../../types';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  Layers, 
  Eye, 
  EyeOff, 
  Zap, 
  MapPin,
  Fuel,
  Clock,
  AlertTriangle
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom truck icon based on status and type
const createTruckIcon = (truck: Truck) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return '#10b981';
      case 'assigned': return '#3b82f6';
      case 'available': return '#6b7280';
      case 'maintenance': return '#ef4444';
      case 'offline': return '#374151';
      default: return '#6b7280';
    }
  };

  const getTruckEmoji = (type: string) => {
    switch (type) {
      case 'mini': return '🚐';
      case 'small': return '🚚';
      case 'medium': return '🚛';
      case 'large': return '🚜';
      case 'trailer': return '🚛';
      default: return '🚚';
    }
  };

  const color = getStatusColor(truck.status);
  const emoji = getTruckEmoji(truck.vehicleType);
  
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-3" style="border-color: ${color}">
          <span class="text-lg">${emoji}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse" style="background-color: ${color}"></div>
        ${truck.speed > 0 ? `
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div class="bg-black text-white text-xs px-1 rounded">${Math.round(truck.speed)} km/h</div>
          </div>
        ` : ''}
      </div>
    `,
    className: 'custom-truck-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map controller component
function MapController() {
  const { selectedTruck, selectedTrip } = useAppStore();
  const map = useMap();

  useEffect(() => {
    if (selectedTruck) {
      map.flyTo([selectedTruck.currentLocation.lat, selectedTruck.currentLocation.lng], 12, {
        duration: 1.5
      });
    } else if (selectedTrip) {
      map.flyTo([selectedTrip.currentLocation.lat, selectedTrip.currentLocation.lng], 10, {
        duration: 1.5
      });
    }
  }, [selectedTruck, selectedTrip, map]);

  return null;
}

// Geofence component
function GeofenceLayer({ geofence }: { geofence: Geofence }) {
  if (!geofence.active) return null;

  if (geofence.type === 'circular' && typeof geofence.coordinates === 'object' && 'lat' in geofence.coordinates) {
    return (
      <Circle
        center={[geofence.coordinates.lat, geofence.coordinates.lng]}
        radius={geofence.radius || 1000}
        pathOptions={{
          color: geofence.color,
          fillColor: geofence.color,
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '5, 5'
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{geofence.name}</h3>
            <p className="text-sm text-gray-600">
              Radius: {((geofence.radius || 0) / 1000).toFixed(1)} km
            </p>
            <div className="flex space-x-2 mt-2 text-xs">
              {geofence.alertOnEntry && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Entry Alert</span>
              )}
              {geofence.alertOnExit && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Exit Alert</span>
              )}
            </div>
          </div>
        </Popup>
      </Circle>
    );
  }

  return null;
}

export default function MapView() {
  const { 
    trucks, 
    selectedTruck, 
    setSelectedTruck,
    trips,
    selectedTrip,
    geofences,
    mapView,
    showTraffic,
    showGeofences,
    setMapView,
    setShowTraffic,
    setShowGeofences
  } = useAppStore();

  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Center map on India
  const center: [number, number] = [20.5937, 78.9629];

  const getTileLayerUrl = () => {
    switch (mapView) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileLayerAttribution = () => {
    switch (mapView) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      case 'terrain':
        return '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }
  };

  const activeTrips = trips.filter(trip => 
    trip.status === 'started' || trip.status === 'in-progress'
  );

  const getStatusStats = () => {
    const stats = {
      active: trucks.filter(t => t.status === 'in-transit').length,
      assigned: trucks.filter(t => t.status === 'assigned').length,
      available: trucks.filter(t => t.status === 'available').length,
      maintenance: trucks.filter(t => t.status === 'maintenance').length,
      offline: trucks.filter(t => t.status === 'offline').length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        ref={mapRef}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />
        
        <MapController />

        {/* Truck markers */}
        {trucks.map((truck) => (
          <Marker
            key={truck.id}
            position={[truck.currentLocation.lat, truck.currentLocation.lng]}
            icon={createTruckIcon(truck)}
            eventHandlers={{
              click: () => setSelectedTruck(truck),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[250px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{truck.registrationNumber}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    truck.status === 'in-transit' ? 'bg-green-100 text-green-800' :
                    truck.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    truck.status === 'available' ? 'bg-gray-100 text-gray-800' :
                    truck.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {truck.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span><strong>Driver:</strong> {truck.driverName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4" />
                    <span><strong>Speed:</strong> {truck.speed.toFixed(0)} km/h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-4 h-4" />
                    <span><strong>Fuel:</strong> {truck.fuelLevel.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span><strong>Last Update:</strong> {truck.lastUpdate.toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <strong>Capacity:</strong> {truck.capacity}T ({truck.vehicleType})
                  </div>
                  <div>
                    <strong>Phone:</strong> {truck.driverPhone}
                  </div>
                </div>

                {truck.fuelLevel < 20 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low fuel alert!</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Trip routes */}
        {activeTrips.map((trip) => (
          <React.Fragment key={trip.id}>
            {trip.selectedRoute.coordinates.length > 1 && (
              <Polyline
                positions={trip.selectedRoute.coordinates.map(coord => [coord.lat, coord.lng])}
                pathOptions={{
                  color: selectedTrip?.id === trip.id ? '#3b82f6' : '#6b7280',
                  weight: selectedTrip?.id === trip.id ? 4 : 2,
                  opacity: 0.7,
                  dashArray: selectedTrip?.id === trip.id ? undefined : '10, 10'
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Geofences */}
        {showGeofences && geofences.map((geofence) => (
          <GeofenceLayer key={geofence.id} geofence={geofence} />
        ))}
      </MapContainer>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {/* Map Style Selector */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/20 backdrop-blur-sm rounded-lg p-2"
        >
          <div className="flex space-x-1">
            {[
              { key: 'default', icon: '🗺️', label: 'Default' },
              { key: 'satellite', icon: '🛰️', label: 'Satellite' },
              { key: 'terrain', icon: '🏔️', label: 'Terrain' }
            ].map((style) => (
              <button
                key={style.key}
                onClick={() => setMapView(style.key as any)}
                className={`p-2 rounded text-xs transition-colors ${
                  mapView === style.key
                    ? 'bg-blue-500 text-white'
                    : 'text-white hover:bg-white/20'
                }`}
                title={style.label}
              >
                {style.icon}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Layer Controls */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/20 backdrop-blur-sm rounded-lg p-2 space-y-1"
        >
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`w-full p-2 rounded text-xs transition-colors flex items-center space-x-2 ${
              showTraffic
                ? 'bg-orange-500 text-white'
                : 'text-white hover:bg-white/20'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Traffic</span>
          </button>
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`w-full p-2 rounded text-xs transition-colors flex items-center space-x-2 ${
              showGeofences
                ? 'bg-purple-500 text-white'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {showGeofences ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>Zones</span>
          </button>
        </motion.div>
      </div>

      {/* Fleet Status Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 text-white min-w-[200px]"
      >
        <h3 className="font-semibold mb-3 flex items-center">
          <Layers className="w-4 h-4 mr-2" />
          Fleet Status
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>In Transit</span>
            </div>
            <span className="font-medium">{stats.active}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Assigned</span>
            </div>
            <span className="font-medium">{stats.assigned}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <span className="font-medium">{stats.available}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Maintenance</span>
            </div>
            <span className="font-medium">{stats.maintenance}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-700 rounded-full"></div>
              <span>Offline</span>
            </div>
            <span className="font-medium">{stats.offline}</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="text-xs text-gray-300">
            Total Fleet: <span className="font-medium text-white">{trucks.length}</span>
          </div>
          <div className="text-xs text-gray-300">
            Active Trips: <span className="font-medium text-white">{activeTrips.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Selected Truck Info */}
      {selectedTruck && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-4 text-white min-w-[250px]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{selectedTruck.registrationNumber}</h3>
            <button
              onClick={() => setSelectedTruck(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Driver:</span>
              <span>{selectedTruck.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Speed:</span>
              <span>{selectedTruck.speed.toFixed(0)} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Fuel:</span>
              <span className={selectedTruck.fuelLevel < 20 ? 'text-red-400' : 'text-green-400'}>
                {selectedTruck.fuelLevel.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="capitalize">{selectedTruck.status}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}