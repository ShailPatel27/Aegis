import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { LiveMonitoring } from "./components/LiveMonitoring";
import { FaceRecognition } from "./components/FaceRecognition";
import { Alerts } from "./components/Alerts";
import { Analytics } from "./components/Analytics";
import { AddCamera } from "./components/AddCamera";
import { Settings } from "./components/Settings";
import { CameraConfig } from "./components/CameraConfig";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "live", element: <LiveMonitoring /> },
      { path: "faces", element: <FaceRecognition /> },
      { path: "alerts", element: <Alerts /> },
      { path: "analytics", element: <Analytics /> },
      { path: "add-camera", element: <AddCamera /> },
      { path: "camera-config", element: <CameraConfig /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
