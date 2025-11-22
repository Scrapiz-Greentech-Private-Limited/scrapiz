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
    "15.206.44.215",
    "13.204.50.150",
    "api.scrapiz.in"
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    'http://192.168.0.107:8081',
    "https://scrapiz.in",
    "https://api.scrapiz.in"
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    'http://192.168.0.107:8081',
    "https://scrapiz.in",
    "https://api.scrapiz.in"
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
    'rest_framework',
    'notifications',
    'waitlist',
    'django_celery_beat'
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
        "DIRS": [BASE_DIR / "authentication" / "templates"],
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

# Dummy local path just to satisfy Django
STATIC_ROOT = BASE_DIR / "staticfiles"

STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

#  Authentication
AUTH_USER_MODEL = 'authentication.User'
GOOGLE_IOS_CLIENT_ID = os.getenv('GOOGLE_IOS_CLIENT_ID')
GOOGLE_ANDROID_CLIENT_ID = os.getenv('GOOGLE_ANDROID_CLIENT_ID')

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS':{
          "CLIENT_CLASS":"django_redis.client.DefaultClient",
        }
    }
}


# Session 24 hours
SESSION_COOKIE_AGE = 60 * 60 * 24  # 24 hours in seconds
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

USER_EMAIL_DELAY = int(os.getenv('USER_EMAIL_DELAY', '5'))
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'

CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 4 * 24 * 60 * 60  


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


SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')


TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_ACCOUNT_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER')



NOTIFICATION_ENABLED = os.getenv('NOTIFICATION_ENABLED', 'true').lower() == 'true'
NOTIFICATION_CHANNELS = [
    ch.strip() for ch in os.getenv('NOTIFICATION_CHANNELS', 'email,whatsapp,dashboard').split(',')
]


ADMIN_EMAILS = [
    email.strip() for email in 'abdulrahimmansuri1@gmail.com'.split(',') if email.strip()
]

DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024 
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024 

ADMIN_WHATSAPP_NUMBERS = [
    num.strip() for num in '+918689856448'.split(',') if num.strip()
]

NOTIFICATION_MAX_RETRIES = 3

NOTIFICATION_RETRY_DELAY = 60 

ADMIN_DASHBOARD_URL = 'https://api.scrapiz.in/admin/'

# ----------------------
# Push Notification Configuration
# ----------------------
PUSH_NOTIFICATION_ENABLED = os.getenv('PUSH_NOTIFICATION_ENABLED', 'true').lower() == 'true'
EXPO_ACCESS_TOKEN = os.getenv('EXPO_ACCESS_TOKEN')
PUSH_NOTIFICATION_BATCH_SIZE = int(os.getenv('PUSH_NOTIFICATION_BATCH_SIZE', '100'))
PUSH_NOTIFICATION_MAX_RETRIES = int(os.getenv('PUSH_NOTIFICATION_MAX_RETRIES', '3'))

# ----------------------
# Google Calendar/Meet Configuration
# ----------------------
GOOGLE_SERVICE_ACCOUNT_FILE = os.getenv('GOOGLE_SERVICE_ACCOUNT_FILE')
ADMIN_CALENDAR_ID = os.getenv('ADMIN_CALENDAR_ID', 'primary')