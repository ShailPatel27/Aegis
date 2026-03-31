import { useUser } from "../context/UserContext";
import { useEffect } from "react";

export function DebugUserInfo() {
  const { user, isLoading, error } = useUser();

  useEffect(() => {
    console.log("Debug - User data:", user);
    console.log("Debug - Is loading:", isLoading);
    console.log("Debug - Error:", error);
    console.log("Debug - Token in localStorage:", localStorage.getItem("aegis_token"));
    console.log("Debug - User in localStorage:", localStorage.getItem("aegis_user"));
  }, [user, isLoading, error]);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg m-4">
      <h3 className="font-bold text-yellow-800">Debug Info:</h3>
      <p className="text-sm text-yellow-700">User: {user ? JSON.stringify(user) : "No user"}</p>
      <p className="text-sm text-yellow-700">Loading: {isLoading ? "Yes" : "No"}</p>
      <p className="text-sm text-yellow-700">Error: {error || "None"}</p>
    </div>
  );
}
