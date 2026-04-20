from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel

from auth.dependencies import get_current_user
from database.supabase import supabase

router = APIRouter(tags=["Monitor"])

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


class AlertCreatePayload(BaseModel):
    camera_id: str
    alert_type: str
    message: Optional[str] = None
    confidence: Optional[float] = None
    image_url: Optional[str] = None
    metadata: Optional[Dict] = None
    face_name: Optional[str] = None


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
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
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
    cameras = _user_cameras(user["id"])
    camera_map = {c["id"]: c for c in cameras if c.get("id")}
    alerts = _fetch_alerts_for_user(user["id"], max(limit, 250))

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
                "message": row.get("message") or "",
                "image_url": row.get("image_url"),
                "metadata": row.get("metadata") or {},
            }
        )
        if len(out) >= limit:
            break

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
    return {"success": True, "alert": data[0] if data else None}


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
        update = {"processed": False, "acknowledged": False}
    elif status == "resolved":
        update = {"processed": True, "acknowledged": True}
    else:
        update = {"processed": False, "acknowledged": True}

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

    role = (payload.role or "user").strip() or "user"
    embedding_vals = _normalize_embedding(payload.embedding)

    existing = (
        supabase.table("faces")
        .select("id")
        .eq("user_id", user["id"])
        .eq("name", name)
        .limit(1)
        .execute()
    ).data or []

    row = {
        "user_id": user["id"],
        "name": name,
        "role": role,
        "image_url": payload.image_url,
        "embedding": embedding_vals,
        "updated_at": datetime.utcnow().isoformat(),
    }
    try:
        if existing:
            face_id = existing[0]["id"]
            response = supabase.table("faces").update(row).eq("id", face_id).execute()
        else:
            row["created_at"] = datetime.utcnow().isoformat()
            response = supabase.table("faces").insert(row).execute()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to store face: {exc}")

    data = response.data or []
    return {"success": True, "face": data[0] if data else None}


@router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    start_24h = now - timedelta(hours=24)
    start_24h_iso = start_24h.isoformat()

    cameras = _user_cameras(user["id"])
    alerts = _fetch_alerts_for_user(user["id"], 500)
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

    return {
        "success": True,
        "stats": {
            "total_detections_today": len(alerts_24h),
            "active_cameras": len([c for c in cameras if c.get("status") == "online"]),
            "alerts_triggered": len([a for a in alerts_24h if _status_from_flags(a) == "active"]),
            "recognized_faces": len(faces),
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
    start = now - timedelta(days=days - 1)
    start_iso = start.isoformat()

    alerts = _fetch_alerts_for_user(user["id"], 3000)
    cameras = _user_cameras(user["id"])

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

    detection_over_time = []
    alerts_per_day = []
    for i in range(days):
        day = (start + timedelta(days=i)).date().isoformat()
        detection_over_time.append({"date": day, "detections": int(daily_counts.get(day, 0))})
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
            "face_recognition_rate": round(face_rate, 2),
            "active_alerts": active_alerts,
            "active_cameras": len([c for c in cameras if c.get("status") == "online"]),
        },
        "detection_over_time": detection_over_time,
        "object_type_data": object_type_data,
        "face_recognition_data": face_breakdown,
        "alerts_per_day": alerts_per_day,
        "camera_performance": camera_performance,
    }
