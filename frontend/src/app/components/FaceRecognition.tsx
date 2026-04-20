import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Plus, Trash2, User, X } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { cameraAPI, monitorAPI, tokenManager } from "../services/api";

type FaceRow = {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  created_at: string;
  last_seen: string | null;
  detection_count: number;
};

type FaceAlertLog = {
  id: string;
  type: string;
  camera_name: string;
  timestamp: string;
  subject_name: string;
  message: string;
  image_url: string | null;
};

type CameraRow = {
  id: string;
  name: string;
};

type SortKey = "name" | "role" | "status" | "last_seen" | "detection_count";

const parseSubjectFromMessage = (message: string) => {
  const m = (message || "").match(/(User detected|Blacklisted person detected):\s*([^\(\n\r]+)/i);
  return m?.[2]?.trim() || "";
};

export function FaceRecognition() {
  const { darkMode } = useSharedDarkMode();
  const [faces, setFaces] = useState<FaceRow[]>([]);
  const [selectedFaceId, setSelectedFaceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<FaceAlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"user" | "blacklist">("user");
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [cameraRows, setCameraRows] = useState<CameraRow[]>([]);
  const [applyToAllCameras, setApplyToAllCameras] = useState(true);
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visibleRecentCount, setVisibleRecentCount] = useState(8);

  const selectedUser = useMemo(() => faces.find((f) => f.id === selectedFaceId) || null, [faces, selectedFaceId]);
  const shownLogs = useMemo(() => logs.slice(0, visibleRecentCount), [logs, visibleRecentCount]);

  const loadData = async (showLoader: boolean = false) => {
    const token = tokenManager.getToken();
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      if (showLoader) {
        setLoading(true);
      }
      const [facesRes, alertsRes, cameras] = await Promise.all([
        monitorAPI.getFaces(token, 500),
        monitorAPI.getAlerts(token, { limit: 200 }),
        cameraAPI.getCameras(token),
      ]);

      const nextFaces = Array.isArray(facesRes?.faces) ? facesRes.faces : [];
      const nextCameras = Array.isArray(cameras)
        ? cameras.map((c: any) => ({ id: String(c.id), name: String(c.name || "Camera") }))
        : [];
      setCameraRows(nextCameras);
      if (nextCameras.length > 0 && selectedCameraIds.length === 0) {
        setSelectedCameraIds(nextCameras.map((c) => c.id));
      }
      setFaces(nextFaces);
      if (!selectedFaceId && nextFaces.length > 0) {
        setSelectedFaceId(nextFaces[0].id);
      }

      const alertRows = Array.isArray(alertsRes?.alerts) ? alertsRes.alerts : [];
      const faceLogs = alertRows
        .filter((a: any) => a?.type === "face_detected" || a?.type === "unknown_face" || (a?.type === "threat" && /blacklisted person detected/i.test(String(a?.message || ""))))
        .map((a: any) => ({
          id: String(a.id),
          type: String(a.type || ""),
          camera_name: String(a.camera_name || "Camera"),
          timestamp: String(a.timestamp || ""),
          subject_name: String(a.subject_name || parseSubjectFromMessage(String(a.message || "")) || a.type || "Unknown"),
          message: String(a.message || ""),
          image_url: a?.image_url ? String(a.image_url) : null,
        }))
        .slice(0, 12);
      setLogs(faceLogs);
      setVisibleRecentCount(8);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load face data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const timer = window.setInterval(() => loadData(false), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortedFaces = useMemo(() => {
    const rows = [...faces];
    const sign = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const aStatus = String((a.role || "").toLowerCase() === "blacklist" ? "Blacklisted" : "Recognized");
      const bStatus = String((b.role || "").toLowerCase() === "blacklist" ? "Blacklisted" : "Recognized");
      let av: any = "";
      let bv: any = "";
      if (sortKey === "name") { av = a.name || ""; bv = b.name || ""; }
      if (sortKey === "role") { av = a.role || ""; bv = b.role || ""; }
      if (sortKey === "status") { av = aStatus; bv = bStatus; }
      if (sortKey === "last_seen") { av = new Date(a.last_seen || a.created_at).getTime(); bv = new Date(b.last_seen || b.created_at).getTime(); }
      if (sortKey === "detection_count") { av = Number(a.detection_count || 0); bv = Number(b.detection_count || 0); }
      if (av < bv) return -1 * sign;
      if (av > bv) return 1 * sign;
      return 0;
    });
    return rows;
  }, [faces, sortDir, sortKey]);

  const handleImageFile = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setNewImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const toggleCameraId = (cameraId: string, checked: boolean) => {
    setSelectedCameraIds((prev) => {
      if (checked) return prev.includes(cameraId) ? prev : [...prev, cameraId];
      return prev.filter((id) => id !== cameraId);
    });
  };

  const createFace = async () => {
    const token = tokenManager.getToken();
    if (!token) return;
    if (!newName.trim()) {
      setError("Name is required");
      return;
    }
    if (newRole === "blacklist" && !applyToAllCameras && selectedCameraIds.length === 0) {
      setError("Select at least one camera for blacklist");
      return;
    }

    setSaving(true);
    try {
      await monitorAPI.createFace(token, {
        name: newName.trim(),
        role: newRole || "user",
        image_url: newImageUrl || undefined,
        apply_to_all: newRole === "blacklist" ? applyToAllCameras : true,
        camera_ids: newRole === "blacklist" && !applyToAllCameras ? selectedCameraIds : undefined,
      });
      setShowAddModal(false);
      setNewName("");
      setNewRole("user");
      setNewImageUrl("");
      setApplyToAllCameras(true);
      setSelectedCameraIds(cameraRows.map((c) => c.id));
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to add face");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedUser = async () => {
    const token = tokenManager.getToken();
    if (!token || !selectedUser) return;
    try {
      await monitorAPI.deleteFace(token, selectedUser.id);
      setShowDeleteConfirm(false);
      setSelectedFaceId(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete user");
    }
  };

  const fmtRelative = (ts?: string | null) => {
    if (!ts) return "Never";
    const dt = new Date(ts);
    const diffMs = Date.now() - dt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  };

  const thButton = (label: string, key: SortKey) => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className={`uppercase tracking-wider text-xs font-medium ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-800"}`}
    >
      {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </button>
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Face Recognition</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Recognized and blacklisted face profiles</p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} />
          Add New User
        </button>
      </div>

      {loading ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>Loading face profiles...</div>
      ) : error ? (
        <div className={`rounded-xl p-10 text-center border ${darkMode ? "bg-gray-800 border-gray-700 text-red-300" : "bg-white border-gray-200 text-red-600"}`}>{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 rounded-xl shadow-sm border overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                    <tr>
                      <th className="px-6 py-3 text-left">{thButton("User", "name")}</th>
                      <th className="px-6 py-3 text-left">{thButton("Role", "role")}</th>
                      <th className="px-6 py-3 text-left">{thButton("Status", "status")}</th>
                      <th className="px-6 py-3 text-left">{thButton("Last Seen", "last_seen")}</th>
                      <th className="px-6 py-3 text-left">{thButton("Detections", "detection_count")}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                    {sortedFaces.map((user) => {
                      const isBlacklisted = String(user.role || "").toLowerCase() === "blacklist";
                      return (
                        <tr key={user.id} className={`cursor-pointer transition-colors ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`} onClick={() => setSelectedFaceId(user.id)}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80"}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover cursor-zoom-in"
                                onClick={(e) => { e.stopPropagation(); if (user.image_url) setPreviewImage(user.image_url); }}
                              />
                              <span className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{user.name}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{user.role || "user"}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isBlacklisted ? (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-300 text-gray-800") : darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800"}`}>
                              <CheckCircle size={12} />
                              {isBlacklisted ? "Blacklisted" : "Recognized"}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{fmtRelative(user.last_seen)}</td>
                          <td className={`px-6 py-4 text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{user.detection_count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              {selectedUser ? (
                <div>
                  <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>User Details</h2>
                  <div className="text-center mb-6">
                    <img
                      src={selectedUser.image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80"}
                      alt={selectedUser.name}
                      className={`w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 cursor-zoom-in ${darkMode ? "border-gray-600" : "border-gray-200"}`}
                      onClick={() => selectedUser.image_url && setPreviewImage(selectedUser.image_url)}
                    />
                    <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{selectedUser.name}</h3>
                    <p className={`text-sm mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{selectedUser.role || "user"}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Last Seen</label>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{fmtRelative(selectedUser.last_seen)}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Total Detections</label>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{selectedUser.detection_count}</p>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Created</label>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{new Date(selectedUser.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                    <Trash2 size={16} />
                    Delete User
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User size={48} className={`mx-auto mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>No registered faces yet</p>
                </div>
              )}
            </div>
          </div>

          <div className={`mt-6 rounded-xl shadow-sm p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>Recent Face Alerts</h2>
            <div className="space-y-3">
              {shownLogs.map((log) => {
                const isBlacklisted = /blacklisted person detected/i.test(log.message || "");
                return (
                  <div key={log.id} className={`flex items-center justify-between p-4 rounded-lg ${isBlacklisted ? (darkMode ? "bg-gray-700" : "bg-gray-200") : darkMode ? "bg-gray-700/40" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-4">
                      <img
                        src={log.image_url || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=80"}
                        alt={log.subject_name || log.type}
                        className="w-12 h-12 rounded object-cover cursor-zoom-in"
                        onClick={() => log.image_url && setPreviewImage(log.image_url)}
                      />
                      <div className={`w-2 h-2 rounded-full ${isBlacklisted ? "bg-gray-400" : log.type === "face_detected" ? "bg-green-500" : "bg-orange-500"}`} />
                      <div>
                        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{log.subject_name || "Unknown"}</p>
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{log.camera_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-500"}`}>{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>No face-related alerts yet.</div>}
            </div>
            {logs.length > 0 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleRecentCount((prev) => Math.min(logs.length, prev + 8))}
                  disabled={visibleRecentCount >= logs.length}
                  className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-100 disabled:opacity-50" : "bg-gray-200 text-gray-800 disabled:opacity-50"}`}
                >
                  View More
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleRecentCount(logs.length)}
                  disabled={visibleRecentCount >= logs.length}
                  className={`px-4 py-2 rounded-lg ${darkMode ? "bg-blue-700 text-white disabled:opacity-50" : "bg-blue-600 text-white disabled:opacity-50"}`}
                >
                  View All
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-xl border p-6 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Add Face User</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className={`p-1 rounded ${darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-600 hover:bg-gray-100"}`}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Name</label>
                <input title="Face name" value={newName} onChange={(e) => setNewName(e.target.value)} className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setNewRole("user")} className={`px-3 py-2 rounded-lg border text-sm ${newRole === "user" ? "bg-blue-600 text-white border-blue-500" : darkMode ? "bg-gray-800 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"}`}>Normal User</button>
                  <button type="button" onClick={() => setNewRole("blacklist")} className={`px-3 py-2 rounded-lg border text-sm ${newRole === "blacklist" ? "bg-red-600 text-white border-red-500" : darkMode ? "bg-gray-800 text-gray-200 border-gray-600" : "bg-white text-gray-800 border-gray-300"}`}>Blacklist</button>
                </div>
              </div>
              {newRole === "blacklist" && (
                <div className={`rounded-lg border p-3 ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                  <label className={`flex items-center gap-2 text-sm font-medium mb-3 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    <input title="Apply blacklist to all cameras" type="checkbox" checked={applyToAllCameras} onChange={(e) => { const checked = e.target.checked; setApplyToAllCameras(checked); if (checked) setSelectedCameraIds(cameraRows.map((c) => c.id)); }} />
                    Apply To All Cameras
                  </label>
                  <div className="space-y-2">
                    {cameraRows.map((camera) => (
                      <label key={camera.id} className={`flex items-center gap-2 text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        <input title={`Blacklist on ${camera.name}`} type="checkbox" disabled={applyToAllCameras} checked={selectedCameraIds.includes(camera.id)} onChange={(e) => toggleCameraId(camera.id, e.target.checked)} />
                        {camera.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Picture</label>
                <label className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer ${darkMode ? "bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700" : "bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"}`}>
                  Select File
                  <input title="Upload picture" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageFile(e.target.files?.[0])} />
                </label>
                {newImageUrl && <img src={newImageUrl} alt="preview" className="mt-3 w-20 h-20 rounded object-cover border border-gray-500/40 cursor-zoom-in" onClick={() => setPreviewImage(newImageUrl)} />}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800"}`}>Cancel</button>
                <button type="button" disabled={saving} onClick={createFace} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-xl border p-6 ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Delete User?</h3>
            <p className={darkMode ? "text-gray-300" : "text-gray-700"}>This will remove <span className="font-semibold">{selectedUser.name}</span> from face recognition.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className={`px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-100" : "bg-gray-200 text-gray-800"}`}>Cancel</button>
              <button type="button" onClick={deleteSelectedUser} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white/90 hover:text-white">
              <X size={28} />
            </button>
            <img src={previewImage} alt="preview" className="max-w-full max-h-[85vh] rounded-lg object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
