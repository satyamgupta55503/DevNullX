import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Route as RouteIcon, 
  MapPin, 
  Clock, 
  Fuel, 
  DollarSign, 
  AlertTriangle,
  Truck,
  ArrowRight,
  RefreshCw,
  Navigation
} from 'lucide-react';
import PlaceAutocomplete from '../common/PlaceAutocomplete';
import { Place, Route, TripPricing, Truck as TruckType } from '../../types';
import { RouteService, PricingService } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

interface TripPlannerProps {
  onTripPlanned: (source: Place, destination: Place, route: Route, truck: TruckType) => void;
}

export default function TripPlanner({ onTripPlanned }: TripPlannerProps) {
  const { trucks } = useAppStore();
  const [source, setSource] = useState<Place | null>(null);
  const [destination, setDestination] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [pricing, setPricing] = useState<TripPricing | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'places' | 'routes' | 'truck' | 'confirm'>('places');

  const availableTrucks = trucks.filter(truck => 
    truck.status === 'available' || truck.status === 'assigned'
  );

  useEffect(() => {
    if (source && destination && source.id !== destination.id) {
      calculateRoutes();
    }
  }, [source, destination]);

  useEffect(() => {
    if (selectedRoute && selectedTruck) {
      calculatePricing();
    }
  }, [selectedRoute, selectedTruck]);

  const calculateRoutes = async () => {
    if (!source || !destination) return;
    
    setLoading(true);
    try {
      const calculatedRoutes = await RouteService.calculateRoutes(source, destination);
      setRoutes(calculatedRoutes);
      if (calculatedRoutes.length > 0) {
        setSelectedRoute(calculatedRoutes[0]);
        setStep('routes');
      }
    } catch (error) {
      toast.error('Failed to calculate routes');
      console.error('Route calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = async () => {
    if (!selectedRoute || !selectedTruck) return;

    try {
      const calculatedPricing = await PricingService.calculateTripPricing(
        selectedRoute, 
        selectedTruck.vehicleType
      );
      setPricing(calculatedPricing);
    } catch (error) {
      toast.error('Failed to calculate pricing');
      console.error('Pricing calculation error:', error);
    }
  };

  const handlePlanTrip = () => {
    if (source && destination && selectedRoute && selectedTruck) {
      onTripPlanned(source, destination, selectedRoute, selectedTruck);
      toast.success('Trip planned successfully!');
      resetForm();
    }
  };

  const resetForm = () => {
    setSource(null);
    setDestination(null);
    setRoutes([]);
    setSelectedRoute(null);
    setSelectedTruck(null);
    setPricing(null);
    setStep('places');
  };

  const swapPlaces = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
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

  const getTruckStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'in-transit': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Navigation className="w-6 h-6 mr-2 text-blue-400" />
          Trip Planner
        </h2>
        <div className="flex space-x-2">
          {['places', 'routes', 'truck', 'confirm'].map((s, index) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                step === s ? 'bg-blue-500' : 
                ['places', 'routes', 'truck', 'confirm'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'places' && (
          <motion.div
            key="places"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source Location
                </label>
                <PlaceAutocomplete
                  placeholder="Search pickup location, GPS coordinates, or current location..."
                  value={source}
                  onChange={setSource}
                  enableGPS={true}
                  enableRoutes={false}
                  enablePOI={true}
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={swapPlaces}
                  className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  disabled={!source && !destination}
                >
                  <ArrowRight className="w-4 h-4 transform rotate-90" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destination
                </label>
                <PlaceAutocomplete
                  placeholder="Search delivery location, GPS coordinates, or POI..."
                  value={destination}
                  onChange={setDestination}
                  enableGPS={true}
                  enableRoutes={false}
                  enablePOI={true}
                />
              </div>
            </div>

            {source && destination && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStep('routes')}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Calculating Routes...
                  </>
                ) : (
                  <>
                    <RouteIcon className="w-4 h-4 mr-2" />
                    Find Routes
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'routes' && (
          <motion.div
            key="routes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Available Routes</h3>
              <button
                onClick={() => setStep('places')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Change Locations
              </button>
            </div>

            <div className="space-y-3">
              {routes.map((route) => (
                <motion.div
                  key={route.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRoute?.id === route.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getRouteTypeIcon(route.type)}</span>
                      <span className="font-medium text-white">{route.name}</span>
                    </div>
                    <div className={`text-sm font-medium ${getTrafficColor(route.trafficLevel)}`}>
                      {route.trafficLevel} traffic
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
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
                  </div>

                  {route.delays.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{route.delays[0].delayMinutes} min delay on {route.delays[0].location}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {selectedRoute && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStep('truck')}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all"
              >
                Select Truck
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'truck' && (
          <motion.div
            key="truck"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Select Truck</h3>
              <button
                onClick={() => setStep('routes')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Change Route
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {availableTrucks.map((truck) => (
                <motion.div
                  key={truck.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedTruck(truck)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTruck?.id === truck.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getTruckStatusColor(truck.status)}`} />
                      <div>
                        <div className="font-medium text-white">{truck.registrationNumber}</div>
                        <div className="text-sm text-gray-400">{truck.driverName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-300">{truck.capacity}T</div>
                      <div className="text-xs text-gray-500 capitalize">{truck.vehicleType}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Fuel className="w-3 h-3" />
                      <span>{truck.fuelLevel}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Truck className="w-3 h-3" />
                      <span>{truck.mileage} km/l</span>
                    </div>
                    <div className="text-green-400 capitalize">{truck.status}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedTruck && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setStep('confirm')}
                className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all"
              >
                Review & Confirm
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Trip Summary</h3>
              <button
                onClick={() => setStep('truck')}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Edit
              </button>
            </div>

            {/* Route Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-3">Route Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">From:</span>
                  <span className="text-white">{source?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">To:</span>
                  <span className="text-white">{destination?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Distance:</span>
                  <span className="text-white">{selectedRoute?.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {selectedRoute && Math.floor(selectedRoute.duration / 60)}h {selectedRoute && selectedRoute.duration % 60}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Truck:</span>
                  <span className="text-white">{selectedTruck?.registrationNumber}</span>
                </div>
              </div>
            </div>

            {/* Pricing Summary */}
            {pricing && (
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Cost Breakdown</h4>
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
                      <span className="text-green-400">₹{pricing.customerPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlanTrip}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                Create Trip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}