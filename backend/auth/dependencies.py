from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.security import verify_token
from database.supabase import supabase

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = verify_token(token)

    response = supabase.table("users") \
        .select("*") \
        .eq("id", payload["user_id"]) \
        .single() \
        .execute()

    user = response.data

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user