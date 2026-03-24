import { useState } from "react";
import { User, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";

const initialUsers = [
  { id: 1, name: "John Doe", role: "Employee", status: "whitelist", lastSeen: "2 min ago", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { id: 2, name: "Jane Smith", role: "Manager", status: "whitelist", lastSeen: "15 min ago", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
  { id: 3, name: "Mike Johnson", role: "Security", status: "whitelist", lastSeen: "1 hour ago", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  { id: 4, name: "Sarah Williams", role: "Visitor", status: "whitelist", lastSeen: "3 hours ago", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
  { id: 5, name: "Robert Brown", role: "Contractor", status: "blacklist", lastSeen: "Never", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
];

const accessLog = [
  { id: 1, name: "John Doe", action: "Entry", location: "Main Entrance", time: "2 min ago" },
  { id: 2, name: "Jane Smith", action: "Entry", location: "Parking Lot", time: "15 min ago" },
  { id: 3, name: "Mike Johnson", action: "Exit", location: "Main Entrance", time: "1 hour ago" },
];

export function FaceRecognition() {
  const { darkMode } = useSharedDarkMode();
  const [users, setUsers] = useState(initialUsers);
  const [selectedUser, setSelectedUser] = useState<typeof initialUsers[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'whitelist' ? 'blacklist' : 'whitelist' }
        : user
    ));
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face Recognition</h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage recognized individuals and access control</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className={`lg:col-span-2 rounded-xl shadow-sm border overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>User</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Role</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Last Seen</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`cursor-pointer transition-colors ${
                      darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.image} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'whitelist' 
                          ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          : darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'whitelist' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.status === 'whitelist' ? 'Whitelist' : 'Blacklist'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.lastSeen}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className={`p-1 rounded transition-colors ${
                            darkMode ? 'text-blue-400 hover:bg-blue-900' : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setUsers(users.filter(u => u.id !== user.id));
                          }}
                          className={`p-1 rounded transition-colors ${
                            darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Details Panel */}
        <div className={`rounded-xl shadow-sm p-6 border ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {selectedUser ? (
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>User Details</h2>
              <div className="text-center mb-6">
                <img 
                  src={selectedUser.image} 
                  alt={selectedUser.name}
                  className={`w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 ${
                    darkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}
                />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser.name}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedUser.role}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                  <button
                    onClick={() => toggleStatus(selectedUser.id)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedUser.status === 'whitelist'
                        ? darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'
                        : darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {selectedUser.status === 'whitelist' ? 'Whitelisted' : 'Blacklisted'}
                  </button>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload New Image</label>
                  <button className={`w-full px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
                    darkMode ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400' : 'border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600'
                  }`}>
                    Choose File
                  </button>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Last Seen</label>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.lastSeen}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <User size={48} className={`mx-auto mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Access Log */}
      <div className={`mt-6 rounded-xl shadow-sm p-6 border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Access Log</h2>
        <div className="space-y-3">
          {accessLog.map((log) => (
            <div key={log.id} className={`flex items-center justify-between p-4 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${log.action === 'Entry' ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{log.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.action}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{log.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
