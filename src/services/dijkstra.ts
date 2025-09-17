/**
 * Dijkstra's Algorithm Implementation for Route Optimization
 * Supports Indian road networks and geospatial calculations
 */

export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'city' | 'junction' | 'toll' | 'fuel' | 'rest_area';
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;
  time: number;
  cost: number;
  roadType: 'national_highway' | 'state_highway' | 'expressway' | 'city_road';
  tollCost: number;
  trafficFactor: number;
}

export interface RouteResult {
  path: string[];
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  coordinates: { lat: number; lng: number }[];
  segments: RouteSegment[];
}

export interface RouteSegment {
  from: GraphNode;
  to: GraphNode;
  distance: number;
  time: number;
  roadType: string;
  instructions: string;
}

class DijkstraRouter {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map();

  constructor() {
    this.initializeIndianRoadNetwork();
  }

  /**
   * Initialize Indian road network with major cities and highways
   */
  private initializeIndianRoadNetwork() {
    // Major Indian cities and junctions
    const indianNodes: GraphNode[] = [
      { id: 'mumbai', lat: 19.0760, lng: 72.8777, name: 'Mumbai', type: 'city' },
      { id: 'delhi', lat: 28.6139, lng: 77.2090, name: 'Delhi', type: 'city' },
      { id: 'bangalore', lat: 12.9716, lng: 77.5946, name: 'Bangalore', type: 'city' },
      { id: 'chennai', lat: 13.0827, lng: 80.2707, name: 'Chennai', type: 'city' },
      { id: 'kolkata', lat: 22.5726, lng: 88.3639, name: 'Kolkata', type: 'city' },
      { id: 'pune', lat: 18.5204, lng: 73.8567, name: 'Pune', type: 'city' },
      { id: 'hyderabad', lat: 17.3850, lng: 78.4867, name: 'Hyderabad', type: 'city' },
      { id: 'ahmedabad', lat: 23.0225, lng: 72.5714, name: 'Ahmedabad', type: 'city' },
      { id: 'jaipur', lat: 26.9124, lng: 75.7873, name: 'Jaipur', type: 'city' },
      { id: 'surat', lat: 21.1702, lng: 72.8311, name: 'Surat', type: 'city' },
      
      // Highway junctions
      { id: 'panvel_junction', lat: 18.9894, lng: 73.1103, name: 'Panvel Junction', type: 'junction' },
      { id: 'vadodara_junction', lat: 22.3072, lng: 73.1812, name: 'Vadodara Junction', type: 'junction' },
      { id: 'indore_junction', lat: 22.7196, lng: 75.8577, name: 'Indore Junction', type: 'junction' },
      { id: 'nagpur_junction', lat: 21.1458, lng: 79.0882, name: 'Nagpur Junction', type: 'junction' },
      
      // Toll plazas
      { id: 'khalapur_toll', lat: 18.8642, lng: 73.3467, name: 'Khalapur Toll Plaza', type: 'toll' },
      { id: 'khed_toll', lat: 18.7197, lng: 73.4000, name: 'Khed Toll Plaza', type: 'toll' },
      
      // Fuel stations
      { id: 'lonavala_fuel', lat: 18.7537, lng: 73.4068, name: 'Lonavala Fuel Station', type: 'fuel' },
      { id: 'nashik_fuel', lat: 19.9975, lng: 73.7898, name: 'Nashik Fuel Station', type: 'fuel' }
    ];

    // Add nodes to the graph
    indianNodes.forEach(node => {
      this.nodes.set(node.id, node);
      this.edges.set(node.id, []);
    });

    // Define major highway connections with realistic data
    const indianEdges: GraphEdge[] = [
      // Mumbai-Pune Expressway (NH-48)
      {
        from: 'mumbai', to: 'panvel_junction', distance: 42, time: 45, cost: 50,
        roadType: 'expressway', tollCost: 0, trafficFactor: 1.2
      },
      {
        from: 'panvel_junction', to: 'khalapur_toll', distance: 28, time: 25, cost: 30,
        roadType: 'expressway', tollCost: 85, trafficFactor: 1.0
      },
      {
        from: 'khalapur_toll', to: 'lonavala_fuel', distance: 35, time: 30, cost: 40,
        roadType: 'expressway', tollCost: 0, trafficFactor: 1.0
      },
      {
        from: 'lonavala_fuel', to: 'pune', distance: 25, time: 25, cost: 30,
        roadType: 'expressway', tollCost: 65, trafficFactor: 1.1
      },

      // Mumbai-Ahmedabad Highway (NH-48)
      {
        from: 'mumbai', to: 'surat', distance: 284, time: 300, cost: 350,
        roadType: 'national_highway', tollCost: 150, trafficFactor: 1.3
      },
      {
        from: 'surat', to: 'vadodara_junction', distance: 125, time: 120, cost: 150,
        roadType: 'national_highway', tollCost: 80, trafficFactor: 1.1
      },
      {
        from: 'vadodara_junction', to: 'ahmedabad', distance: 110, time: 105, cost: 130,
        roadType: 'national_highway', tollCost: 70, trafficFactor: 1.2
      },

      // Delhi-Mumbai Highway (NH-48)
      {
        from: 'delhi', to: 'jaipur', distance: 280, time: 300, cost: 350,
        roadType: 'national_highway', tollCost: 120, trafficFactor: 1.4
      },
      {
        from: 'jaipur', to: 'ahmedabad', distance: 680, time: 720, cost: 850,
        roadType: 'national_highway', tollCost: 280, trafficFactor: 1.2
      },

      // Bangalore-Chennai Highway (NH-44)
      {
        from: 'bangalore', to: 'chennai', distance: 346, time: 360, cost: 420,
        roadType: 'national_highway', tollCost: 180, trafficFactor: 1.3
      },

      // Bangalore-Hyderabad Highway (NH-44)
      {
        from: 'bangalore', to: 'hyderabad', distance: 569, time: 600, cost: 700,
        roadType: 'national_highway', tollCost: 250, trafficFactor: 1.2
      },

      // Delhi-Kolkata Highway (NH-19)
      {
        from: 'delhi', to: 'nagpur_junction', distance: 1050, time: 1200, cost: 1300,
        roadType: 'national_highway', tollCost: 450, trafficFactor: 1.3
      },
      {
        from: 'nagpur_junction', to: 'kolkata', distance: 520, time: 600, cost: 650,
        roadType: 'national_highway', tollCost: 220, trafficFactor: 1.2
      }
    ];

    // Add edges to the graph (bidirectional)
    indianEdges.forEach(edge => {
      this.addEdge(edge);
      // Add reverse edge
      this.addEdge({
        from: edge.to,
        to: edge.from,
        distance: edge.distance,
        time: edge.time,
        cost: edge.cost,
        roadType: edge.roadType,
        tollCost: edge.tollCost,
        trafficFactor: edge.trafficFactor
      });
    });
  }

