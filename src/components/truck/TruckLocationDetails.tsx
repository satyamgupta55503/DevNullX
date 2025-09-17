import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Fuel, 
  Route as RouteIcon,
  Gauge,
  Phone,
  User,
  Truck as TruckIcon,
  Target,
  AlertTriangle,
  Battery,
  Signal,
  Calendar,
  Activity
} from 'lucide-react';
import { Truck, Coordinates } from '../../types';
import { format } from 'date-fns';

interface TruckLocationDetailsProps {
  truck: Truck;
  onClose: () => void;
}

export default function TruckLocationDetails({ truck, onClose }: TruckLocationDetailsProps) {
  const [distanceFromOrigin, setDistanceFromOrigin] = useState<number>(0);
  const [nearestLandmark, setNearestLandmark] = useState<string>('');
  const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);

  // Mock destination for demo (in real app, this would come from active trip)
  const mockDestination: Coordinates = { lat: 28.6139, lng: 77.2090 }; // Delhi
  const mockOrigin: Coordinates = { lat: 19.0760, lng: 72.8777 }; // Mumbai

  useEffect(() => {
    // Calculate distance from origin
    const distFromOrigin = calculateDistance(truck.currentLocation, mockOrigin);
    setDistanceFromOrigin(distFromOrigin);

    // Mock nearest landmark
    setNearestLandmark('NH-48 Highway, Near Panvel');

    // Calculate estimated arrival
    if (truck.speed > 0) {
      const distanceToDestination = calculateDistance(truck.currentLocation, mockDestination);
      const hoursToDestination = distanceToDestination / truck.speed;
      const arrivalTime = new Date(Date.now() + hoursToDestination * 60 * 60 * 1000);
      setEstimatedArrival(arrivalTime);
    }
  }, [truck.currentLocation, truck.speed]);

  const calculateDistance = (coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'text-green-400 bg-green-400/10';
      case 'assigned': return 'text-blue-400 bg-blue-400/10';
      case 'available': return 'text-gray-400 bg-gray-400/10';
      case 'maintenance': return 'text-red-400 bg-red-400/10';
      case 'offline': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level > 50) return 'text-green-400';
    if (level > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSpeedStatus = (speed: number) => {
    if (speed === 0) return { text: 'Stationary', color: 'text-gray-400' };
    if (speed < 30) return { text: 'Slow', color: 'text-yellow-400' };
    if (speed < 60) return { text: 'Normal', color: 'text-green-400' };
    if (speed < 80) return { text: 'Fast', color: 'text-blue-400' };
    return { text: 'Very Fast', color: 'text-red-400' };
  };

  const speedStatus = getSpeedStatus(truck.speed);
  const distanceToDestination = calculateDistance(truck.currentLocation, mockDestination);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-sm border-l border-white/10 z-50 overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <TruckIcon className="w-6 h-6 mr-2 text-blue-400" />
            Truck Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>

        {/* Truck Basic Info */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">{truck.registrationNumber}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(truck.status)}`}>
              {truck.status}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Driver</p>
                <p className="text-white font-medium">{truck.driverName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Contact</p>
                <p className="text-white font-medium">{truck.driverPhone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TruckIcon className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Type</p>
                <p className="text-white font-medium capitalize">{truck.vehicleType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-400">Capacity</p>
                <p className="text-white font-medium">{truck.capacity}T</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-green-400" />
            Current Location
          </h4>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">Coordinates</p>
              <p className="text-white font-mono">
                {truck.currentLocation.lat.toFixed(6)}, {truck.currentLocation.lng.toFixed(6)}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400">Nearest Landmark</p>
              <p className="text-white">{nearestLandmark}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-gray-400">Distance from Origin</p>
                <p className="text-white font-medium">{distanceFromOrigin.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-gray-400">Distance to Destination</p>
                <p className="text-white font-medium">{distanceToDestination.toFixed(1)} km</p>
              </div>
            </div>
          </div>
        </div>

        {/* Movement & Speed */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Gauge className="w-4 h-4 mr-2 text-blue-400" />
            Movement Status
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400">Current Speed</p>
              <div className="flex items-center space-x-2">
                <p className="text-white font-bold text-lg">{truck.speed.toFixed(0)}</p>
                <span className="text-gray-400">km/h</span>
                <span className={`text-xs px-2 py-1 rounded ${speedStatus.color} bg-current/10`}>
                  {speedStatus.text}
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400">Heading</p>
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-gray-400" style={{ transform: `rotate(${truck.heading}deg)` }} />
                <p className="text-white font-medium">{truck.heading.toFixed(0)}°</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fuel & Vehicle Status */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Fuel className="w-4 h-4 mr-2 text-orange-400" />
            Vehicle Status
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Fuel Level</span>
                <span className={`font-medium ${getFuelLevelColor(truck.fuelLevel)}`}>
                  {truck.fuelLevel.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    truck.fuelLevel > 50 ? 'bg-green-500' :
                    truck.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${truck.fuelLevel}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Fuel Type</p>
                <p className="text-white font-medium capitalize">{truck.fuelType}</p>
              </div>
              <div>
                <p className="text-gray-400">Mileage</p>
                <p className="text-white font-medium">{truck.mileage} km/l</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Information */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <RouteIcon className="w-4 h-4 mr-2 text-purple-400" />
            Trip Information
          </h4>
          
          <div className="space-y-3 text-sm">
            {estimatedArrival && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Estimated Arrival</span>
                <span className="text-white font-medium">
                  {format(estimatedArrival, 'MMM dd, HH:mm')}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-medium">
                {((distanceFromOrigin / (distanceFromOrigin + distanceToDestination)) * 100).toFixed(0)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(distanceFromOrigin / (distanceFromOrigin + distanceToDestination)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Activity className="w-4 h-4 mr-2 text-cyan-400" />
            System Status
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Last Update</span>
              </div>
              <span className="text-white">
                {format(truck.lastUpdate, 'HH:mm:ss')}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Signal className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">GPS Signal</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs">Strong</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Battery className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400">Device Battery</span>
              </div>
              <span className="text-white">85%</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {truck.fuelLevel < 25 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Low Fuel Alert</span>
            </div>
            <p className="text-red-300 text-sm mt-1">
              Fuel level is below 25%. Consider refueling soon.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Track on Map
          </button>
          <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
            Contact Driver
          </button>
        </div>
      </div>
    </motion.div>
  );
}