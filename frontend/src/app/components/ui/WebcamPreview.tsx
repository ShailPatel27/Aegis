import { useEffect, useRef, useState } from "react";
import { useCameras } from "../../context/CameraContext";

export function WebcamPreview({
  cameraIndex,
  className = "w-full h-full object-cover"
}: {
  cameraIndex: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { getStream, releaseStream } = useCameras();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setFailed(false);

    getStream(cameraIndex).then(stream => {
      if (!mounted) return;

      if (!stream) {
        setFailed(true);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Detect when camera is physically disconnected
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          if (mounted) setFailed(true);
        });
      }
    }).catch(() => {
      if (mounted) setFailed(true);
    });

    return () => {
      mounted = false;
      releaseStream(cameraIndex);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraIndex]);

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18" />
        </svg>
        <p className="text-sm">Camera Inactive</p>
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