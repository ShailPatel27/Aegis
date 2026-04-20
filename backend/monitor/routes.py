from collections import Counter, defaultdict
import asyncio
import base64
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import re
import threading
from typing import Dict, List, Optional
from urllib.parse import urlparse, unquote
from uuid import uuid4

import aiosmtplib
from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
import requests

from auth.dependencies import get_current_user
from config.settings import settings
from database.supabase import supabase

router = APIRouter(tags=["Monitor"])
_ANALYTICS_TABLE_AVAILABLE: Optional[bool] = None

AI_ALERT_TYPES = [
    "intrusion",
    "crowd",
    "vehicle",
    "threat",
    "motion",
    "loiter",
    "emergency",
    "face_detected",
    "unknown_face",
    "system_error",
]

DEFAULT_FACE_VECTOR_DIM = 9216


class FaceCreatePayload(BaseModel):
    name: str
    role: Optional[str] = "user"
    image_url: Optional[str] = None
    embedding: Optional[List[float]] = None
    apply_to_all: Optional[bool] = True
    camera_ids: Optional[List[str]] = None


class AlertCreatePayload(BaseModel):
    camera_id: str
    alert_type: str
    message: Optional[str] = None
    confidence: Optional[float] = None
    image_url: Optional[str] = None
    metadata: Optional[Dict] = None
    face_name: Optional[str] = None


class AnalyticsIngestPayload(BaseModel):
    camera_id: str
    total_detections: int = 0
    people_detected: int = 0
    unique_people_entries: int = 0
    recognized_faces: int = 0
    unknown_faces: int = 0
    timestamp: Optional[str] = None


class MonitorSettingsPayload(BaseModel):
    push_notifications: Optional[bool] = None
    email_alerts: Optional[bool] = None
    notify_email: Optional[str] = None


def _normalize_embedding(values: Optional[List[float]]) -> List[float]:
    if not isinstance(values, list):
        return [0.0] * DEFAULT_FACE_VECTOR_DIM
    casted = []
    for v in values:
        try:
            casted.append(float(v))
        except Exception:
            casted.append(0.0)
    if len(casted) < DEFAULT_FACE_VECTOR_DIM:
        casted.extend([0.0] * (DEFAULT_FACE_VECTOR_DIM - len(casted)))
    if len(casted) > DEFAULT_FACE_VECTOR_DIM:
        casted = casted[:DEFAULT_FACE_VECTOR_DIM]
    return casted


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts.astimezone(timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)
    except Exception:
        return None


def _severity_for_alert(alert_type: str, confidence: Optional[float]) -> str:
    high_types = {"threat", "emergency", "system_error"}
    medium_types = {"unknown_face", "intrusion", "crowd"}
    if alert_type in high_types:
        return "high"
    if alert_type in medium_types:
        return "medium"
    if confidence is not None and confidence >= 0.9:
        return "high"
    if confidence is not None and confidence >= 0.7:
        return "medium"
    return "low"


def _status_from_flags(alert_row: dict) -> str:
    acknowledged = bool(alert_row.get("acknowledged", False))
    processed = bool(alert_row.get("processed", False))
    if processed:
        return "resolved"
    if acknowledged:
        return "dismissed"
    return "active"


def _safe_name(value: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9_-]+", "_", value or "").strip("_")
    return clean or "user"


def _decode_data_url_image(data_url: Optional[str]) -> Optional[bytes]:
    if not data_url or not isinstance(data_url, str):
        return None
    if not data_url.startswith("data:image"):
        return None
    try:
        _, b64 = data_url.split(",", 1)
        return base64.b64decode(b64)
    except Exception:
        return None


def _upload_face_image_for_camera(camera_id: str, name: str, image_bytes: Optional[bytes]) -> Optional[str]:
    if not image_bytes:
        return None
    object_path = f"users/{_safe_name(name)}_{int(datetime.utcnow().timestamp() * 1000)}_{uuid4().hex[:8]}.jpg"
    storage = supabase.storage.from_(camera_id)
    try:
        storage.upload(
            path=object_path,
            file=image_bytes,
            file_options={"content-type": "image/jpeg", "upsert": "true"},
        )
    except TypeError:
        storage.upload(object_path, image_bytes)
    public_result = storage.get_public_url(object_path)
    if isinstance(public_result, str):
        return public_result
    if isinstance(public_result, dict):
        if isinstance(public_result.get("publicURL"), str):
            return public_result["publicURL"]
        data = public_result.get("data")
        if isinstance(data, dict) and isinstance(data.get("publicUrl"), str):
            return data["publicUrl"]
    return None


