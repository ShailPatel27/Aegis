import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, Filter, XCircle } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { monitorAPI, tokenManager } from "../services/api";

type AlertRow = {
  id: string;
  type: string;
  camera_id: string;
  camera_name: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  confidence: number | null;
  status: "active" | "resolved" | "dismissed";
  message: string;
  subject_name?: string | null;
  image_url: string | null;
};

const DEFAULT_TYPES = [
  "intrusion",
  "crowd",
  "vehicle",
  "threat",
  "motion",
  "loiter",
  "emergency",
  "face_detected",
  "unknown_face",
  "system_error",
];

export function Alerts() {
  const { darkMode } = useSharedDarkMode();
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [types, setTypes] = useState<string[]>(DEFAULT_TYPES);
  const [cameras, setCameras] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCamera, setFilterCamera] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const loadAlerts = async (showLoader: boolean = false) => {
    const token = tokenManager.getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await monitorAPI.getAlerts(token, {
        alert_type: filterType,
        status: filterStatus,
        camera_id: filterCamera,
        date: filterDate || undefined,
        limit: 150,
      });
      const rows = Array.isArray(res?.alerts) ? res.alerts : [];
      setAlerts(rows);
      const nextTypes = Array.isArray(res?.types) && res.types.length > 0 ? res.types : DEFAULT_TYPES;
      setTypes(nextTypes);
      setCameras(Array.isArray(res?.cameras) ? res.cameras : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts(true);
    const timer = window.setInterval(() => loadAlerts(false), 5000);
    return () => window.clearInterval(timer);
  }, [filterType, filterStatus, filterCamera, filterDate]);

  useEffect(() => {
    setVisibleCount(12);
  }, [filterType, filterStatus, filterCamera, filterDate, filterSeverity]);

  const filteredAlerts = useMemo(() => {
    const base = filterSeverity === "all" ? alerts : alerts.filter((a) => a.severity === filterSeverity);
    const rank: Record<string, number> = { active: 0, dismissed: 1, resolved: 2 };
    return [...base].sort((a, b) => {
      const ra = rank[a.status] ?? 9;
      const rb = rank[b.status] ?? 9;
      if (ra !== rb) return ra - rb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [alerts, filterSeverity]);

  const shownAlerts = useMemo(() => filteredAlerts.slice(0, visibleCount), [filteredAlerts, visibleCount]);

  const updateStatus = async (id: string, status: "resolved" | "dismissed") => {
    const token = tokenManager.getToken();
    if (!token) return;
    setPendingStatusId(id);
    try {
      await monitorAPI.updateAlertStatus(token, id, status);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setPendingStatusId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return darkMode ? "border-red-700 bg-red-950/40" : "border-red-500 bg-red-50";
      case "medium":
        return darkMode ? "border-orange-700 bg-orange-950/40" : "border-orange-500 bg-orange-50";
      case "low":
        return darkMode ? "border-yellow-700 bg-yellow-950/40" : "border-yellow-500 bg-yellow-50";
      default:
        return darkMode ? "border-gray-600 bg-gray-800/50" : "border-gray-500 bg-gray-50";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return darkMode ? "border-red-700 text-red-400 bg-gray-700/50" : "bg-red-100 text-red-800";
      case "medium":
        return darkMode ? "border-orange-700 text-orange-400 bg-gray-700/50" : "bg-orange-100 text-orange-800";
      case "low":
        return darkMode ? "border-yellow-700 text-yellow-400 bg-gray-700/50" : "bg-yellow-100 text-yellow-800";
      default:
        return darkMode ? "border-gray-600 text-gray-400 bg-gray-700/50" : "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Alerts</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Monitor and manage system alerts</p>
      </div>

      <div className={`rounded-xl shadow-sm p-6 border mb-6 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className={darkMode ? "text-gray-400" : "text-gray-600"} />
          <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>AI Type</label>
            <select
              title="Filter by AI type"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Severity</label>
            <select
              title="Filter by severity"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
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
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Status</label>
            <select
              title="Filter by status"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
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
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date</label>
            <input
              type="date"
              title="Filter by date"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" : "bg-white border-gray-300"}`}
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Camera</label>
            <select
              title="Filter by camera"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              value={filterCamera}
              onChange={(e) => setFilterCamera(e.target.value)}
            >
              <option value="all">All Cameras</option>
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>Loading alerts...</div>
      ) : error ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-red-300" : "bg-white border-gray-200 text-red-600"}`}>{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shownAlerts.map((alert) => (
            <div key={alert.id} className={`rounded-xl shadow-sm border-l-4 overflow-hidden ${getSeverityColor(alert.severity)}`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={alert.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80"}
                    alt={alert.type}
                    className="w-24 h-24 rounded-lg object-cover cursor-zoom-in"
                    onClick={() => alert.image_url && setPreviewImage(alert.image_url)}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-semibold text-lg flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                          <AlertTriangle size={20} className={darkMode ? "text-red-400" : "text-red-600"} />
                          {alert.type}
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{alert.camera_name}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Timestamp</p>
                        <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Confidence</p>
                        <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{alert.confidence == null ? "N/A" : `${Math.round(alert.confidence * 100)}%`}</p>
                      </div>
                    </div>

                    {alert.message && <p className={`mt-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{alert.message}</p>}

                    <div className="flex items-center gap-2 mt-4">
                      {alert.status === "active" ? (
                        <>
                          <button
                            type="button"
                            disabled={pendingStatusId === alert.id}
                            onClick={() => updateStatus(alert.id, "resolved")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${darkMode ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-600 text-white hover:bg-green-700"} disabled:opacity-60`}
                          >
                            <CheckCircle size={16} />
                            Resolve
                          </button>
                          <button
                            type="button"
                            disabled={pendingStatusId === alert.id}
                            onClick={() => updateStatus(alert.id, "dismissed")}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-600 text-white hover:bg-gray-700"} disabled:opacity-60`}
                          >
                            <XCircle size={16} />
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${alert.status === "resolved" ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800") : darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-800"}`}
                        >
                          {alert.status === "resolved" ? <CheckCircle size={16} /> : <XCircle size={16} />}
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
      )}

      {!loading && !error && filteredAlerts.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(filteredAlerts.length, prev + 12))}
            disabled={visibleCount >= filteredAlerts.length}
            className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-100 disabled:opacity-50" : "bg-gray-200 text-gray-800 disabled:opacity-50"}`}
          >
            View More
          </button>
          <button
            type="button"
            onClick={() => setVisibleCount(filteredAlerts.length)}
            disabled={visibleCount >= filteredAlerts.length}
            className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-700 text-white disabled:opacity-50" : "bg-blue-600 text-white disabled:opacity-50"}`}
          >
            View All
          </button>
        </div>
      )}

      {!loading && !error && filteredAlerts.length === 0 && (
        <div className={`rounded-xl shadow-sm p-12 border text-center ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
          <AlertTriangle size={48} className="mx-auto mb-3 opacity-60" />
          <p>No alerts match your filters</p>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white/90 hover:text-white">
              <XCircle size={28} />
            </button>
            <img src={previewImage} alt="preview" className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
