import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Truck, MapPin, Clock, Fuel, Navigation, Eye } from 'lucide-react';

export default function TruckList() {
  const { trucks, selectedTruck, setSelectedTruck } = useAppStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'available': return 'bg-gray-500';
      case 'maintenance': return 'bg-red-500';
      case 'offline': return 'bg-gray-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-transit': return 'In Transit';
      case 'assigned': return 'Assigned';
      case 'available': return 'Available';
      case 'maintenance': return 'Maintenance';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Truck className="w-5 h-5 mr-2 text-blue-400" />
        Fleet Status ({trucks.length})
      </h2>

      {trucks.map((truck) => (
        <div
          key={truck.id}
          className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
            selectedTruck?.id === truck.id
              ? 'bg-blue-500/20 border-2 border-blue-500/50 shadow-lg'
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(truck.status)} animate-pulse`}></div>
              <span className="text-white font-medium">{truck.registrationNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">
                {truck.id}
              </span>
              <button
                onClick={() => setSelectedTruck(selectedTruck?.id === truck.id ? null : truck)}
                className="p-1 rounded text-gray-400 hover:text-blue-400 transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status</span>
              <span className={`font-medium ${
                truck.status === 'in-transit' ? 'text-green-400' :
                truck.status === 'assigned' ? 'text-blue-400' :
                truck.status === 'available' ? 'text-gray-400' :
                truck.status === 'maintenance' ? 'text-red-400' : 'text-gray-500'
              }`}>
                {getStatusText(truck.status)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                Driver
              </span>
              <span className="text-white">{truck.driverName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Navigation className="w-3 h-3 mr-1" />
                Speed
              </span>
              <span className="text-white">{truck.speed.toFixed(0)} km/h</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Fuel className="w-3 h-3 mr-1" />
                Fuel
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      truck.fuelLevel > 50 ? 'bg-green-500' :
                      truck.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${truck.fuelLevel}%` }}
                  ></div>
                </div>
                <span className="text-white text-xs">{truck.fuelLevel.toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last Update
              </span>
              <span className="text-white text-xs">
                {truck.lastUpdate.toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Location</span>
              <span className="text-white text-xs font-mono">
                {truck.currentLocation.lat.toFixed(4)}, {truck.currentLocation.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}