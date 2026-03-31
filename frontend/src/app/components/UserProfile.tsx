import { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { ProfilePicture } from "./ProfilePicture";
import { authAPI } from "../services/api";
import {
  Camera,
  Check,
  X,
  User,
  Mail,
  Edit2,
  Save
} from "lucide-react";

interface UserProfileProps {
  show: boolean;
  onClose: () => void;
}

export function UserProfile({ show, onClose }: UserProfileProps) {
  const { user, setUser } = useUser();
  const { darkMode } = useSharedDarkMode();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for validation
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState(user?.recovery_email || "");
  const [alternateContact, setAlternateContact] = useState(user?.alternate_contact || "");
  const [recoveryEmailError, setRecoveryEmailError] = useState("");
  const [alternateContactError, setAlternateContactError] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [alternateCountryCode, setAlternateCountryCode] = useState("+91");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  // Recovery email editing states
  const [isEditingRecoveryEmail, setIsEditingRecoveryEmail] = useState(false);
  const [tempRecoveryEmail, setTempRecoveryEmail] = useState("");
  const [isAddingRecoveryEmail, setIsAddingRecoveryEmail] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  // Phone number validation - allow + symbol and numbers only
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9+\s\-\(\)]/g, '');
    
    setPhone(sanitizedValue);
    if (value !== sanitizedValue) {
      setPhoneError("Phone number can only contain digits, +, spaces, dashes, and parentheses");
    } else {
      setPhoneError("");
    }
  };

  // Password validation criteria
  const passwordCriteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    numbers: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
  };

  // Recovery email validation
  const handleRecoveryEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecoveryEmail(value);
    
    if (value && !validateEmail(value)) {
      setRecoveryEmailError("Please enter a valid email address");
    } else {
      setRecoveryEmailError("");
    }
  };

  // Alternate contact validation
  const handleAlternateContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const sanitizedValue = value.replace(/[^0-9+\s\-\(\)]/g, '');
    
    setAlternateContact(sanitizedValue);
    if (value !== sanitizedValue) {
      setAlternateContactError("Phone number can only contain digits, +, spaces, dashes, and parentheses");
    } else {
      setAlternateContactError("");
    }
  };

  const handleAddRecoveryEmail = async () => {
    // Check authentication first
    const token = localStorage.getItem('aegis_token');
    console.log('Token check:', token ? 'Token exists' : 'No token found');
    console.log('User email:', user?.email);
    
    if (!token) {
      setSaveMessage("Authentication error. Please log in again.");
      return;
    }

    if (!validateEmail(tempRecoveryEmail)) {
      setRecoveryEmailError("Please enter a valid email address");
      return;
    }

    // Check if recovery email is the same as primary email
    if (tempRecoveryEmail === user?.email) {
      setRecoveryEmailError("Recovery email cannot be the same as your primary email");
      return;
    }

    console.log('Attempting to add recovery email:', tempRecoveryEmail);
    console.log('Using token:', token.substring(0, 20) + '...');

    setIsAddingRecoveryEmail(true);
    setSaveMessage("");

    try {
      const response = await authAPI.addRecoveryEmail(token, tempRecoveryEmail);
      
      setRecoveryEmail(tempRecoveryEmail);
      setTempRecoveryEmail("");
      setIsEditingRecoveryEmail(false);
      setSaveMessage("Recovery email added successfully! Verification email sent.");
      
      // Update user context with new recovery email
      // Fetch updated user data to sync context
      try {
        const userResponse = await authAPI.getCurrentUser(token);
        if (userResponse && userResponse.email) {
          const updatedUser = {
            id: userResponse.id,
            email: userResponse.email,
            name: userResponse.name,
            cameraId: userResponse.camera_id,
            phone: userResponse.phone,
            recovery_email: userResponse.recovery_email,
            alternate_contact: userResponse.alternate_contact,
          };
          
          // Update both localStorage and user context
          localStorage.setItem('aegis_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          console.log('User context updated with fresh data:', updatedUser);
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
      
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add recovery email";
      
      console.error('Recovery email error:', errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes('No authentication token') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setSaveMessage("Authentication error. Please log in again.");
        // Clear invalid token
        localStorage.removeItem('aegis_token');
        localStorage.removeItem('aegis_user');
      } else if (errorMessage.includes('Invalid email format')) {
        setRecoveryEmailError("Invalid email format");
      } else if (errorMessage.includes('Failed to send verification email')) {
        setSaveMessage("Failed to send verification email. Please check your SMTP configuration.");
      } else if (errorMessage.includes('already registered as a primary account')) {
        setRecoveryEmailError("This email is already registered as a primary account");
      } else if (errorMessage.includes('same as your primary email')) {
        setRecoveryEmailError("Recovery email cannot be the same as your primary email");
      } else {
        setSaveMessage(errorMessage);
      }
    } finally {
      setIsAddingRecoveryEmail(false);
    }
  };

  const handleChangeRecoveryEmail = () => {
    setTempRecoveryEmail(recoveryEmail);
    setIsEditingRecoveryEmail(true);
  };

  const handleCancelRecoveryEmailEdit = () => {
    setIsEditingRecoveryEmail(false);
    setTempRecoveryEmail("");
    setRecoveryEmailError("");
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicture(null);
    setShowPhotoOptions(false);
  };

  // Close dropdowns when clicking outside
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPhotoOptions(false);
  };

  const handleModalBackdropClick = () => {
    onClose();
    setShowPhotoOptions(false);
  };

  const closeDropdowns = () => {
    // This will be called when country code dropdowns are closed
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage("");
    
    try {
      const token = localStorage.getItem('aegis_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: user?.name,
          phone: phone,
          recovery_email: recoveryEmail,
          alternate_contact: alternateContact,
          current_password: newPassword ? "current" : undefined, // TODO: Get actual current password
          new_password: newPassword || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage("Profile updated successfully!");
        // Update user context with new data
        // TODO: Update user context with new profile data
        
        // Clear password fields after successful update
        setNewPassword("");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage(data.detail || "Failed to update profile");
      }
    } catch (error) {
      setSaveMessage("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-hidden" onClick={handleModalBackdropClick}>
      <div className={`${darkMode ? 'dark bg-gray-800 text-white' : 'bg-white'} rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} onClick={handleModalClick}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            User Profile
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:${darkMode ? 'text-gray-200' : 'text-gray-600'} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Picture Section */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <button 
              onClick={() => setShowPhotoOptions(!showPhotoOptions)}
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-4xl overflow-hidden hover:opacity-90 transition-opacity"
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
              {/* Hover overlay with camera icon */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera size={24} className="text-white" />
              </div>
            </button>
            
            {/* Photo options dropdown */}
            {showPhotoOptions && (
              <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-lg p-2 min-w-[150px] z-10`}>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowPhotoOptions(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} transition-colors flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}
                >
                  <Camera size={16} />
                  Add Photo
                </button>
                <button
                  onClick={handleRemovePhoto}
                  disabled={!profilePicture}
                  className={`w-full text-left px-3 py-2 rounded hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} transition-colors flex items-center gap-2 ${
                    profilePicture 
                      ? darkMode ? 'text-white' : 'text-gray-700'
                      : darkMode ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Camera size={16} />
                  Remove Photo
                </button>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureUpload}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.name || "User"}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email || "user@aegis.com"}
                    disabled
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white opacity-60 cursor-not-allowed' : 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelector 
                      value={countryCode}
                      onChange={setCountryCode}
                      darkMode={darkMode}
                      onClose={closeDropdowns}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                      } ${phoneError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Recovery Email
                  </label>
                  
                  {!recoveryEmail && !isEditingRecoveryEmail ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => setIsEditingRecoveryEmail(true)}
                        className={`w-full px-4 py-2 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          darkMode 
                            ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                            : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Mail size={16} />
                        Add Recovery Email
                      </button>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Used for account recovery and notifications
                      </p>
                    </div>
                  ) : isEditingRecoveryEmail ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={tempRecoveryEmail}
                        onChange={(e) => {
                          setTempRecoveryEmail(e.target.value);
                          if (recoveryEmailError) setRecoveryEmailError("");
                        }}
                        placeholder="recovery@example.com"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                        } ${recoveryEmailError ? 'border-red-500' : ''}`}
                      />
                      {recoveryEmailError && (
                        <p className="text-red-500 text-sm">{recoveryEmailError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddRecoveryEmail}
                          disabled={isAddingRecoveryEmail || !tempRecoveryEmail}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                            isAddingRecoveryEmail || !tempRecoveryEmail
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isAddingRecoveryEmail ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Adding...
                            </>
                          ) : (
                            <>
                              <Save size={14} />
                              Add Email
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelRecoveryEmailEdit}
                          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        A verification email will be sent to this address
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={recoveryEmail}
                          disabled
                          className={`flex-1 px-4 py-2 border rounded-lg ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white opacity-60 cursor-not-allowed' 
                              : 'bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        />
                        <button
                          onClick={handleChangeRecoveryEmail}
                          className={`p-2 rounded-lg transition-colors ${
                            darkMode 
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Change recovery email"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                        <Check size={12} />
                        Verification email sent to this address
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Alternate Contact
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelector 
                      value={alternateCountryCode}
                      onChange={setAlternateCountryCode}
                      darkMode={darkMode}
                      onClose={closeDropdowns}
                    />
                    <input
                      type="tel"
                      value={alternateContact}
                      onChange={handleAlternateContactChange}
                      placeholder="99887 76655"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                      } ${alternateContactError ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {alternateContactError && (
                    <p className="text-red-500 text-sm mt-1">{alternateContactError}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Security */}
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  />
                  {!showForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className={`text-sm text-blue-600 hover:text-blue-700 mt-2 transition-colors ${
                        darkMode ? 'text-blue-400 hover:text-blue-300' : ''
                      }`}
                    >
                      Forgot Password?
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-1`}>
                        Recovery Email Address
                      </label>
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email or recovery email"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                          darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (forgotPasswordEmail && validateEmail(forgotPasswordEmail)) {
                              alert(`Password recovery link sent to: ${forgotPasswordEmail}`);
                              setShowForgotPassword(false);
                              setForgotPasswordEmail("");
                            } else {
                              alert("Please enter a valid email address");
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Send Recovery
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordEmail("");
                          }}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  />
                  
                  {/* Password Strength Indicators */}
                  {newPassword && (
                    <div className="mt-3 space-y-2">
                      <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Password Requirements:
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordCriteria.length ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-red-500" />
                          )}
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.uppercase ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-red-500" />
                          )}
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Contains uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.lowercase ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-red-500" />
                          )}
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Contains lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.numbers ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-red-500" />
                          )}
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Contains number
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordCriteria.special ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <X size={16} className="text-red-500" />
                          )}
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Contains special character
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
                    }`}
                  />
                </div>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    Password must be at least 8 characters with uppercase, lowercase, numbers and special characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isSaving 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            saveMessage.includes('successfully') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
