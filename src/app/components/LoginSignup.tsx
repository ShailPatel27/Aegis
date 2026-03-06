import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useUser } from "../context/UserContext";
import { Camera, Monitor, ArrowLeft } from "lucide-react";

export function LoginSignup() {
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get("type") as "camera" | "monitor") || "monitor";
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const generateCameraId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `CAM-${timestamp}-${random}`.toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignup && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const user = {
      type: userType,
      name: formData.name || "User",
      email: formData.email,
      ...(userType === "camera" ? { cameraId: generateCameraId() } : {}),
    };

    setUser(user);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/select-type")}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to selection</span>
        </button>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                userType === "camera" ? "bg-blue-600" : "bg-green-600"
              }`}>
                {userType === "camera" ? (
                  <Camera size={40} className="text-white" />
                ) : (
                  <Monitor size={40} className="text-white" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AEGIS</h1>
            <p className="text-gray-300">
              {isSignup ? "Create" : "Sign in to"} your {userType} account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                userType === "camera"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isSignup ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
