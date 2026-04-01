"""
AEGIS Camera Status Monitor
Automatically mark cameras offline
"""

import time
import threading
from datetime import datetime, timedelta

from database.supabase import supabase


OFFLINE_THRESHOLD = 15  # seconds


def start_status_monitor():
    """
    Background thread to mark cameras offline
    """

    def monitor():
        while True:
            try:
                cutoff = datetime.utcnow() - timedelta(seconds=OFFLINE_THRESHOLD)

                supabase.table("cameras") \
                    .update({"status": "offline"}) \
                    .lt("last_seen", cutoff.isoformat()) \
                    .execute()

            except Exception:
                pass

            time.sleep(10)

    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()