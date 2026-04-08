import cv2
import numpy as np
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse, Response

router = APIRouter()
active_cameras = {}


def create_camera(camera_id: int):
    print(f"Opening camera {camera_id}")

    cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        print("Camera failed to open")
        return None

    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    # Warmup with validation
    success_count = 0
    for _ in range(10):
        ret, frame = cap.read()
        if ret and frame is not None and frame.mean() > 1.0:
            success_count += 1

    print(f"Warmup: {success_count}/10 valid frames")

    if success_count == 0:
        print("❌ Camera returning no valid frames — is another app using it?")
        cap.release()
        return None

    print("✅ Camera opened successfully")
    return cap


def get_camera(camera_id: int):
    if camera_id not in active_cameras:
        camera = create_camera(camera_id)
        if camera is None:
            return None
        active_cameras[camera_id] = camera
    return active_cameras[camera_id]


def generate_frames(camera_id: int):
    # ✅ Create camera HERE, inside the worker thread
    print(f"Opening camera {camera_id}")
    cap = cv2.VideoCapture(camera_id)
    
    if not cap.isOpened():
        print("Camera failed to open")
        return

    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    import time
    time.sleep(1)  # let MSMF initialize

    print("Camera opened, starting stream...")

    try:
        while True:
            success, frame = cap.read()

            if not success or frame is None:
                print("Frame read failed")
                break

            frame = np.ascontiguousarray(frame)
            _, buffer = cv2.imencode(".jpg", frame)

            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n'
            )
    finally:
        print(f"Releasing camera {camera_id}")
        cap.release()


@router.get("/list")
def list_cameras():
    return JSONResponse({
        "success": True,
        "cameras": [{"id": 0, "name": "Camera 0"}]
    })


@router.get("/stream/{camera_id}")
def stream(camera_id: int):
    return StreamingResponse(
        generate_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/frame/{camera_id}")
def frame(camera_id: int):
    camera = get_camera(camera_id)
    if camera is None:
        return {"error": "camera failed"}

    success, frame = camera.read()
    if not success or frame is None:
        return {"error": "frame failed"}

    frame = np.ascontiguousarray(frame)
    _, buffer = cv2.imencode(".jpg", frame)

    return Response(
        content=buffer.tobytes(),
        media_type="image/jpeg"
    )


@router.get("/stop/{camera_id}")
def stop_camera(camera_id: int):
    if camera_id in active_cameras:
        active_cameras[camera_id].release()
        del active_cameras[camera_id]
        print(f"Camera {camera_id} stopped")
    return {"success": True}