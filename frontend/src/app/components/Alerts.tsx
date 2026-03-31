import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Filter } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";

const initialAlerts = [
  { 
    id: 1, 
    type: "Weapon Detected", 
    camera: "Camera 3 - Hallway A", 
    timestamp: "2024-03-02 14:32:15", 
    severity: "high",
    confidence: "97%",
    status: "active",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&q=80"
  },
  { 
    id: 2, 
    type: "Blacklist Match", 
    camera: "Camera 1 - Main Entrance", 
    timestamp: "2024-03-02 14:15:42", 
    severity: "high",
    confidence: "95%",
    status: "active",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80"
  },
  { 
    id: 3, 
    type: "Unrecognized Person", 
    camera: "Camera 5 - Server Room", 
    timestamp: "2024-03-02 13:47:28", 
    severity: "medium",
    confidence: "89%",
    status: "active",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80"
  },
  { 
    id: 4, 
    type: "Running Detected", 
    camera: "Camera 2 - Parking Lot", 
    timestamp: "2024-03-02 13:12:05", 
    severity: "low",
    confidence: "92%",
    status: "resolved",
    image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&q=80"
  },
  { 
    id: 5, 
    type: "Loitering Detected", 
    camera: "Camera 4 - Side Entrance", 
    timestamp: "2024-03-02 12:45:33", 
    severity: "low",
    confidence: "86%",
    status: "dismissed",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80"
  },
  { 
    id: 6, 
    type: "Multiple People", 
    camera: "Camera 1 - Main Entrance", 
    timestamp: "2024-03-02 11:23:17", 
    severity: "medium",
    confidence: "93%",
    status: "resolved",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80"
  },
];

export function Alerts() {
  const { darkMode } = useSharedDarkMode();
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && alert.status !== filterStatus) return false;
    return true;
  });

  const resolveAlert = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: 'resolved' } : alert
    ));
  };

  const dismissAlert = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: 'dismissed' } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return darkMode ? 'border-red-700 bg-red-950/40' : 'border-red-500 bg-red-50';
      case 'medium': return darkMode ? 'border-orange-700 bg-orange-950/40' : 'border-orange-500 bg-orange-50';
      case 'low': return darkMode ? 'border-yellow-700 bg-yellow-950/40' : 'border-yellow-500 bg-yellow-50';
      default: return darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return darkMode ? 'border-red-700 text-red-400 bg-gray-700/50' : 'bg-red-100 text-red-800';
      case 'medium': return darkMode ? 'border-orange-700 text-orange-400 bg-gray-700/50' : 'bg-orange-100 text-orange-800';
      case 'low': return darkMode ? 'border-yellow-700 text-yellow-400 bg-gray-700/50' : 'bg-yellow-100 text-yellow-800';
      default: return darkMode ? 'border-gray-600 text-gray-400 bg-gray-700/50' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alerts</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Monitor and manage system alerts</p>
      </div>

      {/* Filters */}
      <div className={`rounded-xl shadow-sm p-6 border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Severity</label>
            <select 
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
            <select 
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date</label>
            <input 
              type="date" 
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert' : 'bg-white border-gray-300'
              }`}
              defaultValue="2024-03-02"
              style={darkMode ? {
                colorScheme: 'dark'
              } : undefined}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Camera</label>
            <select className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
            }`}>
              <option>All Cameras</option>
              <option>Camera 1</option>
              <option>Camera 2</option>
              <option>Camera 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`rounded-xl shadow-sm border-l-4 overflow-hidden ${getSeverityColor(alert.severity)}`}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={alert.image} 
                  alt={alert.type}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-semibold text-lg flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <AlertTriangle size={20} className={darkMode ? 'text-red-400' : 'text-red-600'} />
                        {alert.type}
                      </h3>
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{alert.camera}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Timestamp</p>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.timestamp}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Confidence</p>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.confidence}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {alert.status === 'active' ? (
                      <>
                        <button 
                          onClick={() => resolveAlert(alert.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            darkMode 
                              ? 'bg-green-700 text-white hover:bg-green-600' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <CheckCircle size={16} />
                          Resolve
                        </button>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-600 text-white hover:bg-gray-700'
                          }`}
                        >
                          <XCircle size={16} />
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        alert.status === 'resolved' 
                          ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.status === 'resolved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <AlertTriangle size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No alerts match your filters</p>
        </div>
      )}
    </div>
  );
}