def _get_profile_json(user_id: str) -> dict:
    rows = (
        supabase.table("profiles")
        .select("user_id,profile_data_json")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        return {}
    data = rows[0].get("profile_data_json")
    return data if isinstance(data, dict) else {}


def _upsert_profile_json(user_id: str, profile_json: dict):
    now = datetime.utcnow().isoformat()
    existing = (
        supabase.table("profiles")
        .select("user_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    ).data or []
    if existing:
        supabase.table("profiles").update({"profile_data_json": profile_json, "updated_at": now}).eq("user_id", user_id).execute()
    else:
        supabase.table("profiles").insert(
            {
                "user_id": user_id,
                "profile_data_json": profile_json,
                "created_at": now,
                "updated_at": now,
            }
        ).execute()


def _extract_storage_path_from_public_url(image_url: Optional[str], bucket: str) -> Optional[str]:
    if not image_url or not isinstance(image_url, str):
        return None
    try:
        parsed = urlparse(image_url)
        marker = f"/storage/v1/object/public/{bucket}/"
        idx = parsed.path.find(marker)
        if idx < 0:
            return None
        return unquote(parsed.path[idx + len(marker):])
    except Exception:
        return None


def _delete_storage_image(camera_id: Optional[str], image_url: Optional[str]):
    if not camera_id or not image_url:
        return
    object_path = _extract_storage_path_from_public_url(image_url, str(camera_id))
    if not object_path:
        return
    try:
        supabase.storage.from_(str(camera_id)).remove([object_path])
    except Exception:
        pass


def _get_monitor_settings(user_id: str, default_email: Optional[str] = None) -> dict:
    profile_json = _get_profile_json(user_id)
    monitor_settings = profile_json.get("monitor_settings")
    if not isinstance(monitor_settings, dict):
        monitor_settings = {}
    out = {
        "push_notifications": bool(monitor_settings.get("push_notifications", True)),
        "email_alerts": bool(monitor_settings.get("email_alerts", True)),
        "notify_email": str(monitor_settings.get("notify_email") or default_email or "").strip(),
    }
    return out


def _download_image_bytes(url: Optional[str]) -> Optional[bytes]:
    if not url:
        return None
    try:
        resp = requests.get(url, timeout=10)
        if resp.ok and resp.content:
            return resp.content
    except Exception:
        return None
    return None


def _format_alert_time(value: Optional[str]) -> str:
    dt = _parse_iso(value)
    if not dt:
        return str(value or "N/A")
    # Human-readable timestamp with timezone abbreviation.
    return dt.astimezone().strftime("%b %d, %Y %I:%M:%S %p %Z")


def _send_alert_email_worker(
    *,
    to_email: str,
    alert_type: str,
    severity: str,
    camera_name: str,
    occurred_at: str,
    message: str,
    image_url: Optional[str],
):
    if not to_email:
        return
    if not settings.USER_EMAIL or not settings.USER_PASS:
        return

    subject = f"[AEGIS] {severity.upper()} Alert: {alert_type.replace('_', ' ').title()}"
    pretty_time = _format_alert_time(occurred_at)
    body_text = (
        f"AEGIS detected a {severity.upper()} alert.\n\n"
        f"Alert: {alert_type}\n"
        f"Camera: {camera_name}\n"
        f"Time: {pretty_time}\n"
        f"Message: {message}\n"
        f"Screenshot URL: {image_url or 'N/A'}\n"
    )
    body_html = f"""
    <html>
      <body>
        <h2>AEGIS Alert Notification</h2>
        <p><b>Severity:</b> {severity.upper()}</p>
        <p><b>Alert:</b> {alert_type}</p>
        <p><b>Camera:</b> {camera_name}</p>
        <p><b>Time:</b> {pretty_time}</p>
        <p><b>Message:</b> {message}</p>
        <p><b>Screenshot:</b> {image_url or 'N/A'}</p>
      </body>
    </html>
    """

    msg = EmailMessage()
    msg["From"] = settings.USER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body_text)
    msg.add_alternative(body_html, subtype="html")

    img_bytes = _download_image_bytes(image_url)
    if img_bytes:
        msg.add_attachment(
            img_bytes,
            maintype="image",
            subtype="jpeg",
            filename=f"aegis_alert_{int(datetime.utcnow().timestamp())}.jpg",
        )

    try:
        asyncio.run(
            aiosmtplib.send(
                msg,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                start_tls=True,
                username=settings.USER_EMAIL,
                password=settings.USER_PASS,
            )
        )
    except Exception:
        pass


def _rollup_deleted_alerts(user_id: str, rows: List[dict]):
    if not rows:
        return
    profile_json = _get_profile_json(user_id)
    analytics_rollup = profile_json.get("analytics_rollup")
    if not isinstance(analytics_rollup, dict):
        analytics_rollup = {}

    for row in rows:
        ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at")) or datetime.now(timezone.utc)
        day = ts.date().isoformat()
        bucket = analytics_rollup.get(day)
        if not isinstance(bucket, dict):
            bucket = {
                "detections": 0,
                "recognized": 0,
                "unknown": 0,
                "active_alerts": 0,
                "type_counts": {},
                "severity_counts": {"high": 0, "medium": 0, "low": 0},
                "camera_detection_count": {},
                "camera_alert_count": {},
            }

        alert_type = str(row.get("alert_type") or "system_error")
        severity = _severity_for_alert(alert_type, row.get("confidence"))
        cid = str(row.get("camera_id") or "")

        bucket["detections"] = int(bucket.get("detections", 0)) + 1
        if alert_type == "face_detected":
            bucket["recognized"] = int(bucket.get("recognized", 0)) + 1
        if alert_type == "unknown_face":
            bucket["unknown"] = int(bucket.get("unknown", 0)) + 1
        if _status_from_flags(row) == "active":
            bucket["active_alerts"] = int(bucket.get("active_alerts", 0)) + 1

        type_counts = bucket.get("type_counts") if isinstance(bucket.get("type_counts"), dict) else {}
        type_counts[alert_type] = int(type_counts.get(alert_type, 0)) + 1
        bucket["type_counts"] = type_counts

        severity_counts = bucket.get("severity_counts") if isinstance(bucket.get("severity_counts"), dict) else {"high": 0, "medium": 0, "low": 0}
        severity_counts[severity] = int(severity_counts.get(severity, 0)) + 1
        bucket["severity_counts"] = severity_counts

        if cid:
            camera_detection = bucket.get("camera_detection_count") if isinstance(bucket.get("camera_detection_count"), dict) else {}
            camera_alert = bucket.get("camera_alert_count") if isinstance(bucket.get("camera_alert_count"), dict) else {}
            camera_detection[cid] = int(camera_detection.get(cid, 0)) + 1
            if severity in {"high", "medium"}:
                camera_alert[cid] = int(camera_alert.get(cid, 0)) + 1
            bucket["camera_detection_count"] = camera_detection
            bucket["camera_alert_count"] = camera_alert

        analytics_rollup[day] = bucket

    profile_json["analytics_rollup"] = analytics_rollup
    _upsert_profile_json(user_id, profile_json)


def _apply_alert_retention(user_id: str):
    rows = _fetch_alerts_for_user(user_id, limit=2000)
    if not rows:
        return
    now = datetime.now(timezone.utc)

    # 0) Face-related alerts older than 12h are removed.
    face_delete_rows = []
    for row in rows:
        row_ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        if not row_ts or now - row_ts < timedelta(hours=12):
            continue
        alert_type = str(row.get("alert_type") or "")
        message = str(row.get("message") or "")
        is_face_related = alert_type in {"face_detected", "unknown_face"} or (
            alert_type == "threat" and "blacklisted person detected" in message.lower()
        )
        if is_face_related:
            face_delete_rows.append(row)

    if face_delete_rows:
        _rollup_deleted_alerts(user_id, face_delete_rows)
        for row in face_delete_rows:
            _delete_storage_image(row.get("camera_id"), row.get("image_url"))
            try:
                supabase.table("alerts").delete().eq("id", row.get("id")).execute()
            except Exception:
                pass
        existing_ids = {str(r.get("id")) for r in face_delete_rows}
        rows = [r for r in rows if str(r.get("id")) not in existing_ids]

    # 1) Auto-dismiss low severity active alerts older than 24h and remove their image.
    for row in rows:
        if _status_from_flags(row) != "active":
            continue
        row_ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        if not row_ts:
            continue
        if now - row_ts < timedelta(hours=24):
            continue
        severity = _severity_for_alert(str(row.get("alert_type") or "system_error"), row.get("confidence"))
        if severity != "low":
            continue
        _delete_storage_image(row.get("camera_id"), row.get("image_url"))
        try:
            supabase.table("alerts").update({"acknowledged": True, "processed": False, "image_url": None}).eq("id", row.get("id")).execute()
        except Exception:
            pass

    # 2) Delete dismissed/resolved older than 5 min, but archive counts first for analytics.
    to_delete = []
    for row in rows:
        alert_type = str(row.get("alert_type") or "")
        message = str(row.get("message") or "")
        is_face_related = alert_type in {"face_detected", "unknown_face"} or (
            alert_type == "threat" and "blacklisted person detected" in message.lower()
        )
        # Face-related alerts must follow 12h retention policy above only.
        if is_face_related:
            continue
        status = _status_from_flags(row)
        if status not in {"dismissed", "resolved"}:
            continue
        row_ts = (
            _parse_iso(row.get("resolved_at"))
            or _parse_iso(row.get("acknowledged_at"))
            or _parse_iso(row.get("timestamp"))
            or _parse_iso(row.get("created_at"))
        )
        if not row_ts:
            continue
        if now - row_ts >= timedelta(minutes=5):
            to_delete.append(row)

    if to_delete:
        _rollup_deleted_alerts(user_id, to_delete)
        for row in to_delete:
            _delete_storage_image(row.get("camera_id"), row.get("image_url"))
            try:
                supabase.table("alerts").delete().eq("id", row.get("id")).execute()
            except Exception:
                pass


def _load_rollup(user_id: str) -> dict:
    profile_json = _get_profile_json(user_id)
    rollup = profile_json.get("analytics_rollup")
    return rollup if isinstance(rollup, dict) else {}


def _load_metrics(user_id: str) -> dict:
    global _ANALYTICS_TABLE_AVAILABLE
    if _ANALYTICS_TABLE_AVAILABLE is not False:
        try:
            rows = (
                supabase.table("analytics_daily")
                .select("*")
                .eq("user_id", user_id)
                .limit(3650)
                .execute()
            ).data or []
            _ANALYTICS_TABLE_AVAILABLE = True
            metrics = {}
            for row in rows:
                day = str(row.get("day") or "")
                if not day:
                    continue
                metrics[day] = {
                    "total_detections": int(row.get("total_detections") or 0),
                    "people_detected": int(row.get("people_detected") or 0),
                    "unique_people_entries": int(row.get("unique_people_entries") or 0),
                    "recognized_faces": int(row.get("recognized_faces") or 0),
                    "unknown_faces": int(row.get("unknown_faces") or 0),
                    "camera_detection_count": row.get("camera_detection_count") if isinstance(row.get("camera_detection_count"), dict) else {},
                    "camera_people_count": row.get("camera_people_count") if isinstance(row.get("camera_people_count"), dict) else {},
                }
            return metrics
        except Exception:
            _ANALYTICS_TABLE_AVAILABLE = False

    profile_json = _get_profile_json(user_id)
    metrics = profile_json.get("analytics_metrics")
    return metrics if isinstance(metrics, dict) else {}


def _upsert_metrics_bucket(user_id: str, day: str, updates: dict) -> dict:
    global _ANALYTICS_TABLE_AVAILABLE
    if _ANALYTICS_TABLE_AVAILABLE is not False:
        try:
            rows = (
                supabase.table("analytics_daily")
                .select("*")
                .eq("user_id", user_id)
                .eq("day", day)
                .limit(1)
                .execute()
            ).data or []
            _ANALYTICS_TABLE_AVAILABLE = True
            row = rows[0] if rows else {}
            bucket = {
                "total_detections": int(row.get("total_detections") or 0),
                "people_detected": int(row.get("people_detected") or 0),
                "unique_people_entries": int(row.get("unique_people_entries") or 0),
                "recognized_faces": int(row.get("recognized_faces") or 0),
                "unknown_faces": int(row.get("unknown_faces") or 0),
                "camera_detection_count": row.get("camera_detection_count") if isinstance(row.get("camera_detection_count"), dict) else {},
                "camera_people_count": row.get("camera_people_count") if isinstance(row.get("camera_people_count"), dict) else {},
            }

            for key in ("total_detections", "people_detected", "unique_people_entries", "recognized_faces", "unknown_faces"):
                bucket[key] = int(bucket.get(key, 0)) + int(updates.get(key, 0))

            camera_id = str(updates.get("camera_id") or "")
            if camera_id:
                cam_det = bucket.get("camera_detection_count") if isinstance(bucket.get("camera_detection_count"), dict) else {}
                cam_people = bucket.get("camera_people_count") if isinstance(bucket.get("camera_people_count"), dict) else {}
                cam_det[camera_id] = int(cam_det.get(camera_id, 0)) + int(updates.get("total_detections", 0))
                cam_people[camera_id] = int(cam_people.get(camera_id, 0)) + int(updates.get("unique_people_entries", 0))
                bucket["camera_detection_count"] = cam_det
                bucket["camera_people_count"] = cam_people

            payload = {
                "user_id": user_id,
                "day": day,
                "total_detections": int(bucket["total_detections"]),
                "people_detected": int(bucket["people_detected"]),
                "unique_people_entries": int(bucket["unique_people_entries"]),
                "recognized_faces": int(bucket["recognized_faces"]),
                "unknown_faces": int(bucket["unknown_faces"]),
                "camera_detection_count": bucket["camera_detection_count"],
                "camera_people_count": bucket["camera_people_count"],
                "updated_at": datetime.utcnow().isoformat(),
            }

            if rows:
                (
                    supabase.table("analytics_daily")
                    .update(payload)
                    .eq("user_id", user_id)
                    .eq("day", day)
                    .execute()
                )
            else:
                payload["created_at"] = datetime.utcnow().isoformat()
                supabase.table("analytics_daily").insert(payload).execute()

            return bucket
        except Exception:
            _ANALYTICS_TABLE_AVAILABLE = False

    profile_json = _get_profile_json(user_id)
    metrics = profile_json.get("analytics_metrics")
    if not isinstance(metrics, dict):
        metrics = {}

    bucket = metrics.get(day)
    if not isinstance(bucket, dict):
        bucket = {
            "total_detections": 0,
            "people_detected": 0,
            "unique_people_entries": 0,
            "recognized_faces": 0,
            "unknown_faces": 0,
            "camera_detection_count": {},
            "camera_people_count": {},
        }

    for key in ("total_detections", "people_detected", "unique_people_entries", "recognized_faces", "unknown_faces"):
        bucket[key] = int(bucket.get(key, 0)) + int(updates.get(key, 0))

    camera_id = str(updates.get("camera_id") or "")
    if camera_id:
        cam_det = bucket.get("camera_detection_count")
        if not isinstance(cam_det, dict):
            cam_det = {}
        cam_people = bucket.get("camera_people_count")
        if not isinstance(cam_people, dict):
            cam_people = {}
        cam_det[camera_id] = int(cam_det.get(camera_id, 0)) + int(updates.get("total_detections", 0))
        cam_people[camera_id] = int(cam_people.get(camera_id, 0)) + int(updates.get("unique_people_entries", 0))
        bucket["camera_detection_count"] = cam_det
        bucket["camera_people_count"] = cam_people

    metrics[day] = bucket
    profile_json["analytics_metrics"] = metrics
    _upsert_profile_json(user_id, profile_json)
    return bucket


def _user_cameras(user_id: str) -> List[dict]:
    response = (
        supabase.table("cameras")
        .select("id,name,status,config")
        .eq("user_id", user_id)
        .execute()
    )
    return response.data or []


def _fetch_alerts_for_user(user_id: str, limit: int = 300) -> List[dict]:
    cameras = _user_cameras(user_id)
    camera_ids = [c.get("id") for c in cameras if c.get("id")]
    if not camera_ids:
        return []

    query = supabase.table("alerts").select("*").order("timestamp", desc=True).limit(limit)
    if len(camera_ids) == 1:
        query = query.eq("camera_id", camera_ids[0])
    else:
        query = query.in_("camera_id", camera_ids)
    response = query.execute()
    return response.data or []


@router.get("/alerts")
async def get_alerts(
    alert_type: str = Query(default="all"),
    status: str = Query(default="all"),
    camera_id: str = Query(default="all"),
    date: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    user=Depends(get_current_user),
):
    try:
        _apply_alert_retention(user["id"])
    except Exception:
        # Never block alerts endpoint on retention failures.
        pass
    cameras = _user_cameras(user["id"])
    camera_map = {c["id"]: c for c in cameras if c.get("id")}
    alerts = _fetch_alerts_for_user(user["id"], max(limit, 250))
    face_map = {}
    try:
        face_rows = (
            supabase.table("faces")
            .select("id,name")
            .eq("user_id", user["id"])
            .execute()
        ).data or []
        face_map = {f.get("id"): f.get("name") for f in face_rows if f.get("id")}
    except Exception:
        face_map = {}

    out = []
    for row in alerts:
        row_type = str(row.get("alert_type") or "system_error")
        row_status = _status_from_flags(row)
        row_camera_id = row.get("camera_id")
        row_ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        row_date = row_ts.date().isoformat() if row_ts else None
        confidence_val = row.get("confidence")
        confidence = float(confidence_val) if confidence_val is not None else None

        if alert_type != "all" and row_type != alert_type:
            continue
        if status != "all" and row_status != status:
            continue
        if camera_id != "all" and row_camera_id != camera_id:
            continue
        if date and row_date and row_date != date:
            continue
        if date and row_date is None:
            continue

        message = row.get("message") or ""
        subject_name = face_map.get(row.get("face_id"))
        if not subject_name and isinstance(message, str):
            m = re.search(r"(User detected|Blacklisted person detected):\s*([^\(\n\r]+)", message)
            if m:
                subject_name = m.group(2).strip()

        out.append(
            {
                "id": row.get("id"),
                "type": row_type,
                "camera_id": row_camera_id,
                "camera_name": (camera_map.get(row_camera_id) or {}).get("name", "Unknown Camera"),
                "timestamp": row.get("timestamp") or row.get("created_at"),
                "severity": _severity_for_alert(row_type, confidence),
                "confidence": confidence,
                "status": row_status,
                "message": message,
                "subject_name": subject_name,
                "image_url": row.get("image_url"),
                "metadata": row.get("metadata") or {},
            }
        )
        if len(out) >= limit:
            break

    status_rank = {"active": 0, "dismissed": 1, "resolved": 2}
    out.sort(
        key=lambda r: (
            status_rank.get(r.get("status"), 9),
            -(int((_parse_iso(r.get("timestamp")) or datetime.now(timezone.utc)).timestamp())),
        )
    )

    return {
        "success": True,
        "alerts": out,
        "types": AI_ALERT_TYPES,
        "cameras": [{"id": c.get("id"), "name": c.get("name")} for c in cameras],
    }


@router.post("/alerts")
async def create_alert(
    payload: AlertCreatePayload,
    user=Depends(get_current_user),
):
    if payload.alert_type not in AI_ALERT_TYPES:
        raise HTTPException(status_code=400, detail="Invalid alert_type")

    camera = (
        supabase.table("cameras")
        .select("id")
        .eq("id", payload.camera_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    ).data
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    face_id = None
    if payload.face_name:
        face_rows = (
            supabase.table("faces")
            .select("id")
            .eq("user_id", user["id"])
            .eq("name", payload.face_name)
            .limit(1)
            .execute()
        ).data or []
        if face_rows:
            face_id = face_rows[0].get("id")

    row = {
        "user_id": user["id"],
        "camera_id": payload.camera_id,
        "face_id": face_id,
        "confidence": payload.confidence,
        "image_url": payload.image_url,
        "alert_type": payload.alert_type,
        "message": payload.message,
        "processed": False,
        "acknowledged": False,
        "metadata": payload.metadata or {},
        "timestamp": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        response = supabase.table("alerts").insert(row).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to create alert: {exc}")

    data = response.data or []
    created = data[0] if data else None
    severity = _severity_for_alert(payload.alert_type, payload.confidence)
    if severity == "high":
        monitor_settings = _get_monitor_settings(user["id"], user.get("email"))
        push_on = bool(monitor_settings.get("push_notifications", True))
        email_on = bool(monitor_settings.get("email_alerts", True))
        notify_email = str(monitor_settings.get("notify_email") or user.get("email") or "").strip()
        if push_on and email_on and notify_email:
            cameras = (
                supabase.table("cameras")
                .select("id,name")
                .eq("id", payload.camera_id)
                .limit(1)
                .execute()
            ).data or []
            camera_name = cameras[0].get("name") if cameras else "Unknown Camera"
            alert_time = (created or {}).get("timestamp") or row["timestamp"]
            threading.Thread(
                target=_send_alert_email_worker,
                kwargs={
                    "to_email": notify_email,
                    "alert_type": payload.alert_type,
                    "severity": severity,
                    "camera_name": camera_name,
                    "occurred_at": str(alert_time),
                    "message": payload.message or "",
                    "image_url": payload.image_url,
                },
                daemon=True,
            ).start()
    return {"success": True, "alert": created}


@router.get("/settings")
async def get_monitor_settings(user=Depends(get_current_user)):
    return {
        "success": True,
        "settings": _get_monitor_settings(user["id"], user.get("email")),
    }


@router.patch("/settings")
async def update_monitor_settings(payload: MonitorSettingsPayload, user=Depends(get_current_user)):
    profile_json = _get_profile_json(user["id"])
    monitor_settings = profile_json.get("monitor_settings")
    if not isinstance(monitor_settings, dict):
        monitor_settings = {}

    if payload.push_notifications is not None:
        monitor_settings["push_notifications"] = bool(payload.push_notifications)
    if payload.email_alerts is not None:
        monitor_settings["email_alerts"] = bool(payload.email_alerts)
    if payload.notify_email is not None:
        monitor_settings["notify_email"] = str(payload.notify_email).strip()

    profile_json["monitor_settings"] = monitor_settings
    _upsert_profile_json(user["id"], profile_json)
    return {"success": True, "settings": _get_monitor_settings(user["id"], user.get("email"))}


@router.patch("/alerts/{alert_id}")
async def update_alert_status(
    alert_id: str,
    payload: Dict[str, str] = Body(...),
    user=Depends(get_current_user),
):
    status = (payload.get("status") or "").strip().lower()
    if status not in {"active", "resolved", "dismissed"}:
        raise HTTPException(status_code=400, detail="Invalid status")

    alerts = _fetch_alerts_for_user(user["id"], 500)
    target = next((a for a in alerts if a.get("id") == alert_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Alert not found")

    if status == "active":
        update = {"processed": False, "acknowledged": False, "resolved_at": None, "acknowledged_at": None}
    elif status == "resolved":
        update = {
            "processed": True,
            "acknowledged": True,
            "resolved_at": datetime.utcnow().isoformat(),
            "acknowledged_at": datetime.utcnow().isoformat(),
        }
    else:
        update = {
            "processed": False,
            "acknowledged": True,
            "acknowledged_at": datetime.utcnow().isoformat(),
        }

    supabase.table("alerts").update(update).eq("id", alert_id).execute()
    return {"success": True}


@router.get("/faces")
async def get_faces(
    limit: int = Query(default=200, ge=1, le=1000),
    user=Depends(get_current_user),
):
    faces_response = (
        supabase.table("faces")
        .select("id,name,role,image_url,created_at,updated_at")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    faces = faces_response.data or []
    face_ids = [f.get("id") for f in faces if f.get("id")]

    last_seen_map: Dict[str, Optional[str]] = {fid: None for fid in face_ids}
    seen_count_map: Dict[str, int] = defaultdict(int)
    if face_ids:
        alerts_query = supabase.table("alerts").select("face_id,timestamp,created_at").order("timestamp", desc=True).limit(1000)
        if len(face_ids) == 1:
            alerts_query = alerts_query.eq("face_id", face_ids[0])
        else:
            alerts_query = alerts_query.in_("face_id", face_ids)
        alert_rows = alerts_query.execute().data or []
        for row in alert_rows:
            fid = row.get("face_id")
            if not fid:
                continue
            seen_count_map[fid] += 1
            if last_seen_map.get(fid) is None:
                last_seen_map[fid] = row.get("timestamp") or row.get("created_at")

    return {
        "success": True,
        "faces": [
            {
                "id": f.get("id"),
                "name": f.get("name"),
                "role": f.get("role") or "user",
                "image_url": f.get("image_url"),
                "created_at": f.get("created_at"),
                "last_seen": last_seen_map.get(f.get("id")),
                "detection_count": int(seen_count_map.get(f.get("id"), 0)),
            }
            for f in faces
        ],
    }


@router.post("/faces")
async def create_face(
    payload: FaceCreatePayload,
    user=Depends(get_current_user),
):
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")

    role = (payload.role or "user").strip().lower() or "user"
    embedding_vals = _normalize_embedding(payload.embedding)
    cameras = _user_cameras(user["id"])
    camera_ids = [str(c.get("id")) for c in cameras if c.get("id")]

    if role == "blacklist":
        if payload.apply_to_all:
            target_camera_ids = camera_ids
        else:
            requested = [str(cid) for cid in (payload.camera_ids or [])]
            target_camera_ids = [cid for cid in requested if cid in camera_ids]
        if not target_camera_ids:
            raise HTTPException(status_code=400, detail="Select at least one camera for blacklist")
    else:
        target_camera_ids = camera_ids

    image_bytes = _decode_data_url_image(payload.image_url)
    uploaded_urls: Dict[str, str] = {}
    for cid in target_camera_ids:
        try:
            url = _upload_face_image_for_camera(cid, name, image_bytes)
            if url:
                uploaded_urls[cid] = url
        except Exception:
            continue
    resolved_image_url = next(iter(uploaded_urls.values()), None) or payload.image_url

    existing = (
        supabase.table("faces")
        .select("id,name")
        .eq("user_id", user["id"])
        .eq("name", name)
        .limit(1)
        .execute()
    ).data or []
    if existing:
        raise HTTPException(status_code=409, detail="User already exists")

    row = {
        "user_id": user["id"],
        "name": name,
        "role": role,
        "image_url": resolved_image_url,
        "embedding": embedding_vals,
        "updated_at": datetime.utcnow().isoformat(),
    }
    try:
        row["created_at"] = datetime.utcnow().isoformat()
        response = supabase.table("faces").insert(row).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to store face: {exc}")

    data = response.data or []
    saved_face = data[0] if data else None

    # Store blacklist scope metadata in profile json without requiring new tables.
    if saved_face and saved_face.get("id"):
        profile_json = _get_profile_json(user["id"])
        blacklist_targets = profile_json.get("blacklist_targets")
        if not isinstance(blacklist_targets, dict):
            blacklist_targets = {}
        blacklist_targets[str(saved_face["id"])] = {
            "apply_to_all": bool(payload.apply_to_all if role == "blacklist" else True),
            "camera_ids": target_camera_ids,
            "uploaded_urls": uploaded_urls,
            "updated_at": datetime.utcnow().isoformat(),
        }
        profile_json["blacklist_targets"] = blacklist_targets
        _upsert_profile_json(user["id"], profile_json)

    return {"success": True, "face": saved_face}


@router.delete("/faces/{face_id}")
async def delete_face(
    face_id: str,
    user=Depends(get_current_user),
):
    row = (
        supabase.table("faces")
        .select("id,image_url")
        .eq("id", face_id)
        .eq("user_id", user["id"])
        .limit(1)
        .execute()
    ).data or []
    if not row:
        raise HTTPException(status_code=404, detail="Face not found")
    face = row[0]

    # Remove image from all user camera buckets if path matches.
    cameras = _user_cameras(user["id"])
    for camera in cameras:
        _delete_storage_image(camera.get("id"), face.get("image_url"))

    supabase.table("faces").delete().eq("id", face_id).execute()

    profile_json = _get_profile_json(user["id"])
    blacklist_targets = profile_json.get("blacklist_targets")
    if isinstance(blacklist_targets, dict) and face_id in blacklist_targets:
        blacklist_targets.pop(face_id, None)
        profile_json["blacklist_targets"] = blacklist_targets
        _upsert_profile_json(user["id"], profile_json)

    return {"success": True}


@router.post("/analytics/ingest")
async def ingest_analytics(
    payload: AnalyticsIngestPayload,
    user=Depends(get_current_user),
):
    camera = (
        supabase.table("cameras")
        .select("id")
        .eq("id", payload.camera_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    ).data
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    ts = _parse_iso(payload.timestamp) if payload.timestamp else datetime.now(timezone.utc)
    if ts is None:
        ts = datetime.now(timezone.utc)
    day = ts.date().isoformat()

    bucket = _upsert_metrics_bucket(
        user["id"],
        day,
        {
            "camera_id": payload.camera_id,
            "total_detections": max(0, int(payload.total_detections)),
            "people_detected": max(0, int(payload.people_detected)),
            "unique_people_entries": max(0, int(payload.unique_people_entries)),
            "recognized_faces": max(0, int(payload.recognized_faces)),
            "unknown_faces": max(0, int(payload.unknown_faces)),
        },
    )

    return {"success": True, "day": day, "bucket": bucket}


@router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    try:
        _apply_alert_retention(user["id"])
    except Exception:
        pass
    now = datetime.now(timezone.utc)
    start_24h = now - timedelta(hours=24)
    start_24h_iso = start_24h.isoformat()

    cameras = _user_cameras(user["id"])
    alerts = _fetch_alerts_for_user(user["id"], 500)
    metrics = _load_metrics(user["id"])
    faces = (
        supabase.table("faces")
        .select("id")
        .eq("user_id", user["id"])
        .execute()
        .data
        or []
    )

    alerts_24h = []
    for row in alerts:
        ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        if ts and ts >= _parse_iso(start_24h_iso):
            alerts_24h.append(row)

    recent = []
    camera_map = {c.get("id"): c.get("name") for c in cameras if c.get("id")}
    for row in alerts[:8]:
        recent.append(
            {
                "id": row.get("id"),
                "type": row.get("alert_type"),
                "camera": camera_map.get(row.get("camera_id"), "Unknown Camera"),
                "timestamp": row.get("timestamp") or row.get("created_at"),
                "severity": _severity_for_alert(row.get("alert_type") or "", row.get("confidence")),
                "status": _status_from_flags(row),
            }
        )

    # Group by 4-hour windows for last 24h chart.
    buckets = []
    for i in range(6):
        slot_start = now - timedelta(hours=(24 - (i + 1) * 4))
        buckets.append({"label": slot_start.strftime("%H:%M"), "detections": 0})
    for row in alerts_24h:
        ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        if not ts:
            continue
        diff_h = (now - ts).total_seconds() / 3600.0
        idx = int(max(0, min(5, (24 - diff_h) // 4)))
        buckets[idx]["detections"] += 1

    today = now.date().isoformat()
    today_metrics = metrics.get(today) if isinstance(metrics.get(today), dict) else {}
    total_detections_today = int(today_metrics.get("total_detections", 0))
    total_activity_today = len(alerts_24h)
    people_detected_today = int(today_metrics.get("unique_people_entries", 0))

    return {
        "success": True,
        "stats": {
            "total_detections_today": total_detections_today,
            "total_activity_today": total_activity_today,
            "active_cameras": len([c for c in cameras if c.get("status") == "online"]),
            "alerts_triggered": len([a for a in alerts_24h if _status_from_flags(a) == "active"]),
            "recognized_faces": len(faces),
            "people_detected_today": people_detected_today,
        },
        "activity": buckets,
        "recent_alerts": recent,
        "cameras": [{"id": c.get("id"), "name": c.get("name")} for c in cameras],
    }


@router.get("/analytics")
async def get_analytics(
    days: int = Query(default=7, ge=1, le=90),
    user=Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    try:
        _apply_alert_retention(user["id"])
    except Exception:
        pass
    start = now - timedelta(days=days - 1)
    start_iso = start.isoformat()

    alerts = _fetch_alerts_for_user(user["id"], 3000)
    cameras = _user_cameras(user["id"])
    rollup = _load_rollup(user["id"])
    metrics = _load_metrics(user["id"])

    filtered = []
    for row in alerts:
        ts = _parse_iso(row.get("timestamp")) or _parse_iso(row.get("created_at"))
        if ts and ts >= _parse_iso(start_iso):
            filtered.append((row, ts))

    daily_counts = Counter()
    alerts_by_day_severity = defaultdict(lambda: {"high": 0, "medium": 0, "low": 0})
    type_counts = Counter()
    recognized = 0
    unknown = 0
    active_alerts = 0
    people_over_time_map = Counter()
    people_total = 0
    camera_detection_count = Counter()
    camera_alert_count = Counter()

    for row, ts in filtered:
        day = ts.date().isoformat()
        daily_counts[day] += 1
        alert_type = str(row.get("alert_type") or "system_error")
        type_counts[alert_type] += 1
        severity = _severity_for_alert(alert_type, row.get("confidence"))
        alerts_by_day_severity[day][severity] += 1
        if alert_type == "face_detected":
            recognized += 1
        if alert_type == "unknown_face":
            unknown += 1
        if _status_from_flags(row) == "active":
            active_alerts += 1
        cid = row.get("camera_id")
        if cid:
            camera_detection_count[cid] += 1
            if severity in {"high", "medium"}:
                camera_alert_count[cid] += 1

    # Merge archived/deleted alert counts.
    for i in range(days):
        day = (start + timedelta(days=i)).date().isoformat()
        bucket = rollup.get(day)
        if not isinstance(bucket, dict):
            continue
        daily_counts[day] += int(bucket.get("detections", 0))
        recognized += int(bucket.get("recognized", 0))
        unknown += int(bucket.get("unknown", 0))
        active_alerts += int(bucket.get("active_alerts", 0))

        sev = bucket.get("severity_counts") if isinstance(bucket.get("severity_counts"), dict) else {}
        alerts_by_day_severity[day]["high"] += int(sev.get("high", 0))
        alerts_by_day_severity[day]["medium"] += int(sev.get("medium", 0))
        alerts_by_day_severity[day]["low"] += int(sev.get("low", 0))

        tcounts = bucket.get("type_counts") if isinstance(bucket.get("type_counts"), dict) else {}
        for k, v in tcounts.items():
            type_counts[str(k)] += int(v)

        cdet = bucket.get("camera_detection_count") if isinstance(bucket.get("camera_detection_count"), dict) else {}
        for cid, v in cdet.items():
            camera_detection_count[str(cid)] += int(v)

        calert = bucket.get("camera_alert_count") if isinstance(bucket.get("camera_alert_count"), dict) else {}
        for cid, v in calert.items():
            camera_alert_count[str(cid)] += int(v)

    # Merge persistent analytics metrics (independent of alerts retention/deletions).
    for i in range(days):
        day = (start + timedelta(days=i)).date().isoformat()
        bucket = metrics.get(day)
        if not isinstance(bucket, dict):
            continue
        daily_counts[day] += int(bucket.get("total_detections", 0))
        unique_people = int(bucket.get("unique_people_entries", 0))
        people_over_time_map[day] += unique_people
        people_total += unique_people

        recognized += int(bucket.get("recognized_faces", 0))
        unknown += int(bucket.get("unknown_faces", 0))

        cam_det = bucket.get("camera_detection_count") if isinstance(bucket.get("camera_detection_count"), dict) else {}
        for cid, v in cam_det.items():
            camera_detection_count[str(cid)] += int(v)

    detection_over_time = []
    people_over_time = []
    alerts_per_day = []
    for i in range(days):
        day = (start + timedelta(days=i)).date().isoformat()
        detection_over_time.append({"date": day, "detections": int(daily_counts.get(day, 0))})
        people_over_time.append({"date": day, "people": int(people_over_time_map.get(day, 0))})
        sev = alerts_by_day_severity.get(day, {"high": 0, "medium": 0, "low": 0})
        alerts_per_day.append({"date": day, **sev})

    object_type_data = [{"type": k, "count": int(v)} for k, v in type_counts.items()]
    object_type_data.sort(key=lambda x: x["count"], reverse=True)

    face_total = recognized + unknown
    face_breakdown = [
        {"name": "Recognized", "value": recognized, "color": "#10b981"},
        {"name": "Unknown", "value": unknown, "color": "#f59e0b"},
    ]
    face_rate = (recognized / face_total * 100.0) if face_total else 0.0

    camera_performance = []
    for cam in cameras:
        cid = cam.get("id")
        camera_performance.append(
            {
                "camera": cam.get("name"),
                "uptime": "100%" if cam.get("status") == "online" else "0%",
                "detections": int(camera_detection_count.get(cid, 0)),
                "alerts": int(camera_alert_count.get(cid, 0)),
                "accuracy": "N/A",
            }
        )

    return {
        "success": True,
        "stats": {
            "total_detections": sum(daily_counts.values()),
            "total_people_detected": people_total,
            "face_recognition_rate": round(face_rate, 2),
            "active_alerts": active_alerts,
            "active_cameras": len([c for c in cameras if c.get("status") == "online"]),
        },
        "detection_over_time": detection_over_time,
        "people_over_time": people_over_time,
        "object_type_data": object_type_data,
        "face_recognition_data": face_breakdown,
        "alerts_per_day": alerts_per_day,
        "camera_performance": camera_performance,
    }
