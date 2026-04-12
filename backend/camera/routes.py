from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel

from auth.dependencies import get_current_user
from database.supabase import supabase
from camera.device import get_device_id
from camera.heartbeat import start_heartbeat

router = APIRouter(tags=["Cameras"])

class CameraRegister(BaseModel):
    name: str
    selected_camera: int
    type: Optional[str] = "webcam"
    location: Optional[str] = None


class CameraStreamToggle(BaseModel):
    enabled: bool


def is_stream_enabled(camera: dict) -> bool:
    return camera.get("status") == "online"

@router.post("/register")
async def register_camera(
    camera: CameraRegister,
    user=Depends(get_current_user),
):
    try:
        device_id = get_device_id()

        # Check for duplicate camera index on same device
        existing = supabase.table("cameras") \
            .select("id") \
            .eq("user_id", user["id"]) \
            .eq("selected_camera", camera.selected_camera) \
            .eq("device_id", device_id) \
            .execute()

        if existing.data:
            raise HTTPException(
                status_code=400,
                detail="A camera with this index is already registered on this device"
            )

        data = {
            "id": str(uuid4()),
            "user_id": user["id"],
            "name": camera.name,
            "device_id": device_id,
            "selected_camera": camera.selected_camera,
            "type": camera.type,
            "location": camera.location,
            "status": "online",
            "created_at": datetime.utcnow().isoformat(),
        }

        response = supabase.table("cameras").insert(data).execute()
        start_heartbeat(data["id"], user["id"])

        return {
            "success": True,
            "camera_id": data["id"],
            "camera": [
                {
                    **row,
                    "stream_enabled": is_stream_enabled(row),
                }
                for row in response.data
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def get_cameras(user=Depends(get_current_user)):
    try:
        response = (
            supabase.table("cameras")
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )

        return [
            {
                **row,
                "stream_enabled": is_stream_enabled(row),
            }
            for row in response.data
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{camera_id}")
async def delete_camera(camera_id: str, user=Depends(get_current_user)):
    try:
        supabase.table("cameras") \
            .delete() \
            .eq("id", camera_id) \
            .eq("user_id", user["id"]) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/heartbeat/{camera_id}")
async def camera_heartbeat(camera_id: str, user=Depends(get_current_user)):
    try:
        supabase.table("cameras") \
            .update({
                "status": "online",
                "last_seen": datetime.utcnow().isoformat()
            }) \
            .eq("id", camera_id) \
            .eq("user_id", user["id"]) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{camera_id}/stream")
async def set_camera_stream_state(
    camera_id: str,
    payload: CameraStreamToggle,
    user=Depends(get_current_user),
):
    try:
        supabase.table("cameras") \
            .update({
                "status": "online" if payload.enabled else "offline",
            }) \
            .eq("id", camera_id) \
            .eq("user_id", user["id"]) \
            .execute()

        camera_response = (
            supabase.table("cameras")
            .select("*")
            .eq("id", camera_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )

        if not camera_response.data:
            raise HTTPException(status_code=404, detail="Camera not found")

        return {
            "success": True,
            "camera": {
                **camera_response.data,
                "stream_enabled": is_stream_enabled(camera_response.data),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
