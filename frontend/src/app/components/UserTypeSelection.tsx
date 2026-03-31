import { useNavigate } from "react-router";
import { Camera, Monitor } from "lucide-react";

export function UserTypeSelection() {
  const navigate = useNavigate();

  const handleSelection = (type: "camera" | "monitor") => {
    // Navigate to specific add-camera routes
    if (type === 'camera') {
      navigate("/camera/dashboard");
    } else {
      navigate("/monitor/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">AEGIS</h1>
          <p className="text-xl text-gray-300">Vision System</p>
          <p className="text-gray-400 mt-4">Select your account type to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Option */}
          <button
            onClick={() => handleSelection("camera")}
            className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
                <Camera size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Camera</h2>
              <p className="text-gray-300 mb-6">
                Register as a camera device to stream video feeds and send detection data to the monitoring system.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ Stream live video feed</p>
                <p>✓ Perform local detection</p>
                <p>✓ Send alerts to monitors</p>
              </div>
            </div>
          </button>

          {/* Monitor Option */}
          <button
            onClick={() => handleSelection("monitor")}
            className="group bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-500 transition-colors">
                <Monitor size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Monitor</h2>
              <p className="text-gray-300 mb-6">
                Register as a monitor to view multiple camera feeds, manage alerts, and analyze detection data.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>✓ View multiple cameras</p>
                <p>✓ Manage face recognition</p>
                <p>✓ Configure alerts & analytics</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
