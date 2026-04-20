import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { cameraAPI, tokenManager, authAPI } from "../services/api";

type Camera = {
  id: string;
  name: string;
  selected_camera: number;
  status: string;
  stream_enabled?: boolean;
  location?: string | null;
  type?: string;
  config?: Record<string, any>;
  created_at: string;
  last_seen?: string;
};

type StreamEntry = {
  stream: MediaStream;
  refCount: number;
};

type CameraContextType = {
  cameras: Camera[];
  refreshCameras: () => Promise<void>;
  deleteCamera: (id: string) => Promise<void>;
  setCameraStreamState: (id: string, enabled: boolean) => Promise<void>;
  setCameraConfig: (id: string, config: Record<string, any>) => Promise<void>;
  getStream: (cameraIndex: number) => Promise<MediaStream | null>;
  releaseStream: (cameraIndex: number) => void;
};

const CameraContext = createContext<CameraContextType | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const streams = useRef<Map<number, StreamEntry>>(new Map());

  const clearSession = useCallback(() => {
    tokenManager.removeToken();
    localStorage.removeItem("aegis_user");
    setCameras([]);
  }, []);

  const refreshCameras = useCallback(async () => {
    const token = tokenManager.getToken();
    if (!token) return;
    try {
      const data = await cameraAPI.getCameras(token);
      setCameras(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        clearSession();
        return;
      }
      // Keep current camera state on transient backend errors.
      console.error("refreshCameras failed:", error);
    }
  }, [clearSession]);

  const silentTokenRefresh = async () => {
    const token = tokenManager.getToken();
    if (!token) return;

    try {
      const newToken = await authAPI.refreshToken(token);
      tokenManager.setToken(newToken);
      console.log('🔄 Token refreshed silently');
    } catch (err) {
      console.error('Token refresh failed:', err);
      // Don't logout — just log the error, camera keeps running
    }
  };

  const deleteCamera = useCallback(async (id: string) => {
    const token = tokenManager.getToken();
    if (!token) return;
    try {
      await cameraAPI.deleteCamera(token, id);
      await refreshCameras();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        clearSession();
        return;
      }
      throw error;
    }
  }, [clearSession, refreshCameras]);

  const setCameraStreamState = useCallback(async (id: string, enabled: boolean) => {
    const token = tokenManager.getToken();
    if (!token) return;
    try {
      await cameraAPI.setCameraStreamState(token, id, enabled);
      await refreshCameras();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        clearSession();
        return;
      }
      throw error;
    }
  }, [clearSession, refreshCameras]);

  const setCameraConfig = useCallback(async (id: string, config: Record<string, any>) => {
    const token = tokenManager.getToken();
    if (!token) return;
    try {
      await cameraAPI.updateCameraConfig(token, id, config);
      await refreshCameras();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        clearSession();
        return;
      }
      throw error;
    }
  }, [clearSession, refreshCameras]);

  // Shared stream — if two components need same index, reuse same MediaStream
  const getStream = useCallback(async (cameraIndex: number): Promise<MediaStream | null> => {
    const existing = streams.current.get(cameraIndex);
    if (existing) {
      existing.refCount++;
      return existing.stream;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      const device = videoDevices[cameraIndex];

      const stream = await navigator.mediaDevices.getUserMedia({
        video: device ? { deviceId: { exact: device.deviceId } } : true,
        audio: false
      });

      streams.current.set(cameraIndex, { stream, refCount: 1 });
      return stream;
    } catch (err) {
      console.error(`Failed to get stream for camera ${cameraIndex}:`, err);
      return null;
    }
  }, []);

  const releaseStream = useCallback((cameraIndex: number) => {
    const entry = streams.current.get(cameraIndex);
    if (!entry) return;

    entry.refCount--;
    if (entry.refCount <= 0) {
      entry.stream.getTracks().forEach(t => t.stop());
      streams.current.delete(cameraIndex);
    }
  }, []);

  useEffect(() => {
    refreshCameras();
    const cameraInterval = setInterval(refreshCameras, 10000);

    // Refresh token every 20 minutes (before 30 min expiry)
    const tokenInterval = setInterval(silentTokenRefresh, 20 * 60 * 1000);

    return () => {
      clearInterval(cameraInterval);
      clearInterval(tokenInterval);
    };
  }, []);

  return (
    <CameraContext.Provider value={{ cameras, refreshCameras, deleteCamera, setCameraStreamState, setCameraConfig, getStream, releaseStream }}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCameras() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error("useCameras must be used inside CameraProvider");
  return ctx;
}
