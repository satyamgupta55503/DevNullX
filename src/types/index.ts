export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: 'city' | 'landmark' | 'highway' | 'warehouse';
}

export interface Route {
  id: string;
  name: string;
  distance: number; // in km
  duration: number; // in minutes
  coordinates: Coordinates[];
  type: 'shortest' | 'fastest' | 'economic' | 'highway';
  tollPoints: TollPoint[];
  fuelStops: FuelStop[];
  delays: RouteDelay[];
  trafficLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TollPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  cost: number;
  vehicleType: string;
}

export interface FuelStop {
  id: string;
  name: string;
  coordinates: Coordinates;
  fuelPrice: number;
  brand: string;
}

export interface RouteDelay {
  id: string;
  location: string;
  coordinates: Coordinates;
  delayMinutes: number;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Truck {
  id: string;
  registrationNumber: string;
  driverName: string;
  driverPhone: string;
  vehicleType: 'mini' | 'small' | 'medium' | 'large' | 'trailer';
  capacity: number; // in tons
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric';
  mileage: number; // km per liter
  status: 'available' | 'assigned' | 'in-transit' | 'maintenance' | 'offline';
  currentLocation: Coordinates;
  speed: number;
  heading: number;
  fuelLevel: number; // percentage
  lastUpdate: Date;
  geofences: string[];
}

export interface Trip {
  id: string;
  truckId: string;
  driverId: string;
  source: Place;
  destination: Place;
  selectedRoute: Route;
  alternativeRoutes: Route[];
  status: 'planned' | 'started' | 'in-progress' | 'delayed' | 'completed' | 'cancelled';
  startTime: Date;
  estimatedEndTime: Date;
  actualEndTime?: Date;
  currentLocation: Coordinates;
  distanceRemaining: number;
  pricing: TripPricing;
  alerts: Alert[];
  checkpoints: Checkpoint[];
  liveTracking: LiveTrackingData[];
}

export interface TripPricing {
  fuelCost: number;
  tollCost: number;
  permitCost: number;
  driverCost: number;
  maintenanceCost: number;
  totalCost: number;
  profitMargin: number;
  customerPrice: number;
}

export interface LiveTrackingData {
  id: string;
  truckId: string;
  tripId: string;
  coordinates: Coordinates;
  speed: number;
  heading: number;
  timestamp: Date;
  accuracy: number;
  altitude?: number;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface Alert {
  id: string;
  type: 'geofence' | 'speed' | 'route_deviation' | 'fuel_low' | 'maintenance' | 'emergency' | 'delay';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  timestamp: Date;
  truckId: string;
  tripId?: string;
  coordinates?: Coordinates;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circular' | 'polygon';
  coordinates: Coordinates | Coordinates[];
  radius?: number; // for circular geofences
  alertOnEntry: boolean;
  alertOnExit: boolean;
  color: string;
  active: boolean;
  createdAt: Date;
}

export interface Checkpoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  estimatedArrival: Date;
  actualArrival?: Date;
  status: 'pending' | 'reached' | 'skipped';
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'fleet_manager' | 'driver' | 'customer';
  permissions: string[];
  avatar?: string;
  phone?: string;
  lastLogin: Date;
}

export interface Analytics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  totalRevenue: number;
  totalDistance: number;
  averageDeliveryTime: number;
  fuelEfficiency: number;
  onTimeDeliveryRate: number;
  customerSatisfaction: number;
  fleetUtilization: number;
}

export interface WebSocketMessage {
  type: 'location_update' | 'alert' | 'trip_status' | 'system_status';
  payload: any;
  timestamp: Date;
}

export interface SystemStatus {
  mqttConnected: boolean;
  kafkaConnected: boolean;
  redisConnected: boolean;
  postgresConnected: boolean;
  websocketConnected: boolean;
  activeTrucks: number;
  messagesPerSecond: number;
  systemLoad: number;
}