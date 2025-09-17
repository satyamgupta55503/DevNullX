import React from 'react';
import { TruckLocation } from '../context/TrackingContext';
import { 
  MapPin, 
  Clock, 
  Route, 
  Fuel, 
  Gauge, 
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface TripMetricsProps {
  truck: TruckLocation;
}

export default function TripMetrics({ truck }: TripMetricsProps) {
  const estimatedFuelCost = (truck.distance * 0.8).toFixed(2);
  const tollCost = (truck.distance * 0.15).toFixed(2);
  const totalCost = (parseFloat(estimatedFuelCost) + parseFloat(tollCost)).toFixed(2);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
        Trip Analytics
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-3 rounded-lg border border-blue-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Speed</span>
          </div>
          <p className="text-xl font-bold text-white">{truck.speed.toFixed(0)}</p>
          <p className="text-xs text-gray-400">km/h</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-3 rounded-lg border border-green-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Route className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Distance</span>
          </div>
          <p className="text-xl font-bold text-white">{truck.distance}</p>
          <p className="text-xs text-gray-400">km remaining</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-3 rounded-lg border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">ETA</span>
          </div>
          <p className="text-xl font-bold text-white">{truck.eta}</p>
          <p className="text-xs text-gray-400">Today</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-3 rounded-lg border border-orange-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Fuel className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-medium">Fuel</span>
          </div>
          <p className="text-xl font-bold text-white">{truck.fuelLevel.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Remaining</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-lg border border-white/10">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-yellow-400" />
          Cost Estimation
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Fuel Cost</span>
            <span className="text-white">₹{estimatedFuelCost}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Toll Cost</span>
            <span className="text-white">₹{tollCost}</span>
          </div>
          <div className="border-t border-white/10 pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span className="text-white">Total Estimated</span>
              <span className="text-green-400">₹{totalCost}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-lg border border-white/10">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-blue-400" />
          Last Update
        </h4>
        <p className="text-gray-400 text-sm">
          {format(truck.lastUpdate, 'MMM dd, yyyy HH:mm:ss')}
        </p>
        <div className="flex items-center mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-green-400 text-xs">Live</span>
        </div>
      </div>
    </div>
  );
}