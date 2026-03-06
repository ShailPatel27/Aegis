import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Filter } from "lucide-react";

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
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      case 'low': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
        <p className="text-gray-600 mt-1">Monitor and manage system alerts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <input 
              type="date" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              defaultValue="2024-03-02"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
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
            className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${getSeverityColor(alert.severity)}`}
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
                      <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-600" />
                        {alert.type}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{alert.camera}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-600">Timestamp</p>
                      <p className="text-sm font-medium text-gray-900">{alert.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Confidence</p>
                      <p className="text-sm font-medium text-gray-900">{alert.confidence}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    {alert.status === 'active' ? (
                      <>
                        <button 
                          onClick={() => resolveAlert(alert.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle size={16} />
                          Resolve
                        </button>
                        <button 
                          onClick={() => dismissAlert(alert.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                          <XCircle size={16} />
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        alert.status === 'resolved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
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
