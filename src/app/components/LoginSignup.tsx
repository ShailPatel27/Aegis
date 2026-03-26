import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { Camera, Monitor, AlertCircle } from "lucide-react";

export function LoginSignup() {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useUser();
  const [isSignup, setIsSignup] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [useAlternateEmail, setUseAlternateEmail] = useState(false);
  const [showForgotPasswordUI, setShowForgotPasswordUI] = useState(false);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState("");
  const [usePhoneForReset, setUsePhoneForReset] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (isSignup && formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match!");
      return;
    }

    if (isSignup && formData.password.length > 72) {
      setFormError("Password must be 72 characters or less for security.");
      return;
    }

    try {
      if (isSignup) {
        await register({
          name: formData.name || "User",
          email: formData.email,
          password: formData.password,
          user_type: "camera" // All users are just users, no type distinction
        });
        navigate("/select-type");
      } else {
        await login(formData.email, formData.password);
        navigate("/select-type");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Authentication failed");
    }
  };

  const handleForgotPassword = async () => {
    const resetEmail = usePhoneForReset ? forgotPasswordPhone : forgotPasswordEmail;
    const useAltEmail = alternateEmail && !usePhoneForReset;
    
    if (!resetEmail) {
      setFormError("Please enter your email address or phone number");
      return;
    }

    try {
      const endpoint = usePhoneForReset ? "/auth/forgot-password-alternate" : "/auth/forgot-password";
      const response = await fetch(`http://localhost:8000/api/v1${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail,
          use_alternate: useAltEmail
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowForgotPasswordUI(false);
        setForgotPasswordEmail("");
        setForgotPasswordPhone("");
        setAlternateEmail("");
        setUsePhoneForReset(false);
      } else {
        setFormError(data.detail || "Failed to send reset link");
      }
    } catch (error) {
      setFormError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                <Camera size={40} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">AEGIS</h1>
            <p className="text-gray-300">
              {showForgotPasswordUI ? "Reset Your Password" : (isSignup ? "Create" : "Sign in to") + " your account"}
            </p>
          </div>

          {/* Error Display */}
          {(error || formError) && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <div className="text-red-300 text-sm">
                <p className="font-medium">Error</p>
                <p>{typeof error === 'object' ? JSON.stringify(error) : error || formError}</p>
              </div>
            </div>
          )}

          {/* Forgot Password UI */}
          {showForgotPasswordUI && (
            <div className="space-y-4">
              <p className="text-lg font-semibold text-white mb-4">Reset Your Password</p>
              
              {/* Email/Phone Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUsePhoneForReset(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !usePhoneForReset 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/10 border border-white/20 text-gray-300'
                  }`}
                >
                  <Mail size={16} className="mr-2" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setUsePhoneForReset(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    usePhoneForReset 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/10 border border-white/20 text-gray-300'
                  }`}
                >
                  <Phone size={16} className="mr-2" />
                  Phone Number
                </button>
              </div>
              
              {/* Phone Input Field */}
              {usePhoneForReset && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={forgotPasswordPhone}
                    onChange={(e) => setForgotPasswordPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              )}
              
              {/* Email Fields */}
              {!usePhoneForReset && (
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setUseAlternateEmail(!useAlternateEmail)}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
                    >
                      {useAlternateEmail ? "Use Primary Email" : "Use Alternate Email"}
                    </button>
                  </div>
                  
                  {/* Alternate Email Field */}
                  {useAlternateEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Alternate Email Address
                      </label>
                      <input
                        type="email"
                        value={alternateEmail}
                        onChange={(e) => setAlternateEmail(e.target.value)}
                        placeholder="Enter alternate email address"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Send Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordUI(false)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-gray-300 hover:bg-white/20 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
          
          {/* Regular Login/Signup Form - Only show when NOT in forgot password mode */}
          {!showForgotPasswordUI && (
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
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  maxLength={72}
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
                    maxLength={72}
                  />
                </div>
              )}

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/reset-password-code")}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  isSignup ? "Sign Up" : "Sign In"
                )}
              </button>
            </form>
          )}

          {/* Toggle Sign In/Sign Up */}
          {!showForgotPasswordUI && (
            <div className="mt-6 text-center">
              <p className="text-gray-300 mb-3">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setShowForgotPasswordUI(false);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                  disabled={isLoading}
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
