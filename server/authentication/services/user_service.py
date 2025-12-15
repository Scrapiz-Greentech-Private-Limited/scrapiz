"""
User Service for handling user creation and JWT token management.
"""

import uuid
import datetime
import jwt
from ..models import User


class UserService:
    """Service for user management operations."""
    
    @staticmethod
    def generate_session_id() -> str:
        """
        Generate a new unique session ID.
        
        Returns:
            str: A UUID4 string for session identification
        """
        return str(uuid.uuid4())
    
    @staticmethod
    def create_jwt_token(user_id: int, session_id: str) -> str:
        """
        Create a JWT token for authenticated user.
        
        Args:
            user_id: The user's database ID
            session_id: The session ID for this authentication
            
        Returns:
            str: Encoded JWT token
        """
        payload = {
            'id': user_id,
            'session_id': session_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }
        return jwt.encode(payload, 'secret', algorithm='HS256')
    
    @staticmethod
    def get_or_create_oauth_user(email: str, name: str) -> User:
        """
        Get existing user or create new OAuth user.
        
        Args:
            email: User's email address
            name: User's display name
            
        Returns:
            User: The existing or newly created user
        """
        user = User.objects.filter(email=email, is_deleted=False).first()
        
        if user:
            return user
        
        # Create new OAuth user with unusable password
        from ..utils import generate_referral_code
        user = User.objects.create(
            email=email,
            name=name,
            is_active=True,
            password='',
        )
        user.set_unusable_password()
        user.referral_code = generate_referral_code()
        user.save()
        return user
    
    @staticmethod
    def create_apple_oauth_user(
        apple_user_id: str,
        email: str = None,
        name: str = None
    ) -> User:
        """
        Create a new user for Apple OAuth authentication.
        
        Args:
            apple_user_id: Apple's unique user identifier (sub claim)
            email: User's email (may be Apple's private relay)
            name: User's display name
            
        Returns:
            User: Newly created user with unusable password and is_active=True
        """
        from ..utils import generate_referral_code
        
        user = User.objects.create(
            email=email or f"{apple_user_id}@privaterelay.appleid.com",
            name=name or 'Apple User',
            apple_user_id=apple_user_id,
            is_active=True,
            password='',
        )
        user.set_unusable_password()
        user.referral_code = generate_referral_code()
        user.save()
        return user
                 