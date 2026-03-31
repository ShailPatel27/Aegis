import { useUser } from "../context/UserContext";

export function UserProfileDisplay({ darkMode }: { darkMode: boolean }) {
  const { user } = useUser();

  return (
    <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Name</p>
          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {user?.name || "Not available"}
          </p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {user?.email || "Not available"}
          </p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>User Type</p>
          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {user?.type || "Not available"}
          </p>
        </div>
        {user?.type === "camera" && user?.cameraId && (
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Camera ID</p>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user.cameraId}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
