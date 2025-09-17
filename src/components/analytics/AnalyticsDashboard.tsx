import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  Clock, 
  Fuel,
  Target,
  Users,
  Download} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function AnalyticsDashboard() {
  const { analytics, trucks, trips } = useAppStore();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'trips' | 'fuel' | 'efficiency'>('revenue');

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', revenue: 245000, trips: 45, fuel: 12000 },
    { name: 'Feb', revenue: 289000, trips: 52, fuel: 13500 },
    { name: 'Mar', revenue: 312000, trips: 58, fuel: 14200 },
    { name: 'Apr', revenue: 298000, trips: 55, fuel: 13800 },
    { name: 'May', revenue: 334000, trips: 62, fuel: 15100 },
    { name: 'Jun', revenue: 356000, trips: 68, fuel: 16200 },
    { name: 'Jul', revenue: 378000, trips: 71, fuel: 17000 },
    { name: 'Aug', revenue: 392000, trips: 74, fuel: 17800 },
    { name: 'Sep', revenue: 367000, trips: 69, fuel: 16900 },
    { name: 'Oct', revenue: 389000, trips: 73, fuel: 17500 },
    { name: 'Nov', revenue: 412000, trips: 78, fuel: 18200 },
    { name: 'Dec', revenue: 445000, trips: 84, fuel: 19100 }
  ];

  const fleetStatusData = [
    { name: 'In Transit', value: trucks.filter(t => t.status === 'in-transit').length, color: '#10b981' },
    { name: 'Available', value: trucks.filter(t => t.status === 'available').length, color: '#6b7280' },
    { name: 'Assigned', value: trucks.filter(t => t.status === 'assigned').length, color: '#3b82f6' },
    { name: 'Maintenance', value: trucks.filter(t => t.status === 'maintenance').length, color: '#ef4444' },
    { name: 'Offline', value: trucks.filter(t => t.status === 'offline').length, color: '#374151' }
  ];

  const performanceData = [
    { name: 'Week 1', onTime: 94, delayed: 6, cancelled: 0 },
    { name: 'Week 2', onTime: 92, delayed: 7, cancelled: 1 },
    { name: 'Week 3', onTime: 96, delayed: 4, cancelled: 0 },
    { name: 'Week 4', onTime: 89, delayed: 9, cancelled: 2 }
  ];

  const routeEfficiencyData = [
    { route: 'Mumbai-Delhi', trips: 45, avgTime: 18.5, fuelEff: 7.2, cost: 25000 },
    { route: 'Delhi-Bangalore', trips: 38, avgTime: 22.3, fuelEff: 6.8, cost: 32000  },
    { route: 'Chennai-Kolkata', trips: 29, avgTime: 16.7, fuelEff: 7.5, cost: 22000 },
    { route: 'Pune-Hyderabad', trips: 34, avgTime: 14.2, fuelEff: 8.1, cost: 18000 },
    { route: 'Ahmedabad-Mumbai', trips: 52, avgTime: 8.5, fuelEff: 9.2, cost: 12000 }
  ];

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: `₹${analytics?.totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      title: 'Active Trips',
      value: analytics?.activeTrips.toString(),
      change: '+8.2%',
      trend: 'up',
      icon: Truck,
      color: 'text-blue-400'
    },
    {
      title: 'Avg Delivery Time',
      value: `${analytics?.averageDeliveryTime}h`,
      change: '-5.1%',
      trend: 'down',
      icon: Clock,
      color: 'text-purple-400'
    },
    {
      title: 'Fuel Efficiency',
      value: `${analytics?.fuelEfficiency} km/l`,
      change: '+3.8%',
      trend: 'up',
      icon: Fuel,
      color: 'text-orange-400'
    },
    {
      title: 'On-Time Delivery',
      value: `${analytics?.onTimeDeliveryRate}%`,
      change: '+2.1%',
      trend: 'up',
      icon: Target,
      color: 'text-emerald-400'
    },
    {
      title: 'Fleet Utilization',
      value: `${analytics?.fleetUtilization}%`,
      change: '+6.7%',
      trend: 'up',
      icon: Users,
      color: 'text-cyan-400'
    }
  ];

  const exportData = () => {
    const data = {
      analytics,
      trucks: trucks.length,
      trips: trips.length,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Real-time insights and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={exportData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                <div className={`flex items-center space-x-1 text-xs ${
                  kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{kpi.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
              <div className="text-xs text-gray-400">{kpi.title}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
              <div className="flex space-x-2">
                {['revenue', 'trips', 'fuel'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric as any)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                      selectedMetric === metric
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Fleet Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Fleet Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={fleetStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fleetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {fleetStatusData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Delivery Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="onTime" fill="#10b981" name="On Time" />
                <Bar dataKey="delayed" fill="#f59e0b" name="Delayed" />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Route Efficiency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Route Efficiency</h3>
            <div className="space-y-3">
              {routeEfficiencyData.map((route) => (
                <div key={route.route} className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{route.route}</span>
                    <span className="text-sm text-gray-400">{route.trips} trips</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Avg Time:</span>
                      <span className="text-white ml-1">{route.avgTime}h</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Fuel Eff:</span>
                      <span className="text-white ml-1">{route.fuelEff} km/l</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Cost:</span>
                      <span className="text-white ml-1">₹{route.cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { time: '2 min ago', event: 'TRK001 completed delivery to Mumbai Central', type: 'success' },
              { time: '5 min ago', event: 'TRK003 entered maintenance mode', type: 'warning' },
              { time: '12 min ago', event: 'New trip planned: Delhi to Bangalore', type: 'info' },
              { time: '18 min ago', event: 'TRK005 exceeded speed limit on NH-48', type: 'alert' },
              { time: '25 min ago', event: 'Fuel refill completed for TRK002', type: 'success' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-700/20 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                  activity.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.event}</p>
                  <p className="text-gray-400 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}