import cv2
from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse

router = APIRouter()

# Store active cameras
active_cameras = {}


def get_available_cameras(max_cameras=10):
    """Detect available cameras"""

    available = []

    for i in range(max_cameras):
        cap = cv2.VideoCapture(i)

        if cap.isOpened():
            available.append({
                "id": i,
                "name": f"Camera {i}"
            })
            cap.release()

    return available


def get_camera(camera_id: int):
    """Get or create camera instance"""

    if camera_id not in active_cameras:
        active_cameras[camera_id] = cv2.VideoCapture(camera_id)

    return active_cameras[camera_id]


def generate_frames(camera_id: int):
    """Generate streaming frames"""

    camera = get_camera(camera_id)

    while True:
        success, frame = camera.read()

        if not success:
            break

        _, buffer = cv2.imencode(".jpg", frame)
        frame = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        )


@router.get("/list")
def list_cameras():
    """List available cameras"""

    cameras = get_available_cameras()

    return JSONResponse({
        "success": True,
        "cameras": cameras
    })


@router.get("/stream/{camera_id}")
def video_stream(camera_id: int):
    """Stream camera feed"""

    return StreamingResponse(
        generate_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/stop/{camera_id}")
def stop_camera(camera_id: int):
    """Stop camera"""

    if camera_id in active_cameras:
        active_cameras[camera_id].release()
        del active_cameras[camera_id]

    return {"success": True}