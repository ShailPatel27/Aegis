import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Camera, TrendingUp, Users } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { monitorAPI, tokenManager } from "../services/api";

type AnalyticsPayload = {
  stats: {
    total_detections: number;
    face_recognition_rate: number;
    active_alerts: number;
    active_cameras: number;
  };
  detection_over_time: Array<{ date: string; detections: number }>;
  object_type_data: Array<{ type: string; count: number }>;
  face_recognition_data: Array<{ name: string; value: number; color: string }>;
  alerts_per_day: Array<{ date: string; high: number; medium: number; low: number }>;
  camera_performance: Array<{ camera: string; uptime: string; detections: number; alerts: number; accuracy: string }>;
};

export function Analytics() {
  const { darkMode } = useSharedDarkMode();
  const [days, setDays] = useState(7);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const loadAnalytics = async (targetDays: number = days) => {
    const token = tokenManager.getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await monitorAPI.getAnalytics(token, targetDays);
      setData({
        stats: res?.stats || {
          total_detections: 0,
          face_recognition_rate: 0,
          active_alerts: 0,
          active_cameras: 0,
        },
        detection_over_time: Array.isArray(res?.detection_over_time) ? res.detection_over_time : [],
        object_type_data: Array.isArray(res?.object_type_data) ? res.object_type_data : [],
        face_recognition_data: Array.isArray(res?.face_recognition_data) ? res.face_recognition_data : [],
        alerts_per_day: Array.isArray(res?.alerts_per_day) ? res.alerts_per_day : [],
        camera_performance: Array.isArray(res?.camera_performance) ? res.camera_performance : [],
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(days);
  }, [days]);

  const stats = useMemo(() => {
    const s = data?.stats;
    return [
      { label: "Total Detections", value: s?.total_detections ?? 0, icon: Camera, color: "text-blue-600" },
      { label: "Face Recognition Rate", value: `${(s?.face_recognition_rate ?? 0).toFixed(1)}%`, icon: Users, color: "text-green-600" },
      { label: "Active Cameras", value: s?.active_cameras ?? 0, icon: TrendingUp, color: "text-purple-600" },
      { label: "Active Alerts", value: s?.active_alerts ?? 0, icon: AlertTriangle, color: "text-red-600" },
    ];
  }, [data]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Analytics</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Visual insights and system performance</p>
        </div>
        <div className="flex items-center gap-3">
          <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date Range:</label>
          <select
            title="Select date range"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>Loading analytics...</div>
      ) : error ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-red-300" : "bg-white border-gray-200 text-red-600"}`}>{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className={stat.color} size={24} />
                  </div>
                  <p className={`text-sm mb-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Detections Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.detection_over_time || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="date" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, borderRadius: "8px", color: darkMode ? "#f3f4f6" : "#111827" }} />
                  <Line type="monotone" dataKey="detections" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Object Type Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.object_type_data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="type" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, borderRadius: "8px", color: darkMode ? "#f3f4f6" : "#111827" }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Face Recognition Breakdown</h2>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data?.face_recognition_data || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                      activeIndex={activeIndex}
                      activeShape={(props: any) => {
                        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                        return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 10} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
                      }}
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(undefined)}
                    >
                      {(data?.face_recognition_data || []).map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, borderRadius: "8px" }}
                      labelStyle={{ color: darkMode ? "#f3f4f6" : "#111827" }}
                      itemStyle={{ color: darkMode ? "#f3f4f6" : "#111827" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Alerts by Severity</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.alerts_per_day || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                  <XAxis dataKey="date" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <YAxis stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? "#1f2937" : "#fff", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, borderRadius: "8px", color: darkMode ? "#f3f4f6" : "#111827" }} />
                  <Legend />
                  <Bar dataKey="high" stackId="a" fill="#ef4444" name="High" />
                  <Bar dataKey="medium" stackId="a" fill="#f59e0b" name="Medium" />
                  <Bar dataKey="low" stackId="a" fill="#fbbf24" name="Low" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`mt-6 rounded-xl shadow-sm border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className={`p-6 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Camera Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Camera</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Uptime</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Detections</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Alerts</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Accuracy</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {(data?.camera_performance || []).map((row) => (
                    <tr key={row.camera} className={`transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className={`px-6 py-4 font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{row.camera}</td>
                      <td className={`px-6 py-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{row.uptime}</td>
                      <td className={`px-6 py-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{row.detections}</td>
                      <td className={`px-6 py-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{row.alerts}</td>
                      <td className={`px-6 py-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{row.accuracy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
