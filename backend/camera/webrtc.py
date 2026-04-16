"""
Aegis WebRTC Signaling and Relay
Camera device sends stream → backend relays → monitor receives
"""

import asyncio
import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaRelay
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# One relay per camera stream — efficiently shares one stream to many monitors
relays: Dict[str, MediaRelay] = {}
camera_tracks: Dict[str, object] = {}

# Active peer connections — track all to clean up properly  
camera_pcs: Dict[str, RTCPeerConnection] = {}  # camera_id → pc
monitor_pcs: Dict[str, Set[RTCPeerConnection]] = {}  # camera_id → set of monitor pcs


async def cleanup_pc(pc: RTCPeerConnection, camera_id: str, role: str):
    """Clean up a peer connection"""
    await pc.close()
    if role == "camera":
        if camera_id in camera_pcs:
            del camera_pcs[camera_id]
        if camera_id in relays:
            del relays[camera_id]
        if camera_id in camera_tracks:
            del camera_tracks[camera_id]
        logger.info(f"Camera {camera_id} disconnected")
    else:
        if camera_id in monitor_pcs:
            monitor_pcs[camera_id].discard(pc)
        logger.info(f"Monitor disconnected from camera {camera_id}")


@router.websocket("/ws/camera/{camera_id}")
async def camera_endpoint(websocket: WebSocket, camera_id: str):
    """
    Camera device connects here.
    Sends its stream to the backend via WebRTC.
    """
    await websocket.accept()
    pc = RTCPeerConnection()

    try:
        await websocket.send_text(json.dumps({"type": "ready"}))
    except Exception as e:
        logger.error(f"Failed to send ready: {e}")
        camera_pcs[camera_id] = pc
        relays[camera_id] = MediaRelay()

    @pc.on("icecandidate")
    async def on_ice(candidate):
        if candidate:
            await websocket.send_text(json.dumps({
                "type": "candidate",
                "candidate": candidate.to_sdp(),
                "sdpMid": candidate.sdpMid,
                "sdpMLineIndex": candidate.sdpMLineIndex
            }))

    @pc.on("track")
    async def on_track(track):
        logger.info(f"Camera {camera_id} sending {track.kind} track")
        if track.kind == "video":
            camera_tracks[camera_id] = track

    @pc.on("connectionstatechange")
    async def on_state_change():
        logger.info(f"Camera {camera_id} state: {pc.connectionState}")
        if pc.connectionState in ("failed", "closed", "disconnected"):
            await cleanup_pc(pc, camera_id, "camera")

    try:
        while True:
            try:
                raw = await websocket.receive_text()
                msg = json.loads(raw)

                if msg["type"] == "offer":
                    # Camera sends offer → backend answers
                    offer = RTCSessionDescription(
                        sdp=msg["sdp"],
                        type=msg["type"]
                    )
                    await pc.setRemoteDescription(offer)
                    answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)

                    await websocket.send_text(json.dumps({
                        "type": pc.localDescription.type,
                        "sdp": pc.localDescription.sdp
                    }))

                elif msg["type"] == "candidate" and msg.get("candidate"):
                    # ICE candidate exchange
                    from aiortc.sdp import candidate_from_sdp
                    candidate = candidate_from_sdp(msg["candidate"])
                    candidate.sdpMid = msg.get("sdpMid", "0")
                    candidate.sdpMLineIndex = msg.get("sdpMLineIndex", 0)
                    await pc.addIceCandidate(candidate)

            except WebSocketDisconnect:
                break

    except Exception as e:
        logger.error(f"Camera WS error: {e}")
    finally:
        logger.info(f"Camera websocket closed for {camera_id}")


@router.websocket("/ws/monitor/{camera_id}")
async def monitor_endpoint(websocket: WebSocket, camera_id: str):
    """
    Monitor device connects here.
    Receives the relayed stream from the camera.
    """
        
    pc = RTCPeerConnection()

    if camera_id not in monitor_pcs:
        monitor_pcs[camera_id] = set()
    monitor_pcs[camera_id].add(pc)

    @pc.on("icecandidate")
    async def on_ice(candidate):
        if candidate:
            await websocket.send_text(json.dumps({
                "type": "candidate",
                "candidate": candidate.to_sdp(),
                "sdpMid": candidate.sdpMid,
                "sdpMLineIndex": candidate.sdpMLineIndex
            }))

    @pc.on("connectionstatechange")
    async def on_state_change():
        logger.info(f"Monitor state for {camera_id}: {pc.connectionState}")
        if pc.connectionState in ("failed", "closed", "disconnected"):
            await cleanup_pc(pc, camera_id, "monitor")

    try:
        # Wait for camera stream
        for _ in range(20):  # wait up to 10 seconds
            if camera_id in relays and camera_id in camera_tracks:
                break
            await asyncio.sleep(0.5)

        if camera_id not in relays or camera_id not in camera_tracks:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": "Camera stream not available"
            }))
            await websocket.close()
            return

        # Add relayed track to monitor's peer connection
        relay = relays[camera_id]
        pc.addTrack(relay.subscribe(camera_tracks[camera_id]))

        # Monitor sends offer → backend answers with camera stream
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg["type"] == "offer":
                offer = RTCSessionDescription(sdp=msg["sdp"], type=msg["type"])
                await pc.setRemoteDescription(offer)
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                await websocket.send_text(json.dumps({
                    "type": pc.localDescription.type,
                    "sdp": pc.localDescription.sdp
                }))

            elif msg["type"] == "candidate" and msg.get("candidate"):
                from aiortc.sdp import candidate_from_sdp
                candidate = candidate_from_sdp(msg["candidate"])
                candidate.sdpMid = msg.get("sdpMid", "0")
                candidate.sdpMLineIndex = msg.get("sdpMLineIndex", 0)
                await pc.addIceCandidate(candidate)

    except WebSocketDisconnect:
        logger.info("Monitor websocket disconnected")
    except Exception as e:
        logger.error(f"Monitor WS error: {e}")
        await cleanup_pc(pc, camera_id, "monitor")
