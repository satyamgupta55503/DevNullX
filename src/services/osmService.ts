/**
 * Large Scale OpenStreetMap (OSM) API Service
 * Provides comprehensive India-level mapping data and services
 */

export interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OSMWay {
  id: number;
  nodes: number[];
  tags: Record<string, string>;
}

export interface OSMRelation {
  id: number;
  members: Array<{
    type: 'node' | 'way' | 'relation';
    ref: number;
    role: string;
  }>;
  tags: Record<string, string>;
}

export interface OSMPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export interface OSMRoute {
  geometry: {
    coordinates: number[][];
    type: 'LineString';
  };
  legs: Array<{
    distance: number;
    duration: number;
    steps: Array<{
      distance: number;
      duration: number;
      geometry: {
        coordinates: number[][];
        type: 'LineString';
      };
      name: string;
      instruction: string;
    }>;
  }>;
  distance: number;
  duration: number;
}

class OSMService {
  private readonly NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
  private readonly OVERPASS_BASE = 'https://overpass-api.de/api/interpreter';
  private readonly OSRM_BASE = 'https://router.project-osrm.org';
  private readonly PHOTON_BASE = 'https://photon.komoot.io';
  
  // Rate limiting
  private lastRequest = 0;
  private readonly MIN_INTERVAL = 1000; // 1 second between requests

