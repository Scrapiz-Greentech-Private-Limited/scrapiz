"""
Utility functions for the application
"""
from django.core.exceptions import ValidationError


def validate_images(uploaded_file):
    """
    Validate image file size and format for order images.
    
    Args:
        uploaded_file: Django UploadedFile object
        
    Raises:
        ValidationError: If file is invalid
    """
    # Validate file size (max 10MB per image)
    max_size = 10 * 1024 * 1024  # 10MB in bytes
    if uploaded_file.size > max_size:
        raise ValidationError(
            f"Image size exceeds maximum limit of 10MB. Your file is {uploaded_file.size / (1024 * 1024):.2f}MB."
        )
    
    # Validate file extension
    allowed_extensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
    file_name = uploaded_file.name.lower()
    file_extension = file_name.split('.')[-1] if '.' in file_name else ''
    
    if file_extension not in allowed_extensions:
        raise ValidationError(
            f"Invalid file format. Allowed formats: {', '.join(allowed_extensions).upper()}"
        )
    
    # Validate MIME type
    allowed_mime_types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    content_type = uploaded_file.content_type
    
    if content_type and content_type not in allowed_mime_types:
        raise ValidationError(
            f"Invalid file type. File must be an image (JPEG, PNG, WEBP, or HEIC)."
        )
