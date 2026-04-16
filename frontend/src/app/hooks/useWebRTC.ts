import { useEffect, useRef, useState } from "react";
import { BACKEND_BASE_URL } from "../services/api";

const WS_BASE =
  import.meta.env.VITE_BACKEND_WS_URL ||
  BACKEND_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

// ─── Camera Hook ───────────────────────────────────────────────
export function useCameraStream(cameraId: string, localStream: MediaStream | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    if (!localStream || !cameraId) {
      setStatus("idle");
      return;
    }

    let isDisposed = false;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local camera tracks to peer connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${WS_BASE}/api/webrtc/ws/camera/${cameraId}`);
    } catch (error) {
      console.error("Failed to open camera WebSocket:", error);
      setStatus("error");
      return () => {
        isDisposed = true;
        pc.close();
      };
    }
    wsRef.current = ws;

    ws.onopen = () => {
      if (isDisposed) return;
      setStatus("connecting");

      pc.onicecandidate = (e) => {
        if (
          e.candidate &&
          ws.readyState === WebSocket.OPEN &&
          !isDisposed
        ) {
          ws.send(JSON.stringify({
            type: "candidate",
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          }));
        }
      };

      // Add 500ms delay to prevent deadlock
      setTimeout(async () => {
        if (isDisposed || pc.signalingState !== "stable") return;
        
        const offer = await pc.createOffer();
        if (isDisposed) return;
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: offer.type, sdp: offer.sdp }));
        }
      }, 500);
    };

    ws.onmessage = async (e) => {
      if (isDisposed) return;

      const msg = JSON.parse(e.data);

      if (msg.type === "ready") {
        const offer = await pc.createOffer();
        if (isDisposed) return;

        await pc.setLocalDescription(offer);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: offer.type,
            sdp: offer.sdp
          }));
        }
      }

      if (msg.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
        if (!isDisposed) {
          setStatus("connected");
        }
      }

      if (msg.type === "candidate") {
        await pc.addIceCandidate(msg);
      }
    };

    ws.onclose = () => {
      if (!isDisposed && status !== "connected") {
        setStatus("error");
      }
    };

    pc.onconnectionstatechange = () => {
      if (isDisposed) return;
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("error");
      }
    };

    ws.onerror = () => {
      if (!isDisposed) {
        setStatus("error");
      }
    };

    return () => {
      isDisposed = true;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [localStream, cameraId]);

  return { status };
}

// ─── Monitor Hook ───────────────────────────────────────────────
export function useMonitorStream(cameraId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error" | "unavailable">("idle");

  useEffect(() => {
    if (!cameraId) {
      setRemoteStream(null);
      setStatus("idle");
      return;
    }

    let isDisposed = false;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Receive remote stream
    pc.ontrack = (e) => {
      if (!isDisposed) {
        setRemoteStream(e.streams[0]);
      }
    };

    let ws: WebSocket;
    try {
      ws = new WebSocket(`${WS_BASE}/api/webrtc/ws/monitor/${cameraId}`);
    } catch (error) {
      console.error("Failed to open monitor WebSocket:", error);
      setStatus("error");
      return () => {
        isDisposed = true;
        pc.close();
      };
    }
    wsRef.current = ws;

    ws.onopen = async () => {
      if (isDisposed) return;
      setStatus("connecting");

      pc.onicecandidate = (e) => {
        if (
          e.candidate &&
          ws.readyState === WebSocket.OPEN &&
          !isDisposed
        ) {
          ws.send(JSON.stringify({
            type: "candidate",
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          }));
        }
      };

      // Add transceiver to receive video
      pc.addTransceiver("video", { direction: "recvonly" });

      // Add 500ms delay to prevent deadlock
      setTimeout(async () => {
        if (isDisposed || pc.signalingState !== "stable") return;
        
        const offer = await pc.createOffer();
        if (isDisposed) return;
        await pc.setLocalDescription(offer);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: offer.type, sdp: offer.sdp }));
        }
      }, 500);
    };

    ws.onmessage = async (e) => {
      if (isDisposed) return;
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        setStatus("unavailable");
        return;
      }

      if (msg.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
        if (!isDisposed) {
          setStatus("connected");
        }
      } else if (msg.type === "candidate") {
        await pc.addIceCandidate({
          candidate: msg.candidate,
          sdpMid: msg.sdpMid,
          sdpMLineIndex: msg.sdpMLineIndex
        });
      }
    };

    ws.onclose = () => {
      if (!isDisposed && status !== "connected") {
        setStatus("unavailable");
      }
    };

    pc.onconnectionstatechange = () => {
      if (isDisposed) return;
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("error");
      }
    };

    ws.onerror = () => {
      if (!isDisposed) {
        setStatus("error");
      }
    };

    return () => {
      isDisposed = true;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.ontrack = null;
      pc.close();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [cameraId]);

  return { remoteStream, status };
}
