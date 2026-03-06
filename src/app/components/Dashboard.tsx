import { Camera, AlertTriangle, Users, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { label: "Total Detections Today", value: "1,247", icon: Activity, color: "bg-blue-500" },
  { label: "Active Cameras", value: "12", icon: Camera, color: "bg-green-500" },
  { label: "Alerts Triggered", value: "8", icon: AlertTriangle, color: "bg-red-500" },
  { label: "Recognized Faces", value: "342", icon: Users, color: "bg-purple-500" },
];

const activityData = [
  { id: "act-1", time: "00:00", detections: 45 },
  { id: "act-2", time: "04:00", detections: 20 },
  { id: "act-3", time: "08:00", detections: 85 },
  { id: "act-4", time: "12:00", detections: 120 },
  { id: "act-5", time: "16:00", detections: 95 },
  { id: "act-6", time: "20:00", detections: 70 },
  { id: "act-7", time: "23:59", detections: 55 },
];

const recentAlerts = [
  { id: 1, type: "Weapon Detected", camera: "Camera 3", time: "2 min ago", severity: "high" },
  { id: 2, type: "Blacklist Match", camera: "Camera 1", time: "15 min ago", severity: "high" },
  { id: 3, type: "Unrecognized Person", camera: "Camera 5", time: "23 min ago", severity: "medium" },
  { id: 4, type: "Running Detected", camera: "Camera 2", time: "1 hour ago", severity: "low" },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time overview of your vision system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Live Feed Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Feed Preview</h2>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80" 
              alt="Security camera feed"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </div>
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
              Camera 1 - Main Entrance
            </div>
            {/* Mock detection boxes */}
            <div className="absolute top-1/3 left-1/4 w-24 h-32 border-2 border-green-500 rounded">
              <div className="bg-green-500 text-white text-xs px-2 py-1 -mt-6">Person 98%</div>
            </div>
            <div className="absolute bottom-1/4 right-1/3 w-20 h-28 border-2 border-blue-500 rounded">
              <div className="bg-blue-500 text-white text-xs px-2 py-1 -mt-6">Person 95%</div>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="p-3 bg-gray-50 rounded-lg border-l-4"
                style={{ borderLeftColor: alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f59e0b' : '#6b7280' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{alert.type}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.camera}</p>
                  </div>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Activity (Last 24 Hours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Line 
              type="monotone" 
              dataKey="detections" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
