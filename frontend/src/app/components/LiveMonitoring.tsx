import React, { useState, useEffect, useRef } from "react";
import { Camera, Circle, Grid3x3, Monitor, ChevronLeft, ChevronRight, Maximize2, Archive } from "lucide-react";
import { useSharedDarkMode } from "../hooks/useSharedDarkMode";
import { useCameras } from "../context/CameraContext";
import { useLocation } from "react-router";
import { cameraAPI, tokenManager } from "../services/api";

const mockEvents = [
  { id: 1, type: "Person", confidence: "98%", time: "14:32:45", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80" },
  { id: 2, type: "Person", confidence: "95%", time: "14:32:43", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { id: 3, type: "Vehicle", confidence: "92%", time: "14:31:22", img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=100&q=80" },
  { id: 4, type: "Person", confidence: "89%", time: "14:30:15", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80" },
];

type LayoutType = "single" | "main-with-grid" | "grid";

function LocalCameraPreview({
  cameraIndex,
  className = "w-full h-full object-cover",
}: {
  cameraIndex: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { getStream, releaseStream } = useCameras();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadStream = async () => {
      const stream = await getStream(cameraIndex);
      if (!isActive) {
        if (stream) {
          releaseStream(cameraIndex);
        }
        return;
      }
      setLocalStream(stream);
    };

    loadStream();

    return () => {
      isActive = false;
      releaseStream(cameraIndex);
      setLocalStream(null);
    };
  }, [cameraIndex, getStream, releaseStream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  if (!localStream) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">Opening camera...</p>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={className}
      />
    </>
  );
}

function ChunkPlaybackPlayer({
  cameraId,
  streamEnabled,
  feedPaused,
  className = "w-full h-full",
}: {
  cameraId: string;
  streamEnabled: boolean;
  feedPaused: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadVideoRef = useRef<HTMLVideoElement>(null);
  const activeTsRef = useRef<number>(0);
  const pendingRef = useRef<{ url: string; ts: number } | null>(null);
  const latestChunkRef = useRef<{ url: string; ts: number } | null>(null);
  const lastChunkSeenAtRef = useRef<number>(0);
  const currentChunkStartMsRef = useRef<number>(0);
  const liveJumpRequestedRef = useRef<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveFollow, setIsLiveFollow] = useState(true);
  const [captureTimeLabel, setCaptureTimeLabel] = useState<string>("--:--:--");

  const CHUNK_STALE_MS = 7000;

  const swapToPending = () => {
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    activeTsRef.current = next.ts;
    currentChunkStartMsRef.current = next.ts * 1000;
    setVideoUrl(next.url);
  };

  const updateCaptureTimeLabel = () => {
    const video = videoRef.current;
    const startMs = currentChunkStartMsRef.current;
    if (!video || startMs <= 0) {
      setCaptureTimeLabel("--:--:--");
      return;
    }
    const captureAt = new Date(startMs + Math.max(0, video.currentTime) * 1000);
    setCaptureTimeLabel(captureAt.toLocaleTimeString());
  };

  const jumpToLive = () => {
    setIsLiveFollow(true);
    const latest = latestChunkRef.current;
    if (latest && latest.ts > 0 && latest.url) {
      pendingRef.current = null;
      activeTsRef.current = latest.ts;
      currentChunkStartMsRef.current = latest.ts * 1000;
      liveJumpRequestedRef.current = true;
      setVideoUrl(latest.url);
    } else {
      swapToPending();
    }
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    let mounted = true;
    let timer: number | undefined;

    const poll = async () => {
      if (!streamEnabled) {
        if (mounted) {
          activeTsRef.current = 0;
          pendingRef.current = null;
          lastChunkSeenAtRef.current = 0;
          setVideoUrl(null);
          setLoading(false);
          setError("Feed stopped. Camera is offline.");
        }
        return;
      }

      if (feedPaused) {
        if (mounted) {
          setLoading(false);
          setError("Feed paused from camera.");
        }
        timer = window.setTimeout(poll, 1200);
        return;
      }

      const token = tokenManager.getToken();
      if (!token) {
        if (mounted) {
          setLoading(false);
          setError("Not authenticated");
        }
        return;
      }

      try {
        const response = await cameraAPI.getLatestChunks(token, cameraId, 5);
        const chunks = Array.isArray(response?.chunks) ? response.chunks : [];
        const sorted = chunks
          .map((c: any) => ({
            url: c?.url || c?.url_public || null,
            ts: Number(c?.timestamp || 0),
          }))
          .filter((c: any) => Boolean(c.url) && c.ts > 0)
          .sort((a: any, b: any) => a.ts - b.ts);
        const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
        const nextUrl = latest?.url || null;
        const nextTs = Number(latest?.ts || 0);

        if (!mounted) return;

        if (nextUrl && nextTs > 0) {
          latestChunkRef.current = { url: nextUrl, ts: nextTs };
          lastChunkSeenAtRef.current = Date.now();
          if (activeTsRef.current <= 0) {
            activeTsRef.current = nextTs;
            currentChunkStartMsRef.current = nextTs * 1000;
            setVideoUrl(nextUrl);
          } else if (nextTs > activeTsRef.current) {
            pendingRef.current = { url: nextUrl, ts: nextTs };
            // Warm up the next chunk file before boundary switch.
            if (preloadVideoRef.current) {
              preloadVideoRef.current.src = nextUrl;
              preloadVideoRef.current.load();
            }
            // If user wants "live" and video is currently ended/stalled, jump immediately.
            const video = videoRef.current;
            if (
              isLiveFollow &&
              video &&
              (video.ended || video.readyState < 2 || (video.duration > 0 && video.currentTime >= video.duration - 0.01))
            ) {
              swapToPending();
            }
          }
        } else if (
          lastChunkSeenAtRef.current > 0 &&
          Date.now() - lastChunkSeenAtRef.current > CHUNK_STALE_MS
        ) {
          setVideoUrl(null);
          setError("No fresh chunks from camera.");
        }
        if (!nextUrl && !error) {
          setError("Waiting for chunks...");
        } else if (nextUrl) {
          setError(null);
        }
        setLoading(false);
      } catch {
        if (!mounted) return;
        setLoading(false);
        setError("Waiting for chunks...");
      } finally {
        timer = window.setTimeout(poll, 1500);
      }
    };

    setVideoUrl(null);
    activeTsRef.current = 0;
    pendingRef.current = null;
    latestChunkRef.current = null;
    lastChunkSeenAtRef.current = 0;
    currentChunkStartMsRef.current = 0;
    liveJumpRequestedRef.current = false;
    setCaptureTimeLabel("--:--:--");
    setLoading(true);
    setError(null);
    poll();

    return () => {
      mounted = false;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [cameraId, streamEnabled, feedPaused, isLiveFollow]);

  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    if (!streamEnabled || feedPaused) return;
    videoRef.current.src = videoUrl;
    videoRef.current.load();
    videoRef.current
      .play()
      .catch(() => {
        // Autoplay may be blocked until user gesture on some browsers.
      });
  }, [videoUrl, streamEnabled, feedPaused]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (feedPaused || !streamEnabled) {
      videoRef.current.pause();
    }
  }, [feedPaused, streamEnabled]);

  if (!streamEnabled) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]`}>
        <Archive size={36} className="mb-2 opacity-60" />
        <p className="text-sm">Feed stopped. Camera is offline.</p>
      </div>
    );
  }

  if (feedPaused) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]`}>
        <Archive size={36} className="mb-2 opacity-60" />
        <p className="text-sm">Feed is paused.</p>
        <p className="text-xs mt-1">Resume from camera controls to continue.</p>
      </div>
    );
  }

  if (loading && !videoUrl) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]`}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">Waiting for first chunk...</p>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gray-900 text-gray-500 min-h-[180px]`}>
        <Archive size={36} className="mb-2 opacity-60" />
        <p className="text-sm">{error || "No chunk available yet"}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        controls
        className={className}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (video && liveJumpRequestedRef.current && Number.isFinite(video.duration)) {
            video.currentTime = Math.max(0, video.duration - 0.2);
            liveJumpRequestedRef.current = false;
          }
          updateCaptureTimeLabel();
        }}
        onTimeUpdate={updateCaptureTimeLabel}
        onEnded={() => {
          if (isLiveFollow) {
            swapToPending();
          }
        }}
      />
      <video
        ref={preloadVideoRef}
        muted
        playsInline
        preload="auto"
        className="hidden"
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/70 text-white px-2 py-1 rounded text-xs">
        <span className="font-mono">{captureTimeLabel}</span>
        <button
          type="button"
          title="Jump to latest chunk"
          onClick={jumpToLive}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded"
        >
          LIVE
        </button>
      </div>
    </div>
  );
}

