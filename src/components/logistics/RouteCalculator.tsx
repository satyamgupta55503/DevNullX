import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route as RouteIcon, 
  MapPin, 
  Clock, 
  DollarSign, 
  Fuel, 
  Navigation,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Map,
  X,
  Maximize2,
  Eye
} from 'lucide-react';
import PlaceAutocomplete from '../common/PlaceAutocomplete';
import RouteMapView from './RouteMapView';
import { Place, Route } from '../../types';
import { RouteService, PricingService } from '../../services/api';
import toast from 'react-hot-toast';

interface RouteCalculatorProps {
  onRouteCalculated: (route: Route, pricing: any) => void;
}

export default function RouteCalculator({ onRouteCalculated }: RouteCalculatorProps) {
  const [source, setSource] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapRoute, setMapRoute] = useState<Route | null>(null);

  useEffect(() => {
    if (source && destination && source.id !== destination.id) {
      calculateRoutes();
    }
  }, [source, destination]);

  useEffect(() => {
    if (selectedRoute) {
      calculatePricing();
    }
  }, [selectedRoute]);

  const calculateRoutes = async () => {
    if (!source || !destination) return;
    
    setLoading(true);
    try {
      const calculatedRoutes = await RouteService.calculateRoutes(source, destination);
      setRoutes(calculatedRoutes);
      if (calculatedRoutes.length > 0) {
        setSelectedRoute(calculatedRoutes[0]);
      }
      toast.success('Routes calculated successfully!');
    } catch (error) {
      toast.error('Failed to calculate routes');
      console.error('Route calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async () => {
    if (!selectedRoute) return;

    try {
      const calculatedPricing = await PricingService.calculateTripPricing(selectedRoute, 'medium');
      setPricing(calculatedPricing);
      onRouteCalculated(selectedRoute, calculatedPricing);
    } catch (error) {
      toast.error('Failed to calculate pricing');
      console.error('Pricing calculation error:', error);
    }
  };

  const handleRouteClick = (route: Route) => {
    setSelectedRoute(route);
    setMapRoute(route);
    setShowMap(true);
  };

  const handleViewOnMap = (route: Route) => {
    setMapRoute(route);
    setShowMap(true);
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'fastest': return '⚡';
      case 'shortest': return '📏';
      case 'economic': return '💰';
      case 'highway': return '🛣️';
      default: return '🗺️';
    }
  };

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'fastest': return 'border-blue-500 bg-blue-500/10';
      case 'shortest': return 'border-green-500 bg-green-500/10';
      case 'economic': return 'border-yellow-500 bg-yellow-500/10';
      case 'highway': return 'border-purple-500 bg-purple-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const totalDistance = selectedRoute?.distance || 0;
  const totalTime = selectedRoute ? Math.floor(selectedRoute.duration / 60) : 0;
  const totalTolls = selectedRoute?.tollPoints.reduce((sum, toll) => sum + toll.cost, 0) || 0;

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-blue-400" />
            Route Calculator
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <RouteIcon className="w-4 h-4" />
              <span>{routes.length} routes found</span>
            </div>
            {selectedRoute && (
              <button
                onClick={() => handleViewOnMap(selectedRoute)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Map className="w-4 h-4" />
                <span>View on Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Source & Destination Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source Location
            </label>
            <PlaceAutocomplete
              placeholder="Search location, GPS coordinates, routes, POIs..."
              value={source}
              onChange={setSource}
              enableGPS={true}
              enableRoutes={true}
              enablePOI={true}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <PlaceAutocomplete
              placeholder="Search destination, coordinates, or nearby POIs..."
              value={destination}
              onChange={setDestination}
              enableGPS={true}
              enableRoutes={true}
              enablePOI={true}
            />
          </div>
        </div>

        {/* Route Summary Cards */}
        {selectedRoute && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <RouteIcon className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 text-sm font-medium">Distance</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalDistance}</p>
              <p className="text-xs text-gray-400">kilometers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalTime}h</p>
              <p className="text-xs text-gray-400">{selectedRoute.duration % 60}m</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Tolls</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{totalTolls}</p>
              <p className="text-xs text-gray-400">{selectedRoute.tollPoints.length} toll points</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Fuel className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Fuel Cost</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{pricing?.fuelCost || 0}</p>
              <p className="text-xs text-gray-400">estimated</p>
            </motion.div>
          </div>
        )}

        {/* Available Routes */}
        {routes.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-white">Available Routes</h3>
            {routes.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRoute?.id === route.id
                    ? `${getRouteTypeColor(route.type)} border-2`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getRouteTypeIcon(route.type)}</span>
                    <div>
                      <h4 className="font-medium text-white">{route.name}</h4>
                      <div className={`text-sm font-medium ${getTrafficColor(route.trafficLevel)}`}>
                        {route.trafficLevel} traffic
                      </div>
                    </div>
                    {selectedRoute?.id === route.id && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOnMap(route);
                      }}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                      title="View on Map"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRouteClick(route)}
                      className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <RouteIcon className="w-3 h-3" />
                    <span>{route.distance} km</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(route.duration / 60)}h {route.duration % 60}m</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <DollarSign className="w-3 h-3" />
                    <span>₹{route.tollPoints.reduce((sum, toll) => sum + toll.cost, 0)}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Fuel className="w-3 h-3" />
                    <span>{route.fuelStops.length} stops</span>
                  </div>
                </div>

                {/* Route Features */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {route.type === 'fastest' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                      Fastest Route
                    </span>
                  )}
                  {route.type === 'shortest' && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Shortest Distance
                    </span>
                  )}
                  {route.type === 'economic' && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                      Most Economic
                    </span>
                  )}
                  {route.type === 'highway' && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                      Highway Express
                    </span>
                  )}
                  {route.tollPoints.length === 0 && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      No Tolls
                    </span>
                  )}
                </div>

                {route.delays.length > 0 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{route.delays[0].delayMinutes} min delay on {route.delays[0].location}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Detailed Pricing Breakdown */}
        {pricing && selectedRoute && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-lg p-4 border border-white/10"
          >
            <h4 className="font-medium text-white mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
              Cost Breakdown for {selectedRoute.name}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fuel Cost:</span>
                  <span className="text-white">₹{pricing.fuelCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Toll Cost:</span>
                  <span className="text-white">₹{pricing.tollCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Permit Cost:</span>
                  <span className="text-white">₹{pricing.permitCost}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver Cost:</span>
                  <span className="text-white">₹{pricing.driverCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Maintenance:</span>
                  <span className="text-white">₹{pricing.maintenanceCost}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total Cost:</span>
                    <span className="text-green-400 text-lg">₹{pricing.customerPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Calculating routes...</span>
          </div>
        )}
      </div>

      {/* Route Map Modal */}
      <AnimatePresence>
        {showMap && mapRoute && source && destination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl border border-white/10 w-full max-w-6xl h-[80vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getRouteTypeIcon(mapRoute.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{mapRoute.name}</h3>
                    <p className="text-sm text-gray-400">
                      {mapRoute.distance} km • {Math.floor(mapRoute.duration / 60)}h {mapRoute.duration % 60}m
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMap(false)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowMap(false)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Map Content */}
              <div className="flex-1 relative">
                <RouteMapView
                  source={source}
                  destination={destination}
                  route={mapRoute}
                  onClose={() => setShowMap(false)}
                />
              </div>

              {/* Route Info Footer */}
              <div className="p-4 border-t border-white/10 bg-gray-800/50">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Distance</p>
                    <p className="text-white font-semibold">{mapRoute.distance} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white font-semibold">
                      {Math.floor(mapRoute.duration / 60)}h {mapRoute.duration % 60}m
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Tolls</p>
                    <p className="text-white font-semibold">
                      ₹{mapRoute.tollPoints.reduce((sum, toll) => sum + toll.cost, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Fuel Stops</p>
                    <p className="text-white font-semibold">{mapRoute.fuelStops.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Traffic</p>
                    <p className={`font-semibold capitalize ${getTrafficColor(mapRoute.trafficLevel)}`}>
                      {mapRoute.trafficLevel}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}