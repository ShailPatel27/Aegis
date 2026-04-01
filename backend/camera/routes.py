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

@router.post("/register")
async def register_camera(
    camera: CameraRegister,
    user=Depends(get_current_user),
):
    try:
        device_id = get_device_id()

        data = {
            "id": str(uuid4()),
            "user_id": user["id"],
            "name": camera.name,
            "device_id": device_id,
            "selected_camera": camera.selected_camera,
            "type": camera.type,
            "location": camera.location,
            "status": "offline",
            "created_at": datetime.utcnow().isoformat(),
        }

        response = supabase.table("cameras").insert(data).execute()
        start_heartbeat(data["id"], user["id"])

        return {
            "success": True,
            "camera_id": data["id"],
            "camera": response.data,
        }

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

        return response.data

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