import { useEffect, useRef, useState } from "react";
import { BACKEND_BASE_URL } from "../services/api";

const WS_BASE = BACKEND_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");

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
    if (!localStream || !cameraId) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add local camera tracks to peer connection
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    const ws = new WebSocket(`${WS_BASE}/api/webrtc/ws/camera/${cameraId}`);
    wsRef.current = ws;

    ws.onopen = async () => {
      setStatus("connecting");

      // Collect ICE candidates and send them
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          ws.send(JSON.stringify({
            type: "candidate",
            candidate: e.candidate.candidate,
            sdpMid: e.candidate.sdpMid,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
          }));
        }
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: offer.type, sdp: offer.sdp }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
        setStatus("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed") setStatus("error");
    };

    ws.onerror = () => setStatus("error");

    return () => {
      pc.close();
      ws.close();
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
    if (!cameraId) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Receive remote stream
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    const ws = new WebSocket(`${WS_BASE}/api/webrtc/ws/monitor/${cameraId}`);
    wsRef.current = ws;

    ws.onopen = async () => {
      setStatus("connecting");

      pc.onicecandidate = (e) => {
        if (e.candidate) {
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

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: offer.type, sdp: offer.sdp }));
    };

    ws.onmessage = async (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        setStatus("unavailable");
        return;
      }

      if (msg.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(msg));
        setStatus("connected");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed") setStatus("error");
    };

    ws.onerror = () => setStatus("error");

    return () => {
      pc.close();
      ws.close();
    };
  }, [cameraId]);

  return { remoteStream, status };
}