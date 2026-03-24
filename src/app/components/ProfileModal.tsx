// import { useState } from "react";
// import { useUser } from "../context/UserContext";
// import { UserProfileDisplay } from "./UserProfileDisplay";
// import { ProfilePicture } from "./ProfilePicture"
// import { Check, X } from "lucide-react";

// interface ProfileModalProps {
//   show: boolean;
//   onClose: () => void;
//   darkMode: boolean;
// } 

// export function ProfileModal({ show, onClose, darkMode }: ProfileModalProps) {
//   const { user } = useUser();
//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");
//   const [phoneError, setPhoneError] = useState("");

//   // Password validation criteria
//   const passwordCriteria = {
//     length: password.length >= 8,
//     uppercase: /[A-Z]/.test(password),
//     lowercase: /[a-z]/.test(password),
//     numbers: /[0-9]/.test(password),
//     special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
//   };

//   // Phone number validation - only numbers
//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     const sanitizedValue = value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    
//     setPhone(sanitizedValue);
//     if (value !== sanitizedValue) {
//       setPhoneError("Phone number can only contain digits");
//     } else {
//       setPhoneError("");
//     }
//   };

//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className={`${darkMode ? 'dark bg-gray-800 text-white' : 'bg-white'} rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
//         <div className="flex items-center justify-between mb-6">
//           <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//             User Profile
//           </h2>
//           <button
//             onClick={onClose}
//             className={`text-gray-400 hover:${darkMode ? 'text-gray-200' : 'text-gray-600'} transition-colors`}
//           >
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <UserProfileDisplay darkMode={darkMode} />
//         <ProfilePicture />

//         <div className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 value={user?.name || "User"}
//                 readOnly
//                 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                   darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
//                 }`}
//               />
//             </div>
//             <div>
//               <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//                 User Type
//               </label>
//               <select
//                 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                   darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 bg-white'
//                 }`}
//                 defaultValue={user?.type || "monitor"}
//               >
//                 <option value="monitor">Monitor</option>
//                 <option value="camera">Camera</option>
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//               Email Address
//             </label>
//             <input
//               type="email"
//               value={user?.email || "user@aegis.com"}
//               readOnly
//               className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
//               }`}
//             />
//           </div>

//           <div>
//             <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//               Phone Number
//             </label>
//             <input
//               type="tel"
//               value={phone}
//               onChange={handlePhoneChange}
//               placeholder="Enter phone number (digits only)"
//               className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
//               } ${phoneError ? 'border-red-500' : ''}`}
//             />
//             {phoneError && (
//               <p className="text-red-500 text-sm mt-1">{phoneError}</p>
//             )}
//           </div>

//           <div>
//             <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//               New Password
//             </label>
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter new password"
//               className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                 darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
//               }`}
//             />
            
//             {/* Password Strength Indicators */}
//             {password && (
//               <div className="mt-3 space-y-2">
//                 <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                   Password Requirements:
//                 </p>
//                 <div className="space-y-1">
//                   <div className="flex items-center gap-2">
//                     {passwordCriteria.length ? (
//                       <Check size={16} className="text-green-500" />
//                     ) : (
//                       <X size={16} className="text-red-500" />
//                     )}
//                     <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       At least 8 characters
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {passwordCriteria.uppercase ? (
//                       <Check size={16} className="text-green-500" />
//                     ) : (
//                       <X size={16} className="text-red-500" />
//                     )}
//                     <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       Contains uppercase letter
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {passwordCriteria.lowercase ? (
//                       <Check size={16} className="text-green-500" />
//                     ) : (
//                       <X size={16} className="text-red-500" />
//                     )}
//                     <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       Contains lowercase letter
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {passwordCriteria.numbers ? (
//                       <Check size={16} className="text-green-500" />
//                     ) : (
//                       <X size={16} className="text-red-500" />
//                     )}
//                     <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       Contains number
//                     </span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     {passwordCriteria.special ? (
//                       <Check size={16} className="text-green-500" />
//                     ) : (
//                       <X size={16} className="text-red-500" />
//                     )}
//                     <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       Contains special character
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {user?.type === "camera" && user?.cameraId && (
//             <div>
//               <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
//                 Camera ID
//               </label>
//               <input
//                 type="text"
//                 value={user.cameraId}
//                 readOnly
//                 className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed ${
//                   darkMode ? 'bg-gray-600 border-gray-500 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-600'
//                 }`}
//                 title="Camera ID is automatically generated and cannot be changed"
//               />
//               <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                 Camera ID is automatically generated and cannot be changed
//               </p>
//             </div>
//           )}

//           <div className="flex gap-3 pt-4">
//             <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
//               Save Changes
//             </button>
//             <button
//               onClick={onClose}
//               className={`px-6 py-3 rounded-lg transition-colors font-medium ${
//                 darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
//               }`}
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
