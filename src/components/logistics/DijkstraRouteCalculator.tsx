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
  Eye,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { dijkstraRouter, RouteResult, GraphNode } from '../../services/dijkstra';
import { geospatialService } from '../../services/geospatial';
import RouteMapView from './RouteMapView';
import { Place, Route } from '../../types';
import toast from 'react-hot-toast';

interface DijkstraRouteCalculatorProps {
  onRouteCalculated: (route: Route, pricing: any) => void;
}

export default function DijkstraRouteCalculator({ onRouteCalculated }: DijkstraRouteCalculatorProps) {
  const [availableNodes, setAvailableNodes] = useState<GraphNode[]>([]);
  const [sourceNode, setSourceNode] = useState<GraphNode | null>(null);
  const [destinationNode, setDestinationNode] = useState<GraphNode | null>(null);
  const [calculatedRoutes, setCalculatedRoutes] = useState<RouteResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapRoute, setMapRoute] = useState<Route | null>(null);

  useEffect(() => {
    // Load available nodes from Dijkstra router
    const nodes = dijkstraRouter.getAllNodes();
    setAvailableNodes(nodes);
  }, []);

  const calculateDijkstraRoutes = async () => {
    if (!sourceNode || !destinationNode) {
      toast.error('Please select both source and destination');
      return;
    }

    if (sourceNode.id === destinationNode.id) {
      toast.error('Source and destination cannot be the same');
      return;
    }

    setLoading(true);
    try {
      // Find multiple routes using Dijkstra algorithm
      const routes = dijkstraRouter.findMultipleRoutes(sourceNode.id, destinationNode.id);
      
      if (routes.length === 0) {
        toast.error('No route found between selected locations');
        return;
      }

      setCalculatedRoutes(routes);
      setSelectedRoute(routes[0]);
      
      // Convert to our Route format for compatibility
      const convertedRoute = convertDijkstraToRoute(routes[0], sourceNode, destinationNode);
      onRouteCalculated(convertedRoute, calculatePricing(routes[0]));
      
      toast.success(`Found ${routes.length} route${routes.length > 1 ? 's' : ''} using Dijkstra algorithm!`);
    } catch (error) {
      toast.error('Error calculating routes');
      console.error('Dijkstra route calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertDijkstraToRoute = (dijkstraRoute: RouteResult, source: GraphNode, destination: GraphNode): Route => {
    return {
      id: `dijkstra-${Date.now()}`,
      name: `Optimal Route (${dijkstraRoute.totalDistance} km)`,
      distance: dijkstraRoute.totalDistance,
      duration: dijkstraRoute.totalTime,
      coordinates: dijkstraRoute.coordinates,
      type: 'fastest',
      tollPoints: [],
      fuelStops: [],
      delays: [],
      trafficLevel: 'medium'
    };
  };

  const calculatePricing = (route: RouteResult) => {
    const fuelCost = route.totalDistance * 8; // ₹8 per km
    const tollCost = geospatialService.calculateIndianTollCost(route.coordinates, 'medium');
    const driverCost = route.totalTime * 8; // ₹8 per minute
    const maintenanceCost = route.totalDistance * 2; // ₹2 per km
    const totalCost = fuelCost + tollCost + driverCost + maintenanceCost;
    
    return {
      fuelCost: Math.round(fuelCost),
      tollCost,
      permitCost: Math.round(route.totalDistance * 0.5),
      driverCost: Math.round(driverCost),
      maintenanceCost: Math.round(maintenanceCost),
      totalCost: Math.round(totalCost),
      profitMargin: Math.round(totalCost * 0.25),
      customerPrice: Math.round(totalCost * 1.25)
    };
  };

  const handleViewOnMap = (route: RouteResult) => {
    if (!sourceNode || !destinationNode) return;
    
    const convertedRoute = convertDijkstraToRoute(route, sourceNode, destinationNode);
    setMapRoute(convertedRoute);
    setShowMap(true);
  };

  const getRouteTypeIcon = (index: number) => {
    const icons = ['⚡', '📏', '💰', '🛣️'];
    return icons[index] || '🗺️';
  };

  const getRouteTypeName = (index: number) => {
    const names = ['Fastest Route', 'Shortest Route', 'Economic Route', 'Highway Route'];
    return names[index] || 'Alternative Route';
  };

  const getRouteTypeColor = (index: number) => {
    const colors = [
      'border-blue-500 bg-blue-500/10',
      'border-green-500 bg-green-500/10', 
      'border-yellow-500 bg-yellow-500/10',
      'border-purple-500 bg-purple-500/10'
    ];
    return colors[index] || 'border-gray-500 bg-gray-500/10';
  };

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-blue-400" />
            Dijkstra Route Calculator
            <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              AI Optimized
            </span>
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Target className="w-4 h-4" />
              <span>{calculatedRoutes.length} routes calculated</span>
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

        {/* Node Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source Location
            </label>
            <select
              value={sourceNode?.id || ''}
              onChange={(e) => {
                const node = availableNodes.find(n => n.id === e.target.value);
                setSourceNode(node || null);
              }}
              className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select source location...</option>
              {availableNodes.map(node => (
                <option key={node.id} value={node.id} className="bg-gray-800">
                  {node.name} ({node.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <select
              value={destinationNode?.id || ''}
              onChange={(e) => {
                const node = availableNodes.find(n => n.id === e.target.value);
                setDestinationNode(node || null);
              }}
              className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select destination...</option>
              {availableNodes.map(node => (
                <option key={node.id} value={node.id} className="bg-gray-800">
                  {node.name} ({node.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculate Button */}
        <div className="mb-6">
          <button
            onClick={calculateDijkstraRoutes}
            disabled={!sourceNode || !destinationNode || loading}
            className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Calculating optimal routes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Calculate Routes with Dijkstra
              </>
            )}
          </button>
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
              <p className="text-2xl font-bold text-white">{selectedRoute.totalDistance}</p>
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
              <p className="text-2xl font-bold text-white">{Math.floor(selectedRoute.totalTime / 60)}h</p>
              <p className="text-xs text-gray-400">{Math.round(selectedRoute.totalTime % 60)}m</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Cost</span>
              </div>
              <p className="text-2xl font-bold text-white">₹{selectedRoute.totalCost}</p>
              <p className="text-xs text-gray-400">estimated</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Efficiency</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {Math.round((selectedRoute.totalDistance / selectedRoute.totalTime) * 60)}
              </p>
              <p className="text-xs text-gray-400">km/h avg</p>
            </motion.div>
          </div>
        )}

        {/* Calculated Routes */}
        {calculatedRoutes.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-white">Optimized Routes</h3>
            {calculatedRoutes.map((route, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedRoute === route
                    ? `${getRouteTypeColor(index)} border-2`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getRouteTypeIcon(index)}</span>
                    <div>
                      <h4 className="font-medium text-white">{getRouteTypeName(index)}</h4>
                      <div className="text-sm text-gray-400">
                        Via: {route.path.slice(1, -1).map(nodeId => {
                          const node = dijkstraRouter.getNode(nodeId);
                          return node?.name;
                        }).filter(Boolean).join(' → ')}
                      </div>
                    </div>
                    {selectedRoute === route && (
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
                      onClick={() => setSelectedRoute(route)}
                      className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                  <div className="flex items-center space-x-1 text-gray-300">
                    <RouteIcon className="w-3 h-3" />
                    <span>{route.totalDistance} km</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Clock className="w-3 h-3" />
                    <span>{Math.floor(route.totalTime / 60)}h {Math.round(route.totalTime % 60)}m</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <DollarSign className="w-3 h-3" />
                    <span>₹{route.totalCost}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Navigation className="w-3 h-3" />
                    <span>{route.segments.length} segments</span>
                  </div>
                </div>

                {/* Route Segments */}
                <div className="space-y-1">
                  {route.segments.slice(0, 3).map((segment, segIndex) => (
                    <div key={segIndex} className="text-xs text-gray-400 bg-gray-700/20 rounded px-2 py-1">
                      {segment.instructions}
                    </div>
                  ))}
                  {route.segments.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{route.segments.length - 3} more segments
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Algorithm Info */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <h4 className="font-medium text-white mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
            Dijkstra Algorithm Benefits
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Guaranteed shortest path</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Optimized for Indian highways</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Real toll cost calculation</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Traffic-aware routing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Multiple optimization criteria</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-gray-300">Indian geospatial integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Route Map Modal */}
      <AnimatePresence>
        {showMap && mapRoute && sourceNode && destinationNode && (
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
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Dijkstra Optimized Route</h3>
                    <p className="text-sm text-gray-400">
                      {sourceNode.name} → {destinationNode.name}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowMap(false)}
                  className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Map Content */}
              <div className="flex-1 relative">
                <RouteMapView
                  source={{
                    id: sourceNode.id,
                    name: sourceNode.name,
                    address: `${sourceNode.name}, India`,
                    coordinates: { lat: sourceNode.lat, lng: sourceNode.lng },
                    type: sourceNode.type as any
                  }}
                  destination={{
                    id: destinationNode.id,
                    name: destinationNode.name,
                    address: `${destinationNode.name}, India`,
                    coordinates: { lat: destinationNode.lat, lng: destinationNode.lng },
                    type: destinationNode.type as any
                  }}
                  route={mapRoute}
                  onClose={() => setShowMap(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}