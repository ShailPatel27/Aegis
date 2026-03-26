"""
Database Models and Operations
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from config.settings import settings

class DatabaseManager:
    """Manages all database operations"""
    
    def __init__(self):
        self.users_db = {}
        self.verification_codes_db = {}
        self.profiles_db = {}
        self.tokens_db = {}  # Add token storage
        self.load_all_data()
    
    def load_all_data(self):
        """Load all database files"""
        self.load_users()
        self.load_verification_codes()
        self.load_profiles()
    
    def load_users(self):
        """Load users from file"""
        if os.path.exists(settings.USERS_DB_FILE):
            try:
                with open(settings.USERS_DB_FILE, 'r') as f:
                    self.users_db = json.load(f)
            except Exception as e:
                print(f"Error loading users: {e}")
                self.users_db = {}
        else:
            # Create default test user
            self.users_db = {
                "test@example.com": {
                    "id": "test-user-123",
                    "email": "test@example.com",
                    "name": "Test User",
                    "user_type": "monitor",
                    "hashed_password": self._hash_password("test123"),
                    "created_at": datetime.now().isoformat(),
                    "phone": None,
                    "recovery_email": None,
                    "alternate_contact": None,
                    "camera_id": None,
                    "email_verified": True,
                    "phone_verified": False
                }
            }
            self.save_users()
    
    def load_verification_codes(self):
        """Load verification codes from file"""
        if os.path.exists(settings.VERIFICATION_CODES_FILE):
            try:
                with open(settings.VERIFICATION_CODES_FILE, 'r') as f:
                    self.verification_codes_db = json.load(f)
            except Exception as e:
                print(f"Error loading verification codes: {e}")
                self.verification_codes_db = {}
        else:
            self.verification_codes_db = {}
    
    def load_profiles(self):
        """Load user profiles from file"""
        if os.path.exists(settings.PROFILES_DB_FILE):
            try:
                with open(settings.PROFILES_DB_FILE, 'r') as f:
                    self.profiles_db = json.load(f)
            except Exception as e:
                print(f"Error loading profiles: {e}")
                self.profiles_db = {}
        else:
            self.profiles_db = {}
    
    def save_users(self):
        """Save users to file"""
        try:
            with open(settings.USERS_DB_FILE, 'w') as f:
                json.dump(self.users_db, f, indent=2)
        except Exception as e:
            print(f"Error saving users: {e}")
    
    def save_verification_codes(self):
        """Save verification codes to file"""
        try:
            with open(settings.VERIFICATION_CODES_FILE, 'w') as f:
                json.dump(self.verification_codes_db, f, indent=2)
        except Exception as e:
            print(f"Error saving verification codes: {e}")
    
    def save_profiles(self):
        """Save profiles to file"""
        try:
            with open(settings.PROFILES_DB_FILE, 'w') as f:
                json.dump(self.profiles_db, f, indent=2)
        except Exception as e:
            print(f"Error saving profiles: {e}")
    
    def save_all_data(self):
        """Save all database files"""
        self.save_users()
        self.save_verification_codes()
        self.save_profiles()
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()
    
    # User operations
    def get_user(self, email: str) -> Optional[Dict]:
        """Get user by email"""
        return self.users_db.get(email.lower().strip())
    
    def create_user(self, email: str, user_data: Dict) -> bool:
        """Create new user"""
        email = email.lower().strip()
        if email in self.users_db:
            return False
        
        self.users_db[email] = user_data
        self.save_users()
        return True
    
    def update_user(self, email: str, updates: Dict) -> bool:
        """Update user data"""
        email = email.lower().strip()
        if email not in self.users_db:
            return False
        
        self.users_db[email].update(updates)
        self.save_users()
        return True
    
    def delete_user(self, email: str) -> bool:
        """Delete user"""
        email = email.lower().strip()
        if email not in self.users_db:
            return False
        
        del self.users_db[email]
        self.save_users()
        return True
    
    # Verification code operations
    def store_verification_code(self, email: str, code: str) -> bool:
        """Store verification code"""
        self.verification_codes_db[email] = {
            "code": code,
            "created_at": datetime.now().isoformat(),
            "attempts": 0
        }
        self.save_verification_codes()
        return True
    
    def get_verification_code(self, email: str) -> Optional[Dict]:
        """Get verification code"""
        return self.verification_codes_db.get(email)
    
    def delete_verification_code(self, email: str) -> bool:
        """Delete verification code"""
        if email in self.verification_codes_db:
            del self.verification_codes_db[email]
            self.save_verification_codes()
            return True
        return False
    
    # Profile operations
    def get_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile"""
        return self.profiles_db.get(user_id)
    
    def create_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Create user profile"""
        self.profiles_db[user_id] = profile_data
        self.save_profiles()
        return True
    
    def update_profile(self, user_id: str, updates: Dict) -> bool:
        """Update user profile"""
        if user_id not in self.profiles_db:
            return False
        
        self.profiles_db[user_id].update(updates)
        self.save_profiles()
        return True
    
    # Token operations
    def store_token(self, token: str, user_id: str) -> bool:
        """Store token with user_id"""
        self.tokens_db[token] = user_id
        return True
    
    def get_user_by_token(self, token: str) -> Optional[Dict]:
        """Get user by token"""
        user_id = self.tokens_db.get(token)
        if not user_id:
            return None
        
        # Find user by user_id
        for user in self.users_db.values():
            if user.get("id") == user_id:
                return user
        return None
    
    def delete_token(self, token: str) -> bool:
        """Delete token"""
        if token in self.tokens_db:
            del self.tokens_db[token]
            return True
        return False

# Global database instance
db = DatabaseManager()
