import { useState } from "react";
import { ChevronDown, ChevronUp, Edit2, Save, X, Check, Trash2 } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";

type CameraConfig = {
  objectDetection: boolean;
  weaponDetection: boolean;
  faceRecognition: boolean;
  runningDetection: boolean;
  loiteringDetection: boolean;
  crowdDetection: boolean;
};

type Camera = {
  id: number;
  name: string;
  location: string;
  status: "active" | "inactive";
  config: CameraConfig;
  createdAt: Date;
};

export function CameraConfig() {
  const { darkMode } = useSharedDarkMode();
  const [cameras, setCameras] = useState<Camera[]>([
    {
      id: 1,
      name: "Main Entrance",
      location: "Building A - Floor 1",
      status: "active",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: true,
        runningDetection: false,
        loiteringDetection: true,
        crowdDetection: false,
      },
      createdAt: new Date('2026-03-01T08:00:00'),
    },
    {
      id: 2,
      name: "Lobby Camera 1",
      location: "Building A - Lobby",
      status: "active",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: true,
        runningDetection: true,
        loiteringDetection: true,
        crowdDetection: true,
      },
      createdAt: new Date('2026-03-01T09:30:00'),
    },
    {
      id: 3,
      name: "Parking Lot North",
      location: "Outdoor - North Section",
      status: "active",
      config: {
        objectDetection: true,
        weaponDetection: false,
        faceRecognition: false,
        runningDetection: false,
        loiteringDetection: true,
        crowdDetection: true,
      },
      createdAt: new Date('2026-03-02T10:00:00'),
    },
    {
      id: 4,
      name: "Server Room",
      location: "Building B - Floor 3",
      status: "inactive",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: true,
        runningDetection: false,
        loiteringDetection: false,
        crowdDetection: false,
      },
      createdAt: new Date('2026-03-03T11:00:00'),
    },
    {
      id: 5,
      name: "Cafeteria Camera",
      location: "Building A - Floor 2",
      status: "active",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: false,
        runningDetection: false,
        loiteringDetection: false,
        crowdDetection: true,
      },
      createdAt: new Date('2026-03-04T12:00:00'),
    },
  ]);

  const [expandedCamera, setExpandedCamera] = useState<number | null>(null);
  const [editingCamera, setEditingCamera] = useState<number | null>(null);
  const [editConfig, setEditConfig] = useState<CameraConfig | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  const startEditing = (camera: Camera) => {
    setEditingCamera(camera.id);
    setEditConfig(camera.config);
    setEditName(camera.name);
    setEditLocation(camera.location);
  };

  const saveEdit = (cameraId: number) => {
    if (editConfig && editName.trim() && editLocation.trim()) {
      setCameras(cameras.map(cam => 
        cam.id === cameraId 
          ? { ...cam, name: editName.trim(), location: editLocation.trim(), config: editConfig }
          : cam
      ));
      setEditingCamera(null);
      setEditConfig(null);
      setEditName("");
      setEditLocation("");
    }
  };

  const cancelEdit = () => {
    setEditingCamera(null);
    setEditConfig(null);
    setEditName("");
    setEditLocation("");
  };

  const toggleEditFeature = (feature: keyof CameraConfig) => {
    if (editConfig) {
      setEditConfig({
        ...editConfig,
        [feature]: !editConfig[feature],
      });
    }
  };

  const deleteCamera = (cameraId: number) => {
    setShowDeleteModal(cameraId);
  };

  const confirmDelete = (cameraId: number) => {
    setCameras(cameras.filter(cam => cam.id !== cameraId));
    if (expandedCamera === cameraId) {
      setExpandedCamera(null);
    }
    setShowDeleteModal(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(null);
  };

  const toggleStatus = (cameraId: number) => {
    setCameras(cameras.map(cam =>
      cam.id === cameraId
        ? { ...cam, status: cam.status === "active" ? "inactive" : "active" }
        : cam
    ));
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Camera Configuration</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage and configure all deployed cameras</p>
      </div>

      <div className={`rounded-xl shadow-sm border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Cameras</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {cameras.filter(c => c.status === "active").length} active, {cameras.filter(c => c.status === "inactive").length} inactive
              </p>
            </div>
          </div>
        </div>

        <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {cameras.map((camera) => (
            <div key={camera.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <button
                onClick={() => setExpandedCamera(expandedCamera === camera.id ? null : camera.id)}
                className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    camera.status === "active" ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  <div className="text-left">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{camera.name}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{camera.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    camera.status === "active" 
                      ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
                      : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
                  }`}>
                    {camera.status}
                  </span>
                  {expandedCamera === camera.id ? (
                    <ChevronUp size={20} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                  ) : (
                    <ChevronDown size={20} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                  )}
                </div>
              </button>
              
              {expandedCamera === camera.id && (
                <div className={`px-6 py-6 border-t ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  {editingCamera === camera.id ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Camera Name</label>
                          <input 
                            type="text" 
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                            }`}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location</label>
                          <input 
                            type="text" 
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'
                            }`}
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Detection Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ToggleCard
                            label="Object Detection"
                            description="Track objects"
                            enabled={editConfig?.objectDetection || false}
                            onToggle={() => toggleEditFeature('objectDetection')}
                            darkMode={darkMode}
                          />
                          <ToggleCard
                            label="Weapon Detection"
                            description="Detect threats"
                            enabled={editConfig?.weaponDetection || false}
                            onToggle={() => toggleEditFeature('weaponDetection')}
                            darkMode={darkMode}
                          />
                          <ToggleCard
                            label="Face Recognition"
                            description="Identify faces"
                            enabled={editConfig?.faceRecognition || false}
                            onToggle={() => toggleEditFeature('faceRecognition')}
                            darkMode={darkMode}
                          />
                          <ToggleCard
                            label="Running Detection"
                            description="Detect movement"
                            enabled={editConfig?.runningDetection || false}
                            onToggle={() => toggleEditFeature('runningDetection')}
                            darkMode={darkMode}
                          />
                          <ToggleCard
                            label="Loitering Detection"
                            description="Detect loitering"
                            enabled={editConfig?.loiteringDetection || false}
                            onToggle={() => toggleEditFeature('loiteringDetection')}
                            darkMode={darkMode}
                          />
                          <ToggleCard
                            label="Crowd Detection"
                            description="Monitor crowds"
                            enabled={editConfig?.crowdDetection || false}
                            onToggle={() => toggleEditFeature('crowdDetection')}
                            darkMode={darkMode}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => saveEdit(camera.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Save size={16} />
                          Save Changes
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Camera Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Name:</span>
                            <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{camera.name}</span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Location:</span>
                            <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{camera.location}</span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Status:</span>
                            <span className={`ml-2 font-medium ${
                              camera.status === "active" ? (darkMode ? "text-green-400" : "text-green-600") : (darkMode ? "text-gray-400" : "text-gray-600")
                            }`}>
                              {camera.status.charAt(0).toUpperCase() + camera.status.slice(1)}
                            </span>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Added:</span>
                            <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {camera.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <FeatureItem 
                            enabled={camera.config.objectDetection} 
                            label="Object Detection" 
                            darkMode={darkMode}
                          />
                          <FeatureItem 
                            enabled={camera.config.weaponDetection} 
                            label="Weapon Detection" 
                            darkMode={darkMode}
                          />
                          <FeatureItem 
                            enabled={camera.config.faceRecognition} 
                            label="Face Recognition" 
                            darkMode={darkMode}
                          />
                          <FeatureItem 
                            enabled={camera.config.runningDetection} 
                            label="Running Detection" 
                            darkMode={darkMode}
                          />
                          <FeatureItem 
                            enabled={camera.config.loiteringDetection} 
                            label="Loitering Detection" 
                            darkMode={darkMode}
                          />
                          <FeatureItem 
                            enabled={camera.config.crowdDetection} 
                            label="Crowd Detection" 
                            darkMode={darkMode}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditing(camera)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit2 size={16} />
                          Edit Configuration
                        </button>
                        <button 
                          onClick={() => toggleStatus(camera.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            camera.status === "active"
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {camera.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button 
                          onClick={() => deleteCamera(camera.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Camera
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-red-900' : 'bg-red-100'
              }`}>
                <Trash2 size={24} className={darkMode ? 'text-red-400' : 'text-red-600'} />
              </div>
              <div>
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Delete Camera
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <div className={`mb-6 p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to delete this camera? All configuration and historical data will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => confirmDelete(showDeleteModal)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete Camera
              </button>
              <button 
                onClick={cancelDelete}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

function FeatureItem({ enabled, label, darkMode }: { enabled: boolean; label: string; darkMode: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <Check size={16} className={darkMode ? "text-green-400" : "text-green-600"} />
      ) : (
        <div className={`w-4 h-4 rounded-full border-2 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />
      )}
      <span className={enabled ? (darkMode ? "text-white" : "text-gray-900") : (darkMode ? "text-gray-500" : "text-gray-400")}>{label}</span>
    </div>
  );
}

function ToggleCard({ 
  label, 
  description, 
  enabled, 
  onToggle,
  darkMode 
}: { 
  label: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void;
  darkMode: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      enabled 
        ? (darkMode ? 'border-blue-500 bg-blue-950' : 'border-blue-500 bg-blue-50')
        : (darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
            enabled ? "bg-blue-600" : (darkMode ? "bg-gray-600" : "bg-gray-300")
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
            enabled ? "translate-x-6" : "translate-x-0.5"
          }`} />
        </button>
      </div>
    </div>
  );
}
