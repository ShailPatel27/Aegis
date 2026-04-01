"""
AEGIS Device Identity
Each camera node gets a persistent device_id
"""

import os
import uuid
from pathlib import Path


DEVICE_FILE = Path("device_id.txt")


def get_device_id() -> str:
    """
    Get persistent device ID
    Creates one if it doesn't exist
    """

    # If device_id already exists
    if DEVICE_FILE.exists():
        return DEVICE_FILE.read_text().strip()

    # Generate new device id
    device_id = str(uuid.uuid4())

    # Save it
    DEVICE_FILE.write_text(device_id)

    return device_id