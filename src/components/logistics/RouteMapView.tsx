import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  Fuel, 
  DollarSign, 
  Clock,
  AlertTriangle,
  Route as RouteIcon,
  Zap,
  Layers
} from 'lucide-react';
import { Place, Route } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (color: string, icon: string) => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-12 h-12 rounded-full shadow-xl flex items-center justify-center border-3 animate-pulse" style="background-color: ${color}; border-color: white;">
          <span class="text-white text-xl">${icon}</span>
        </div>
        <div class="absolute inset-0 w-12 h-12 rounded-full animate-ping" style="background-color: ${color}; opacity: 0.3;"></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
};

const createTollIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-10 h-10 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white animate-bounce">
          <span class="text-white text-sm font-bold">₹</span>
        </div>
        <div class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
      </div>
    `,
    className: 'toll-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createFuelIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-10 h-10 bg-orange-500 rounded-full shadow-lg flex items-center justify-center border-2 border-white">
          <span class="text-white text-lg">⛽</span>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
      </div>
    `,
    className: 'fuel-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Map controller component
function MapController({ route }: { route: Route }) {
  const map = useMap();

  useEffect(() => {
    if (route.coordinates.length > 0) {
      const bounds = L.latLngBounds(
        route.coordinates.map(coord => [coord.lat, coord.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);

  return null;
}

interface RouteMapViewProps {
  source: Place;
  destination: Place;
  route: Route;
  onClose: () => void;
}

export default function RouteMapView({ source, destination, route, onClose }: RouteMapViewProps) {
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'default' | 'satellite' | 'terrain'>('default');

  const getRouteColor = (type: string) => {
    switch (type) {
      case 'fastest': return '#3b82f6'; // blue
      case 'shortest': return '#10b981'; // green
      case 'economic': return '#f59e0b'; // yellow
      case 'highway': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const getRouteWeight = (type: string) => {
    switch (type) {
      case 'fastest': return 8;
      case 'shortest': return 6;
      case 'economic': return 5;
      case 'highway': return 10;
      default: return 5;
    }
  };

  const getRoutePattern = (type: string) => {
    switch (type) {
      case 'fastest': return undefined; // Solid line
      case 'shortest': return undefined; // Solid line
      case 'economic': return '15, 10'; // Dashed line
      case 'highway': return undefined; // Solid line
      default: return '10, 5'; // Dotted line
    }
  };

  const getTileLayerUrl = () => {
    switch (mapStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getTileLayerAttribution = () => {
    switch (mapStyle) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      case 'terrain':
        return '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>';
      default:
        return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    }
  };

  const center: [number, number] = route.coordinates.length > 0 
    ? [route.coordinates[0].lat, route.coordinates[0].lng]
    : [20.5937, 78.9629];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full rounded-lg"
        ref={mapRef}
      >
        <TileLayer
          attribution={getTileLayerAttribution()}
          url={getTileLayerUrl()}
        />
        
        <MapController route={route} />

        {/* Source Marker */}
        <Marker
          position={[source.coordinates.lat, source.coordinates.lng]}
          icon={createCustomIcon('#10b981', '🚀')}
        >
          <Popup>
            <div className="p-3 min-w-[250px]">
              <h3 className="font-bold text-gray-800 mb-2 text-lg">🚀 Source Location</h3>
              <p className="text-sm text-gray-700 mb-2 font-medium">{source.name}</p>
              <p className="text-xs text-gray-600 mb-3">{source.address}</p>
              <div className="bg-green-50 p-2 rounded text-xs text-green-700 border border-green-200">
                📍 {source.coordinates.lat.toFixed(6)}, {source.coordinates.lng.toFixed(6)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <strong>Type:</strong> {source.type.charAt(0).toUpperCase() + source.type.slice(1)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker
          position={[destination.coordinates.lat, destination.coordinates.lng]}
          icon={createCustomIcon('#ef4444', '🎯')}
        >
          <Popup>
            <div className="p-3 min-w-[250px]">
              <h3 className="font-bold text-gray-800 mb-2 text-lg">🎯 Destination</h3>
              <p className="text-sm text-gray-700 mb-2 font-medium">{destination.name}</p>
              <p className="text-xs text-gray-600 mb-3">{destination.address}</p>
              <div className="bg-red-50 p-2 rounded text-xs text-red-700 border border-red-200">
                📍 {destination.coordinates.lat.toFixed(6)}, {destination.coordinates.lng.toFixed(6)}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <strong>Type:</strong> {destination.type.charAt(0).toUpperCase() + destination.type.slice(1)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Enhanced Route Polyline with Road-like Appearance */}
        {route.coordinates.length > 1 && (
          <>
            {/* Road outline (darker/thicker) */}
            <Polyline
              positions={route.coordinates.map(coord => [coord.lat, coord.lng])}
              pathOptions={{
                color: '#1f2937',
                weight: getRouteWeight(route.type) + 4,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Main route line */}
            <Polyline
              positions={route.coordinates.map(coord => [coord.lat, coord.lng])}
              pathOptions={{
                color: getRouteColor(route.type),
                weight: getRouteWeight(route.type),
                opacity: 0.9,
                dashArray: getRoutePattern(route.type),
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Route highlight (lighter/thinner) */}
            <Polyline
              positions={route.coordinates.map(coord => [coord.lat, coord.lng])}
              pathOptions={{
                color: '#ffffff',
                weight: Math.max(1, getRouteWeight(route.type) - 4),
                opacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Toll Points */}
        {route.tollPoints.map((toll) => (
          <Marker
            key={toll.id}
            position={[toll.coordinates.lat, toll.coordinates.lng]}
            icon={createTollIcon()}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                  <span className="text-yellow-500 mr-2">💰</span>
                  {toll.name}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-semibold text-yellow-600">₹{toll.cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="capitalize">{toll.vehicleType}</span>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700 border border-yellow-200">
                  <strong>Note:</strong> Toll rates may vary by time and vehicle type
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Fuel Stops */}
        {route.fuelStops.map((fuel) => (
          <Marker
            key={fuel.id}
            position={[fuel.coordinates.lat, fuel.coordinates.lng]}
            icon={createFuelIcon()}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                  <span className="text-orange-500 mr-2">⛽</span>
                  {fuel.name}
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-semibold text-orange-600">₹{fuel.fuelPrice.toFixed(2)}/L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brand:</span>
                    <span className="font-medium">{fuel.brand}</span>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700 border border-orange-200">
                  <strong>Services:</strong> Diesel, Petrol, Restrooms, Parking
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Style Selector */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-2"
      >
        <div className="flex space-x-1">
          {[
            { key: 'default', icon: '🗺️', label: 'Default' },
            { key: 'satellite', icon: '🛰️', label: 'Satellite' },
            { key: 'terrain', icon: '🏔️', label: 'Terrain' }
          ].map((style) => (
            <button
              key={style.key}
              onClick={() => setMapStyle(style.key as any)}
              className={`p-2 rounded text-xs transition-colors ${
                mapStyle === style.key
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

      {/* Enhanced Route Information Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm rounded-xl p-4 text-white min-w-[320px] border border-white/20"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-6 h-6 rounded-full border-2 border-white"
            style={{ backgroundColor: getRouteColor(route.type) }}
          />
          <div>
            <h3 className="font-bold text-lg">{route.name}</h3>
            <p className="text-sm text-gray-300 capitalize">{route.type} route</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RouteIcon className="w-4 h-4 text-blue-400" />
                <span>Distance:</span>
              </div>
              <span className="font-bold text-blue-400">{route.distance} km</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span>Duration:</span>
              </div>
              <span className="font-bold text-green-400">
                {Math.floor(route.duration / 60)}h {route.duration % 60}m
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span>Tolls:</span>
              </div>
              <span className="font-bold text-yellow-400">
                ₹{route.tollPoints.reduce((sum, toll) => sum + toll.cost, 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Fuel className="w-4 h-4 text-orange-400" />
                <span>Fuel Stops:</span>
              </div>
              <span className="font-bold text-orange-400">{route.fuelStops.length}</span>
            </div>
          </div>
        </div>

        {/* Route Features */}
        <div className="mt-4 flex flex-wrap gap-2">
          {route.type === 'fastest' && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              ⚡ Fastest Route
            </span>
          )}
          {route.type === 'shortest' && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              📏 Shortest Distance
            </span>
          )}
          {route.type === 'economic' && (
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
              💰 Most Economic
            </span>
          )}
          {route.type === 'highway' && (
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
              🛣️ Highway Express
            </span>
          )}
          {route.tollPoints.length === 0 && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              🆓 No Tolls
            </span>
          )}
        </div>

        {route.delays.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs">
            <div className="flex items-center space-x-2 text-yellow-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Delay Alert</span>
            </div>
            <p className="text-yellow-300">
              {route.delays[0].delayMinutes} min delay on {route.delays[0].location}
            </p>
            <p className="text-yellow-400 mt-1 text-xs">
              Reason: {route.delays[0].reason}
            </p>
          </div>
        )}
      </motion.div>

      {/* Enhanced Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm rounded-xl p-4 text-white border border-white/20"
      >
        <h4 className="font-bold mb-3 text-sm flex items-center">
          <Layers className="w-4 h-4 mr-2" />
          Map Legend
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-500 rounded-full border border-white"></div>
            <span>🚀 Source Location</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full border border-white"></div>
            <span>🎯 Destination</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white"></div>
            <span>💰 Toll Points</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-orange-500 rounded-full border border-white"></div>
            <span>⛽ Fuel Stops</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-6 h-2 rounded border border-white"
              style={{ backgroundColor: getRouteColor(route.type) }}
            ></div>
            <span>🛣️ Route Path</span>
          </div>
        </div>
      </motion.div>

      {/* Traffic Info */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-20 right-4 bg-black/90 backdrop-blur-sm rounded-xl p-3 text-white border border-white/20"
      >
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="font-semibold text-sm">Traffic Status</span>
        </div>
        <div className={`text-sm font-bold capitalize flex items-center space-x-2 ${
          route.trafficLevel === 'low' ? 'text-green-400' :
          route.trafficLevel === 'medium' ? 'text-yellow-400' :
          route.trafficLevel === 'high' ? 'text-orange-400' : 'text-red-400'
        }`}>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            route.trafficLevel === 'low' ? 'bg-green-400' :
            route.trafficLevel === 'medium' ? 'bg-yellow-400' :
            route.trafficLevel === 'high' ? 'bg-orange-400' : 'bg-red-400'
          }`}></div>
          <span>{route.trafficLevel} Traffic</span>
        </div>
        <p className="text-xs text-gray-300 mt-1">
          Real-time traffic conditions
        </p>
      </motion.div>
    </div>
  );
}