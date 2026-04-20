import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Camera, Users } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { monitorAPI, tokenManager } from "../services/api";

type DashboardPayload = {
  stats: {
    total_detections_today: number;
    active_cameras: number;
    alerts_triggered: number;
    recognized_faces: number;
  };
  activity: Array<{ label: string; detections: number }>;
  recent_alerts: Array<{ id: string; type: string; camera: string; timestamp: string; severity: string }>;
};

export function Dashboard() {
  const { darkMode } = useSharedDarkMode();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    const token = tokenManager.getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await monitorAPI.getDashboard(token);
      setData({
        stats: res?.stats || {
          total_detections_today: 0,
          active_cameras: 0,
          alerts_triggered: 0,
          recognized_faces: 0,
        },
        activity: Array.isArray(res?.activity) ? res.activity : [],
        recent_alerts: Array.isArray(res?.recent_alerts) ? res.recent_alerts : [],
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const timer = window.setInterval(loadDashboard, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const s = data?.stats;
    return [
      { label: "Total Detections Today", value: s?.total_detections_today ?? 0, icon: Activity, color: "bg-blue-500" },
      { label: "Active Cameras", value: s?.active_cameras ?? 0, icon: Camera, color: "bg-green-500" },
      { label: "Alerts Triggered", value: s?.alerts_triggered ?? 0, icon: AlertTriangle, color: "bg-red-500" },
      { label: "Recognized Faces", value: s?.recognized_faces ?? 0, icon: Users, color: "bg-purple-500" },
    ];
  }, [data]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Dashboard</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Real-time overview of your vision system</p>
      </div>

      {loading ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>Loading dashboard...</div>
      ) : error ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-red-300" : "bg-white border-gray-200 text-red-600"}`}>{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{stat.label}</p>
                      <p className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
                    </div>
                    <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className={`lg:col-span-2 rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Detection Activity (Last 24 Hours)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.activity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="label" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? "#1f2937" : "#fff",
                      border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
                      borderRadius: "8px",
                      color: darkMode ? "#fff" : "#000",
                    }}
                  />
                  <Line type="monotone" dataKey="detections" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Recent Alerts</h2>
              <div className="space-y-3">
                {(data?.recent_alerts || []).slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                    style={{ borderLeftColor: alert.severity === "high" ? "#ef4444" : alert.severity === "medium" ? "#f59e0b" : "#6b7280" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"}`}>{alert.type}</p>
                        <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{alert.camera}</p>
                      </div>
                      <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {(data?.recent_alerts || []).length === 0 && (
                  <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No recent alerts.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
