from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DEBUG = False

ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '0.0.0.0', 
    '192.168.0.107',
    "15.206.44.215"
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    'http://192.168.0.107:8081'
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    'http://192.168.0.107:8081'
]

CORS_ALLOW_CREDENTIALS = True

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'storages',
    'authentication',
    'inventory',
    'user',
    'services',
    'notifications',
    'waitlist',
    'rest_framework',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
STORAGES = {
    "default": {
        "BACKEND": "server.storages.MediaStorage",
    },
    "staticfiles": {
        "BACKEND": "server.storages.StaticStorage",
    },
}


ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        "DIRS": [
            BASE_DIR / "authentication" / "templates",
            BASE_DIR / "notifications" / "templates",
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'server.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ----------------------
# File Upload Configuration
# ----------------------
# Maximum size in bytes for request body (20MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB
# Maximum size for files uploaded via POST (20MB)
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB

# ----------------------
# AWS S3 Configuration
# ----------------------
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = 'scrapiz-inventory'
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME")  # e.g., ap-south-1
AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.ap-south-1.amazonaws.com'
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
AWS_S3_USE_SSL = True
AWS_S3_VERIFY = True

# Direct S3 backend without custom classes
STATICFILES_STORAGE = 'server.storages.StaticStorage'
DEFAULT_FILE_STORAGE = 'server.storages.MediaStorage'  
# Dummy local path just to satisfy Django
STATIC_ROOT = BASE_DIR / "staticfiles"

STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

#  Authentication
AUTH_USER_MODEL = 'authentication.User'

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}


# Session 24 hours
SESSION_COOKIE_AGE = 60 * 60 * 24  # 24 hours in seconds
SESSION_EXPIRE_AT_BROWSER_CLOSE = False


# Session 24 hours
SESSION_COOKIE_AGE = 60 * 60 * 24  # 24 hours in seconds
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# ----------------------
# Celery Configuration
# ----------------------
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 4 * 24 * 60 * 60  # 4 days (345,600 seconds)

# Resource optimization settings
CELERY_TASK_ACKS_LATE = True  # Acknowledge tasks after completion, not before
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Fetch one task at a time to reduce memory
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100  # Restart worker after 100 tasks to prevent memory leaks
CELERY_TASK_SOFT_TIME_LIMIT = 3 * 24 * 60 * 60  # Soft limit at 3 days (gives time to cleanup)
CELERY_RESULT_EXPIRES = 86400  # Results expire after 1 day to save Redis memory
CELERY_TASK_IGNORE_RESULT = False  # Keep results for monitoring
CELERY_TASK_STORE_ERRORS_EVEN_IF_IGNORED = True  # Store errors even if results ignored

# Celery Beat Schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
    'retry-failed-notifications': {
        'task': 'notifications.tasks.retry_failed_notifications_task',
        'schedule': 3600.0,  # Every hour (in seconds)
    },
    'four-day-failure-summary': {
        'task': 'notifications.tasks.send_daily_failure_summary_task',
        'schedule': 345600.0,  # Every 4 days (4 * 24 * 60 * 60 = 345,600 seconds)
    },
}

# ----------------------
# Supabase Configuration
# ----------------------
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# ----------------------
# Twilio Configuration
# ----------------------
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')

# ----------------------
# Notification Configuration
# ----------------------
NOTIFICATION_ENABLED = os.getenv('NOTIFICATION_ENABLED', 'true').lower() == 'true'
NOTIFICATION_CHANNELS = [ch.strip() for ch in os.getenv('NOTIFICATION_CHANNELS', 'email,whatsapp,dashboard').split(',')]
ADMIN_EMAILS = [email.strip() for email in os.getenv('ADMIN_EMAILS', '').split(',') if email.strip()]
ADMIN_WHATSAPP_NUMBERS = [num.strip() for num in os.getenv('ADMIN_WHATSAPP_NUMBERS', '').split(',') if num.strip()]
NOTIFICATION_MAX_RETRIES = int(os.getenv('NOTIFICATION_MAX_RETRIES', '3'))
NOTIFICATION_RETRY_DELAY = int(os.getenv('NOTIFICATION_RETRY_DELAY', '60'))
ADMIN_DASHBOARD_URL = os.getenv('ADMIN_DASHBOARD_URL', 'http://localhost:8000/admin/')

# Email from configuration
EMAIL_FROM_ADDRESS = os.getenv('EMAIL_FROM_ADDRESS', EMAIL_HOST_USER)
EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'Scrapiz Order System')
