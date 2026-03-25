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
    path: "/add-camera",
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
    path: "/dashboard",
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
    path: "/live",
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
    path: "/faces",
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
    path: "/alerts",
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
    path: "/analytics",
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
    path: "/camera-config",
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
    path: "/settings",
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
