import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TruckLocation {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'offline';
  lat: number;
  lng: number;
  speed: number;
  destination: string;
  eta: string;
  distance: number;
  fuelLevel: number;
  route: [number, number][];
  lastUpdate: Date;
}

interface TrackingContextType {
  trucks: TruckLocation[];
  selectedTruck: TruckLocation | null;
  setSelectedTruck: (truck: TruckLocation | null) => void;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const [trucks, setTrucks] = useState<TruckLocation[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);

  // Initialize mock truck data
  useEffect(() => {
    const initialTrucks: TruckLocation[] = [
      {
        id: 'TRK001',
        name: 'Mumbai Express',
        status: 'active',
        lat: 19.0760,
        lng: 72.8777,
        speed: 65,
        destination: 'Delhi Hub',
        eta: '14:30',
        distance: 387,
        fuelLevel: 78,
        route: [[19.0760, 72.8777], [19.1760, 72.9777], [19.2760, 73.0777]],
        lastUpdate: new Date()
      },
      {
        id: 'TRK002',
        name: 'Chennai Cargo',
        status: 'active',
        lat: 13.0827,
        lng: 80.2707,
        speed: 72,
        destination: 'Bangalore',
        eta: '16:45',
        distance: 234,
        fuelLevel: 65,
        route: [[13.0827, 80.2707], [13.1827, 80.3707], [13.2827, 80.4707]],
        lastUpdate: new Date()
      },
      {
        id: 'TRK003',
        name: 'Delhi Freight',
        status: 'idle',
        lat: 28.6139,
        lng: 77.2090,
        speed: 0,
        destination: 'Kolkata',
        eta: '09:15',
        distance: 456,
        fuelLevel: 92,
        route: [[28.6139, 77.2090], [28.7139, 77.3090], [28.8139, 77.4090]],
        lastUpdate: new Date()
      }
    ];

    setTrucks(initialTrucks);
    setSelectedTruck(initialTrucks[0]);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTrucks(prevTrucks => 
        prevTrucks.map(truck => {
          if (truck.status === 'active') {
            // Simulate movement
            const latDelta = (Math.random() - 0.5) * 0.001;
            const lngDelta = (Math.random() - 0.5) * 0.001;
            const speedDelta = (Math.random() - 0.5) * 5;
            
            return {
              ...truck,
              lat: truck.lat + latDelta,
              lng: truck.lng + lngDelta,
              speed: Math.max(0, Math.min(100, truck.speed + speedDelta)),
              distance: Math.max(0, truck.distance - 1),
              fuelLevel: Math.max(0, truck.fuelLevel - 0.1),
              lastUpdate: new Date()
            };
          }
          return truck;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TrackingContext.Provider value={{
      trucks,
      selectedTruck,
      setSelectedTruck
    }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
}