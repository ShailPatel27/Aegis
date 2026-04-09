import { useUser } from "../context/UserContext";
import { AddCamera } from "./AddCamera";
import { MonitorDashboard } from "./MonitorDashboard";
import { useCameras } from "../context/CameraContext";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export function CameraOrMonitorRoute() {
  const { user } = useUser();
  const { cameras } = useCameras();
  const navigate = useNavigate();
  const preferredInterface = sessionStorage.getItem('preferredInterface') || 'camera';

  if (!user) return <div>Loading...</div>;

  if (preferredInterface === 'monitor') {
    return <MonitorDashboard />;
  }

  // Camera mode — handled in AddCamera itself now
  return <AddCamera />;
}