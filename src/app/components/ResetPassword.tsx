import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Check, X, Eye, EyeOff, Key, Mail } from "lucide-react";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Password validation criteria
  const passwordCriteria = {
    length: formData.new_password.length >= 8,
    uppercase: /[A-Z]/.test(formData.new_password),
    lowercase: /[a-z]/.test(formData.new_password),
    numbers: /[0-9]/.test(formData.new_password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.new_password)
  };

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else {
      if (formData.new_password.length < 8) {
        newErrors.new_password = "Password must be at least 8 characters";
      }
      if (!passwordCriteria.uppercase) {
        newErrors.new_password = "Password must contain uppercase letter";
      }
      if (!passwordCriteria.lowercase) {
        newErrors.new_password = "Password must contain lowercase letter";
      }
      if (!passwordCriteria.numbers) {
        newErrors.new_password = "Password must contain number";
      }
      if (!passwordCriteria.special) {
        newErrors.new_password = "Password must contain special character";
      }
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch('http://localhost:8000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: formData.new_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccessMessage("Password reset successfully! Redirecting to login...");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                <Key size={40} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-300">
              Enter your new password below
            </p>
          </div>

          {/* Error Messages */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <X className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-300 text-sm">{successMessage}</p>
            </div>
          )}

          {!token ? (
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-4">
                This reset link is invalid or has expired.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.new_password}
                    onChange={(e) => handleInputChange('new_password', e.target.value)}
                    className={`w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.new_password ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && <p className="text-red-400 text-sm mt-1">{errors.new_password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    className={`w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.confirm_password ? 'border-red-500' : ''
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-400 text-sm mt-1">{errors.confirm_password}</p>}
              </div>

              {/* Password Strength Indicators */}
              {formData.new_password && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm font-medium text-gray-300 mb-3">Password Requirements:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {passwordCriteria.length ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-300">At least 8 characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.uppercase ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-300">Contains uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.lowercase ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-300">Contains lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.numbers ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-300">Contains number</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordCriteria.special ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-sm text-gray-300">Contains special character</span>
                    </div>
                  </div>
                </div>
              )}

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
                    Resetting Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
