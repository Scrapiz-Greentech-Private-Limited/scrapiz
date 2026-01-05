import os
import jwt
from dotenv import load_dotenv

from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed

from authentication.models import User, AdminUser

load_dotenv()


JWT_SECRET = getattr(settings, "SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"


def authenticate_request(request, need_user=False):
    """
    Authenticate incoming API request.

    - Validates frontend secret key
    - Validates JWT token
    - Always returns a REAL User model instance
    - Supports AdminUser and normal User tokens

    Args:
        request: DRF/Django request
        need_user (bool): Whether user object is required

    Returns:
        User instance or None

    Raises:
        AuthenticationFailed
    """


    frontend_secret = request.headers.get("x-auth-app")
    if not frontend_secret or frontend_secret != os.getenv("MY_FRONTEND_SECRET"):
        raise AuthenticationFailed("Invalid secret key!")

    if not need_user:
        return None


    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise AuthenticationFailed("Unauthenticated!")

    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        token = auth_header


    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token expired!")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Invalid token!")


    if "admin_id" in payload:
        try:
            admin = AdminUser.objects.get(id=payload["admin_id"], is_active=True)
        except AdminUser.DoesNotExist:
            raise AuthenticationFailed("Admin user not found!")

        user, _ = User.objects.get_or_create(
            email=admin.email,
            defaults={
                "name": admin.name,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )


        if not user.is_staff or not user.is_superuser:
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.save(update_fields=["is_staff", "is_superuser", "is_active"])

        return user


    user_id = payload.get("id")
    session_id = payload.get("session_id")

    if not user_id:
        raise AuthenticationFailed("Invalid token payload!")

    user = User.objects.filter(id=user_id, is_active=True).first()
    if not user:
        raise AuthenticationFailed("User not found!")


    if session_id and user.session_id != session_id:
        raise AuthenticationFailed("Session invalid - logged in from another device!")

    return user
