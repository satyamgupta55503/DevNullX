import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, LiveTrackingData, Alert, SystemStatus } from '../types';
import { useAppStore } from '../store/useAppStore';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      upgrade: false,
      rememberUpgrade: false
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Update system status
      useAppStore.getState().setSystemStatus({
        ...useAppStore.getState().systemStatus,
        websocketConnected: true
      });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      
      // Update system status
      useAppStore.getState().setSystemStatus({
        ...useAppStore.getState().systemStatus,
        websocketConnected: false
      });

      this.handleReconnect();
    });

    this.socket.on('location_update', (data: LiveTrackingData) => {
      this.handleLocationUpdate(data);
    });

    this.socket.on('alert', (alert: Alert) => {
      this.handleAlert(alert);
    });

    this.socket.on('trip_status', (data: { tripId: string; status: string; location?: any }) => {
      this.handleTripStatusUpdate(data);
    });

    this.socket.on('system_status', (status: SystemStatus) => {
      useAppStore.getState().setSystemStatus(status);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleLocationUpdate(data: LiveTrackingData) {
    const { trucks, updateTruck } = useAppStore.getState();
    
    const truck = trucks.find(t => t.id === data.truckId);
    if (truck) {
      const updatedTruck = {
        ...truck,
        currentLocation: data.coordinates,
        speed: data.speed,
        heading: data.heading,
        lastUpdate: new Date(data.timestamp)
      };
      
      updateTruck(updatedTruck);
    }
  }

  private handleAlert(alert: Alert) {
    const { addAlert } = useAppStore.getState();
    addAlert(alert);
    
    // Show toast notification for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'emergency') {
      // This would integrate with your toast notification system
      console.log('Critical alert:', alert);
    }
  }

  private handleTripStatusUpdate(data: { tripId: string; status: string; location?: any }) {
    const { trips, updateTrip } = useAppStore.getState();
    
    const trip = trips.find(t => t.id === data.tripId);
    if (trip) {
      const updatedTrip = {
        ...trip,
        status: data.status as any,
        currentLocation: data.location || trip.currentLocation
      };
      
      updateTrip(updatedTrip);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(channel: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(channel, callback);
    }
  }

  unsubscribe(channel: string) {
    if (this.socket) {
      this.socket.off(channel);
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();