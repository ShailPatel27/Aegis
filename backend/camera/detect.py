import cv2


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