  private async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_INTERVAL - timeSinceLastRequest));
    }
    this.lastRequest = Date.now();
  }

  /**
   * Search places using Nominatim API with India focus
   */
  async searchPlaces(query: string, options: {
    countryCode?: string;
    limit?: number;
    viewbox?: [number, number, number, number];
    bounded?: boolean;
  } = {}): Promise<OSMPlace[]> {
    await this.rateLimit();

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: (options.limit || 10).toString(),
      countrycodes: options.countryCode || 'in', // Default to India
      'accept-language': 'en'
    });

    // Add India bounding box for better results
    if (!options.viewbox) {
      // India bounding box: [68.1766451354, 7.96553477623, 97.4025614766, 35.4940095078]
      params.append('viewbox', '68.1766451354,35.4940095078,97.4025614766,7.96553477623');
      params.append('bounded', '1');
    } else if (options.viewbox) {
      params.append('viewbox', options.viewbox.join(','));
      params.append('bounded', options.bounded ? '1' : '0');
    }

    try {
      const response = await fetch(`${this.NOMINATIM_BASE}/search?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('OSM search error:', error);
      return [];
    }
  }

  /**
   * Reverse geocoding using Nominatim
   */
  async reverseGeocode(lat: number, lon: number): Promise<OSMPlace | null> {
    await this.rateLimit();

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en'
    });

    try {
      const response = await fetch(`${this.NOMINATIM_BASE}/reverse?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('OSM reverse geocode error:', error);
      return null;
    }
  }

  /**
   * Get routing using OSRM (Open Source Routing Machine)
   */
  async getRoute(
    coordinates: Array<[number, number]>,
    profile: 'driving' | 'walking' | 'cycling' = 'driving',
    options: {
      alternatives?: boolean;
      steps?: boolean;
      geometries?: 'polyline' | 'geojson';
      overview?: 'full' | 'simplified' | 'false';
    } = {}
  ): Promise<OSMRoute[]> {
    const coordString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
    
    const params = new URLSearchParams({
      alternatives: (options.alternatives || false).toString(),
      steps: (options.steps || true).toString(),
      geometries: options.geometries || 'geojson',
      overview: options.overview || 'full'
    });

    try {
      const response = await fetch(
        `${this.OSRM_BASE}/route/v1/${profile}/${coordString}?${params}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      console.error('OSRM routing error:', error);
      return [];
    }
  }

  /**
   * Get POIs using Overpass API
   */
  async getPOIs(
    bbox: [number, number, number, number], // [south, west, north, east]
    amenityTypes: string[] = ['fuel', 'restaurant', 'hotel', 'hospital', 'atm'],
    limit: number = 100
  ): Promise<OSMNode[]> {
    const [south, west, north, east] = bbox;
    
    // Build Overpass query for multiple amenity types
    const amenityQuery = amenityTypes.map(type => `node["amenity"="${type}"]`).join(';\n  ');
    
    const query = `
      [out:json][timeout:25];
      (
        ${amenityQuery};
      );
      out geom ${limit};
    `;

    try {
      const response = await fetch(this.OVERPASS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  }

  /**
   * Get Indian highways and major roads
   */
  async getIndianHighways(
    bbox: [number, number, number, number],
    highwayTypes: string[] = ['motorway', 'trunk', 'primary', 'secondary']
  ): Promise<OSMWay[]> {
    const [south, west, north, east] = bbox;
    
    const highwayQuery = highwayTypes.map(type => `way["highway"="${type}"]`).join(';\n  ');
    
    const query = `
      [out:json][timeout:25];
      (
        ${highwayQuery}(${south},${west},${north},${east});
      );
      out geom;
    `;

    try {
      const response = await fetch(this.OVERPASS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Highway query error:', error);
      return [];
    }
  }

  /**
   * Get Indian state boundaries
   */
  async getStateBoundaries(): Promise<OSMRelation[]> {
    const query = `
      [out:json][timeout:30];
      (
        relation["boundary"="administrative"]["admin_level"="4"]["place"="state"]["ISO3166-1"="IN"];
      );
      out geom;
    `;

    try {
      const response = await fetch(this.OVERPASS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('State boundaries error:', error);
      return [];
    }
  }

  /**
   * Search for specific Indian locations (cities, landmarks, etc.)
   */
  async searchIndianLocations(
    query: string,
    category: 'city' | 'landmark' | 'highway' | 'airport' | 'railway' = 'city'
  ): Promise<OSMPlace[]> {
    const categoryQueries = {
      city: `${query} city India`,
      landmark: `${query} landmark India`,
      highway: `${query} highway India`,
      airport: `${query} airport India`,
      railway: `${query} railway station India`
    };

    return this.searchPlaces(categoryQueries[category], {
      countryCode: 'in',
      limit: 20
    });
  }

  /**
   * Get nearby places with distance calculation
   */
  async getNearbyPlaces(
    lat: number,
    lon: number,
    radius: number = 10000, // 10km default
    amenityTypes: string[] = ['fuel', 'restaurant', 'hotel']
  ): Promise<Array<OSMNode & { distance: number }>> {
    // Calculate bounding box for the radius
    const latOffset = radius / 111000; // Rough conversion: 1 degree ≈ 111km
    const lonOffset = radius / (111000 * Math.cos(lat * Math.PI / 180));

    const bbox: [number, number, number, number] = [
      lat - latOffset,  // south
      lon - lonOffset,  // west
      lat + latOffset,  // north
      lon + lonOffset   // east
    ];

    const pois = await this.getPOIs(bbox, amenityTypes, 50);

    // Calculate distances and filter by radius
    return pois
      .map(poi => ({
        ...poi,
        distance: this.calculateDistance(lat, lon, poi.lat, poi.lon)
      }))
      .filter(poi => poi.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Get Indian toll plazas
   */
  async getIndianTollPlazas(bbox: [number, number, number, number]): Promise<OSMNode[]> {
    const query = `
      [out:json][timeout:25];
      (
        node["barrier"="toll_booth"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        node["amenity"="toll_booth"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      );
      out geom;
    `;

    try {
      const response = await fetch(this.OVERPASS_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.error('Toll plaza query error:', error);
      return [];
    }
  }

  /**
   * Get comprehensive India-level data for a region
   */
  async getIndiaLevelData(
    bbox: [number, number, number, number],
    includeHighways: boolean = true,
    includePOIs: boolean = true,
    includeTolls: boolean = true
  ) {
    const promises = [];

    if (includeHighways) {
      promises.push(this.getIndianHighways(bbox));
    }

    if (includePOIs) {
      promises.push(this.getPOIs(bbox, ['fuel', 'restaurant', 'hotel', 'hospital', 'atm', 'bank'], 200));
    }

    if (includeTolls) {
      promises.push(this.getIndianTollPlazas(bbox));
    }

    try {
      const results = await Promise.all(promises);
      
      return {
        highways: includeHighways ? results[0] : [],
        pois: includePOIs ? results[includeHighways ? 1 : 0] : [],
        tollPlazas: includeTolls ? results[(includeHighways ? 1 : 0) + (includePOIs ? 1 : 0)] : []
      };
    } catch (error) {
      console.error('India-level data fetch error:', error);
      return { highways: [], pois: [], tollPlazas: [] };
    }
  }
}

export const osmService = new OSMService();