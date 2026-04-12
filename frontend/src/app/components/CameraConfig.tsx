import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Power, Trash2 } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { useCameras } from "../context/CameraContext";

export function CameraConfig() {
  const { darkMode } = useSharedDarkMode();
  const { cameras, deleteCamera, setCameraStreamState } = useCameras();
  const [expandedCamera, setExpandedCamera] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [pendingStreamCameraId, setPendingStreamCameraId] = useState<string | null>(null);
  const isStreamEnabled = (camera: typeof cameras[number]) =>
    camera.stream_enabled ?? camera.status === "online";

  const activeCount = useMemo(
    () => cameras.filter((camera) => isStreamEnabled(camera)).length,
    [cameras]
  );

  const inactiveCount = cameras.length - activeCount;

  const handleToggleStream = async (cameraId: string, enabled: boolean) => {
    try {
      setPendingStreamCameraId(cameraId);
      await setCameraStreamState(cameraId, enabled);
    } finally {
      setPendingStreamCameraId(null);
    }
  };

  const confirmDelete = async (cameraId: string) => {
    await deleteCamera(cameraId);
    if (expandedCamera === cameraId) {
      setExpandedCamera(null);
    }
    setShowDeleteModal(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Camera Configuration</h1>
        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage registered cameras and control whether each stream is live</p>
      </div>

      <div className={`rounded-xl shadow-sm border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>All Cameras</h2>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeCount} streaming, {inactiveCount} stopped
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
                    isStreamEnabled(camera) ? "bg-green-500" : "bg-gray-400"
                  }`} />
                  <div className="text-left">
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{camera.name}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {camera.location || `Camera #${camera.selected_camera}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isStreamEnabled(camera)
                      ? (darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-800")
                      : (darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800")
                  }`}>
                    {isStreamEnabled(camera) ? "streaming" : "stopped"}
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
                  <div>
                    <div className="mb-6">
                      <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Camera Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Name:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{camera.name}</span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Source:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {camera.type || "webcam"}
                          </span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Camera Index:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {camera.selected_camera}
                          </span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Backend Status:</span>
                          <span className={`ml-2 font-medium ${
                            camera.status === "online"
                              ? (darkMode ? "text-green-400" : "text-green-600")
                              : (darkMode ? "text-gray-400" : "text-gray-600")
                          }`}>
                            {camera.status}
                          </span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Location:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {camera.location || "Not set"}
                          </span>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Added:</span>
                          <span className={`ml-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {new Date(camera.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`mb-6 rounded-lg p-4 border ${
                      darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Stream Control</h4>
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Start or stop this camera stream for monitor clients on the same account.
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleStream(camera.id, !isStreamEnabled(camera))}
                          disabled={pendingStreamCameraId === camera.id}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-60 ${
                            isStreamEnabled(camera)
                              ? "bg-yellow-600 text-white hover:bg-yellow-700"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          <Power size={16} />
                          {pendingStreamCameraId === camera.id
                            ? "Updating..."
                            : isStreamEnabled(camera)
                              ? "Stop Stream"
                              : "Start Stream"}
                        </button>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowDeleteModal(camera.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Camera
                    </button>
                  </div>
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
                onClick={() => setShowDeleteModal(null)}
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
