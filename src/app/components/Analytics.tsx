import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Camera, AlertTriangle } from "lucide-react";

const detectionOverTime = [
  { id: "det-1", date: "Feb 24", detections: 234 },
  { id: "det-2", date: "Feb 25", detections: 187 },
  { id: "det-3", date: "Feb 26", detections: 298 },
  { id: "det-4", date: "Feb 27", detections: 265 },
  { id: "det-5", date: "Feb 28", detections: 312 },
  { id: "det-6", date: "Mar 01", detections: 289 },
  { id: "det-7", date: "Mar 02", detections: 347 },
];

const objectTypeData = [
  { id: "obj-1", type: "Person", count: 1247 },
  { id: "obj-2", type: "Vehicle", count: 342 },
  { id: "obj-3", type: "Package", count: 156 },
  { id: "obj-4", type: "Animal", count: 89 },
  { id: "obj-5", type: "Unknown", count: 45 },
];

const faceRecognitionData = [
  { id: "face-1", name: "Recognized", value: 782, color: "#10b981" },
  { id: "face-2", name: "Unknown", value: 234, color: "#f59e0b" },
  { id: "face-3", name: "Blacklist", value: 12, color: "#ef4444" },
];

const alertsPerDay = [
  { id: "alert-1", date: "Feb 24", high: 3, medium: 7, low: 12 },
  { id: "alert-2", date: "Feb 25", high: 2, medium: 5, low: 9 },
  { id: "alert-3", date: "Feb 26", high: 5, medium: 8, low: 14 },
  { id: "alert-4", date: "Feb 27", high: 1, medium: 6, low: 11 },
  { id: "alert-5", date: "Feb 28", high: 4, medium: 9, low: 15 },
  { id: "alert-6", date: "Mar 01", high: 2, medium: 7, low: 10 },
  { id: "alert-7", date: "Mar 02", high: 3, medium: 8, low: 13 },
];

const stats = [
  { label: "Total Detections", value: "12,847", change: "+12.5%", icon: Camera, color: "text-blue-600" },
  { label: "Face Recognition Rate", value: "94.2%", change: "+2.1%", icon: Users, color: "text-green-600" },
  { label: "Alert Response Time", value: "2.3 min", change: "-15.3%", icon: TrendingUp, color: "text-purple-600" },
  { label: "Active Alerts", value: "8", change: "-20%", icon: AlertTriangle, color: "text-red-600" },
];

export function Analytics() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Visual insights and system performance</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Date Range:</label>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <Icon className={stat.color} size={24} />
                <span className={`text-sm font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Over Time */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detections Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={detectionOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line 
                key="detections-line"
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

        {/* Object Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Object Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={objectTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="type" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar key="count-bar" dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Face Recognition Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Face Recognition Breakdown</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  key="face-recognition-pie"
                  data={faceRecognitionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {faceRecognitionData.map((entry) => (
                    <Cell key={`cell-${entry.id}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {faceRecognitionData.map((item) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Per Day */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts by Severity</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={alertsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar key="high-bar" dataKey="high" stackId="a" fill="#ef4444" name="High" radius={[0, 0, 0, 0]} />
              <Bar key="medium-bar" dataKey="medium" stackId="a" fill="#f59e0b" name="Medium" radius={[0, 0, 0, 0]} />
              <Bar key="low-bar" dataKey="low" stackId="a" fill="#fbbf24" name="Low" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Camera Performance Table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Camera Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uptime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detections</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Camera 1 - Main Entrance</td>
                <td className="px-6 py-4 text-gray-600">99.8%</td>
                <td className="px-6 py-4 text-gray-600">2,347</td>
                <td className="px-6 py-4 text-gray-600">12</td>
                <td className="px-6 py-4"><span className="text-green-600 font-medium">96.2%</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Camera 2 - Parking Lot</td>
                <td className="px-6 py-4 text-gray-600">98.5%</td>
                <td className="px-6 py-4 text-gray-600">1,892</td>
                <td className="px-6 py-4 text-gray-600">8</td>
                <td className="px-6 py-4"><span className="text-green-600 font-medium">94.7%</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Camera 3 - Hallway A</td>
                <td className="px-6 py-4 text-gray-600">100%</td>
                <td className="px-6 py-4 text-gray-600">3,124</td>
                <td className="px-6 py-4 text-gray-600">15</td>
                <td className="px-6 py-4"><span className="text-green-600 font-medium">97.1%</span></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Camera 4 - Side Entrance</td>
                <td className="px-6 py-4 text-gray-600">97.2%</td>
                <td className="px-6 py-4 text-gray-600">1,456</td>
                <td className="px-6 py-4 text-gray-600">6</td>
                <td className="px-6 py-4"><span className="text-green-600 font-medium">93.8%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
