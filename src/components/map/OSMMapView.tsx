import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Navigation, Layers, Search, MapPin, Fuel, Utensils, Hotel, Guitar as Hospital, DollarSign, Route as RouteIcon, Zap, Filter } from 'lucide-react';
import { osmService, OSMPlace, OSMNode, OSMWay } from '../../services/osmService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for different POI types
const createPOIIcon = (type: string) => {
  const iconMap: Record<string, { color: string; emoji: string }> = {
    fuel: { color: '#f97316', emoji: '⛽' },
    restaurant: { color: '#10b981', emoji: '🍽️' },
    hotel: { color: '#3b82f6', emoji: '🏨' },
    hospital: { color: '#ef4444', emoji: '🏥' },
    atm: { color: '#8b5cf6', emoji: '🏧' },
    bank: { color: '#06b6d4', emoji: '🏦' },
    toll_booth: { color: '#f59e0b', emoji: '💰' }
  };

  const config = iconMap[type] || { color: '#6b7280', emoji: '📍' };
  
  return L.divIcon({
    html: `
      <div class="relative">
        <div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-white" style="background-color: ${config.color}">
          <span class="text-white text-sm">${config.emoji}</span>
        </div>
        <div class="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style="background-color: ${config.color}"></div>
      </div>
    `,
    className: 'custom-poi-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface OSMMapViewProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (place: OSMPlace) => void;
}

export default function OSMMapView({ 
  center = [20.5937, 78.9629], // India center
  zoom = 6,
  onLocationSelect 
}: OSMMapViewProps) {
  const mapRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OSMPlace[]>([]);
  const [pois, setPOIs] = useState<OSMNode[]>([]);
  const [highways, setHighways] = useState<OSMWay[]>([]);
  const [tollPlazas, setTollPlazas] = useState<OSMNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showHighways, setShowHighways] = useState(true);
  const [showTolls, setShowTolls] = useState(true);
  const [selectedPOITypes, setSelectedPOITypes] = useState<string[]>(['fuel', 'restaurant', 'hotel']);

  // Load India-level data when map bounds change
  const handleMapBoundsChange = async (bounds: L.LatLngBounds) => {
    if (!showPOIs && !showHighways && !showTolls) return;

    const bbox: [number, number, number, number] = [
      bounds.getSouth(),
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast()
    ];

    try {
      setLoading(true);
      const data = await osmService.getIndiaLevelData(bbox, showHighways, showPOIs, showTolls);
      
      if (showHighways) setHighways(data.highways as OSMWay[]);
      if (showPOIs) setPOIs(data.pois as OSMNode[]);
      if (showTolls) setTollPlazas(data.tollPlazas as OSMNode[]);
    } catch (error) {
      console.error('Error loading OSM data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await osmService.searchPlaces(searchQuery, {
        countryCode: 'in',
        limit: 10
      });
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map event handler component
  function MapEventHandler() {
    const map = useMap();

    useEffect(() => {
      const handleMoveEnd = () => {
        const bounds = map.getBounds();
        handleMapBoundsChange(bounds);
      };

      map.on('moveend', handleMoveEnd);
      
      // Initial load
      handleMoveEnd();

      return () => {
        map.off('moveend', handleMoveEnd);
      };
    }, [map, showPOIs, showHighways, showTolls]);

    return null;
  }

  const filteredPOIs = pois.filter(poi => {
    const amenity = poi.tags?.amenity || poi.tags?.barrier;
    return selectedPOITypes.includes(amenity) || (amenity === 'toll_booth' && selectedPOITypes.includes('toll'));
  });

  const poiTypes = [
    { key: 'fuel', label: 'Fuel Stations', icon: Fuel, color: 'text-orange-400' },
    { key: 'restaurant', label: 'Restaurants', icon: Utensils, color: 'text-green-400' },
    { key: 'hotel', label: 'Hotels', icon: Hotel, color: 'text-blue-400' },
    { key: 'hospital', label: 'Hospitals', icon: Hospital, color: 'text-red-400' },
    { key: 'atm', label: 'ATMs', icon: DollarSign, color: 'text-purple-400' },
    { key: 'toll', label: 'Toll Plazas', icon: DollarSign, color: 'text-yellow-400' }
  ];

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventHandler />

        {/* Search Results */}
        {searchResults.map((place) => (
          <Marker
            key={place.place_id}
            position={[parseFloat(place.lat), parseFloat(place.lon)]}
            eventHandlers={{
              click: () => onLocationSelect?.(place),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-gray-800 mb-1">{place.display_name}</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Type:</strong> {place.type}</p>
                  <p><strong>Class:</strong> {place.class}</p>
                  {place.address && (
                    <div className="mt-2">
                      <p><strong>Address:</strong></p>
                      <p>{place.address.road && `${place.address.road}, `}
                         {place.address.city && `${place.address.city}, `}
                         {place.address.state}</p>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* POI Markers */}
        {showPOIs && filteredPOIs.map((poi) => {
          const amenity = poi.tags?.amenity || poi.tags?.barrier || 'unknown';
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lon]}
              icon={createPOIIcon(amenity)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {poi.tags?.name || `${amenity.charAt(0).toUpperCase() + amenity.slice(1)}`}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Type:</strong> {amenity}</p>
                    {poi.tags?.brand && <p><strong>Brand:</strong> {poi.tags.brand}</p>}
                    {poi.tags?.operator && <p><strong>Operator:</strong> {poi.tags.operator}</p>}
                    {poi.tags?.phone && <p><strong>Phone:</strong> {poi.tags.phone}</p>}
                    {poi.tags?.opening_hours && <p><strong>Hours:</strong> {poi.tags.opening_hours}</p>}
                    {poi.tags?.fuel && <p><strong>Fuel Types:</strong> {poi.tags.fuel}</p>}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Lat: {poi.lat.toFixed(6)}, Lon: {poi.lon.toFixed(6)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Toll Plaza Markers */}
        {showTolls && tollPlazas.map((toll) => (
          <Marker
            key={toll.id}
            position={[toll.lat, toll.lon]}
            icon={createPOIIcon('toll_booth')}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {toll.tags?.name || 'Toll Plaza'}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Type:</strong> Toll Booth</p>
                  {toll.tags?.operator && <p><strong>Operator:</strong> {toll.tags.operator}</p>}
                  {toll.tags?.fee && <p><strong>Fee:</strong> {toll.tags.fee}</p>}
                  {toll.tags?.payment && <p><strong>Payment:</strong> {toll.tags.payment}</p>}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-4 right-4 z-10"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search places in India (cities, landmarks, highways)..."
              className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Layer Controls */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 right-4 space-y-2 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
          <h4 className="text-white font-semibold mb-2 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Map Layers
          </h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showPOIs}
                onChange={(e) => setShowPOIs(e.target.checked)}
                className="rounded"
              />
              <span>POIs</span>
            </label>
            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showHighways}
                onChange={(e) => setShowHighways(e.target.checked)}
                className="rounded"
              />
              <span>Highways</span>
            </label>
            <label className="flex items-center space-x-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showTolls}
                onChange={(e) => setShowTolls(e.target.checked)}
                className="rounded"
              />
              <span>Toll Plazas</span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* POI Filter */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-4 left-4 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3">
          <h4 className="text-white font-semibold mb-2 flex items-center">
            <Filter className="w-4 h-4 mr-2" />
            POI Types
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {poiTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <button
                  key={type.key}
                  onClick={() => {
                    setSelectedPOITypes(prev => 
                      prev.includes(type.key)
                        ? prev.filter(t => t !== type.key)
                        : [...prev, type.key]
                    );
                  }}
                  className={`flex items-center space-x-2 px-2 py-1 rounded text-xs transition-colors ${
                    selectedPOITypes.includes(type.key)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 right-4 z-10"
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span>{loading ? 'Loading OSM data...' : `${filteredPOIs.length} POIs loaded`}</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Highways: {highways.length} | Tolls: {tollPlazas.length}
          </div>
        </div>
      </motion.div>
    </div>
  );
}