import { useState } from "react";
import { Check, ShoppingBag, Building, GraduationCap, Star } from "lucide-react";

const predefinedTemplates = [
  {
    id: 1,
    name: "Shop Mode",
    icon: ShoppingBag,
    color: "bg-blue-500",
    description: "Optimized for retail environments",
    features: {
      objectDetection: true,
      weaponDetection: true,
      faceRecognition: false,
      runningDetection: true,
      loiteringDetection: true,
      crowdDetection: true,
    }
  },
  {
    id: 2,
    name: "Office Mode",
    icon: Building,
    color: "bg-green-500",
    description: "Optimized for corporate offices",
    features: {
      objectDetection: true,
      weaponDetection: true,
      faceRecognition: true,
      runningDetection: false,
      loiteringDetection: false,
      crowdDetection: false,
    }
  },
  {
    id: 3,
    name: "School Mode",
    icon: GraduationCap,
    color: "bg-purple-500",
    description: "Optimized for educational institutions",
    features: {
      objectDetection: true,
      weaponDetection: true,
      faceRecognition: true,
      runningDetection: true,
      loiteringDetection: true,
      crowdDetection: true,
    }
  },
];

type CameraConfig = {
  objectDetection: boolean;
  weaponDetection: boolean;
  faceRecognition: boolean;
  runningDetection: boolean;
  loiteringDetection: boolean;
  crowdDetection: boolean;
};

type SavedConfig = {
  id: number;
  name: string;
  description: string;
  config: CameraConfig;
  isFavorite: boolean;
  createdAt: Date;
  usedCount: number;
};

