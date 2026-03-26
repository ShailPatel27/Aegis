import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router";
import { useUser } from "../context/UserContext";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { UserProfile } from "./UserProfile";
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
  Video,
  AlertTriangle,
  Cog
} from "lucide-react";

// Camera-specific navigation
const cameraNavItems = [
  { path: "/camera/dashboard", label: "Dashboard", icon: Home },
  { path: "/camera/add-camera", label: "Add Camera", icon: Camera },
  { path: "/camera/live", label: "Live Monitoring", icon: Video },
  { path: "/camera/faces", label: "Face Recognition", icon: User },
  { path: "/camera/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/camera/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/camera/camera-config", label: "Camera Configuration", icon: Cog },
  { path: "/camera/settings", label: "Settings", icon: Settings },
];

// Monitor-specific navigation
const monitorNavItems = [
  { path: "/monitor/dashboard", label: "Dashboard", icon: Home },
  { path: "/monitor/add-camera", label: "Add Camera", icon: Camera },
  { path: "/monitor/live", label: "Live Monitoring", icon: Video },
  { path: "/monitor/faces", label: "Face Recognition", icon: User },
  { path: "/monitor/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/monitor/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/monitor/camera-config", label: "Camera Configuration", icon: Cog },
  { path: "/monitor/settings", label: "Settings", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { darkMode, setDarkMode } = useSharedDarkMode();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Choose navigation based on current route prefix
  const navItems = location.pathname.startsWith('/camera') ? cameraNavItems : monitorNavItems;

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
      <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 border-r ${
        sidebarVisible ? "w-64 border-gray-700" : "w-0 border-transparent"
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
      <UserProfile 
        show={showUserProfile} 
        onClose={() => setShowUserProfile(false)} 
      />
    </div>
  );
}