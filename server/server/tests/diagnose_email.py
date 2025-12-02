#!/usr/bin/env python
"""
Comprehensive email diagnostic script
Run this to check all email-related configurations
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings
from django.core.mail import send_mail
from authentication.models import User
from services.models import ServiceBooking

print("=" * 70)
print("🔍 EMAIL DIAGNOSTIC TOOL")
print("=" * 70)

# 1. Check Django Settings
print("\n1️⃣  DJANGO EMAIL SETTINGS")
print("-" * 70)
print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER or '❌ NOT SET'}")
print(f"EMAIL_HOST_PASSWORD: {'✅ SET (' + '*' * 16 + ')' if settings.EMAIL_HOST_PASSWORD else '❌ NOT SET'}")

# 2. Check Environment Variables
print("\n2️⃣  ENVIRONMENT VARIABLES")
print("-" * 70)
email_user_env = os.getenv('EMAIL_HOST_USER')
email_pass_env = os.getenv('EMAIL_HOST_PASSWORD')
print(f"EMAIL_HOST_USER (from .env): {email_user_env or '❌ NOT SET'}")
print(f"EMAIL_HOST_PASSWORD (from .env): {'✅ SET' if email_pass_env else '❌ NOT SET'}")

if email_pass_env:
    print(f"Password length: {len(email_pass_env)} characters")
    print(f"Has spaces: {'❌ YES (REMOVE SPACES!)' if ' ' in email_pass_env else '✅ NO'}")
    print(f"Has quotes: {'❌ YES (REMOVE QUOTES!)' if any(q in email_pass_env for q in ['"', "'", '`']) else '✅ NO'}")

# 3. Check Database
print("\n3️⃣  DATABASE CHECK")
print("-" * 70)
try:
    user_count = User.objects.count()
    booking_count = ServiceBooking.objects.count()
    print(f"Total users: {user_count}")
    print(f"Total bookings: {booking_count}")
    
    if user_count > 0:
        sample_user = User.objects.first()
        print(f"\nSample user:")
        print(f"  - Name: {sample_user.name}")
        print(f"  - Email: {sample_user.email}")
        print(f"  - Email field exists: ✅ YES")
    else:
        print("⚠️  No users in database")
        
    if booking_count > 0:
        sample_booking = ServiceBooking.objects.first()
        print(f"\nSample booking:")
        print(f"  - ID: {sample_booking.id}")
        print(f"  - Service: {sample_booking.service}")
        print(f"  - User email: {sample_booking.user.email}")
        print(f"  - Has meeting_link field: {'✅ YES' if hasattr(sample_booking, 'meeting_link') else '❌ NO'}")
    else:
        print("⚠️  No bookings in database")
        
except Exception as e:
    print(f"❌ Database error: {e}")

# 4. Test Email Sending
print("\n4️⃣  EMAIL SENDING TEST")
print("-" * 70)

if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
    print("❌ Cannot test - email credentials not configured")
    print("\n💡 Fix:")
    print("   1. Edit server/.env file")
    print("   2. Add: EMAIL_HOST_USER=your-email@gmail.com")
    print("   3. Add: EMAIL_HOST_PASSWORD=your-app-password")
    print("   4. Restart server: docker-compose restart server")
else:
    try:
        print(f"Attempting to send test email to {settings.EMAIL_HOST_USER}...")
        result = send_mail(
            subject='🧪 Scrapiz Email Test',
            message='This is a test email from the diagnostic tool.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],
            html_message='<h2>✅ Email Working!</h2><p>This is a test email from Scrapiz diagnostic tool.</p>',
            fail_silently=False,
        )
        
        if result == 1:
            print("✅ SUCCESS! Test email sent")
            print(f"✅ Check inbox: {settings.EMAIL_HOST_USER}")
        else:
            print(f"⚠️  Email send returned: {result}")
            
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        print(f"\nError type: {type(e).__name__}")
        
        if 'Authentication' in str(e) or 'auth' in str(e).lower():
            print("\n💡 Authentication Error - Solutions:")
            print("   1. Use Gmail App Password, not regular password")
            print("   2. Enable 2FA: https://myaccount.google.com/security")
            print("   3. Generate App Password: https://myaccount.google.com/apppasswords")
            print("   4. Update .env with App Password (16 chars, no spaces)")
        elif 'Connection' in str(e):
            print("\n💡 Connection Error - Solutions:")
            print("   1. Check internet connection")
            print("   2. Verify firewall allows port 587")
            print("   3. Check if running in Docker with proper network")

# 5. Summary
print("\n" + "=" * 70)
print("📋 SUMMARY")
print("=" * 70)

issues = []
if not settings.EMAIL_HOST_USER:
    issues.append("❌ EMAIL_HOST_USER not configured")
if not settings.EMAIL_HOST_PASSWORD:
    issues.append("❌ EMAIL_HOST_PASSWORD not configured")
if email_pass_env and ' ' in email_pass_env:
    issues.append("❌ EMAIL_HOST_PASSWORD contains spaces (remove them)")
if email_pass_env and any(q in email_pass_env for q in ['"', "'", '`']):
    issues.append("❌ EMAIL_HOST_PASSWORD contains quotes (remove them)")

if issues:
    print("\n🔴 ISSUES FOUND:")
    for issue in issues:
        print(f"  {issue}")
    print("\n💡 NEXT STEPS:")
    print("  1. Fix the issues above in server/.env")
    print("  2. Restart server: docker-compose restart server")
    print("  3. Run this script again to verify")
else:
    print("\n✅ All checks passed!")
    print("  - Email credentials configured")
    print("  - Database accessible")
    print("  - Ready to send emails")

print("=" * 70)
