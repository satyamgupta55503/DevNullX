import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Gauge, 
  Battery,
  Signal,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Truck, Coordinates } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface LiveTrackingProps {
  selectedTruck: Truck | null;
  onLocationUpdate: (truckId: string, location: Coordinates) => void;
}

export default function LiveTracking({ selectedTruck, onLocationUpdate }: LiveTrackingProps) {
  const { trucks } = useAppStore();
  const [isTracking, setIsTracking] = useState(true);
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  useEffect(() => {
    if (selectedTruck && isTracking) {
      const interval = setInterval(() => {
        // Simulate GPS updates
        const newLocation = simulateGPSUpdate(selectedTruck);
        onLocationUpdate(selectedTruck.id, newLocation);
        
        // Add to tracking history
        setTrackingHistory(prev => [...prev.slice(-100), {
          timestamp: new Date(),
          location: newLocation,
          speed: selectedTruck.speed,
          heading: selectedTruck.heading
        }]);
      }, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [selectedTruck, isTracking, onLocationUpdate]);

  const simulateGPSUpdate = (truck: Truck): Coordinates => {
    // Simulate realistic GPS movement
    const speedKmh = truck.speed;
    const speedMs = speedKmh / 3.6; // Convert to m/s
    const timeInterval = 5; // 5 seconds
    const distanceM = speedMs * timeInterval;
    
    // Convert distance to lat/lng offset
    const earthRadius = 6371000; // meters
    const latOffset = (distanceM / earthRadius) * (180 / Math.PI);
    const lngOffset = (distanceM / (earthRadius * Math.cos(truck.currentLocation.lat * Math.PI / 180))) * (180 / Math.PI);
    
    // Apply heading
    const headingRad = truck.heading * Math.PI / 180;
    const newLat = truck.currentLocation.lat + (latOffset * Math.cos(headingRad));
    const newLng = truck.currentLocation.lng + (lngOffset * Math.sin(headingRad));
    
    return { lat: newLat, lng: newLng };
  };

  const getSignalStrength = () => {
    return Math.floor(Math.random() * 30) + 70; // 70-100%
  };

  const getBatteryLevel = () => {
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  };

  const getGPSAccuracy = () => {
    return Math.floor(Math.random() * 10) + 3; // 3-13 meters
  };

  if (!selectedTruck) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="text-center py-8">
          <Navigation className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">Select a truck to start live tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Navigation className="w-6 h-6 mr-2 text-green-400" />
          Live Tracking
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`p-2 rounded-lg transition-colors ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setTrackingHistory([])}
            className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Truck Status */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{selectedTruck.registrationNumber}</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className={`text-sm ${isTracking ? 'text-green-400' : 'text-gray-400'}`}>
              {isTracking ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Gauge className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{selectedTruck.speed.toFixed(0)}</p>
            <p className="text-xs text-gray-400">km/h</p>
          </div>
          
          <div className="text-center">
            <Navigation className="w-6 h-6 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{selectedTruck.heading.toFixed(0)}°</p>
            <p className="text-xs text-gray-400">heading</p>
          </div>
          
          <div className="text-center">
            <Signal className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{getSignalStrength()}%</p>
            <p className="text-xs text-gray-400">signal</p>
          </div>
          
          <div className="text-center">
            <Battery className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{getBatteryLevel()}%</p>
            <p className="text-xs text-gray-400">battery</p>
          </div>
        </div>
      </div>

      {/* GPS Information */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-6">
        <h4 className="font-medium text-white mb-3 flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-green-400" />
          GPS Information
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Coordinates:</span>
            <span className="text-white font-mono">
              {selectedTruck.currentLocation.lat.toFixed(6)}, {selectedTruck.currentLocation.lng.toFixed(6)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Accuracy:</span>
            <span className="text-white">±{getGPSAccuracy()}m</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Last Update:</span>
            <span className="text-white">{selectedTruck.lastUpdate.toLocaleTimeString()}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Satellites:</span>
            <span className="text-white">{Math.floor(Math.random() * 5) + 8}</span>
          </div>
        </div>
      </div>

      {/* Tracking History */}
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white flex items-center">
            <Clock className="w-4 h-4 mr-2 text-blue-400" />
            Tracking History
          </h4>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {trackingHistory.slice(-10).reverse().map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-2 bg-gray-700/30 rounded text-xs"
            >
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-white">
                  {entry.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="text-gray-400">
                {entry.speed.toFixed(0)} km/h
              </div>
            </motion.div>
          ))}
        </div>
        
        {trackingHistory.length === 0 && (
          <div className="text-center py-4 text-gray-400 text-sm">
            No tracking data available
          </div>
        )}
      </div>

      {/* Status Indicators */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-green-400">GPS Connected</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">Data Streaming</span>
          </div>
        </div>
        
        <div className="text-gray-400">
          Updates every 5 seconds
        </div>
      </div>
    </div>
  );
}