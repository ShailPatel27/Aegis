"""
Supabase Client
"""

from supabase import create_client, Client
from config.settings import settings


class SupabaseClient:
    """Supabase client wrapper"""

    def __init__(self):
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("Supabase credentials not configured")

        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )

    def get_client(self) -> Client:
        """Return supabase client"""
        return self.client


# Global instance
supabase_client = SupabaseClient()
supabase = supabase_client.get_client()