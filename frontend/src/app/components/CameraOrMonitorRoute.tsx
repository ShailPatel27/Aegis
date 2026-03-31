import { useUser } from "../context/UserContext";
import { AddCamera } from "./AddCamera";
import { MonitorDashboard } from "./MonitorDashboard";

export function CameraOrMonitorRoute() {
  const { user } = useUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Route based on preferred interface from sessionStorage, not user type
  const preferredInterface = sessionStorage.getItem('preferredInterface') || 'camera';
  
  if (preferredInterface === 'monitor') {
    return <MonitorDashboard />;
  } else {
    return <AddCamera />;
  }
}
