"""
AEGIS Camera Heartbeat
"""

import time
import threading
from datetime import datetime

from database.supabase import supabase


def start_heartbeat(camera_id: str, user_id: str):
    """
    Start heartbeat thread
    """

    def heartbeat():
        while True:
            try:
                response = supabase.table("cameras") \
                    .select("status") \
                    .eq("id", camera_id) \
                    .eq("user_id", user_id) \
                    .single() \
                    .execute()

                camera = response.data

                if camera and camera.get("status") == "online":
                    supabase.table("cameras") \
                        .update({
                            "status": "online",
                            "last_seen": datetime.utcnow().isoformat()
                        }) \
                        .eq("id", camera_id) \
                        .eq("user_id", user_id) \
                        .execute()

            except Exception:
                pass

            time.sleep(5)

    thread = threading.Thread(target=heartbeat, daemon=True)
    thread.start()
