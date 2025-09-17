/**
 * Geospatial Services for Indian Mapping and DigiStack Integration
 * Supports Bhuvan, NavIC, and other Indian geospatial platforms
 */

export interface IndianMapTile {
  provider: 'bhuvan' | 'navic' | 'survey_of_india' | 'openstreetmap';
  url: string;
  attribution: string;
  maxZoom: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: number[][];
  radius?: number;
  properties: {
    state: string;
    district: string;
    category: 'restricted' | 'toll' | 'checkpoint' | 'fuel' | 'rest_area';
    alerts: boolean;
  };
}

export interface NavICPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
  satelliteCount: number;
  hdop: number; // Horizontal Dilution of Precision
}

class GeospatialService {
  private indianMapProviders: Map<string, IndianMapTile> = new Map();
  private geofences: Map<string, GeofenceZone> = new Map();

  constructor() {
    this.initializeIndianMapProviders();
    this.initializeIndianGeofences();
  }

  /**
   * Initialize Indian map tile providers
   */
  private initializeIndianMapProviders() {
    const providers: IndianMapTile[] = [
      {
        provider: 'bhuvan',
        url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wmts?layer=india3&style=default&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}',
        attribution: '© ISRO Bhuvan | National Remote Sensing Centre',
        maxZoom: 18
      },
      {
        provider: 'survey_of_india',
        url: 'https://onlinemaps.surveyofindia.gov.in/Digital_Product_Show.aspx?GP_ID={z}/{x}/{y}',
        attribution: '© Survey of India',
        maxZoom: 16
      },
      {
        provider: 'openstreetmap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }
    ];

    providers.forEach(provider => {
      this.indianMapProviders.set(provider.provider, provider);
    });
  }

  /**
   * Initialize Indian geofences (states, toll plazas, checkpoints)
   */
  private initializeIndianGeofences() {
    const indianGeofences: GeofenceZone[] = [
      // Maharashtra State Boundary
      {
        id: 'maharashtra_state',
        name: 'Maharashtra State',
        type: 'polygon',
        coordinates: [
          [72.6369, 20.1204], [80.8913, 20.1204], [80.8913, 22.0273], [72.6369, 22.0273], [72.6369, 20.1204]
        ],
        properties: {
          state: 'Maharashtra',
          district: 'All',
          category: 'checkpoint',
          alerts: true
        }
      },
      
      // Delhi NCR Region
      {
        id: 'delhi_ncr',
        name: 'Delhi NCR Region',
        type: 'circle',
        coordinates: [[77.2090, 28.6139]],
        radius: 50000, // 50km radius
        properties: {
          state: 'Delhi',
          district: 'New Delhi',
          category: 'restricted',
          alerts: true
        }
      },

      // Mumbai Port Area
      {
        id: 'mumbai_port',
        name: 'Mumbai Port Trust Area',
        type: 'polygon',
        coordinates: [
          [72.8200, 18.9200], [72.8600, 18.9200], [72.8600, 18.9600], [72.8200, 18.9600], [72.8200, 18.9200]
        ],
        properties: {
          state: 'Maharashtra',
          district: 'Mumbai',
          category: 'restricted',
          alerts: true
        }
      },

      // Khalapur Toll Plaza
      {
        id: 'khalapur_toll',
        name: 'Khalapur Toll Plaza',
        type: 'circle',
        coordinates: [[73.3467, 18.8642]],
        radius: 1000, // 1km radius
        properties: {
          state: 'Maharashtra',
          district: 'Raigad',
          category: 'toll',
          alerts: true
        }
      },

      // Bangalore IT Corridor
      {
        id: 'bangalore_it_corridor',
        name: 'Bangalore IT Corridor',
        type: 'polygon',
        coordinates: [
          [77.5000, 12.8000], [77.7000, 12.8000], [77.7000, 13.1000], [77.5000, 13.1000], [77.5000, 12.8000]
        ],
        properties: {
          state: 'Karnataka',
          district: 'Bangalore Urban',
          category: 'restricted',
          alerts: false
        }
      }
    ];

    indianGeofences.forEach(geofence => {
      this.geofences.set(geofence.id, geofence);
    });
  }

  /**
   * Get Indian map tile URL for specific provider
   */
  getMapTileUrl(provider: 'bhuvan' | 'navic' | 'survey_of_india' | 'openstreetmap'): string {
    const mapProvider = this.indianMapProviders.get(provider);
    return mapProvider ? mapProvider.url : this.indianMapProviders.get('openstreetmap')!.url;
  }

  /**
   * Get map attribution for provider
   */
  getMapAttribution(provider: string): string {
    const mapProvider = this.indianMapProviders.get(provider);
    return mapProvider ? mapProvider.attribution : '© OpenStreetMap contributors';
  }

