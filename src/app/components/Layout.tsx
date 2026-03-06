import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { 
  Home, 
  Video, 
  User, 
  AlertTriangle, 
  BarChart3, 
  Camera, 
  Settings as SettingsIcon,
  LogOut,
  Menu,
  Cog,
  Moon,
  Sun
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/live", label: "Live Monitoring", icon: Video },
  { path: "/faces", label: "Face Recognition", icon: User },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/add-camera", label: "Add Camera", icon: Camera },
  { path: "/camera-config", label: "Camera Configuration", icon: Cog },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Layout() {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
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
              <User size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-400">admin@aegis.com</p>
            </div>
          </button>
          <button className="flex items-center gap-2 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>

      {/* User Profile Modal */}
      {showUserProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
              <button
                onClick={() => setShowUserProfile(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="Admin User"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option>Administrator</option>
                    <option>Operator</option>
                    <option>Viewer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="admin@aegis.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="+91 8200057431"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Save Changes
                </button>
                <button 
                  onClick={() => setShowUserProfile(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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