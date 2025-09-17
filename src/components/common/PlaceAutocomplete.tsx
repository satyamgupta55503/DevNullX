import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, X, Navigation, Route, Fuel, Hotel, Utensils, Wrench } from 'lucide-react';
import { Place } from '../../types';
import { PlaceService } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash.debounce';

interface SearchResult {
  id: string;
  type: 'place' | 'coordinates' | 'route' | 'poi' | 'address';
  title: string;
  subtitle: string;
  coordinates?: { lat: number; lng: number };
  icon: string;
  data?: any;
}

interface PlaceAutocompleteProps {
  placeholder: string;
  value: Place | null;
  onChange: (place: Place | null) => void;
  className?: string;
  disabled?: boolean;
  enableGPS?: boolean;
  enableRoutes?: boolean;
  enablePOI?: boolean;
}

export default function PlaceAutocomplete({
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  enableGPS = true,
  enableRoutes = true,
  enablePOI = true
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get user's current location
  useEffect(() => {
    if (enableGPS && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Location access denied:', error)
      );
    }
  }, [enableGPS]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        const results = await enhancedSearch(searchQuery);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching places:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  const enhancedSearch = async (query: string): Promise<SearchResult[]> => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. GPS Coordinates Search
    if (enableGPS) {
      const coordMatch = query.match(/^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          results.push({
            id: `coords-${lat}-${lng}`,
            type: 'coordinates',
            title: `GPS Coordinates`,
            subtitle: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            coordinates: { lat, lng },
            icon: '📍'
          });
        }
      }

      // Current location suggestion
      if (currentLocation && (lowerQuery.includes('current') || lowerQuery.includes('my location') || lowerQuery.includes('here'))) {
        results.push({
          id: 'current-location',
          type: 'coordinates',
          title: 'Current Location',
          subtitle: `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
          coordinates: currentLocation,
          icon: '📱'
        });
      }
    }

    // 2. Route Keywords Search
    if (enableRoutes) {
      const routeKeywords = [
        { key: 'fastest', title: 'Fastest Route', subtitle: 'Optimized for speed via highways', icon: '⚡' },
        { key: 'shortest', title: 'Shortest Route', subtitle: 'Minimum distance path', icon: '📏' },
        { key: 'economic', title: 'Economic Route', subtitle: 'Cost-effective with minimal tolls', icon: '💰' },
        { key: 'highway', title: 'Highway Route', subtitle: 'Expressway and national highways', icon: '🛣️' },
        { key: 'bypass', title: 'Bypass Route', subtitle: 'Avoid city centers and traffic', icon: '🔄' },
        { key: 'scenic', title: 'Scenic Route', subtitle: 'Beautiful landscapes and views', icon: '🌄' }
      ];

      routeKeywords.forEach(route => {
        if (route.key.includes(lowerQuery) || route.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            id: `route-${route.key}`,
            type: 'route',
            title: route.title,
            subtitle: route.subtitle,
            icon: route.icon,
            data: { routeType: route.key }
          });
        }
      });
    }

    // 3. POI Search
    if (enablePOI) {
      const poiTypes = [
        { key: 'fuel', title: 'Fuel Stations', subtitle: 'Petrol pumps and gas stations', icon: '⛽', keywords: ['fuel', 'petrol', 'gas', 'pump'] },
        { key: 'hotel', title: 'Hotels & Lodging', subtitle: 'Accommodation and rest areas', icon: '🏨', keywords: ['hotel', 'lodge', 'accommodation', 'stay'] },
        { key: 'restaurant', title: 'Restaurants', subtitle: 'Food and dining options', icon: '🍽️', keywords: ['restaurant', 'food', 'dining', 'eat'] },
        { key: 'dhaba', title: 'Dhabas', subtitle: 'Highway food stops', icon: '🍛', keywords: ['dhaba', 'highway food', 'truck stop'] },
        { key: 'service', title: 'Service Centers', subtitle: 'Vehicle repair and maintenance', icon: '🔧', keywords: ['service', 'repair', 'garage', 'mechanic'] },
        { key: 'hospital', title: 'Hospitals', subtitle: 'Medical facilities and clinics', icon: '🏥', keywords: ['hospital', 'medical', 'clinic', 'doctor'] },
        { key: 'atm', title: 'ATMs & Banks', subtitle: 'Banking and financial services', icon: '🏧', keywords: ['atm', 'bank', 'money', 'cash'] },
        { key: 'parking', title: 'Parking Areas', subtitle: 'Vehicle parking facilities', icon: '🅿️', keywords: ['parking', 'park', 'lot'] }
      ];

      poiTypes.forEach(poi => {
        const matches = poi.keywords.some(keyword => keyword.includes(lowerQuery)) || 
                       poi.title.toLowerCase().includes(lowerQuery);
        if (matches) {
          results.push({
            id: `poi-${poi.key}`,
            type: 'poi',
            title: poi.title,
            subtitle: poi.subtitle,
            icon: poi.icon,
            data: { poiType: poi.key }
          });
        }
      });
    }

    // 4. Regular Places Search
    const places = await PlaceService.searchPlaces(query);
    places.forEach(place => {
      results.push({
        id: place.id,
        type: 'place',
        title: place.name,
        subtitle: place.address,
        coordinates: place.coordinates,
        icon: getPlaceIcon(place.type),
        data: place
      });
    });

    // 5. Address Search (if looks like an address)
    if (query.length > 10 && (query.includes(',') || query.includes('road') || query.includes('street'))) {
      results.push({
        id: `address-${query}`,
        type: 'address',
        title: 'Search Address',
        subtitle: query,
        icon: '🏠'
      });
    }

    return results.slice(0, 10); // Limit to 10 results
  };

  useEffect(() => {
    if (query && query !== value?.name) {
      setLoading(true);
      debouncedSearch(query);
    } else if (!query) {
      setSuggestions([]);
    }
  }, [query, value?.name, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setSelectedIndex(-1);
    
    if (!newQuery) {
      onChange(null);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'place') {
      setQuery(result.title);
      onChange(result.data);
    } else if (result.type === 'coordinates') {
      setQuery(result.title);
      onChange({
        id: result.id,
        name: result.title,
        address: result.subtitle,
        coordinates: result.coordinates!,
        type: 'landmark'
      });
    } else {
      setQuery(result.title);
      // Handle other types (route, poi, address) as needed
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectResult(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    onChange(null);
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getPlaceIcon = (type: string) => {
    switch (type) {
      case 'warehouse': return '🏭';
      case 'city': return '🏙️';
      case 'landmark': return '🏛️';
      case 'highway': return '🛣️';
      default: return '📍';
    }
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'coordinates': return <Navigation className="w-4 h-4" />;
      case 'route': return <Route className="w-4 h-4" />;
      case 'poi': return getPoiIcon(result.data?.poiType);
      case 'address': return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getPoiIcon = (poiType: string) => {
    switch (poiType) {
      case 'fuel': return <Fuel className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'restaurant': return <Utensils className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'coordinates': return 'text-blue-400';
      case 'route': return 'text-purple-400';
      case 'poi': return 'text-orange-400';
      case 'address': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Search places, GPS coordinates, routes, POIs..."}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
          >
            {suggestions.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectResult(result)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${getResultTypeColor(result.type)}`}>
                    {result.icon ? <span className="text-lg">{result.icon}</span> : getResultIcon(result)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    <div className="text-sm text-gray-400 truncate">{result.subtitle}</div>
                    {result.type !== 'place' && (
                      <div className={`text-xs ${getResultTypeColor(result.type)} capitalize`}>
                        {result.type}
                      </div>
                    )}
                  </div>
                  {result.coordinates && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{result.coordinates.lat.toFixed(4)}, {result.coordinates.lng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && query.length >= 2 && suggestions.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 text-center text-gray-400"
        >
          <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No results found for "{query}"</p>
          <p className="text-xs mt-1">Try GPS coordinates, place names, routes, or POI types</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Examples: "19.0760, 72.8777" • "fastest route" • "fuel stations" • "current location"</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}