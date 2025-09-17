import axios from 'axios';
import { Place, Route, Truck, Trip, TripPricing, Alert } from '../types';
import { osmService } from './osmService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export class PlaceService {
  static async searchPlaces(query: string): Promise<Place[]> {
    try {
      // First try OSM search for better coverage
      const osmResults = await osmService.searchPlaces(query, {
        countryCode: 'in',
        limit: 15
      });

      // Convert OSM results to our Place format
      const osmPlaces: Place[] = osmResults.map(place => ({
        id: `osm-${place.place_id}`,
        name: place.display_name.split(',')[0],
        address: place.display_name,
        coordinates: { lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
        type: this.mapOSMTypeToPlaceType(place.type, place.class)
      }));

      // Enhanced mock data with more Indian locations
      const mockPlaces: Place[] = [
        {
          id: '1',
          name: 'Mumbai Central',
          address: 'Mumbai Central, Mumbai, Maharashtra 400008',
          coordinates: { lat: 19.0176, lng: 72.8562 },
          type: 'city'
        },
        {
          id: '2',
          name: 'Delhi Hub',
          address: 'Connaught Place, New Delhi, Delhi 110001',
          coordinates: { lat: 28.6315, lng: 77.2167 },
          type: 'warehouse'
        },
        {
          id: '3',
          name: 'Bangalore Tech Park',
          address: 'Electronic City, Bangalore, Karnataka 560100',
          coordinates: { lat: 12.8456, lng: 77.6603 },
          type: 'landmark'
        },
        {
          id: '4',
          name: 'Chennai Port',
          address: 'Chennai Port Trust, Chennai, Tamil Nadu 600001',
          coordinates: { lat: 13.1067, lng: 80.3000 },
          type: 'warehouse'
        },
        {
          id: '5',
          name: 'Pune Manufacturing Hub',
          address: 'Hinjewadi, Pune, Maharashtra 411057',
          coordinates: { lat: 18.5912, lng: 73.7389 },
          type: 'warehouse'
        },
        {
          id: '6',
          name: 'Hyderabad Logistics Center',
          address: 'HITEC City, Hyderabad, Telangana 500081',
          coordinates: { lat: 17.4435, lng: 78.3772 },
          type: 'warehouse'
        },
        {
          id: '7',
          name: 'Kolkata Distribution Center',
          address: 'Salt Lake, Kolkata, West Bengal 700064',
          coordinates: { lat: 22.5726, lng: 88.3639 },
          type: 'warehouse'
        },
        {
          id: '8',
          name: 'Ahmedabad Industrial Area',
          address: 'Naroda, Ahmedabad, Gujarat 382330',
          coordinates: { lat: 23.0225, lng: 72.5714 },
          type: 'warehouse'
        },
        {
          id: '9',
          name: 'Jaipur Logistics Hub',
          address: 'Sitapura Industrial Area, Jaipur, Rajasthan 302022',
          coordinates: { lat: 26.9124, lng: 75.7873 },
          type: 'warehouse'
        },
        {
          id: '10',
          name: 'Coimbatore Textile Hub',
          address: 'Peelamedu, Coimbatore, Tamil Nadu 641004',
          coordinates: { lat: 11.0168, lng: 76.9558 },
          type: 'warehouse'
        },
        {
          id: '11',
          name: 'Gurgaon Corporate Center',
          address: 'Cyber City, Gurgaon, Haryana 122002',
          coordinates: { lat: 28.4595, lng: 77.0266 },
          type: 'landmark'
        },
        {
          id: '12',
          name: 'Noida IT Park',
          address: 'Sector 62, Noida, Uttar Pradesh 201309',
          coordinates: { lat: 28.6139, lng: 77.3648 },
          type: 'landmark'
        },
        // Major Indian Highways and Routes
        {
          id: '13',
          name: 'NH-48 (Mumbai-Delhi Highway)',
          address: 'National Highway 48, India',
          coordinates: { lat: 23.5, lng: 75.0 },
          type: 'highway'
        },
        {
          id: '14',
          name: 'NH-44 (Srinagar-Kanyakumari)',
          address: 'National Highway 44, India',
          coordinates: { lat: 20.0, lng: 78.0 },
          type: 'highway'
        },
        {
          id: '15',
          name: 'Mumbai-Pune Expressway',
          address: 'Mumbai-Pune Expressway, Maharashtra',
          coordinates: { lat: 18.9, lng: 73.2 },
          type: 'highway'
        },
        // Major Fuel Stations
        {
          id: '16',
          name: 'HP Petrol Pump - Khalapur',
          address: 'Mumbai-Pune Highway, Khalapur, Maharashtra',
          coordinates: { lat: 18.8642, lng: 73.3467 },
          type: 'warehouse'
        },
        {
          id: '17',
          name: 'IOCL Fuel Station - Lonavala',
          address: 'Old Mumbai-Pune Highway, Lonavala, Maharashtra',
          coordinates: { lat: 18.7537, lng: 73.4068 },
          type: 'warehouse'
        },
        // Major Hotels and Dhabas
        {
          id: '18',
          name: 'Highway Dhaba - Panvel',
          address: 'NH-48, Panvel, Maharashtra',
          coordinates: { lat: 18.9894, lng: 73.1103 },
          type: 'landmark'
        },
        {
          id: '19',
          name: 'Truck Stop Hotel - Vadodara',
          address: 'NH-48, Vadodara, Gujarat',
          coordinates: { lat: 22.3072, lng: 73.1812 },
          type: 'landmark'
        }
      ].filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.address.toLowerCase().includes(query.toLowerCase())
      );

      // Combine OSM results with mock data, prioritizing OSM
      const combinedResults = [...osmPlaces, ...mockPlaces];
      
      // Remove duplicates and limit results
      const uniqueResults = combinedResults.filter((place, index, self) => 
        index === self.findIndex(p => 
          Math.abs(p.coordinates.lat - place.coordinates.lat) < 0.01 &&
          Math.abs(p.coordinates.lng - place.coordinates.lng) < 0.01
        )
      );

      return uniqueResults.slice(0, 20);
    } catch (error) {
      console.error('Error searching places:', error);
      // Fallback to mock data if OSM fails
      const mockPlaces: Place[] = [
        {
          id: '1',
          name: 'Mumbai Central',
          address: 'Mumbai Central, Mumbai, Maharashtra 400008',
          coordinates: { lat: 19.0176, lng: 72.8562 },
          type: 'city'
        },
        {
          id: '2',
          name: 'Delhi Hub',
          address: 'Connaught Place, New Delhi, Delhi 110001',
          coordinates: { lat: 28.6315, lng: 77.2167 },
          type: 'warehouse'
        }
      ].filter(place => 
        place.name.toLowerCase().includes(query.toLowerCase()) ||
        place.address.toLowerCase().includes(query.toLowerCase())
      );
      return mockPlaces;
    }
  }

  private static mapOSMTypeToPlaceType(osmType: string, osmClass: string): 'city' | 'landmark' | 'highway' | 'warehouse' {
    if (osmClass === 'place' && ['city', 'town', 'village'].includes(osmType)) {
      return 'city';
    }
    if (osmClass === 'highway') {
      return 'highway';
    }
    if (osmClass === 'building' || osmClass === 'amenity') {
      return 'warehouse';
    }
    return 'landmark';
  }

  static async geocodePlace(placeName: string): Promise<Place | null> {
    try {
      const response = await api.get(`/places/geocode?q=${encodeURIComponent(placeName)}`);
      return response.data;
    } catch (error) {
      console.error('Error geocoding place:', error);
      return null;
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await api.get(`/places/reverse-geocode?lat=${lat}&lng=${lng}`);
      return response.data.address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
}

export class RouteService {
  static async calculateRoutes(source: Place, destination: Place): Promise<Route[]> {
    try {
      // Enhanced route calculation with realistic road-following coordinates
      const baseDistance = this.calculateDistance(source.coordinates, destination.coordinates);
      
      const routes: Route[] = [
        {
          id: 'route-1',
          name: 'Fastest Route (National Highway)',
          distance: baseDistance,
          duration: Math.round(baseDistance / 65 * 60), // 65 km/h average on highways
          coordinates: this.generateRealisticRouteCoordinates(source.coordinates, destination.coordinates, 'highway'),
          type: 'fastest',
          tollPoints: this.generateTollPoints(source.coordinates, destination.coordinates, baseDistance),
          fuelStops: this.generateFuelStops(source.coordinates, destination.coordinates, baseDistance),
          delays: this.generateDelays(baseDistance),
          trafficLevel: 'medium'
        },
        {
          id: 'route-2',
          name: 'Shortest Route (State Highway)',
          distance: baseDistance * 0.85,
          duration: Math.round(baseDistance * 0.85 / 45 * 60), // 45 km/h average on state highways
          coordinates: this.generateRealisticRouteCoordinates(source.coordinates, destination.coordinates, 'state_highway', 0.85),
          type: 'shortest',
          tollPoints: this.generateTollPoints(source.coordinates, destination.coordinates, baseDistance * 0.85, 0.3),
          fuelStops: this.generateFuelStops(source.coordinates, destination.coordinates, baseDistance * 0.85),
          delays: [],
          trafficLevel: 'low'
        },
        {
          id: 'route-3',
          name: 'Economic Route (Bypass Roads)',
          distance: baseDistance * 1.2,
          duration: Math.round(baseDistance * 1.2 / 50 * 60), // 50 km/h average on bypass roads
          coordinates: this.generateRealisticRouteCoordinates(source.coordinates, destination.coordinates, 'bypass', 1.2),
          type: 'economic',
          tollPoints: [], // No tolls on bypass roads
          fuelStops: this.generateFuelStops(source.coordinates, destination.coordinates, baseDistance * 1.2),
          delays: [],
          trafficLevel: 'low'
        },
        {
          id: 'route-4',
          name: 'Highway Express Route',
          distance: baseDistance * 1.1,
          duration: Math.round(baseDistance * 1.1 / 80 * 60), // 80 km/h average on expressways
          coordinates: this.generateRealisticRouteCoordinates(source.coordinates, destination.coordinates, 'expressway', 1.1),
          type: 'highway',
          tollPoints: this.generateTollPoints(source.coordinates, destination.coordinates, baseDistance * 1.1, 1.5),
          fuelStops: this.generateFuelStops(source.coordinates, destination.coordinates, baseDistance * 1.1),
          delays: this.generateDelays(baseDistance * 1.1, 'highway'),
          trafficLevel: 'high'
        }
      ];

      return routes;
    } catch (error) {
      console.error('Error calculating routes:', error);
      return [];
    }
  }

  private static generateRealisticRouteCoordinates(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number },
    roadType: 'highway' | 'state_highway' | 'bypass' | 'expressway' = 'highway',
    factor: number = 1
  ): { lat: number; lng: number }[] {
    const points = [];
    const distance = this.calculateDistance(start, end);
    const steps = Math.max(20, Math.floor(distance / 5)); // More points for smoother curves
    
    // Define road characteristics
    const roadCharacteristics = {
      highway: { curvature: 0.3, deviation: 0.008, waypoints: 3 },
      state_highway: { curvature: 0.5, deviation: 0.012, waypoints: 4 },
      bypass: { curvature: 0.8, deviation: 0.020, waypoints: 6 },
      expressway: { curvature: 0.2, deviation: 0.005, waypoints: 2 }
    };
    
    const config = roadCharacteristics[roadType];
    
    // Generate intermediate waypoints to simulate real road paths
    const waypoints = this.generateWaypoints(start, end, config.waypoints);
    
    // Generate smooth curve through waypoints
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.interpolateAlongWaypoints(waypoints, t);
      
      // Add road-like variations
      const roadDeviation = this.generateRoadDeviation(t, config.curvature, config.deviation);
      
      points.push({
        lat: point.lat + roadDeviation.lat,
        lng: point.lng + roadDeviation.lng
      });
    }
    
    return points;
  }

  private static generateWaypoints(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    count: number
  ): { lat: number; lng: number }[] {
    const waypoints = [start];
    
    // Generate intermediate waypoints that simulate real road routing
    for (let i = 1; i < count + 1; i++) {
      const ratio = i / (count + 1);
      
      // Base interpolation
      let lat = start.lat + (end.lat - start.lat) * ratio;
      let lng = start.lng + (end.lng - start.lng) * ratio;
      
      // Add realistic deviations based on geography
      const geographicDeviation = this.getGeographicDeviation(start, end, ratio);
      lat += geographicDeviation.lat;
      lng += geographicDeviation.lng;
      
      waypoints.push({ lat, lng });
    }
    
    waypoints.push(end);
    return waypoints;
  }

  private static getGeographicDeviation(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    ratio: number
  ): { lat: number; lng: number } {
    // Simulate real geographic constraints that affect road routing
    const distance = this.calculateDistance(start, end);
    
    // Major cities and geographic features that roads tend to route through/around
    const majorCities = [
      { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
      { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
      { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
      { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
      { lat: 18.5204, lng: 73.8567, name: 'Pune' },
      { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
      { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' }
    ];
    
    // Find if route passes near major cities
    const currentPoint = {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio
    };
    
    let deviation = { lat: 0, lng: 0 };
    
    majorCities.forEach(city => {
      const distanceToCity = this.calculateDistance(currentPoint, city);
      if (distanceToCity < 100) { // Within 100km of major city
        const influence = Math.exp(-distanceToCity / 50); // Exponential decay
        const pullStrength = 0.01 * influence;
        
        deviation.lat += (city.lat - currentPoint.lat) * pullStrength;
        deviation.lng += (city.lng - currentPoint.lng) * pullStrength;
      }
    });
    
    // Add some randomness for natural road curves
    const randomFactor = 0.005;
    deviation.lat += (Math.random() - 0.5) * randomFactor;
    deviation.lng += (Math.random() - 0.5) * randomFactor;
    
    return deviation;
  }

  private static interpolateAlongWaypoints(
    waypoints: { lat: number; lng: number }[],
    t: number
  ): { lat: number; lng: number } {
    if (waypoints.length < 2) return waypoints[0];
    
    const segmentLength = 1 / (waypoints.length - 1);
    const segmentIndex = Math.floor(t / segmentLength);
    const segmentT = (t % segmentLength) / segmentLength;
    
    if (segmentIndex >= waypoints.length - 1) {
      return waypoints[waypoints.length - 1];
    }
    
    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];
    
    // Use cubic interpolation for smoother curves
    const smoothT = this.smoothStep(segmentT);
    
    return {
      lat: start.lat + (end.lat - start.lat) * smoothT,
      lng: start.lng + (end.lng - start.lng) * smoothT
    };
  }

  private static smoothStep(t: number): number {
    // Cubic smoothstep function for natural curves
    return t * t * (3 - 2 * t);
  }

  private static generateRoadDeviation(
    t: number,
    curvature: number,
    maxDeviation: number
  ): { lat: number; lng: number } {
    // Generate natural road curves using sine waves
    const frequency1 = 2 * Math.PI * 3; // Primary curve frequency
    const frequency2 = 2 * Math.PI * 7; // Secondary curve frequency
    
    const curve1 = Math.sin(frequency1 * t) * curvature;
    const curve2 = Math.sin(frequency2 * t) * curvature * 0.3;
    
    const totalCurve = curve1 + curve2;
    
    return {
      lat: totalCurve * maxDeviation,
      lng: totalCurve * maxDeviation * 0.7 // Slightly different for lng to create natural curves
    };
  }

  private static generateTollPoints(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number },
    distance: number,
    multiplier: number = 1
  ) {
    const tollPoints = [];
    const numTolls = Math.floor(distance / 200) * multiplier; // One toll every 200km
    
    for (let i = 1; i <= numTolls; i++) {
      const ratio = i / (numTolls + 1);
      tollPoints.push({
        id: `toll-${i}`,
        name: `Toll Plaza ${i}`,
        coordinates: {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio
        },
        cost: Math.floor(Math.random() * 100) + 50, // ₹50-150
        vehicleType: 'truck'
      });
    }
    
    return tollPoints;
  }

  private static generateFuelStops(
    start: { lat: number; lng: number }, 
    end: { lat: number; lng: number },
    distance: number
  ) {
    const fuelStops = [];
    const numStops = Math.floor(distance / 300); // One fuel stop every 300km
    const brands = ['HP', 'IOCL', 'BPCL', 'Shell', 'Reliance'];
    
    for (let i = 1; i <= numStops; i++) {
      const ratio = i / (numStops + 1);
      fuelStops.push({
        id: `fuel-${i}`,
        name: `${brands[Math.floor(Math.random() * brands.length)]} Petrol Pump`,
        coordinates: {
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio
        },
        fuelPrice: 98 + Math.random() * 10, // ₹98-108 per liter
        brand: brands[Math.floor(Math.random() * brands.length)]
      });
    }
    
    return fuelStops;
  }

  private static generateDelays(distance: number, routeType: string = 'normal') {
    const delays = [];
    
    if (routeType === 'highway' && Math.random() > 0.7) {
      delays.push({
        id: 'delay-1',
        location: 'Highway Construction Zone',
        coordinates: { lat: 0, lng: 0 }, // Would be calculated based on route
        delayMinutes: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
        reason: 'Road construction work',
        severity: 'medium' as const
      });
    }
    
    if (distance > 500 && Math.random() > 0.8) {
      delays.push({
        id: 'delay-2',
        location: 'Traffic Congestion',
        coordinates: { lat: 0, lng: 0 },
        delayMinutes: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        reason: 'Heavy traffic due to festival',
        severity: 'high' as const
      });
    }
    
    return delays;
  }

  private static calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  }
}

export class PricingService {
  static async calculateTripPricing(route: Route, truckType: string): Promise<TripPricing> {
    try {
      // Enhanced pricing calculation with regional variations
      const fuelRate = this.getFuelRate(route.coordinates[0]); // Regional fuel prices
      const mileage = this.getTruckMileage(truckType);
      const fuelCost = (route.distance / mileage) * fuelRate;
      
      const tollCost = route.tollPoints.reduce((sum, toll) => sum + toll.cost, 0);
      
      const permitCost = this.calculatePermitCost(route.distance, route.coordinates);
      const driverCost = this.calculateDriverCost(route.duration, route.type);
      const maintenanceCost = this.calculateMaintenanceCost(route.distance, truckType);
      
      const totalCost = fuelCost + tollCost + permitCost + driverCost + maintenanceCost;
      const profitMargin = totalCost * this.getProfitMargin(route.type); // Variable margin based on route type
      const customerPrice = totalCost + profitMargin;

      return {
        fuelCost: Math.round(fuelCost),
        tollCost,
        permitCost,
        driverCost,
        maintenanceCost: Math.round(maintenanceCost),
        totalCost: Math.round(totalCost),
        profitMargin: Math.round(profitMargin),
        customerPrice: Math.round(customerPrice)
      };
    } catch (error) {
      console.error('Error calculating pricing:', error);
      throw error;
    }
  }

  private static getFuelRate(location: { lat: number; lng: number }): number {
    // Regional fuel price variations
    const basePrice = 102.5;
    const regionalVariation = Math.sin(location.lat) * 5; // ±5 rupees variation
    return basePrice + regionalVariation;
  }

  private static getTruckMileage(truckType: string): number {
    const mileageMap: Record<string, number> = {
      'mini': 15,
      'small': 12,
      'medium': 8,
      'large': 6,
      'trailer': 4
    };
    return mileageMap[truckType] || 8;
  }

  private static calculatePermitCost(distance: number, coordinates: { lat: number; lng: number }[]): number {
    // Calculate state border crossings based on coordinates
    const stateCrossings = Math.floor(distance / 400); // Approximate state crossing every 400km
    const baseCost = 200; // Base permit cost per state
    const distanceMultiplier = distance > 1000 ? 1.5 : 1; // Long distance multiplier
    
    return stateCrossings * baseCost * distanceMultiplier;
  }

  private static calculateDriverCost(duration: number, routeType: string): number {
    const baseRate = 500; // ₹500 per hour
    const hours = Math.ceil(duration / 60);
    
    // Route type multipliers
    const multipliers = {
      'fastest': 1.2, // Premium for fast routes
      'shortest': 1.0,
      'economic': 0.9, // Discount for economic routes
      'highway': 1.1
    };
    
    const multiplier = multipliers[routeType as keyof typeof multipliers] || 1.0;
    return Math.round(hours * baseRate * multiplier);
  }

  private static calculateMaintenanceCost(distance: number, truckType: string): number {
    const baseRatePerKm = {
      'mini': 1.5,
      'small': 2.0,
      'medium': 2.5,
      'large': 3.0,
      'trailer': 3.5
    };
    
    const rate = baseRatePerKm[truckType as keyof typeof baseRatePerKm] || 2.5;
    return distance * rate;
  }

  private static getProfitMargin(routeType: string): number {
    // Variable profit margins based on route complexity
    const margins = {
      'fastest': 0.30, // 30% for premium fast routes
      'shortest': 0.25, // 25% standard
      'economic': 0.20, // 20% for budget routes
      'highway': 0.28  // 28% for highway routes
    };
    
    return margins[routeType as keyof typeof margins] || 0.25;
  }
}

export class TruckService {
  static async getTrucks(): Promise<Truck[]> {
    try {
      const response = await api.get('/trucks');
      return response.data;
    } catch (error) {
      console.error('Error fetching trucks:', error);
      return [];
    }
  }

  static async updateTruckLocation(truckId: string, location: { lat: number; lng: number; speed: number; heading: number }): Promise<void> {
    try {
      await api.put(`/trucks/${truckId}/location`, location);
    } catch (error) {
      console.error('Error updating truck location:', error);
    }
  }
}

export class TripService {
  static async createTrip(tripData: Partial<Trip>): Promise<Trip> {
    try {
      const response = await api.post('/trips', tripData);
      return response.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  }

  static async getTrips(): Promise<Trip[]> {
    try {
      const response = await api.get('/trips');
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      return [];
    }
  }

  static async updateTripStatus(tripId: string, status: string): Promise<void> {
    try {
      await api.put(`/trips/${tripId}/status`, { status });
    } catch (error) {
      console.error('Error updating trip status:', error);
    }
  }
}

export class AlertService {
  static async getAlerts(): Promise<Alert[]> {
    try {
      const response = await api.get('/alerts');
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  static async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await api.put(`/alerts/${alertId}/acknowledge`);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }
}

// POI Service for nearby places
export class POIService {
  static async getNearbyPOIs(location: { lat: number; lng: number }, radius: number = 10000): Promise<any[]> {
    try {
      // In real implementation, this would call Google Places API or similar
      const response = await api.get(`/pois/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby POIs:', error);
      return [];
    }
  }

  static async searchPOIs(query: string, location: { lat: number; lng: number }): Promise<any[]> {
    try {
      const response = await api.get(`/pois/search?q=${encodeURIComponent(query)}&lat=${location.lat}&lng=${location.lng}`);
      return response.data;
    } catch (error) {
      console.error('Error searching POIs:', error);
      return [];
    }
  }
}