import { useEffect, useState } from "react";
import { Bell, Camera } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { useCameras } from "../context/CameraContext";
import { monitorAPI, tokenManager } from "../services/api";

export function Settings() {
  const { darkMode } = useSharedDarkMode();
  const { cameras, deleteCamera } = useCameras();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = tokenManager.getToken();
        if (!token) return;
        const res = await monitorAPI.getSettings(token);
        const s = res?.settings || {};
        setPushNotifications(Boolean(s.push_notifications ?? true));
        setEmailAlerts(Boolean(s.email_alerts ?? true));
        setNotifyEmail(String(s.notify_email || ""));
      } catch {
        // keep defaults
      }
    };
    load();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      const token = tokenManager.getToken();
      if (!token) return;
      await monitorAPI.updateSettings(token, {
        push_notifications: pushNotifications,
        email_alerts: emailAlerts,
        notify_email: notifyEmail.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Settings</h1>
        <p className={`mt-1 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Alert preferences and camera management
        </p>
      </div>

      <div
        className={`rounded-xl shadow-sm p-6 border mb-6 ${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-6">
          <Bell size={24} className={darkMode ? "text-gray-300" : "text-gray-700"} />
          <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
            Alert Settings
          </h2>
        </div>

        <div className="space-y-6">
          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div>
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Push Notifications</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Enable high-severity alert notifications
              </p>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                pushNotifications ? "bg-blue-600" : darkMode ? "bg-gray-600" : "bg-gray-300"
              }`}
              type="button"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  pushNotifications ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div
            className={`flex items-center justify-between p-4 rounded-lg ${
              darkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div>
              <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Email Alerts</p>
              <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Receive email with screenshot and alert details
              </p>
            </div>
            <button
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`w-12 h-6 rounded-full transition-colors ${
                emailAlerts ? "bg-blue-600" : darkMode ? "bg-gray-600" : "bg-gray-300"
              }`}
              type="button"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  emailAlerts ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className={`text-sm font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
              Notification Email
            </label>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="you@example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
              }`}
            />
          </div>
        </div>
      </div>

      {cameras.length > 0 && (
        <div
          className={`rounded-xl shadow-sm p-6 border mb-6 ${
            darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-6">
            <Camera size={24} className={darkMode ? "text-gray-300" : "text-gray-700"} />
            <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>Registered Cameras</h2>
          </div>

          <div className="space-y-4">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={`p-4 rounded-lg border ${
                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{camera.name}</p>
                    <p className={`text-xs mt-1 font-mono ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      ID: {camera.id}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${camera.name}"? This cannot be undone.`)) {
                        await deleteCamera(camera.id);
                        window.location.href = "/select-type";
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    type="button"
                  >
                    Delete Camera
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}

