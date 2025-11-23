#!/usr/bin/env python
"""
Diagnostic script to check booking system setup
Run this to see what's configured and what's missing
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.conf import settings
from services.models import ServiceBooking

def check_database_migration():
    """Check if meeting fields exist in database"""
    print("\n" + "=" * 60)
    print("DATABASE MIGRATION CHECK")
    print("=" * 60)
    
    try:
        # Try to access the fields
        booking = ServiceBooking.objects.first()
        if booking:
            has_meeting_link = hasattr(booking, 'meeting_link')
            has_meeting_event_id = hasattr(booking, 'meeting_event_id')
            
            print(f"✅ ServiceBooking model loaded")
            print(f"   - meeting_link field exists: {has_meeting_link}")
            print(f"   - meeting_event_id field exists: {has_meeting_event_id}")
            
            if has_meeting_link and has_meeting_event_id:
                print("\n✅ MIGRATION COMPLETE: Google Meet fields exist")
                return True
            else:
                print("\n❌ MIGRATION NEEDED: Google Meet fields missing")
                print("\n💡 Run this command:")
                print("   docker-compose exec backend python manage.py migrate services")
                return False
        else:
            print("⚠️  No bookings in database yet")
            print("   Create a test booking to verify fields")
            return None
            
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False

def check_google_calendar_config():
    """Check Google Calendar configuration"""
    print("\n" + "=" * 60)
    print("GOOGLE CALENDAR CONFIGURATION CHECK")
    print("=" * 60)
    
    has_file_setting = hasattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE')
    file_path = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
    calendar_id = getattr(settings, 'ADMIN_CALENDAR_ID', 'primary')
    
    print(f"GOOGLE_SERVICE_ACCOUNT_FILE setting exists: {has_file_setting}")
    print(f"GOOGLE_SERVICE_ACCOUNT_FILE value: {file_path}")
    print(f"ADMIN_CALENDAR_ID: {calendar_id}")
    
    if not file_path:
        print("\n❌ GOOGLE_SERVICE_ACCOUNT_FILE not set")
        print("\n💡 Add to .env:")
        print("   GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json")
        return False
    
    if not os.path.exists(file_path):
        print(f"\n❌ Credentials file not found: {file_path}")
        print("\n💡 Steps to fix:")
        print("   1. Download service account JSON from Google Cloud Console")
        print("   2. Place it at the path specified in .env")
        print("   3. Ensure file is readable by Django process")
        return False
    
    print(f"\n✅ Credentials file exists: {file_path}")
    
    # Try to load credentials
    try:
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(
            file_path,
            scopes=['https://www.googleapis.com/auth/calendar']
        )
        print("✅ Credentials loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to load credentials: {str(e)}")
        return False

def check_email_config():
    """Check email configuration"""
    print("\n" + "=" * 60)
    print("EMAIL CONFIGURATION CHECK")
    print("=" * 60)
    
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or 'NOT SET'}")
    print(f"EMAIL_HOST_PASSWORD: {'*' * 16 if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    
    if not settings.EMAIL_HOST_USER:
        print("\n❌ EMAIL_HOST_USER not set")
        print("\n💡 Add to .env:")
        print("   EMAIL_HOST_USER=your-email@gmail.com")
        return False
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("\n❌ EMAIL_HOST_PASSWORD not set")
        print("\n💡 Add to .env:")
        print("   EMAIL_HOST_PASSWORD=your-app-password")
        print("\n💡 For Gmail, use App Password:")
        print("   https://myaccount.google.com/apppasswords")
        return False
    
    print("\n✅ Email credentials configured")
    return True

def main():
    print("\n" + "=" * 60)
    print("BOOKING SYSTEM DIAGNOSTIC")
    print("=" * 60)
    
    migration_ok = check_database_migration()
    google_ok = check_google_calendar_config()
    email_ok = check_email_config()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    status_icon = lambda x: "✅" if x else "❌" if x is False else "⚠️ "
    
    print(f"{status_icon(migration_ok)} Database Migration: {'Complete' if migration_ok else 'Needed' if migration_ok is False else 'Unknown'}")
    print(f"{status_icon(google_ok)} Google Calendar: {'Configured' if google_ok else 'Not Configured'}")
    print(f"{status_icon(email_ok)} Email: {'Configured' if email_ok else 'Not Configured'}")
    
    print("\n" + "=" * 60)
    print("WHAT WILL WORK")
    print("=" * 60)
    
    print("✅ Booking creation: YES (always works)")
    print(f"{'✅' if google_ok and migration_ok else '❌'} Google Meet creation: {'YES' if google_ok and migration_ok else 'NO'}")
    print(f"{'✅' if email_ok else '❌'} Email notifications: {'YES' if email_ok else 'NO'}")
    
    if not all([migration_ok, google_ok, email_ok]):
        print("\n" + "=" * 60)
        print("NEXT STEPS")
        print("=" * 60)
        
        if migration_ok is False:
            print("\n1. Run database migration:")
            print("   docker-compose exec backend python manage.py migrate services")
        
        if not google_ok:
            print("\n2. Configure Google Calendar:")
            print("   - Set GOOGLE_SERVICE_ACCOUNT_FILE in .env")
            print("   - Place credentials JSON file on server")
            print("   - See GOOGLE_MEET_SETUP_CHECKLIST.md")
        
        if not email_ok:
            print("\n3. Configure email:")
            print("   - Set EMAIL_HOST_USER in .env")
            print("   - Set EMAIL_HOST_PASSWORD in .env (use App Password)")
            print("   - Run: python test_email.py")
        
        print("\n4. Restart server:")
        print("   docker-compose restart backend")

if __name__ == '__main__':
    main()
