import cv2
import time

cap = cv2.VideoCapture(0)
time.sleep(2)  # give MSMF time to initialize

ret, frame = cap.read()
print(f"success={ret}, mean={frame.mean() if frame is not None else 'None'}")
cap.release()