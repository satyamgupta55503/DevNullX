import { Truck, Trip, Alert, Geofence, Analytics, Place } from '../types';

export const mockTrucks: Truck[] = [
  {
    id: 'TRK001',
    registrationNumber: 'MH-12-AB-1234',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91-9876543210',
    vehicleType: 'large',
    capacity: 15,
    fuelType: 'diesel',
    mileage: 6,
    status: 'in-transit',
    currentLocation: { lat: 19.0760, lng: 72.8777 },
    speed: 65,
    heading: 45,
    fuelLevel: 78,
    lastUpdate: new Date(),
    geofences: ['geo-1', 'geo-2']
  },
  {
    id: 'TRK002',
    registrationNumber: 'KA-05-CD-5678',
    driverName: 'Suresh Reddy',
    driverPhone: '+91-9876543211',
    vehicleType: 'medium',
    capacity: 10,
    fuelType: 'diesel',
    mileage: 8,
    status: 'in-transit',
    currentLocation: { lat: 13.0827, lng: 80.2707 },
    speed: 72,
    heading: 120,
    fuelLevel: 65,
    lastUpdate: new Date(),
    geofences: ['geo-3']
  },
  {
    id: 'TRK003',
    registrationNumber: 'DL-01-EF-9012',
    driverName: 'Amit Singh',
    driverPhone: '+91-9876543212',
    vehicleType: 'trailer',
    capacity: 25,
    fuelType: 'diesel',
    mileage: 4,
    status: 'available',
    currentLocation: { lat: 28.6139, lng: 77.2090 },
    speed: 0,
    heading: 0,
    fuelLevel: 92,
    lastUpdate: new Date(),
    geofences: []
  },
  {
    id: 'TRK004',
    registrationNumber: 'GJ-01-GH-3456',
    driverName: 'Vikram Patel',
    driverPhone: '+91-9876543213',
    vehicleType: 'small',
    capacity: 5,
    fuelType: 'cng',
    mileage: 12,
    status: 'maintenance',
    currentLocation: { lat: 23.0225, lng: 72.5714 },
    speed: 0,
    heading: 0,
    fuelLevel: 45,
    lastUpdate: new Date(),
    geofences: ['geo-4']
  },
  {
    id: 'TRK005',
    registrationNumber: 'TN-09-IJ-7890',
    driverName: 'Murugan S',
    driverPhone: '+91-9876543214',
    vehicleType: 'mini',
    capacity: 2,
    fuelType: 'petrol',
    mileage: 15,
    status: 'assigned',
    currentLocation: { lat: 11.0168, lng: 76.9558 },
    speed: 45,
    heading: 270,
    fuelLevel: 88,
    lastUpdate: new Date(),
    geofences: []
  }
];

export const mockPlaces: Place[] = [
  {
    id: 'place-1',
    name: 'Mumbai Central Warehouse',
    address: 'Mumbai Central, Mumbai, Maharashtra 400008',
    coordinates: { lat: 19.0176, lng: 72.8562 },
    type: 'warehouse'
  },
  {
    id: 'place-2',
    name: 'Delhi Distribution Hub',
    address: 'Connaught Place, New Delhi, Delhi 110001',
    coordinates: { lat: 28.6315, lng: 77.2167 },
    type: 'warehouse'
  },
  {
    id: 'place-3',
    name: 'Bangalore Tech Park',
    address: 'Electronic City, Bangalore, Karnataka 560100',
    coordinates: { lat: 12.8456, lng: 77.6603 },
    type: 'landmark'
  },
  {
    id: 'place-4',
    name: 'Chennai Port',
    address: 'Chennai Port Trust, Chennai, Tamil Nadu 600001',
    coordinates: { lat: 13.1067, lng: 80.3000 },
    type: 'warehouse'
  },
  {
    id: 'place-5',
    name: 'Pune Manufacturing Unit',
    address: 'Hinjewadi, Pune, Maharashtra 411057',
    coordinates: { lat: 18.5912, lng: 73.7389 },
    type: 'warehouse'
  },
  {
    id: 'place-6',
    name: 'Hyderabad Logistics Center',
    address: 'HITEC City, Hyderabad, Telangana 500081',
    coordinates: { lat: 17.4435, lng: 78.3772 },
    type: 'warehouse'
  }
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: 'speed',
    severity: 'warning',
    title: 'Speed Limit Exceeded',
    message: 'TRK001 is traveling at 85 km/h in a 60 km/h zone',
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    truckId: 'TRK001',
    tripId: 'trip-1',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    acknowledged: false
  },
  {
    id: 'alert-2',
    type: 'geofence',
    severity: 'info',
    title: 'Geofence Entry',
    message: 'TRK002 has entered Mumbai Zone',
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    truckId: 'TRK002',
    coordinates: { lat: 19.0176, lng: 72.8562 },
    acknowledged: true
  },
  {
    id: 'alert-3',
    type: 'fuel_low',
    severity: 'critical',
    title: 'Low Fuel Alert',
    message: 'TRK004 fuel level is below 20%',
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    truckId: 'TRK004',
    coordinates: { lat: 23.0225, lng: 72.5714 },
    acknowledged: false
  },
  {
    id: 'alert-4',
    type: 'route_deviation',
    severity: 'warning',
    title: 'Route Deviation',
    message: 'TRK005 has deviated from planned route by 5 km',
    timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
    truckId: 'TRK005',
    tripId: 'trip-3',
    coordinates: { lat: 11.0168, lng: 76.9558 },
    acknowledged: false
  },
  {
    id: 'alert-5',
    type: 'emergency',
    severity: 'emergency',
    title: 'Emergency SOS',
    message: 'Driver of TRK001 has triggered emergency alert',
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    truckId: 'TRK001',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    acknowledged: true,
    resolvedAt: new Date(Date.now() - 1200000)
  }
];

