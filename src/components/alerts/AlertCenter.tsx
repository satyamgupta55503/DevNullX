import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  Fuel,
  Navigation,
  Shield,
  Zap
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Alert } from '../../types';
import { format } from 'date-fns';

export default function AlertCenter() {
  const { alerts, unreadAlerts, acknowledgeAlert } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'critical') return alert.severity === 'critical' || alert.severity === 'emergency';
    if (filter === 'warning') return alert.severity === 'warning';
    if (filter === 'info') return alert.severity === 'info';
    return true;
  }).slice(0, expanded ? undefined : 5);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'speed': return Navigation;
      case 'geofence': return MapPin;
      case 'fuel_low': return Fuel;
      case 'route_deviation': return Navigation;
      case 'maintenance': return Shield;
      case 'emergency': return AlertTriangle;
      case 'delay': return Clock;
      default: return Bell;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'info': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-500 text-white';
      case 'critical': return 'bg-red-400 text-white';
      case 'warning': return 'bg-yellow-400 text-black';
      case 'info': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-yellow-400" />
          Alert Center
          {unreadAlerts > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadAlerts}
            </span>
          )}
        </h2>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-1">
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'critical', label: 'Critical', count: alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length },
          { key: 'warning', label: 'Warning', count: alerts.filter(a => a.severity === 'warning').length },
          { key: 'info', label: 'Info', count: alerts.filter(a => a.severity === 'info').length }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key as any)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === filterOption.key
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {filterOption.label} ({filterOption.count})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const IconComponent = getAlertIcon(alert.type);
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-3 rounded-lg border transition-all ${
                  alert.acknowledged 
                    ? 'bg-gray-800/30 border-gray-600/30 opacity-60' 
                    : getSeverityColor(alert.severity)
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded ${getSeverityBadge(alert.severity)}`}>
                    <IconComponent className="w-3 h-3" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {alert.title}
                      </h4>
                      <span className="text-xs text-gray-400">
                        {format(alert.timestamp, 'HH:mm')}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-300 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>Truck: {alert.truckId}</span>
                        {alert.coordinates && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span>
                              {alert.coordinates.lat.toFixed(4)}, {alert.coordinates.lng.toFixed(4)}
                            </span>
                          </span>
                        )}
                      </div>
                      
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                    
                    {alert.acknowledged && alert.resolvedAt && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>Resolved at {format(alert.resolvedAt, 'HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More/Less Button */}
      {alerts.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors py-2"
        >
          {expanded ? 'Show Less' : `Show All (${alerts.length})`}
        </button>
      )}

      {/* Empty State */}
      {filteredAlerts.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No alerts to display</p>
          <p className="text-xs text-gray-500 mt-1">
            {filter === 'all' ? 'All systems running smoothly' : `No ${filter} alerts`}
          </p>
        </div>
      )}
    </div>
  );
}