export function LiveMonitoring() {
  const { darkMode } = useSharedDarkMode();
  const { cameras } = useCameras();
  const location = useLocation();
  const isCameraRoute = location.pathname.startsWith("/camera");
  const [selectedCamera, setSelectedCamera] = useState<any | null>(null);
  const [objectDetection, setObjectDetection] = useState(true);
  const [faceRecognition, setFaceRecognition] = useState(true);
  const [weaponDetection, setWeaponDetection] = useState(true);
  const [screenshot, setScreenshot] = useState(false);
  const [layout, setLayout] = useState<LayoutType>("main-with-grid");
  const [mainCameraIndex, setMainCameraIndex] = useState(0);

  // Fix initial selectedCamera when cameras load
  useEffect(() => {
    if (cameras.length > 0 && !selectedCamera) {
      setSelectedCamera(cameras[0]);
      setMainCameraIndex(0);
    }
  }, [cameras]);

  const goToPrevCamera = () => {
    setMainCameraIndex((prev) => (prev === 0 ? cameras.length - 1 : prev - 1));
    setSelectedCamera(cameras[mainCameraIndex === 0 ? cameras.length - 1 : mainCameraIndex - 1]);
  };

  const goToNextCamera = () => {
    setMainCameraIndex((prev) => (prev === cameras.length - 1 ? 0 : prev + 1));
    setSelectedCamera(cameras[mainCameraIndex === cameras.length - 1 ? 0 : mainCameraIndex + 1]);
  };

  const renderVideoFeed = (camera: typeof cameras[0], isMain: boolean = false) => {

    if (!camera) {
      return (
        <div className="flex items-center justify-center aspect-video bg-gray-900 rounded-lg">
          <div className="text-center text-gray-400">
            <Camera className="mx-auto mb-2 opacity-50" size={36} />
            <p>No cameras available</p>
            <p className="text-xs mt-1">Add a camera to start monitoring</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {isCameraRoute ? (
          <LocalCameraPreview
            cameraIndex={camera.selected_camera}
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          (() => {
            const feedPaused = Boolean(camera?.config?.feed_paused);
            const streamEnabled = camera?.stream_enabled === true || camera?.status === "online";
            return (
          <ChunkPlaybackPlayer
            cameraId={camera.id}
            streamEnabled={streamEnabled}
            feedPaused={feedPaused}
            className="w-full h-full object-cover"
          />
            );
          })()
        )}

        {/* Live Indicator */}
        {(() => {
          const feedPaused = Boolean(camera?.config?.feed_paused);
          const streamEnabled = camera?.stream_enabled === true || camera?.status === "online";
          const isLive = streamEnabled && !feedPaused;
          const label = !streamEnabled ? "STOPPED" : feedPaused ? "PAUSED" : "LIVE";
          const badge = !streamEnabled
            ? "bg-slate-600"
            : feedPaused
              ? "bg-yellow-600"
              : "bg-red-600";
          return (
            <div className={`absolute top-2 left-2 ${badge} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}>
              <Circle className={`w-1.5 h-1.5 fill-white ${isLive ? "animate-pulse" : ""}`} />
              {label}
            </div>
          );
        })()}

        {/* Camera Info */}
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          {camera.name}
        </div>

        {/* Timestamp */}
        {isCameraRoute && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
            {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Live Monitoring</h1>
            <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Real-time video feed with detection overlays</p>
          </div>

          {/* Layout Selector */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Layout:</span>
            <button
              onClick={() => setLayout("single")}
              className={`p-2 rounded-lg transition-colors ${layout === "single" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Single Camera"
            >
              <Monitor size={20} />
            </button>
            <button
              onClick={() => setLayout("main-with-grid")}
              className={`p-2 rounded-lg transition-colors ${layout === "main-with-grid" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Main + Grid"
            >
              <Maximize2 size={20} />
            </button>
            <button
              onClick={() => setLayout("grid")}
              className={`p-2 rounded-lg transition-colors ${layout === "grid" ? "bg-blue-600 text-white" : `${darkMode ? 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`
                }`}
              title="Grid View"
            >
              <Grid3x3 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className={`lg:col-span-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-sm p-6 border`}>
            {/* Single Camera Layout with Navigation */}
            {layout === "single" && (
              <div className="relative">
                <div className="relative">
                  {renderVideoFeed(cameras[mainCameraIndex], true)}

                  {/* Navigation Buttons */}
                  <button
                    onClick={goToPrevCamera}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goToNextCamera}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Camera Counter */}
                <div className="mt-4 text-center">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Camera {mainCameraIndex + 1} of {cameras.length}
                  </span>
                </div>
              </div>
            )}

            {/* Main with Grid Layout */}
            {layout === "main-with-grid" && (
              <div>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Main Camera</label>
                  <select
                    className={`w-full md:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    value={selectedCamera?.id || ""}
                    onChange={(e) => {
                      const cam = cameras.find(c => c.id === e.target.value);
                      if (cam) {
                        setSelectedCamera(cam);
                        setMainCameraIndex(cameras.indexOf(cam));
                      }
                    }}
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.name}
                      </option>
                    ))}
                  </select>
                </div>

                {renderVideoFeed(selectedCamera, true)}

                {/* Thumbnail Grid */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {cameras.filter(c => c.id !== selectedCamera?.id).map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => {
                        setSelectedCamera(camera);
                        setMainCameraIndex(cameras.indexOf(camera));
                      }}
                      className={`relative rounded-lg overflow-hidden border-2 transition-colors ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-200 hover:border-blue-500'
                        }`}
                    >
                      <div className="w-full aspect-video bg-gray-800 flex items-center justify-center">
                        <Camera className="text-gray-400" size={24} />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-1 left-1 right-1">
                        <p className="text-white text-xs font-medium truncate">{camera.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Layout */}
            {layout === "grid" && (
              <div className="grid grid-cols-2 gap-4">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    onClick={() => {
                      setSelectedCamera(camera);
                      setMainCameraIndex(cameras.indexOf(camera));
                      setLayout("main-with-grid");
                    }}
                    className={`rounded-lg overflow-hidden border-2 transition-colors ${selectedCamera?.id === camera.id
                      ? "border-blue-500"
                      : darkMode ? "border-gray-600 hover:border-blue-400" : "border-gray-200 hover:border-blue-300"
                      }`}
                  >
                    {renderVideoFeed(camera, false)}
                  </button>
                ))}
              </div>
            )}

            {/* Control Toggles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Object Detection</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track objects</p>
                </div>
                <button
                  onClick={() => setObjectDetection(!objectDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${objectDetection ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${objectDetection ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Face Recognition</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Identify faces</p>
                </div>
                <button
                  onClick={() => setFaceRecognition(!faceRecognition)}
                  className={`w-12 h-6 rounded-full transition-colors ${faceRecognition ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${faceRecognition ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weapon Detection</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Detect threats</p>
                </div>
                <button
                  onClick={() => setWeaponDetection(!weaponDetection)}
                  className={`w-12 h-6 rounded-full transition-colors ${weaponDetection ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${weaponDetection ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Screenshots</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Auto capture</p>
                </div>
                <button
                  onClick={() => setScreenshot(!screenshot)}
                  className={`w-12 h-6 rounded-full transition-colors ${screenshot ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${screenshot ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                </button>
              </div>
            </div>
          </div>


          {/* Event Feed */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <div className={`rounded-xl shadow-sm p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <Camera size={20} />
                Real-Time Events
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {mockEvents.map((event) => (
                  <div key={event.id} className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex gap-3">
                      <img
                        src={event.img}
                        alt={event.type}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.type}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Confidence: {event.confidence}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{event.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
