from fastapi import APIRouter, Depends, HTTPException, Query
from io import BytesIO
from typing import Optional
from uuid import uuid4
from datetime import datetime
import re
import time
from pydantic import BaseModel
from supabase import create_client

from auth.dependencies import get_current_user
from database.supabase import supabase
from camera.device import get_device_id
from config.settings import settings

router = APIRouter(tags=["Cameras"])

admin_supabase = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    try:
        admin_supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
    except Exception:
        admin_supabase = None

class CameraRegister(BaseModel):
    name: str
    selected_camera: int
    type: Optional[str] = "webcam"
    location: Optional[str] = None
    config: Optional[dict] = None


class CameraStreamToggle(BaseModel):
    enabled: bool

class CameraConfigUpdate(BaseModel):
    config: dict


def is_stream_enabled(camera: dict) -> bool:
    return camera.get("status") == "online"


def _bucket_name_from_camera_id(camera_id: str) -> str:
    name = (camera_id or "").strip().lower()
    return "".join(ch if (ch.isalnum() or ch in ("-", "_")) else "-" for ch in name).strip("-")


def _provision_camera_storage(camera_id: str) -> None:
    if admin_supabase is None:
        # Service-role client not configured; skip bucket provisioning.
        return

    bucket_name = _bucket_name_from_camera_id(camera_id)
    if not bucket_name:
        return

    storage = admin_supabase.storage

    try:
        storage.create_bucket(
            bucket_name,
            name=bucket_name,
            options={"public": True, "file_size_limit": 52428800},
        )
    except Exception as exc:
        # Ignore "already exists" and continue.
        if "exists" not in str(exc).lower():
            print(f"[camera-storage] bucket create failed for {bucket_name}: {exc}")
            return

    try:
        storage.from_(bucket_name).upload(
            "stream-chunks/_init.txt",
            BytesIO(b"stream-chunks initialized"),
            {"content-type": "application/octet-stream", "upsert": "true"},
        )
    except Exception as exc:
        # Folder marker is optional.
        print(f"[camera-storage] marker upload skipped for {bucket_name}: {exc}")


def _extract_chunk_timestamp(name: str) -> int:
    match = re.match(r"^chunk_(\d+)\.mp4$", name or "")
    if not match:
        return 0
    return int(match.group(1))


def _list_chunk_entries(storage, bucket_name: str):
    try:
        entries = storage.from_(bucket_name).list(
            "stream-chunks",
            {"limit": 500, "offset": 0, "sortBy": {"column": "name", "order": "desc"}},
        )
    except Exception:
        entries = []
    if not isinstance(entries, list):
        return []
    return [item for item in entries if isinstance(item, dict)]


def _latest_chunk_timestamp(storage, bucket_name: str) -> int:
    latest_ts = 0
    for item in _list_chunk_entries(storage, bucket_name):
        ts = _extract_chunk_timestamp(str(item.get("name") or ""))
        if ts > latest_ts:
            latest_ts = ts
    return latest_ts


def _is_chunk_stream_live(latest_ts: int, stale_after_seconds: int = 10) -> bool:
    if latest_ts <= 0:
        return False
    return (time.time() - latest_ts) < stale_after_seconds


def _public_or_signed_url(storage, bucket_name: str, chunk_path: str) -> Optional[str]:
    try:
        public_url = storage.from_(bucket_name).get_public_url(chunk_path)
        if isinstance(public_url, str):
            return public_url
        if isinstance(public_url, dict):
            return (
                public_url.get("publicURL")
                or public_url.get("publicUrl")
                or public_url.get("public_url")
            )
    except Exception:
        pass

    try:
        signed = storage.from_(bucket_name).create_signed_url(chunk_path, 60)
        if isinstance(signed, dict):
            url = signed.get("signedURL") or signed.get("signedUrl")
            if isinstance(url, str) and url.startswith("http"):
                return url
            if isinstance(url, str) and settings.SUPABASE_URL:
                return f"{settings.SUPABASE_URL}{url}"
    except Exception:
        pass
    return None

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
            "config": camera.config or {},
            "status": "online",
            "created_at": datetime.utcnow().isoformat(),
        }

        response = supabase.table("cameras").insert(data).execute()
        _provision_camera_storage(data["id"])

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

        rows = response.data if isinstance(response.data, list) else []
        storage_client = admin_supabase if admin_supabase is not None else supabase
        storage = storage_client.storage

        normalized = []
        for row in rows:
            camera = dict(row or {})
            camera_id = str(camera.get("id") or "")
            bucket_name = _bucket_name_from_camera_id(camera_id)
            latest_ts = _latest_chunk_timestamp(storage, bucket_name) if bucket_name else 0
            is_live = _is_chunk_stream_live(latest_ts, stale_after_seconds=10)

            # Display-only live state; do not mutate DB status from chunk polling.
            camera["stream_enabled"] = bool(is_live)
            camera["stream_live"] = bool(is_live)
            camera["latest_chunk_timestamp"] = latest_ts if latest_ts > 0 else None
            camera["chunk_age_seconds"] = (time.time() - latest_ts) if latest_ts > 0 else None
            normalized.append(camera)

        return normalized

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


@router.get("/{camera_id}/chunks/latest")
async def get_latest_chunks(
    camera_id: str,
    limit: int = Query(default=1, ge=1, le=20),
    user=Depends(get_current_user),
):
    try:
        camera_response = (
            supabase.table("cameras")
            .select("id,status")
            .eq("id", camera_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not camera_response.data:
            raise HTTPException(status_code=404, detail="Camera not found")

        bucket_name = _bucket_name_from_camera_id(camera_id)
        if not bucket_name:
            return {"success": True, "camera_id": camera_id, "chunks": []}

        storage_client = admin_supabase if admin_supabase is not None else supabase
        storage = storage_client.storage
        entries = _list_chunk_entries(storage, bucket_name)

        chunk_entries = []
        for item in entries:
            name = str(item.get("name") or "")
            ts = _extract_chunk_timestamp(name)
            if ts <= 0:
                continue
            chunk_entries.append((ts, name))

        chunk_entries.sort(key=lambda x: x[0], reverse=True)
        selected = chunk_entries[:limit]

        chunks = []
        for ts, name in selected:
            chunk_path = f"stream-chunks/{name}"
            url = _public_or_signed_url(storage, bucket_name, chunk_path)
            chunks.append(
                {
                    "name": name,
                    "path": chunk_path,
                    "timestamp": ts,
                    "url": url,
                }
            )

        latest_ts = chunk_entries[0][0] if chunk_entries else 0
        is_live = _is_chunk_stream_live(latest_ts, stale_after_seconds=10)

        return {
            "success": True,
            "camera_id": camera_id,
            "bucket": bucket_name,
            "chunks": chunks,
            "is_live": is_live,
            "latest_chunk_timestamp": latest_ts if latest_ts > 0 else None,
            "chunk_age_seconds": (time.time() - latest_ts) if latest_ts > 0 else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{camera_id}/config")
async def update_camera_config(
    camera_id: str,
    payload: CameraConfigUpdate,
    user=Depends(get_current_user),
):
    try:
        supabase.table("cameras") \
            .update({
                "config": payload.config,
                "updated_at": datetime.utcnow().isoformat(),
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
