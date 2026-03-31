import { useState, useEffect } from "react";
import { Wifi, Monitor, Plus, Settings, Eye, AlertTriangle, CameraOff, Play, Pause, Maximize2 } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { useUser } from "../context/UserContext";

type CameraDevice = {
  id: string;
  name: string;
  source: 'webcam' | 'ip' | 'rtsp';
  url?: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
  detections: {
    objects: number;
    weapons: number;
    faces: number;
  };
};

export function MonitorDashboard() {
  const { darkMode } = useSharedDarkMode();
  const { user } = useUser();
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [showAddCamera, setShowAddCamera] = useState(false);
  const [newCameraType, setNewCameraType] = useState<'ip' | 'rtsp'>('ip');
  const [newCameraUrl, setNewCameraUrl] = useState('');
  const [newCameraName, setNewCameraName] = useState('');
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would fetch from backend
    setCameras([
      {
        id: 'cam-001',
        name: 'Main Entrance',
        source: 'ip',
        url: 'http://192.168.1.100:8080/video',
        status: 'online',
        lastSeen: new Date(),
        detections: { objects: 15, weapons: 0, faces: 8 }
      },
      {
        id: 'cam-002',
        name: 'Parking Lot',
        source: 'rtsp',
        url: 'rtsp://192.168.1.101:554/stream',
        status: 'online',
        lastSeen: new Date(),
        detections: { objects: 3, weapons: 0, faces: 2 }
      },
      {
        id: 'cam-003',
        name: 'Lobby Camera',
        source: 'ip',
        url: 'http://192.168.1.102:8080/video',
        status: 'offline',
        lastSeen: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        detections: { objects: 0, weapons: 0, faces: 0 }
      }
    ]);
  }, []);

  const addCamera = () => {
    if (!newCameraName.trim() || !newCameraUrl.trim()) return;

    const newCamera: CameraDevice = {
      id: `cam-${Date.now()}`,
      name: newCameraName,
      source: newCameraType,
      url: newCameraUrl,
      status: 'offline', // Will be updated when connection is tested
      lastSeen: new Date(),
      detections: { objects: 0, weapons: 0, faces: 0 }
    };

    setCameras([...cameras, newCamera]);
    setNewCameraName('');
    setNewCameraUrl('');
    setShowAddCamera(false);
  };

  const removeCamera = (cameraId: string) => {
    setCameras(cameras.filter(cam => cam.id !== cameraId));
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getStatusColor = (status: CameraDevice['status']) => {
    switch (status) {
      case 'online': return darkMode ? 'text-green-400' : 'text-green-600';
      case 'offline': return darkMode ? 'text-gray-400' : 'text-gray-600';
      case 'error': return darkMode ? 'text-red-400' : 'text-red-600';
    }
  };

  const getStatusBg = (status: CameraDevice['status']) => {
    switch (status) {
      case 'online': return darkMode ? 'bg-green-900' : 'bg-green-100';
      case 'offline': return darkMode ? 'bg-gray-800' : 'bg-gray-100';
      case 'error': return darkMode ? 'bg-red-900' : 'bg-red-100';
    }
  };

  const totalDetections = cameras.reduce((acc, cam) => ({
    objects: acc.objects + cam.detections.objects,
    weapons: acc.weapons + cam.detections.weapons,
    faces: acc.faces + cam.detections.faces
  }), { objects: 0, weapons: 0, faces: 0 });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Monitor Dashboard
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Manage all cameras and monitor detection activity
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-xl p-6 border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <CameraOff className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cameras.length}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Cameras</p>
        </div>

        <div className={`rounded-xl p-6 border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Eye className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {cameras.filter(c => c.status === 'online').length}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Online</p>
        </div>

        <div className={`rounded-xl p-6 border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className={`w-8 h-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalDetections.weapons}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weapon Detections</p>
        </div>

        <div className={`rounded-xl p-6 border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <Settings className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {totalDetections.objects}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Object Detections</p>
        </div>
      </div>

      {/* Add Camera Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddCamera(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add New Camera
        </button>
      </div>

      {/* Cameras Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div
            key={camera.id}
            className={`rounded-xl overflow-hidden ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}
          >
            {/* Live Video Feed */}
            <div className="relative bg-black aspect-video">
              {camera.status === 'online' ? (
                <>
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={togglePause}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                          title={isPaused ? "Resume" : "Pause"}
                        >
                          {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
                          title="Toggle Fullscreen"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        camera.status === 'online' ? 'bg-green-500' :
                        camera.status === 'offline' ? 'bg-gray-500' :
                        'bg-red-500'
                      }`}>
                        {camera.status}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CameraOff size={48} className={darkMode ? 'text-gray-600' : 'text-gray-400'} />
                  <p className={`ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Camera Offline
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {camera.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {camera.source === 'ip' && <Wifi size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                  {camera.source === 'rtsp' && <Monitor size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />}
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {camera.source.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBg(camera.status)} ${getStatusColor(camera.status)}`}>
                {camera.status}
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                {camera.url}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Last seen: {camera.lastSeen.toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {camera.detections.objects}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Objects</div>
              </div>
              <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {camera.detections.weapons}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weapons</div>
              </div>
              <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {camera.detections.faces}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Faces</div>
              </div>
            </div>

            <button
              onClick={() => removeCamera(camera.id)}
              className={`w-full py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'border-red-600 text-red-400 hover:bg-red-900' 
                  : 'border-red-600 text-red-600 hover:bg-red-50'
              }`}
            >
              Remove Camera
            </button>
          </div>
        ))}
      </div>

      {/* Add Camera Modal */}
      {showAddCamera && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Add New Camera
            </h3>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Camera Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewCameraType('ip')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newCameraType === 'ip'
                        ? (darkMode ? 'border-blue-500 bg-blue-950' : 'border-blue-500 bg-blue-50')
                        : (darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')
                    }`}
                  >
                    <Wifi className={`w-6 h-6 mx-auto mb-1 ${newCameraType === 'ip' ? 'text-blue-500' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`} />
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>IP Camera</div>
                  </button>
                  <button
                    onClick={() => setNewCameraType('rtsp')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newCameraType === 'rtsp'
                        ? (darkMode ? 'border-blue-500 bg-blue-950' : 'border-blue-500 bg-blue-50')
                        : (darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')
                    }`}
                  >
                    <Monitor className={`w-6 h-6 mx-auto mb-1 ${newCameraType === 'rtsp' ? 'text-blue-500' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`} />
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>RTSP Stream</div>
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Camera Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Main Entrance Camera"
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {newCameraType === 'ip' ? 'IP Camera URL' : 'RTSP Stream URL'}
                </label>
                <input
                  type="text"
                  placeholder={newCameraType === 'ip' 
                    ? 'http://192.168.1.100:8080/video' 
                    : 'rtsp://username:password@192.168.1.100:554/stream'
                  }
                  value={newCameraUrl}
                  onChange={(e) => setNewCameraUrl(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {newCameraType === 'ip' 
                    ? 'Enter the HTTP/HTTPS URL of your IP camera'
                    : 'Enter the RTSP URL of your security camera'
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addCamera}
                disabled={!newCameraName.trim() || !newCameraUrl.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Camera
              </button>
              <button
                onClick={() => {
                  setShowAddCamera(false);
                  setNewCameraName('');
                  setNewCameraUrl('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
