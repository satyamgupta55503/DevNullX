import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import MapView from './map/MapView';
import TripPlanner from './trip/TripPlanner';
import TruckList from './TruckList';
import TripMetrics from './TripMetrics';
import AlertCenter from './alerts/AlertCenter';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import TruckLocationDetails from './truck/TruckLocationDetails';
import RouteCalculator from './logistics/RouteCalculator';
import DijkstraRouteCalculator from './logistics/DijkstraRouteCalculator';
import POIFinder from './logistics/POIFinder';
import LiveTracking from './logistics/LiveTracking';
import OSMMapView from './map/OSMMapView';
import { useAppStore } from '../store/useAppStore';
import { useRealTimeTracking } from '../hooks/useRealTimeTracking';
import { mockTrucks, mockAlerts, mockGeofences, mockAnalytics, generateMockTrips } from '../utils/mockData';
import { Place, Route, Truck, Coordinates } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'planner' | 'logistics'>('map');
  const [showTruckDetails, setShowTruckDetails] = useState(false);
  const [logisticsSubTab, setLogisticsSubTab] = useState<'calculator' | 'dijkstra' | 'poi' | 'tracking' | 'osm'>('calculator');
  
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    selectedTruck,
    setTrucks,
    setAlerts,
    setGeofences,
    setAnalytics,
    setTrips,
    addTrip,
    updateTruck
  } = useAppStore();

  const { isConnected, realtimeEnabled } = useRealTimeTracking();

  // Initialize mock data
  useEffect(() => {
    setTrucks(mockTrucks);
    setAlerts(mockAlerts);
    setGeofences(mockGeofences);
    setAnalytics(mockAnalytics);
    setTrips(generateMockTrips());
  }, [setTrucks, setAlerts, setGeofences, setAnalytics, setTrips]);

  // Show truck details when a truck is selected
  useEffect(() => {
    if (selectedTruck) {
      setShowTruckDetails(true);
    } else {
      setShowTruckDetails(false);
    }
  }, [selectedTruck]);

  const handleTripPlanned = (source: Place, destination: Place, route: Route, truck: Truck) => {
    const newTrip = {
      id: `trip-${Date.now()}`,
      truckId: truck.id,
      driverId: `driver-${truck.id}`,
      source,
      destination,
      selectedRoute: route,
      alternativeRoutes: [],
      status: 'planned' as const,
      startTime: new Date(),
      estimatedEndTime: new Date(Date.now() + route.duration * 60 * 1000),
      currentLocation: source.coordinates,
      distanceRemaining: route.distance,
      pricing: {
        fuelCost: Math.floor(route.distance * 8),
        tollCost: route.tollPoints.reduce((sum, toll) => sum + toll.cost, 0),
        permitCost: Math.floor(route.distance * 0.5),
        driverCost: Math.floor(route.duration / 60 * 500),
        maintenanceCost: Math.floor(route.distance * 2),
        totalCost: 0,
        profitMargin: 0,
        customerPrice: 0
      },
      alerts: [],
      checkpoints: [],
      liveTracking: []
    };

    // Calculate total pricing
    newTrip.pricing.totalCost = newTrip.pricing.fuelCost + newTrip.pricing.tollCost + 
                               newTrip.pricing.permitCost + newTrip.pricing.driverCost + 
                               newTrip.pricing.maintenanceCost;
    newTrip.pricing.profitMargin = Math.floor(newTrip.pricing.totalCost * 0.25);
    newTrip.pricing.customerPrice = newTrip.pricing.totalCost + newTrip.pricing.profitMargin;

    addTrip(newTrip);
    toast.success(`Trip created successfully! ${source.name} → ${destination.name}`);
  };

  const handleRouteCalculated = (route: Route, pricing: any) => {
    toast.success(`Route calculated: ${route.distance}km, ₹${pricing.customerPrice}`);
  };

  const handlePOISelected = (poi: any) => {
    toast.success(`Selected: ${poi.name} (${poi.distance.toFixed(1)}km away)`);
  };

  const handleLocationUpdate = (truckId: string, location: Coordinates) => {
    const truck = mockTrucks.find(t => t.id === truckId);
    if (truck) {
      const updatedTruck = {
        ...truck,
        currentLocation: location,
        lastUpdate: new Date()
      };
      updateTruck(updatedTruck);
    }
  };

  const tabs = [
    { id: 'map', label: 'Live Map', icon: '🗺️' },
    { id: 'logistics', label: 'Logistics', icon: '🚛' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'planner', label: 'Trip Planner', icon: '🎯' }
  ];

  const logisticsTabs = [
    { id: 'calculator', label: 'Route Calculator', icon: '🧮' },
    { id: 'dijkstra', label: 'Dijkstra AI', icon: '🤖' },
    { id: 'osm', label: 'OSM Map', icon: '🗺️' },
    { id: 'poi', label: 'Nearby Places', icon: '📍' },
    { id: 'tracking', label: 'Live Tracking', icon: '📡' }
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? 384 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-slate-800/50 backdrop-blur-sm border-r border-white/10 overflow-hidden"
        >
          <div className="w-96 p-4 space-y-4 h-full overflow-y-auto">
            {/* Connection Status */}
            <div className={`p-3 rounded-lg border ${
              isConnected 
                ? 'border-green-500/30 bg-green-500/10' 
                : 'border-red-500/30 bg-red-500/10'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isConnected ? 'Real-time Connected' : 'Connection Lost'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {realtimeEnabled ? 'Live tracking enabled' : 'Live tracking disabled'}
              </p>
            </div>

            {/* Alert Center */}
            <AlertCenter />
            
            {/* Truck List */}
            <TruckList />
            
            {/* Trip Metrics for Selected Truck */}
            {selectedTruck && <TripMetrics truck={selectedTruck} />}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-slate-800/30 border-b border-white/10 px-4 py-2">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Logistics Sub-tabs */}
            {activeTab === 'logistics' && (
              <div className="flex space-x-1 mt-2">
                {logisticsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLogisticsSubTab(tab.id as any)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center space-x-1 ${
                      logisticsSubTab === tab.id
                        ? 'bg-blue-400 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative">
            {activeTab === 'map' && <OSMMapView />}
            
            {activeTab === 'logistics' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                  {logisticsSubTab === 'calculator' && (
                    <RouteCalculator onRouteCalculated={handleRouteCalculated} />
                  )}
                  {logisticsSubTab === 'dijkstra' && (
                    <DijkstraRouteCalculator onRouteCalculated={handleRouteCalculated} />
                  )}
                  {logisticsSubTab === 'osm' && (
                    <div className="h-full">
                      <OSMMapView />
                    </div>
                  )}
                  {logisticsSubTab === 'poi' && selectedTruck && (
                    <POIFinder 
                      currentLocation={selectedTruck.currentLocation}
                      onPOISelected={handlePOISelected}
                    />
                  )}
                  {logisticsSubTab === 'tracking' && (
                    <LiveTracking 
                      selectedTruck={selectedTruck}
                      onLocationUpdate={handleLocationUpdate}
                    />
                  )}
                  {logisticsSubTab === 'poi' && !selectedTruck && (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-3">📍</div>
                        <p className="text-gray-400">Select a truck to find nearby places</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            
            {activeTab === 'planner' && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  <TripPlanner onTripPlanned={handleTripPlanned} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Truck Location Details Panel */}
        <AnimatePresence>
          {showTruckDetails && selectedTruck && (
            <TruckLocationDetails 
              truck={selectedTruck} 
              onClose={() => setShowTruckDetails(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}