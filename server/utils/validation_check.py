from PIL import Image
from io import BytesIO
max_image_size = 50*1024*1024
max_dimension = 2048
allowed_formats = ['JPEG', 'PNG', 'WEBP' ,'JPG','HEIC','HEIF']

def validate_images(uploaded_file):
    """Validate image size, dimensions, and format"""
    if uploaded_file.size > max_image_size:
        raise ValueError(f"Image to large. Exceeding the capacity of 5mb")
    try:
        uploaded_file.seek(0)
        img = Image.open(uploaded_file)
        if img.format not in allowed_formats:
            raise ValueError("Invalid Image format")
        width , height = img.size
        if width > max_dimension or height > max_dimension:
            raise ValueError(f"Image to Large. Max dimension {max_dimension}px")
        uploaded_file.seek(0)
    except Exception as e:
        raise ValueError(f"Invalid Image file: {str(e)}")
        
                                                                    