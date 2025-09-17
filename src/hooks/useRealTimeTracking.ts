import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { websocketService } from '../services/websocket';
import { LiveTrackingData, Truck } from '../types';

export function useRealTimeTracking() {
  const { 
    trucks, 
    realtimeEnabled, 
    setTrucks, 
    updateTruck,
    systemStatus,
    setSystemStatus 
  } = useAppStore();
  
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const enableWebSocketBackend = import.meta.env.VITE_ENABLE_WEBSOCKET_BACKEND === 'true';

  // Initialize WebSocket connection only if backend is enabled
  useEffect(() => {
    if (realtimeEnabled && enableWebSocketBackend) {
      websocketService.connect();
    }

    return () => {
      if (enableWebSocketBackend) {
        websocketService.disconnect();
      }
    };
  }, [realtimeEnabled, enableWebSocketBackend]);

  // Simulate real-time GPS data for demo purposes
  useEffect(() => {
    if (!realtimeEnabled) return;

    // Start GPS simulation
    simulationInterval.current = setInterval(() => {
      simulateGPSUpdates();
    }, 5000); // Update every 5 seconds

    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [realtimeEnabled, trucks]);

  const simulateGPSUpdates = () => {
    const activeTrucks = trucks.filter(truck => 
      truck.status === 'in-transit' || truck.status === 'assigned'
    );

    activeTrucks.forEach(truck => {
      // Simulate GPS movement
      const newLocation = simulateMovement(truck);
      
      // Create tracking data
      const trackingData: LiveTrackingData = {
        id: `track_${Date.now()}_${truck.id}`,
        truckId: truck.id,
        tripId: '', // Would be populated from active trip
        coordinates: newLocation.coordinates,
        speed: newLocation.speed,
        heading: newLocation.heading,
        timestamp: new Date(),
        accuracy: 5 + Math.random() * 10, // 5-15 meters
        altitude: 100 + Math.random() * 500,
        batteryLevel: 80 + Math.random() * 20,
        signalStrength: 70 + Math.random() * 30
      };

      // Update truck in store
      const updatedTruck: Truck = {
        ...truck,
        currentLocation: newLocation.coordinates,
        speed: newLocation.speed,
        heading: newLocation.heading,
        lastUpdate: new Date(),
        fuelLevel: Math.max(0, truck.fuelLevel - 0.1) // Simulate fuel consumption
      };

      updateTruck(updatedTruck);

      // Emit to WebSocket only if backend is enabled
      if (enableWebSocketBackend) {
        websocketService.emit('gps_data', trackingData);
      }
    });

    // Update system status
    setSystemStatus({
      ...systemStatus,
      activeTrucks: activeTrucks.length,
      messagesPerSecond: activeTrucks.length / 5, // 5 second interval
      systemLoad: Math.random() * 100
    });
  };

  const simulateMovement = (truck: Truck) => {
    const { currentLocation, speed, heading } = truck;
    
    // Simulate realistic movement
    const speedVariation = (Math.random() - 0.5) * 10; // ±5 km/h variation
    const newSpeed = Math.max(0, Math.min(100, speed + speedVariation));
    
    const headingVariation = (Math.random() - 0.5) * 20; // ±10 degree variation
    const newHeading = (heading + headingVariation + 360) % 360;
    
    // Calculate new position based on speed and heading
    const distanceKm = (newSpeed / 3600) * 5; // Distance in 5 seconds
    const earthRadius = 6371; // km
    
    const lat1 = currentLocation.lat * Math.PI / 180;
    const lng1 = currentLocation.lng * Math.PI / 180;
    const bearing = newHeading * Math.PI / 180;
    
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceKm / earthRadius) +
      Math.cos(lat1) * Math.sin(distanceKm / earthRadius) * Math.cos(bearing)
    );
    
    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceKm / earthRadius) * Math.cos(lat1),
      Math.cos(distanceKm / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      coordinates: {
        lat: lat2 * 180 / Math.PI,
        lng: lng2 * 180 / Math.PI
      },
      speed: newSpeed,
      heading: newHeading
    };
  };

  const startTracking = (truckId: string) => {
    if (enableWebSocketBackend) {
      websocketService.emit('start_tracking', { truckId });
    }
  };

  const stopTracking = (truckId: string) => {
    if (enableWebSocketBackend) {
      websocketService.emit('stop_tracking', { truckId });
    }
  };

  const enableRealTime = () => {
    useAppStore.getState().setRealtimeEnabled(true);
  };

  const disableRealTime = () => {
    useAppStore.getState().setRealtimeEnabled(false);
  };

  return {
    isConnected: enableWebSocketBackend ? websocketService.isConnected() : true,
    startTracking,
    stopTracking,
    enableRealTime,
    disableRealTime,
    realtimeEnabled,
    systemStatus
  };
}