import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Truck, 
  Trip, 
  Alert, 
  Geofence, 
  User, 
  Analytics, 
  SystemStatus,
  Place,
  Route
} from '../types';

interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  
  // Trucks & Fleet
  trucks: Truck[];
  selectedTruck: Truck | null;
  
  // Trips
  trips: Trip[];
  activeTrips: Trip[];
  selectedTrip: Trip | null;
  
  // Places & Routes
  places: Place[];
  searchResults: Place[];
  selectedRoute: Route | null;
  availableRoutes: Route[];
  
  // Alerts & Notifications
  alerts: Alert[];
  unreadAlerts: number;
  
  // Geofences
  geofences: Geofence[];
  
  // Analytics
  analytics: Analytics | null;
  
  // System Status
  systemStatus: SystemStatus;
  
  // UI State
  sidebarOpen: boolean;
  mapView: 'default' | 'satellite' | 'terrain';
  showTraffic: boolean;
  showGeofences: boolean;
  realtimeEnabled: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  
  // Truck actions
  setTrucks: (trucks: Truck[]) => void;
  updateTruck: (truck: Truck) => void;
  setSelectedTruck: (truck: Truck | null) => void;
  
  // Trip actions
  setTrips: (trips: Trip[]) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  
  // Place & Route actions
  setPlaces: (places: Place[]) => void;
  setSearchResults: (results: Place[]) => void;
  setSelectedRoute: (route: Route | null) => void;
  setAvailableRoutes: (routes: Route[]) => void;
  
  // Alert actions
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  
  // Geofence actions
  setGeofences: (geofences: Geofence[]) => void;
  addGeofence: (geofence: Geofence) => void;
  updateGeofence: (geofence: Geofence) => void;
  deleteGeofence: (geofenceId: string) => void;
  
  // Analytics actions
  setAnalytics: (analytics: Analytics) => void;
  
  // System actions
  setSystemStatus: (status: SystemStatus) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setMapView: (view: 'default' | 'satellite' | 'terrain') => void;
  setShowTraffic: (show: boolean) => void;
  setShowGeofences: (show: boolean) => void;
  setRealtimeEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      trucks: [],
      selectedTruck: null,
      trips: [],
      activeTrips: [],
      selectedTrip: null,
      places: [],
      searchResults: [],
      selectedRoute: null,
      availableRoutes: [],
      alerts: [],
      unreadAlerts: 0,
      geofences: [],
      analytics: null,
      systemStatus: {
        mqttConnected: false,
        kafkaConnected: false,
        redisConnected: false,
        postgresConnected: false,
        websocketConnected: false,
        activeTrucks: 0,
        messagesPerSecond: 0,
        systemLoad: 0
      },
      sidebarOpen: true,
      mapView: 'default',
      showTraffic: false,
      showGeofences: true,
      realtimeEnabled: true,

      // Authentication actions
      setUser: (user) => set({ user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

      // Truck actions
      setTrucks: (trucks) => set({ trucks }),
      updateTruck: (truck) => set((state) => ({
        trucks: state.trucks.map(t => t.id === truck.id ? truck : t)
      })),
      setSelectedTruck: (truck) => set({ selectedTruck: truck }),

      // Trip actions
      setTrips: (trips) => set({ 
        trips,
        activeTrips: trips.filter(t => ['started', 'in-progress'].includes(t.status))
      }),
      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, trip],
        activeTrips: [...state.activeTrips, trip]
      })),
      updateTrip: (trip) => set((state) => ({
        trips: state.trips.map(t => t.id === trip.id ? trip : t),
        activeTrips: state.activeTrips.map(t => t.id === trip.id ? trip : t)
      })),
      setSelectedTrip: (trip) => set({ selectedTrip: trip }),

      // Place & Route actions
      setPlaces: (places) => set({ places }),
      setSearchResults: (results) => set({ searchResults: results }),
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      setAvailableRoutes: (routes) => set({ availableRoutes: routes }),

      // Alert actions
      setAlerts: (alerts) => set({ 
        alerts,
        unreadAlerts: alerts.filter(a => !a.acknowledged).length
      }),
      addAlert: (alert) => set((state) => ({
        alerts: [alert, ...state.alerts],
        unreadAlerts: state.unreadAlerts + 1
      })),
      acknowledgeAlert: (alertId) => set((state) => ({
        alerts: state.alerts.map(a => 
          a.id === alertId ? { ...a, acknowledged: true } : a
        ),
        unreadAlerts: Math.max(0, state.unreadAlerts - 1)
      })),

      // Geofence actions
      setGeofences: (geofences) => set({ geofences }),
      addGeofence: (geofence) => set((state) => ({
        geofences: [...state.geofences, geofence]
      })),
      updateGeofence: (geofence) => set((state) => ({
        geofences: state.geofences.map(g => g.id === geofence.id ? geofence : g)
      })),
      deleteGeofence: (geofenceId) => set((state) => ({
        geofences: state.geofences.filter(g => g.id !== geofenceId)
      })),

      // Analytics actions
      setAnalytics: (analytics) => set({ analytics }),

      // System actions
      setSystemStatus: (status) => set({ systemStatus: status }),

      // UI actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setMapView: (view) => set({ mapView: view }),
      setShowTraffic: (show) => set({ showTraffic: show }),
      setShowGeofences: (show) => set({ showGeofences: show }),
      setRealtimeEnabled: (enabled) => set({ realtimeEnabled: enabled })
    }),
    {
      name: 'truck-tracking-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
        mapView: state.mapView,
        showTraffic: state.showTraffic,
        showGeofences: state.showGeofences,
        realtimeEnabled: state.realtimeEnabled
      })
    }
  )
);