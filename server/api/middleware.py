from django.utils import timezone
from .models import User


class ExpiredUserCleanupMiddleware:
    """
    Middleware to delete users if their OTP has expired and they are still inactive.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Get the current time
        current_time = timezone.now()
        
        # Delete users whose OTP has expired and are still inactive
        expired_users = User.objects.filter(
            otp_expiration__isnull=False,
            otp_expiration__lt=current_time,
            is_active=False
        )

        
        if expired_users.exists():
            print(f"Deleting {expired_users.count()} expired inactive users...")
            expired_users.delete()
        
        response = self.get_response(request)
        return response
    