  private addEdge(edge: GraphEdge) {
    if (!this.edges.has(edge.from)) {
      this.edges.set(edge.from, []);
    }
    this.edges.get(edge.from)!.push(edge);
  }

  /**
   * Find shortest path using Dijkstra's algorithm
   */
  findShortestPath(
    startId: string, 
    endId: string, 
    optimizeFor: 'distance' | 'time' | 'cost' = 'distance'
  ): RouteResult | null {
    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return null;
    }

    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const unvisited = new Set<string>();

    // Initialize distances
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }
    distances.set(startId, 0);

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (currentNode === null || minDistance === Infinity) {
        break;
      }

      unvisited.delete(currentNode);
      visited.add(currentNode);

      if (currentNode === endId) {
        break;
      }

      // Check neighbors
      const edges = this.edges.get(currentNode) || [];
      for (const edge of edges) {
        if (visited.has(edge.to)) continue;

        let weight: number;
        switch (optimizeFor) {
          case 'time':
            weight = edge.time * edge.trafficFactor;
            break;
          case 'cost':
            weight = edge.cost + edge.tollCost;
            break;
          default:
            weight = edge.distance;
        }

        const newDistance = distances.get(currentNode)! + weight;
        if (newDistance < distances.get(edge.to)!) {
          distances.set(edge.to, newDistance);
          previous.set(edge.to, currentNode);
        }
      }
    }

    // Reconstruct path
    const path: string[] = [];
    let current: string | null = endId;
    
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current)!;
    }

    if (path[0] !== startId) {
      return null; // No path found
    }

    return this.buildRouteResult(path, optimizeFor);
  }

  private buildRouteResult(path: string[], optimizeFor: string): RouteResult {
    const segments: RouteSegment[] = [];
    const coordinates: { lat: number; lng: number }[] = [];
    let totalDistance = 0;
    let totalTime = 0;
    let totalCost = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const fromId = path[i];
      const toId = path[i + 1];
      const fromNode = this.nodes.get(fromId)!;
      const toNode = this.nodes.get(toId)!;
      
      coordinates.push({ lat: fromNode.lat, lng: fromNode.lng });
      
      // Find edge between nodes
      const edges = this.edges.get(fromId) || [];
      const edge = edges.find(e => e.to === toId);
      
      if (edge) {
        totalDistance += edge.distance;
        totalTime += edge.time * edge.trafficFactor;
        totalCost += edge.cost + edge.tollCost;

        segments.push({
          from: fromNode,
          to: toNode,
          distance: edge.distance,
          time: edge.time * edge.trafficFactor,
          roadType: edge.roadType,
          instructions: this.generateInstructions(fromNode, toNode, edge)
        });
      }
    }

    // Add final coordinate
    if (path.length > 0) {
      const lastNode = this.nodes.get(path[path.length - 1])!;
      coordinates.push({ lat: lastNode.lat, lng: lastNode.lng });
    }

    return {
      path,
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime),
      totalCost: Math.round(totalCost),
      coordinates,
      segments
    };
  }

  private generateInstructions(from: GraphNode, to: GraphNode, edge: GraphEdge): string {
    const roadTypeMap = {
      'national_highway': 'National Highway',
      'state_highway': 'State Highway',
      'expressway': 'Expressway',
      'city_road': 'City Road'
    };

    return `Continue on ${roadTypeMap[edge.roadType]} from ${from.name} to ${to.name} (${edge.distance} km)`;
  }

  /**
   * Find multiple route options
   */
  findMultipleRoutes(startId: string, endId: string): RouteResult[] {
    const routes: RouteResult[] = [];

    // Shortest distance route
    const shortestRoute = this.findShortestPath(startId, endId, 'distance');
    if (shortestRoute) {
      routes.push({ ...shortestRoute, path: [...shortestRoute.path] });
    }

    // Fastest time route
    const fastestRoute = this.findShortestPath(startId, endId, 'time');
    if (fastestRoute && !this.routesEqual(shortestRoute, fastestRoute)) {
      routes.push({ ...fastestRoute, path: [...fastestRoute.path] });
    }

    // Most economical route
    const economicalRoute = this.findShortestPath(startId, endId, 'cost');
    if (economicalRoute && !routes.some(r => this.routesEqual(r, economicalRoute))) {
      routes.push({ ...economicalRoute, path: [...economicalRoute.path] });
    }

    return routes;
  }

  private routesEqual(route1: RouteResult | null, route2: RouteResult | null): boolean {
    if (!route1 || !route2) return false;
    return JSON.stringify(route1.path) === JSON.stringify(route2.path);
  }

  /**
   * Add dynamic node (for custom locations)
   */
  addDynamicNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    this.edges.set(node.id, []);
    
    // Connect to nearest existing nodes
    this.connectToNearestNodes(node);
  }

  private connectToNearestNodes(newNode: GraphNode): void {
    const nearbyNodes: Array<{ node: GraphNode; distance: number }> = [];

    for (const [nodeId, node] of this.nodes) {
      if (nodeId === newNode.id) continue;
      
      const distance = this.calculateHaversineDistance(
        newNode.lat, newNode.lng,
        node.lat, node.lng
      );
      
      if (distance < 100) { // Within 100km
        nearbyNodes.push({ node, distance });
      }
    }

    // Sort by distance and connect to closest 3 nodes
    nearbyNodes.sort((a, b) => a.distance - b.distance);
    nearbyNodes.slice(0, 3).forEach(({ node, distance }) => {
      const estimatedTime = distance / 60; // Assume 60 km/h average
      const estimatedCost = distance * 8; // ₹8 per km

      const edge: GraphEdge = {
        from: newNode.id,
        to: node.id,
        distance,
        time: estimatedTime,
        cost: estimatedCost,
        roadType: 'state_highway',
        tollCost: 0,
        trafficFactor: 1.0
      };

      this.addEdge(edge);
      this.addEdge({
        ...edge,
        from: node.id,
        to: newNode.id
      });
    });
  }

  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
   * Get all nodes for debugging
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }
}

export const dijkstraRouter = new DijkstraRouter();