export const mockGeofences: Geofence[] = [
  {
    id: 'geo-1',
    name: 'Mumbai Metropolitan Area',
    type: 'circular',
    coordinates: { lat: 19.0760, lng: 72.8777 },
    radius: 50000, // 50 km
    alertOnEntry: true,
    alertOnExit: true,
    color: '#3b82f6',
    active: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'geo-2',
    name: 'Delhi NCR Zone',
    type: 'circular',
    coordinates: { lat: 28.6139, lng: 77.2090 },
    radius: 75000, // 75 km
    alertOnEntry: true,
    alertOnExit: false,
    color: '#10b981',
    active: true,
    createdAt: new Date('2024-01-02')
  },
  {
    id: 'geo-3',
    name: 'Bangalore Tech Corridor',
    type: 'circular',
    coordinates: { lat: 12.9716, lng: 77.5946 },
    radius: 30000, // 30 km
    alertOnEntry: false,
    alertOnExit: true,
    color: '#f59e0b',
    active: true,
    createdAt: new Date('2024-01-03')
  },
  {
    id: 'geo-4',
    name: 'Gujarat Industrial Belt',
    type: 'polygon',
    coordinates: [
      { lat: 23.0225, lng: 72.5714 },
      { lat: 23.2156, lng: 72.6369 },
      { lat: 23.1765, lng: 72.8311 },
      { lat: 22.9876, lng: 72.7656 }
    ],
    alertOnEntry: true,
    alertOnExit: true,
    color: '#ef4444',
    active: false,
    createdAt: new Date('2024-01-04')
  }
];

export const mockAnalytics: Analytics = {
  totalTrips: 1247,
  activeTrips: 23,
  completedTrips: 1198,
  totalRevenue: 2847650,
  totalDistance: 156789,
  averageDeliveryTime: 18.5,
  fuelEfficiency: 7.2,
  onTimeDeliveryRate: 94.5,
  customerSatisfaction: 4.6,
  fleetUtilization: 78.3
};

export const generateMockTrips = (): Trip[] => {
  const trips: Trip[] = [];
  const statuses = ['planned', 'started', 'in-progress', 'delayed', 'completed', 'cancelled'];
  
  for (let i = 1; i <= 50; i++) {
    const sourceIndex = Math.floor(Math.random() * mockPlaces.length);
    let destIndex = Math.floor(Math.random() * mockPlaces.length);
    while (destIndex === sourceIndex) {
      destIndex = Math.floor(Math.random() * mockPlaces.length);
    }
    
    const source = mockPlaces[sourceIndex];
    const destination = mockPlaces[destIndex];
    const truckIndex = Math.floor(Math.random() * mockTrucks.length);
    const truck = mockTrucks[truckIndex];
    
    const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const estimatedDuration = 4 + Math.random() * 20; // 4-24 hours
    const estimatedEndTime = new Date(startTime.getTime() + estimatedDuration * 60 * 60 * 1000);
    
    const trip: Trip = {
      id: `trip-${i}`,
      truckId: truck.id,
      driverId: `driver-${i}`,
      source,
      destination,
      selectedRoute: {
        id: `route-${i}`,
        name: 'Optimal Route',
        distance: Math.floor(100 + Math.random() * 800),
        duration: Math.floor(estimatedDuration * 60),
        coordinates: [source.coordinates, destination.coordinates],
        type: 'fastest',
        tollPoints: [],
        fuelStops: [],
        delays: [],
        trafficLevel: 'medium'
      },
      alternativeRoutes: [],
      status: statuses[Math.floor(Math.random() * statuses.length)] as any,
      startTime,
      estimatedEndTime,
      currentLocation: {
        lat: source.coordinates.lat + (destination.coordinates.lat - source.coordinates.lat) * Math.random(),
        lng: source.coordinates.lng + (destination.coordinates.lng - source.coordinates.lng) * Math.random()
      },
      distanceRemaining: Math.floor(Math.random() * 500),
      pricing: {
        fuelCost: Math.floor(2000 + Math.random() * 8000),
        tollCost: Math.floor(500 + Math.random() * 2000),
        permitCost: Math.floor(200 + Math.random() * 800),
        driverCost: Math.floor(1000 + Math.random() * 3000),
        maintenanceCost: Math.floor(300 + Math.random() * 1200),
        totalCost: 0,
        profitMargin: 0,
        customerPrice: 0
      },
      alerts: [],
      checkpoints: [],
      liveTracking: []
    };
    
    // Calculate total pricing
    trip.pricing.totalCost = trip.pricing.fuelCost + trip.pricing.tollCost + 
                            trip.pricing.permitCost + trip.pricing.driverCost + 
                            trip.pricing.maintenanceCost;
    trip.pricing.profitMargin = Math.floor(trip.pricing.totalCost * 0.25);
    trip.pricing.customerPrice = trip.pricing.totalCost + trip.pricing.profitMargin;
    
    trips.push(trip);
  }
  
  return trips;
};