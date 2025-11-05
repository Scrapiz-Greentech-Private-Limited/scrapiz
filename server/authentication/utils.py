"""
Utility functions for authentication and referral system.
"""
import string
import random
from django.db import transaction


def generate_referral_code():
    """
    Generate a unique 8-character alphanumeric referral code.
    Format: XXXX-XXXX for readability
    
    Returns:
        str: Unique referral code in format XXXX-XXXX
    """
    from authentication.models import User
    
    max_attempts = 100
    for _ in range(max_attempts):
        # Generate 8 random uppercase letters and digits
        code = ''.join(random.choices(
            string.ascii_uppercase + string.digits, 
            k=8
        ))
        # Format as XXXX-XXXX for readability
        formatted_code = f"{code[:4]}-{code[4:]}"
        
        # Check uniqueness
        if not User.objects.filter(referral_code=formatted_code).exists():
            return formatted_code
    
    # Fallback: if somehow we can't generate unique code after 100 attempts
    # Add timestamp to ensure uniqueness
    import time
    timestamp = str(int(time.time()))[-4:]
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{code}-{timestamp}"


def validate_promo_code(promo_code):
    """
    Validate if a promo code exists and return the referrer user.
    
    Args:
        promo_code (str): The promo code to validate
        
    Returns:
        User or None: The referrer user if valid, None otherwise
    """
    from authentication.models import User
    
    if not promo_code:
        return None
    
    try:
        referrer = User.objects.get(referral_code=promo_code)
        return referrer
    except User.DoesNotExist:
        return None


def link_referral(user, promo_code):
    """
    Link a new user to their referrer using a promo code.
    
    Args:
        user (User): The new user to link
        promo_code (str): The referrer's promo code
        
    Returns:
        bool: True if successfully linked, False otherwise
    """
    if not promo_code:
        return False
    
    referrer = validate_promo_code(promo_code)
    
    if referrer and referrer.id != user.id:  # Prevent self-referral
        user.referred_by = referrer
        user.save(update_fields=['referred_by'])
        return True
    
    return False


# Image Upload Utilities

def validate_profile_image(uploaded_file):
    """
    Validate profile image file size and format.
    
    Args:
        uploaded_file: Django UploadedFile object
        
    Raises:
        ValidationError: If file is invalid
    """
    from django.core.exceptions import ValidationError
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    if uploaded_file.size > max_size:
        raise ValidationError(
            f"File size exceeds maximum limit of 5MB. Your file is {uploaded_file.size / (1024 * 1024):.2f}MB."
        )
    
    # Validate file extension
    allowed_extensions = ['jpg', 'jpeg', 'png', 'webp']
    file_name = uploaded_file.name.lower()
    file_extension = file_name.split('.')[-1] if '.' in file_name else ''
    
    if file_extension not in allowed_extensions:
        raise ValidationError(
            f"Invalid file format. Allowed formats: {', '.join(allowed_extensions).upper()}"
        )
    
    # Validate MIME type
    allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp']
    content_type = uploaded_file.content_type
    
    if content_type not in allowed_mime_types:
        raise ValidationError(
            f"Invalid file type. File must be an image (JPEG, PNG, or WebP)."
        )


def delete_s3_file(file_url):
    """
    Delete a file from S3 storage given its URL.
    
    Args:
        file_url (str): Full URL of the file to delete
        
    Returns:
        bool: True if deletion successful, False otherwise
    """
    from django.core.files.storage import default_storage
    import logging
    
    logger = logging.getLogger(__name__)
    
    if not file_url:
        return False
    
    try:
        # Extract file path from URL
        # URL format: https://bucket.s3.region.amazonaws.com/path/to/file
        # or https://cloudfront.net/path/to/file
        # We need to extract the path part after the domain
        
        from urllib.parse import urlparse
        parsed_url = urlparse(file_url)
        
        # Get the path without leading slash
        file_path = parsed_url.path.lstrip('/')
        
        # Delete from S3
        if default_storage.exists(file_path):
            default_storage.delete(file_path)
            logger.info(f"Successfully deleted file: {file_path}")
            return True
        else:
            logger.warning(f"File not found in storage: {file_path}")
            return False
            
    except Exception as e:
        logger.error(f"Error deleting file from S3: {str(e)}")
        return False


def anonymize_user_account(user):
    """
    Anonymize user account data while preserving order history.
    
    This function removes all personal information from a user account
    while maintaining the account record for audit compliance and order history.
    
    Args:
        user (User): The user instance to anonymize
        
    Returns:
        None
        
    Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
    """
    import uuid
    from django.utils import timezone
    
    # Generate anonymous identifier
    anonymous_id = f"deleted_user_{uuid.uuid4().hex[:12]}"
    
    # Anonymize email (Requirement 4.1)
    user.email = f"{anonymous_id}@deleted.local"
    
    # Anonymize name (Requirement 4.6)
    user.name = "Deleted User"
    
    # Remove password hash (Requirement 4.2)
    user.password = "!"  # Unusable password marker
    
    # Remove phone number (Requirement 4.3)
    user.phone_number = None
    
    # Delete profile image from S3 if exists (Requirement 4.5)
    if user.profile_image:
        delete_s3_file(user.profile_image)
        user.profile_image = None
    
    # Clear OTP data
    user.otp = None
    user.otp_expiration = None
    
    # Clear session data
    user.session_id = None
    
    # Deactivate account
    user.is_active = False
    
    # Clear referral data
    user.referral_code = None
    user.referred_by = None
    user.referral_balance = 0
    user.has_completed_first_order = False
    
    # Mark as deleted with timestamp (Requirement 4.7)
    user.is_deleted = True
    user.deleted_at = timezone.now()
    
    # Save user changes
    user.save()
    
    # Delete all addresses associated with the user (Requirement 4.4)
    from user.models import AddressModel
    AddressModel.objects.filter(user=user).delete()
    
    # Note: Orders are preserved automatically through foreign key relationship


def send_deletion_confirmation_email(user_email, user_name):
    """
    Send confirmation email after account deletion.
    
    This function sends an enhanced confirmation email to the user
    after their account has been successfully deleted, including
    details about what was removed and what was preserved.
    
    Args:
        user_email (str): Email address to send confirmation to
        user_name (str): Name of the user for personalization
        
    Returns:
        bool: True if email sent successfully, False otherwise
        
    Requirements: 7.1, 7.2, 7.3
    """
    from django.core.mail import send_mail
    from django.template.loader import render_to_string
    from django.utils import timezone
    from django.conf import settings
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Get current timestamp for email (Requirement 7.2)
        deletion_timestamp = timezone.now()
        
        # Render email template with context
        html_message = render_to_string(
            'email/account_deleted_sucessful.html',
            {
                'name': user_name,
                'deletion_date': deletion_timestamp.strftime('%B %d, %Y'),
                'deletion_time': deletion_timestamp.strftime('%I:%M %p'),
            }
        )
        
        # Send email (Requirement 7.1)
        send_mail(
            subject='Account Deletion Confirmed',
            message=f'Your Scrapiz account has been successfully deleted on {deletion_timestamp.strftime("%B %d, %Y at %I:%M %p")}.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            html_message=html_message,
            fail_silently=True  # Handle email failures gracefully (Requirement 7.3)
        )
        
        logger.info(f"Deletion confirmation email sent to {user_email}")
        return True
        
    except Exception as e:
        # Log error but don't raise exception (graceful failure)
        logger.error(f"Failed to send deletion confirmation email to {user_email}: {str(e)}")
        return False
