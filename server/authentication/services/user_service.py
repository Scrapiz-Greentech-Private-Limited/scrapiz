import uuid
import jwt
import datetime
from django.contrib.auth.hashers import make_password
from ..models import User


class UserService:
    """Service for handling user management operations"""
    
    @staticmethod
    def get_or_create_oauth_user(email, name):
        """
        Get existing user by email or create new OAuth user
        
        Args:
            email (str): User's email address
            name (str): User's full name
            
        Returns:
            User: Existing or newly created user instance
        """
        try:
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if user:
                # Return existing user
                return user
            
            # Create new OAuth user with unusable password
            user = User.objects.create(
                email=email,
                name=name,
                password=make_password(None),  # Unusable password for OAuth users
                is_active=True
            )
            
            return user
            
        except Exception as e:
            raise Exception(f'Failed to get or create user: {str(e)}')
    
    @staticmethod
    def generate_session_id():
        """
        Generate a unique session ID
        
        Returns:
            str: UUID session ID as string
        """
        return str(uuid.uuid4())
    
    @staticmethod
    def create_jwt_token(user_id, session_id):
        """
        Create JWT token for authenticated user
        
        Args:
            user_id (int): User's database ID
            session_id (str): User's session ID
            
        Returns:
            str: Encoded JWT token
        """
        payload = {
            'id': user_id,
            'session_id': session_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }
        
        token = jwt.encode(payload, 'secret', algorithm='HS256')
        return token
