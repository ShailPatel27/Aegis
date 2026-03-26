import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { LiveMonitoring } from "./components/LiveMonitoring";
import { FaceRecognition } from "./components/FaceRecognition";
import { Alerts } from "./components/Alerts";
import { Analytics } from "./components/Analytics";
import { AddCamera } from "./components/AddCamera";
import { MonitorDashboard } from "./components/MonitorDashboard";
import { CameraOrMonitorRoute } from "./components/CameraOrMonitorRoute";
import { Settings } from "./components/Settings";
import { CameraConfig } from "./components/CameraConfig";
import { UserTypeSelection } from "./components/UserTypeSelection";
import { LoginSignup } from "./components/LoginSignup";
import { ResetPassword } from "./components/ResetPassword";
import { VerificationCodeReset } from "./components/VerificationCodeReset";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginSignup />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/reset-password-code",
    element: <VerificationCodeReset onBack={() => window.history.back()} />,
  },
  {
    path: "/select-type",
    element: <UserTypeSelection />,
  },
  {
    path: "/camera/add-camera",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AddCamera /> },
    ],
  },
  {
    path: "/camera/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "/monitor/add-camera",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <MonitorDashboard /> },
    ],
  },
  {
    path: "/monitor/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "/add-camera",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CameraOrMonitorRoute /> },
    ],
  },
  {
    path: "/camera/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "/camera/live",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LiveMonitoring /> },
    ],
  },
  {
    path: "/camera/faces",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <FaceRecognition /> },
    ],
  },
  {
    path: "/camera/alerts",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Alerts /> },
    ],
  },
  {
    path: "/camera/analytics",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Analytics /> },
    ],
  },
  {
    path: "/camera/camera-config",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CameraConfig /> },
    ],
  },
  {
    path: "/camera/settings",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Settings /> },
    ],
  },
  {
    path: "/monitor/dashboard",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
    ],
  },
  {
    path: "/monitor/live",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <LiveMonitoring /> },
    ],
  },
  {
    path: "/monitor/faces",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <FaceRecognition /> },
    ],
  },
  {
    path: "/monitor/alerts",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Alerts /> },
    ],
  },
  {
    path: "/monitor/analytics",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Analytics /> },
    ],
  },
  {
    path: "/monitor/camera-config",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <CameraConfig /> },
    ],
  },
  {
    path: "/monitor/settings",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Settings /> },
    ],
  },
]);