export function AddCamera() {
  const [showNameModal, setShowNameModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CameraConfig | null>(null);
  const [cameraName, setCameraName] = useState("");
  
  const [customConfig, setCustomConfig] = useState<CameraConfig>({
    objectDetection: true,
    weaponDetection: true,
    faceRecognition: false,
    runningDetection: false,
    loiteringDetection: false,
    crowdDetection: false,
  });
  
  // Mock saved configurations
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([
    {
      id: 1,
      name: "High Security Setup",
      description: "All features enabled for maximum monitoring",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: true,
        runningDetection: true,
        loiteringDetection: true,
        crowdDetection: true,
      },
      isFavorite: true,
      createdAt: new Date('2026-03-01'),
      usedCount: 5
    },
    {
      id: 2,
      name: "Basic Monitoring",
      description: "Essential detection features only",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: false,
        runningDetection: false,
        loiteringDetection: false,
        crowdDetection: false,
      },
      isFavorite: false,
      createdAt: new Date('2026-03-02'),
      usedCount: 3
    },
    {
      id: 3,
      name: "Entrance Monitor",
      description: "Focused on face recognition and weapons",
      config: {
        objectDetection: true,
        weaponDetection: true,
        faceRecognition: true,
        runningDetection: false,
        loiteringDetection: true,
        crowdDetection: false,
      },
      isFavorite: true,
      createdAt: new Date('2026-03-03'),
      usedCount: 8
    },
    {
      id: 4,
      name: "Parking Lot Setup",
      description: "Loitering and crowd detection for outdoor areas",
      config: {
        objectDetection: true,
        weaponDetection: false,
        faceRecognition: false,
        runningDetection: false,
        loiteringDetection: true,
        crowdDetection: true,
      },
      isFavorite: false,
      createdAt: new Date('2026-03-04'),
      usedCount: 2
    },
  ]);

  const applyPreset = (features: CameraConfig) => {
    setSelectedConfig(features);
    setShowNameModal(true);
    setCameraName("");
  };

  const saveCamera = () => {
    if (cameraName.trim() && selectedConfig) {
      // Here you would save the camera with the selected configuration
      console.log("Saving camera:", cameraName, selectedConfig);
      setShowNameModal(false);
      setSelectedConfig(null);
      setCameraName("");
    }
  };

  const addCustomCamera = () => {
    if (cameraName.trim()) {
      console.log("Adding custom camera:", cameraName, customConfig);
      setCameraName("");
    }
  };

  const toggleCustomFeature = (feature: keyof CameraConfig) => {
    setCustomConfig({
      ...customConfig,
      [feature]: !customConfig[feature],
    });
  };

  const toggleFavorite = (configId: number) => {
    setSavedConfigs(savedConfigs.map(config => 
      config.id === configId 
        ? { ...config, isFavorite: !config.isFavorite }
        : config
    ));
  };

  // Sort configs: favorites first, then by creation date (newest first)
  const sortedConfigs = [...savedConfigs].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const getConfigColor = (config: CameraConfig) => {
    const enabledCount = Object.values(config).filter(v => v).length;
    if (enabledCount === 6) return "bg-purple-500";
    if (enabledCount >= 4) return "bg-blue-500";
    if (enabledCount >= 2) return "bg-green-500";
    return "bg-gray-500";
  };

  return (
    <div className="p-8">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Camera</h1>
        <p className="text-gray-600 mt-1">Configure and deploy new camera with detection presets</p>
      </div>

      {/* Predefined Templates */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Predefined Presets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {predefinedTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div 
                key={template.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className={`${template.color} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{template.name}</h3>
                  <p className="text-sm opacity-90">{template.description}</p>
                </div>
                
                <div className="p-6">
                  <div className="space-y-2 mb-6">
                    <FeatureItem 
                      enabled={template.features.objectDetection} 
                      label="Object Detection" 
                    />
                    <FeatureItem 
                      enabled={template.features.weaponDetection} 
                      label="Weapon Detection" 
                    />
                    <FeatureItem 
                      enabled={template.features.faceRecognition} 
                      label="Face Recognition" 
                    />
                    <FeatureItem 
                      enabled={template.features.runningDetection} 
                      label="Running Detection" 
                    />
                    <FeatureItem 
                      enabled={template.features.loiteringDetection} 
                      label="Loitering Detection" 
                    />
                    <FeatureItem 
                      enabled={template.features.crowdDetection} 
                      label="Crowd Detection" 
                    />
                  </div>
                  
                  <button 
                    onClick={() => applyPreset(template.features)}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Apply Preset
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Configurations */}
      {savedConfigs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Previously Used Configurations
          </h2>
          <div className="overflow-x-auto pb-4 -mx-8 px-8 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex gap-6" style={{ width: 'max-content' }}>
              {sortedConfigs.map((savedConfig) => {
                const colorClass = getConfigColor(savedConfig.config);
                return (
                  <div 
                    key={savedConfig.id}
                    className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative flex-shrink-0"
                    style={{ width: 'calc((100vw - 16rem - 8rem) / 3 - 1rem)' }}
                  >
                    <div className={`${colorClass} p-6 text-white relative`}>
                      <button
                        onClick={() => toggleFavorite(savedConfig.id)}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        title={savedConfig.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star 
                          size={24} 
                          className={savedConfig.isFavorite ? "fill-yellow-300 text-yellow-300" : "text-white/60"}
                        />
                      </button>
                      
                      <h3 className="text-2xl font-bold mb-2 pr-10">{savedConfig.name}</h3>
                      <p className="text-sm opacity-90">{savedConfig.description}</p>
                      <p className="text-xs opacity-75 mt-2">
                        Used {savedConfig.usedCount} time{savedConfig.usedCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="p-6">
                      <div className="space-y-2 mb-6">
                        <FeatureItem 
                          enabled={savedConfig.config.objectDetection} 
                          label="Object Detection" 
                        />
                        <FeatureItem 
                          enabled={savedConfig.config.weaponDetection} 
                          label="Weapon Detection" 
                        />
                        <FeatureItem 
                          enabled={savedConfig.config.faceRecognition} 
                          label="Face Recognition" 
                        />
                        <FeatureItem 
                          enabled={savedConfig.config.runningDetection} 
                          label="Running Detection" 
                        />
                        <FeatureItem 
                          enabled={savedConfig.config.loiteringDetection} 
                          label="Loitering Detection" 
                        />
                        <FeatureItem 
                          enabled={savedConfig.config.crowdDetection} 
                          label="Crowd Detection" 
                        />
                      </div>
                      
                      <button 
                        onClick={() => applyPreset(savedConfig.config)}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        Apply Configuration
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Custom Configuration Builder */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Custom Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Build your own detection setup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <ToggleCard
            label="Object Detection"
            description="Track and identify objects in real-time"
            enabled={customConfig.objectDetection}
            onToggle={() => toggleCustomFeature('objectDetection')}
          />
          <ToggleCard
            label="Weapon Detection"
            description="Detect weapons and dangerous objects"
            enabled={customConfig.weaponDetection}
            onToggle={() => toggleCustomFeature('weaponDetection')}
          />
          <ToggleCard
            label="Face Recognition"
            description="Identify individuals using facial analysis"
            enabled={customConfig.faceRecognition}
            onToggle={() => toggleCustomFeature('faceRecognition')}
          />
          <ToggleCard
            label="Running Detection"
            description="Detect rapid movement patterns"
            enabled={customConfig.runningDetection}
            onToggle={() => toggleCustomFeature('runningDetection')}
          />
          <ToggleCard
            label="Loitering Detection"
            description="Identify prolonged stationary presence"
            enabled={customConfig.loiteringDetection}
            onToggle={() => toggleCustomFeature('loiteringDetection')}
          />
          <ToggleCard
            label="Crowd Detection"
            description="Monitor group formations and density"
            enabled={customConfig.crowdDetection}
            onToggle={() => toggleCustomFeature('crowdDetection')}
          />
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Camera name (e.g., Lobby Camera 1)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={cameraName}
            onChange={(e) => setCameraName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomCamera()}
          />
          <button 
            onClick={addCustomCamera}
            disabled={!cameraName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Camera
          </button>
        </div>
      </div>

      {/* Name Input Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Name Your Camera</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter a name for this camera configuration
            </p>
            <input 
              type="text" 
              placeholder="Enter camera name (e.g., Main Entrance)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveCamera()}
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={saveCamera}
                disabled={!cameraName.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Camera
              </button>
              <button 
                onClick={() => {
                  setShowNameModal(false);
                  setSelectedConfig(null);
                  setCameraName("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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

function FeatureItem({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <Check size={16} className="text-green-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
      )}
      <span className={enabled ? "text-gray-900" : "text-gray-400"}>{label}</span>
    </div>
  );
}

function ToggleCard({ 
  label, 
  description, 
  enabled, 
  onToggle 
}: { 
  label: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void;
}) {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      enabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{label}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <button
          onClick={onToggle}
          className={`ml-4 w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
            enabled ? "bg-blue-600" : "bg-gray-300"
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
