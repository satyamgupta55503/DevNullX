import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Fuel, 
  Utensils, 
  Bed, 
  Wrench, 
  Coffee,
  Navigation,
  Phone,
  Clock,
  Star,
  Filter,
  Search
} from 'lucide-react';
import { Coordinates } from '../../types';

interface POI {
  id: string;
  name: string;
  type: 'fuel' | 'restaurant' | 'hotel' | 'service' | 'dhaba' | 'rest_area';
  coordinates: Coordinates;
  distance: number;
  rating: number;
  phone?: string;
  hours?: string;
  amenities: string[];
  price?: string;
}

interface POIFinderProps {
  currentLocation: Coordinates;
  onPOISelected: (poi: POI) => void;
}

export default function POIFinder({ currentLocation, onPOISelected }: POIFinderProps) {
  const [pois, setPOIs] = useState<POI[]>([]);
  const [filteredPOIs, setFilteredPOIs] = useState<POI[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNearbyPOIs();
  }, [currentLocation]);

  useEffect(() => {
    filterPOIs();
  }, [pois, selectedType, searchQuery]);

  const fetchNearbyPOIs = async () => {
    setLoading(true);
    try {
      // Mock POI data - in real app, this would come from Google Places API or similar
      const mockPOIs: POI[] = [
        {
          id: 'poi-1',
          name: 'HP Petrol Pump',
          type: 'fuel',
          coordinates: { lat: currentLocation.lat + 0.01, lng: currentLocation.lng + 0.01 },
          distance: 1.2,
          rating: 4.2,
          phone: '+91-9876543210',
          hours: '24/7',
          amenities: ['Diesel', 'Petrol', 'CNG', 'ATM', 'Restroom'],
          price: '₹102.50/L'
        },
        {
          id: 'poi-2',
          name: 'Punjabi Dhaba',
          type: 'dhaba',
          coordinates: { lat: currentLocation.lat + 0.02, lng: currentLocation.lng - 0.01 },
          distance: 2.1,
          rating: 4.5,
          phone: '+91-9876543211',
          hours: '6:00 AM - 11:00 PM',
          amenities: ['Parking', 'AC', 'Punjabi Food', 'Truck Parking'],
          price: '₹150-300'
        },
        {
          id: 'poi-3',
          name: 'Highway Lodge',
          type: 'hotel',
          coordinates: { lat: currentLocation.lat - 0.01, lng: currentLocation.lng + 0.02 },
          distance: 1.8,
          rating: 3.8,
          phone: '+91-9876543212',
          hours: '24/7',
          amenities: ['AC Rooms', 'Parking', 'WiFi', 'Restaurant'],
          price: '₹800-1500/night'
        },
        {
          id: 'poi-4',
          name: 'Truck Service Center',
          type: 'service',
          coordinates: { lat: currentLocation.lat + 0.015, lng: currentLocation.lng - 0.02 },
          distance: 2.5,
          rating: 4.0,
          phone: '+91-9876543213',
          hours: '8:00 AM - 8:00 PM',
          amenities: ['Tire Repair', 'Engine Service', 'Spare Parts', 'Washing'],
          price: '₹500-5000'
        },
        {
          id: 'poi-5',
          name: 'Indian Oil Station',
          type: 'fuel',
          coordinates: { lat: currentLocation.lat - 0.02, lng: currentLocation.lng - 0.01 },
          distance: 3.2,
          rating: 4.1,
          phone: '+91-9876543214',
          hours: '24/7',
          amenities: ['Diesel', 'Petrol', 'Lubricants', 'Convenience Store'],
          price: '₹101.80/L'
        },
        {
          id: 'poi-6',
          name: 'Highway Rest Area',
          type: 'rest_area',
          coordinates: { lat: currentLocation.lat + 0.03, lng: currentLocation.lng + 0.015 },
          distance: 4.1,
          rating: 3.9,
          amenities: ['Parking', 'Restrooms', 'Food Court', 'ATM', 'Medical Aid'],
          hours: '24/7'
        }
      ];

      setPOIs(mockPOIs);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPOIs = () => {
    let filtered = pois;

    if (selectedType !== 'all') {
      filtered = filtered.filter(poi => poi.type === selectedType);
    }

    if (searchQuery) {
      filtered = filtered.filter(poi => 
        poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poi.amenities.some(amenity => amenity.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    setFilteredPOIs(filtered);
  };

  const getPOIIcon = (type: string) => {
    switch (type) {
      case 'fuel': return Fuel;
      case 'restaurant': return Utensils;
      case 'hotel': return Bed;
      case 'service': return Wrench;
      case 'dhaba': return Coffee;
      case 'rest_area': return MapPin;
      default: return MapPin;
    }
  };

  const getPOIColor = (type: string) => {
    switch (type) {
      case 'fuel': return 'text-orange-400 bg-orange-400/10';
      case 'restaurant': return 'text-green-400 bg-green-400/10';
      case 'hotel': return 'text-blue-400 bg-blue-400/10';
      case 'service': return 'text-red-400 bg-red-400/10';
      case 'dhaba': return 'text-yellow-400 bg-yellow-400/10';
      case 'rest_area': return 'text-purple-400 bg-purple-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const poiTypes = [
    { key: 'all', label: 'All', icon: MapPin },
    { key: 'fuel', label: 'Fuel', icon: Fuel },
    { key: 'dhaba', label: 'Dhaba', icon: Coffee },
    { key: 'hotel', label: 'Hotels', icon: Bed },
    { key: 'service', label: 'Service', icon: Wrench },
    { key: 'rest_area', label: 'Rest Area', icon: MapPin }
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <MapPin className="w-6 h-6 mr-2 text-green-400" />
          Nearby Places
        </h2>
        <div className="text-sm text-gray-400">
          {filteredPOIs.length} places found
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search places or amenities..."
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {poiTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.key}
              onClick={() => setSelectedType(type.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === type.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* POI List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredPOIs.map((poi, index) => {
            const IconComponent = getPOIIcon(poi.type);
            
            return (
              <motion.div
                key={poi.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onPOISelected(poi)}
                className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getPOIColor(poi.type)}`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-white truncate">{poi.name}</h4>
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs">{poi.rating}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                      <div className="flex items-center space-x-1">
                        <Navigation className="w-3 h-3" />
                        <span>{poi.distance.toFixed(1)} km away</span>
                      </div>
                      {poi.hours && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{poi.hours}</span>
                        </div>
                      )}
                      {poi.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{poi.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {poi.price && (
                      <div className="text-sm text-green-400 mb-2 font-medium">
                        {poi.price}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {poi.amenities.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {poi.amenities.length > 4 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          +{poi.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-white">Finding nearby places...</span>
        </div>
      )}

      {filteredPOIs.length === 0 && !loading && (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No places found</p>
          <p className="text-xs text-gray-500 mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}