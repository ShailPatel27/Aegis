import React, { useState } from "react";
import { Camera, Circle, Grid3x3, Monitor, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";

const cameras = [
  { id: 1, name: "Main Entrance", location: "Front Door", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" },
  { id: 2, name: "Parking Lot", location: "Exterior", img: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&q=80" },
  { id: 3, name: "Reception Area", location: "Lobby", img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80" },
  { id: 4, name: "Hallway A", location: "Floor 1", img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80" },
  { id: 5, name: "Server Room", location: "Floor 2", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80" },
];

const mockEvents = [
  { id: 1, type: "Person", confidence: "98%", time: "14:32:45", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
  { id: 2, type: "Person", confidence: "95%", time: "14:32:43", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { id: 3, type: "Vehicle", confidence: "92%", time: "14:31:22", img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=100&q=80" },
  { id: 4, type: "Person", confidence: "89%", time: "14:30:15", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80" },
];

type LayoutType = "single" | "main-with-grid" | "grid";

export function LiveMonitoring() {
  const { darkMode } = useSharedDarkMode();
  const [selectedCamera, setSelectedCamera] = useState(cameras[0]);
  const [objectDetection, setObjectDetection] = useState(true);
  const [faceRecognition, setFaceRecognition] = useState(true);
  const [weaponDetection, setWeaponDetection] = useState(true);
  const [screenshot, setScreenshot] = useState(false);
  const [layout, setLayout] = useState<LayoutType>("main-with-grid");
  const [mainCameraIndex, setMainCameraIndex] = useState(0);

  const goToPrevCamera = () => {
    setMainCameraIndex((prev) => (prev === 0 ? cameras.length - 1 : prev - 1));
    setSelectedCamera(cameras[mainCameraIndex === 0 ? cameras.length - 1 : mainCameraIndex - 1]);
  };

  const goToNextCamera = () => {
    setMainCameraIndex((prev) => (prev === cameras.length - 1 ? 0 : prev + 1));
    setSelectedCamera(cameras[mainCameraIndex === cameras.length - 1 ? 0 : mainCameraIndex + 1]);
  };

  const renderVideoFeed = (camera: typeof cameras[0], isMain: boolean = false) => (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      <img
        src={camera.img}
        alt={camera.name}
        className="w-full h-full object-cover opacity-70"
      />

      {/* Live Indicator */}
      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
        <Circle className="w-1.5 h-1.5 fill-white animate-pulse" />
        LIVE
      </div>

      {/* Camera Info */}
      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        {camera.name}
      </div>

      {/* Timestamp */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
        {new Date().toLocaleTimeString()}
      </div>

      {/* Detection Boxes (only on main view) */}
      {isMain && objectDetection && (
        <>
          <div className="absolute top-1/3 left-1/4 w-32 h-40 border-2 border-green-400 rounded">
            <div className="absolute -top-7 left-0 bg-green-400 text-white text-xs px-2 py-1 rounded">
              Person #001 • 98%
            </div>
          </div>
          <div className="absolute bottom-1/4 right-1/3 w-28 h-36 border-2 border-blue-400 rounded">
            <div className="absolute -top-7 left-0 bg-blue-400 text-white text-xs px-2 py-1 rounded">
              Person #002 • 95%
            </div>
          </div>
          {faceRecognition && (
            <div className="absolute top-1/2 left-1/2 w-20 h-24 border-2 border-yellow-400 rounded">
              <div className="absolute -top-7 left-0 bg-yellow-400 text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap">
                John Doe • Whitelist
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Monitoring</h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Real-time video feed with detection overlays</p>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Layout:</span>
            <button
              onClick={() => setLayout("single")}
              className={`p-2 rounded-lg transition-colors ${layout === "single" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Single Camera"
            >
              <Monitor size={20} />
            </button>
            <button
              onClick={() => setLayout("main-with-grid")}
              className={`p-2 rounded-lg transition-colors ${layout === "main-with-grid" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Main + Grid"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={() => setLayout("grid")}
              className={`p-2 rounded-lg transition-colors ${layout === "grid" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Grid View"
            >
              <Grid3x3 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-sm p-6 border`}>
            {/* Single Camera Layout with Navigation */}
            {layout === "single" && (
              <div className="relative">
                <div className="relative">
                  {renderVideoFeed(cameras[mainCameraIndex], true)}

                  {/* Navigation Buttons */}
                  <button
                    onClick={goToPrevCamera}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goToNextCamera}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Camera Counter */}
                <div className="mt-4 text-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Camera {mainCameraIndex + 1} of {cameras.length}
                  </span>
                </div>
              </div>
            )}

            {/* Main with Grid Layout */}
            {layout === "main-with-grid" && (
              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Main Camera</label>
                  <select
                    className={`w-full md:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    value={selectedCamera.id}
                    onChange={(e) => {
                      const camera = cameras.find(c => c.id === parseInt(e.target.value));
                      if (camera) {
                        setSelectedCamera(camera);
                        setMainCameraIndex(cameras.indexOf(camera));
                      }
                    }}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.name} - {camera.location}
                      </option>
                    ))}
                  </select>
                </div>

                {renderVideoFeed(selectedCamera, true)}

                {/* Thumbnail Grid */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {cameras.filter(c => c.id !== selectedCamera.id).map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => {
                        setSelectedCamera(camera);
                        setMainCameraIndex(cameras.indexOf(camera));
                      }}
                      className={`relative rounded-lg overflow-hidden border-2 transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-200 hover:border-blue-500'
                        }`}
                    >
                      <img
                        src={camera.img}
                        alt={camera.name}
                        className="w-full aspect-video object-cover opacity-80 hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-white text-xs font-medium truncate">{camera.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Layout */}
            {layout === "grid" && (
              <div className="grid grid-cols-2 gap-4">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => {
                      setSelectedCamera(camera);
                      setMainCameraIndex(cameras.indexOf(camera));
                      setLayout("main-with-grid");
                    }}
                    className={`rounded-lg overflow-hidden border-2 transition-colors ${selectedCamera.id === camera.id
                      ? "border-blue-500"
                      : darkMode ? "border-gray-600 hover:border-blue-400" : "border-gray-200 hover:border-blue-300"
                      }`}
                  >
                    {renderVideoFeed(camera, false)}
                  </button>
                ))}
              </div>
            )}

            {/* Control Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Object Detection</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track objects</p>
                </div>
                <button
                  onClick={() => setObjectDetection(!objectDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${objectDetection ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${objectDetection ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face Recognition</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Identify faces</p>
                </div>
                <button
                  onClick={() => setFaceRecognition(!faceRecognition)}
                  className={`w-12 h-6 rounded-full transition-colors ${faceRecognition ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${faceRecognition ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weapon Detection</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detect threats</p>
                </div>
                <button
                  onClick={() => setWeaponDetection(!weaponDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${weaponDetection ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${weaponDetection ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Screenshots</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto capture</p>
                </div>
                <button
                  onClick={() => setScreenshot(!screenshot)}
                  className={`w-12 h-6 rounded-full transition-colors ${screenshot ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${screenshot ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Feed */}
      <div className="lg:col-span-1">
        <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
          <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Camera size={20} />
            Real-Time Events
          </h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {mockEvents.map((event) => (
              <div key={event.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex gap-3">
                  <img
                    src={event.img}
                    alt={event.type}
                    className="w-16 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.type}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Confidence: {event.confidence}</p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{event.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
