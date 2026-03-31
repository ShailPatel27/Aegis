import { useState } from "react";

import { Bell, Settings as SettingsIcon, Moon, Sun } from "lucide-react";

import { useSharedDarkMode } from "../hooks/useSharedDarkMode";



export function Settings() {

  const [detectionThreshold, setDetectionThreshold] = useState(75);

  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const [emailAlerts, setEmailAlerts] = useState(true);

  const [alertSensitivity, setAlertSensitivity] = useState(70);

  const [screenshotResolution, setScreenshotResolution] = useState("1080p");

  const { darkMode } = useSharedDarkMode();



  return (

    <div className="p-8">

      <div className="mb-6">

        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>

        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Configure system parameters and preferences</p>

      </div>



      {/* General Settings */}

      <div className={`rounded-xl shadow-sm p-6 border mb-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>

        <div className="flex items-center gap-2 mb-6">

          <SettingsIcon size={24} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />

          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>General Settings</h2>

        </div>



        <div className="space-y-6">

          <div>

            <div className="flex items-center justify-between mb-2">

              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Detection Threshold</label>

              <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{detectionThreshold}%</span>

            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={detectionThreshold}
              onChange={(e) => setDetectionThreshold(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            />

            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minimum score for object detection trigger</p>

          </div>



          <div>

            <div className="flex items-center justify-between mb-2">

              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Confidence Threshold</label>

              <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{confidenceThreshold}%</span>

            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            />

            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Minimum confidence level for classification</p>

          </div>



          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>

            <div>

              <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>System Language</label>
              <select className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}>

                <option>English</option>

                <option>Spanish</option>

                <option>French</option>

                <option>German</option>

              </select>

            </div>

            <div>

              <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Time Zone</label>
              <select className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}>

                <option>UTC-8 (Pacific)</option>

                <option>UTC-5 (Eastern)</option>

                <option>UTC+0 (GMT)</option>

                <option>UTC+1 (CET)</option>

              </select>

            </div>

          </div>

        </div>

      </div>



      {/* Alert Settings */}

      <div className={`rounded-xl shadow-sm p-6 border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>

        <div className="flex items-center gap-2 mb-6">

          <Bell size={24} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />

          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Alert Settings</h2>

        </div>



        <div className="space-y-6">

          <div className={`flex items-center justify-between p-4 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>

            <div>

              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Enable Email Alerts</p>

              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receive notifications via email</p>

            </div>

              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  emailAlerts ? "bg-blue-600" : (darkMode ? "bg-gray-600" : "bg-gray-300")
                }`}
              >

                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  emailAlerts ? "translate-x-6" : "translate-x-0.5"
                }`} />

              </button>

          </div>



          {emailAlerts && (

            <div className="pl-4">

              <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
              <input 
                type="email" 
                placeholder="alerts@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}

                defaultValue="admin@aegis.com"

              />

            </div>

          )}



          <div>

            <div className="flex items-center justify-between mb-2">

              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Alert Sensitivity</label>
              <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{alertSensitivity}%</span>

            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              value={alertSensitivity}
              onChange={(e) => setAlertSensitivity(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-600 ${
                darkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}
            />

            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Lower values trigger more alerts</p>

          </div>



          <div>

            <label className={`text-sm font-medium mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Screenshot Resolution</label>
            <select 
              className={`w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
              }`}

              value={screenshotResolution}

              onChange={(e) => setScreenshotResolution(e.target.value)}

            >

              <option value="720p">720p (HD)</option>

              <option value="1080p">1080p (Full HD)</option>

              <option value="1440p">1440p (2K)</option>

              <option value="2160p">2160p (4K)</option>

            </select>

          </div>



          <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Receive Alerts</h3>

            <div className="space-y-2">

              {['Weapon Detection', 'Blacklist Match', 'Unrecognized Person', 'Running Detected', 'Loitering Detected'].map((alertType) => (

                <label key={alertType} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                }`}>

                  <input 

                    type="checkbox" 

                    defaultChecked

                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"

                  />

                  <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alertType}</span>

                </label>

              ))}

            </div>

          </div>

        </div>

      </div>



      {/* Save Button */}

      <div className="mt-6 flex justify-end">

        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">

          Save All Changes

        </button>

      </div>

    </div>

  );

}