  /**
   * Check if point is inside any geofence
   */
  checkGeofenceEntry(lat: number, lng: number): GeofenceZone[] {
    const enteredZones: GeofenceZone[] = [];

    for (const geofence of this.geofences.values()) {
      if (this.isPointInGeofence(lat, lng, geofence)) {
        enteredZones.push(geofence);
      }
    }

    return enteredZones;
  }

  /**
   * Check if point is inside specific geofence
   */
  private isPointInGeofence(lat: number, lng: number, geofence: GeofenceZone): boolean {
    if (geofence.type === 'circle') {
      const center = geofence.coordinates[0];
      const distance = this.calculateDistance(lat, lng, center[1], center[0]);
      return distance <= (geofence.radius || 1000) / 1000; // Convert to km
    } else if (geofence.type === 'polygon') {
      return this.isPointInPolygon(lat, lng, geofence.coordinates);
    }
    return false;
  }

  /**
   * Point-in-polygon algorithm (Ray casting)
   */
  private isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
    let inside = false;
    const x = lng;
    const y = lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Convert NavIC coordinates to standard GPS
   */
  convertNavICToGPS(navicData: NavICPosition): { lat: number; lng: number; accuracy: number } {
    // NavIC uses WGS84 datum, same as GPS
    // In real implementation, you might need coordinate transformation
    return {
      lat: navicData.latitude,
      lng: navicData.longitude,
      accuracy: navicData.accuracy
    };
  }

  /**
   * Get Indian state from coordinates
   */
  getIndianStateFromCoordinates(lat: number, lng: number): string {
    // Simplified state detection based on coordinate ranges
    const stateRanges = [
      { name: 'Maharashtra', latMin: 15.6, latMax: 22.0, lngMin: 72.6, lngMax: 80.9 },
      { name: 'Karnataka', latMin: 11.5, latMax: 18.4, lngMin: 74.0, lngMax: 78.6 },
      { name: 'Tamil Nadu', latMin: 8.0, latMax: 13.5, lngMin: 76.2, lngMax: 80.3 },
      { name: 'Gujarat', latMin: 20.1, latMax: 24.7, lngMin: 68.2, lngMax: 74.4 },
      { name: 'Rajasthan', latMin: 23.0, latMax: 30.2, lngMin: 69.5, lngMax: 78.3 },
      { name: 'Uttar Pradesh', latMin: 23.9, latMax: 30.4, lngMin: 77.1, lngMax: 84.6 },
      { name: 'Madhya Pradesh', latMin: 21.1, latMax: 26.9, lngMin: 74.0, lngMax: 82.8 },
      { name: 'West Bengal', latMin: 21.5, latMax: 27.2, lngMin: 85.8, lngMax: 89.9 },
      { name: 'Delhi', latMin: 28.4, latMax: 28.9, lngMin: 76.8, lngMax: 77.3 }
    ];

    for (const state of stateRanges) {
      if (lat >= state.latMin && lat <= state.latMax && 
          lng >= state.lngMin && lng <= state.lngMax) {
        return state.name;
      }
    }

    return 'Unknown';
  }

  /**
   * Get toll calculation for Indian highways
   */
  calculateIndianTollCost(route: { lat: number; lng: number }[], vehicleType: string): number {
    let totalToll = 0;
    const tollRates = {
      'car': 1.0,
      'mini': 1.5,
      'small': 2.0,
      'medium': 2.5,
      'large': 3.0,
      'trailer': 4.0
    };

    const multiplier = tollRates[vehicleType as keyof typeof tollRates] || 2.0;

    // Check each route segment for toll plazas
    for (let i = 0; i < route.length - 1; i++) {
      const segment = route[i];
      const tollZones = this.checkGeofenceEntry(segment.lat, segment.lng)
        .filter(zone => zone.properties.category === 'toll');
      
      tollZones.forEach(zone => {
        // Base toll cost varies by state and highway type
        const baseCost = this.getBaseTollCost(zone.properties.state);
        totalToll += baseCost * multiplier;
      });
    }

    return Math.round(totalToll);
  }

  private getBaseTollCost(state: string): number {
    const stateTollRates: { [key: string]: number } = {
      'Maharashtra': 65,
      'Gujarat': 55,
      'Karnataka': 60,
      'Tamil Nadu': 50,
      'Rajasthan': 45,
      'Uttar Pradesh': 40,
      'Madhya Pradesh': 35,
      'West Bengal': 30,
      'Delhi': 25
    };

    return stateTollRates[state] || 50;
  }

  /**
   * Get all geofences
   */
  getAllGeofences(): GeofenceZone[] {
    return Array.from(this.geofences.values());
  }

  /**
   * Add custom geofence
   */
  addGeofence(geofence: GeofenceZone): void {
    this.geofences.set(geofence.id, geofence);
  }

  /**
   * Remove geofence
   */
  removeGeofence(id: string): void {
    this.geofences.delete(id);
  }
}

export const geospatialService = new GeospatialService();