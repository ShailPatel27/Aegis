import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router";
import { useUser } from "../context/UserContext";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import {
  Home,
  Camera,
  Users,
  Bell,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  Sun,
  Moon,
  User,
  Shield,
  Video,
  AlertTriangle,
  Cog
} from "lucide-react";

// Camera-specific navigation
const cameraNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/live", label: "Live Monitoring", icon: Video },
  { path: "/faces", label: "Face Recognition", icon: User },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/camera-config", label: "Camera Configuration", icon: Cog },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Monitor-specific navigation
const monitorNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/live", label: "Live Monitoring", icon: Video },
  { path: "/faces", label: "Face Recognition", icon: User },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/add-camera", label: "Add Camera", icon: Camera },
  { path: "/camera-config", label: "Camera Configuration", icon: Cog },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { darkMode, setDarkMode } = useSharedDarkMode();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Choose navigation - use monitor navigation for all users now
  const navItems = monitorNavItems;

  const handleLogout = () => {
    logout();
    navigate("/select-type");
  };

  // Apply dark mode to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
  }, [darkMode]);

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        sidebarVisible ? "w-64" : "w-0"
      } overflow-hidden`}>
        {/* Logo with Menu Toggle */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-4">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="text-white hover:bg-gray-800 p-2 rounded-lg transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">AEGIS</h1>
            <p className="text-sm text-gray-400">Vision System</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-white hover:bg-gray-800 p-2 rounded-lg transition-colors flex-shrink-0"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => setShowUserProfile(true)}
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-2 w-full hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{user?.name || "Guest User"}</p>
              <p className="text-xs text-gray-400">{user?.email || "guest@aegis.com"}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Hamburger Menu Button */}
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="fixed top-4 left-4 z-50 bg-white/20 backdrop-blur-md border border-white/30 text-white p-3 rounded-lg hover:bg-white/30 transition-colors"
            title="Open Menu"
          >
            <Menu size={24} />
          </button>
        )}
        <Outlet />
      </main>

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${darkMode ? 'dark bg-gray-800 text-white' : 'bg-white'} rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                User Profile
              </h2>
              <button
                onClick={() => setShowUserProfile(false)}
                className={`text-gray-400 hover:${darkMode ? 'text-gray-200' : 'text-gray-600'} transition-colors`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Info Display */}
            <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || "Not available"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.email || "user@aegis.com"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>User Type</p>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.type || "User"}
                  </p>
                </div>
                {user?.cameraId && (
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Camera ID</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.cameraId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl">
                  <User size={64} />
                </div>
                <button className="absolute bottom-0 right-0 bg-white border-2 border-gray-200 rounded-full p-2 hover:bg-gray-50 transition-colors">
                  <Camera size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user?.name || "User"}
                    readOnly
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    User Type
                  </label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                    defaultValue="monitor"
                  >
                    <option value="monitor">Monitor</option>
                    <option value="camera">Camera</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || "user@aegis.com"}
                  readOnly
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
              </div>

              {user?.cameraId && (
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Camera ID
                  </label>
                  <input
                    type="text"
                    value={user.cameraId}
                    readOnly
                    className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
                      darkMode ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                    title="Camera ID is automatically generated and cannot be changed"
                  />
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Camera ID is automatically generated and cannot be changed
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Save Changes
                </button>
                <button
                  onClick={() => setShowUserProfile(false)}
                  className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                    darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}