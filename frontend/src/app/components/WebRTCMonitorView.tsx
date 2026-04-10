import { useEffect, useRef } from "react";
import { CameraOff } from "lucide-react";
import { useMonitorStream } from "../hooks/useWebRTC";

export function WebRTCMonitorView({
  cameraId,
  className = "w-full h-full object-cover"
}: {
  cameraId: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { remoteStream, status } = useMonitorStream(cameraId);

  useEffect(() => {
    if (remoteStream && videoRef.current) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status === "unavailable" || status === "error") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]">
        <CameraOff size={40} className="mb-2 opacity-40" />
        <p className="text-sm">Camera Unavailable</p>
      </div>
    );
  }

  if (status === "connecting" || status === "idle") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">Connecting...</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className={className}
    />
  );
}