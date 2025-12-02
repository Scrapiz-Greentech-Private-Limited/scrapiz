#!/usr/bin/env python
"""
Test booking email functionality
Creates a test booking and sends email
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings
from authentication.models import User
from services.models import ServiceBooking
from services.email_service import send_booking_confirmation_email

print("=" * 70)
print("🧪 BOOKING EMAIL TEST")
print("=" * 70)

# Check email configuration
if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
    print("\n❌ Email not configured!")
    print("Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env")
    sys.exit(1)

print(f"\n📧 Email Configuration:")
print(f"   From: {settings.EMAIL_HOST_USER}")
print(f"   Host: {settings.EMAIL_HOST}")
print(f"   Port: {settings.EMAIL_PORT}")

# Get or create test user
print(f"\n👤 Finding test user...")
try:
    user = User.objects.first()
    if not user:
        print("❌ No users found in database")
        print("Please create a user first or use the app to register")
        sys.exit(1)
    
    print(f"✅ Using user: {user.name} ({user.email})")
    
except Exception as e:
    print(f"❌ Error accessing database: {e}")
    sys.exit(1)

# Create test booking
print(f"\n📝 Creating test booking...")
try:
    # Calculate preferred datetime (tomorrow at 2 PM)
    tomorrow = datetime.now() + timedelta(days=1)
    preferred_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
    
    booking = ServiceBooking.objects.create(
        user=user,
        service="Test Service - Email Verification",
        name=user.name,
        phone="+1234567890",
        address="123 Test Street, Test City, TC 12345",
        preferred_datetime=preferred_time.isoformat(),
        notes="This is a test booking to verify email functionality",
        status='pending'
    )
    
    print(f"✅ Booking created:")
    print(f"   ID: {booking.id}")
    print(f"   Service: {booking.service}")
    print(f"   User: {booking.name}")
    print(f"   Email: {booking.user.email}")
    print(f"   Time: {booking.preferred_datetime}")
    
except Exception as e:
    print(f"❌ Error creating booking: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Send email
print(f"\n📧 Sending confirmation email...")
print(f"   To: {booking.user.email}")
print(f"   From: {settings.EMAIL_HOST_USER}")

try:
    result = send_booking_confirmation_email(booking)
    
    if result:
        print("\n" + "=" * 70)
        print("✅ SUCCESS!")
        print("=" * 70)
        print(f"✅ Email sent to: {booking.user.email}")
        print(f"✅ Check the inbox (and spam folder)")
        print("\n💡 If you don't see the email:")
        print("   1. Check spam/junk folder")
        print("   2. Verify the email address is correct")
        print("   3. Check Gmail for security alerts")
        print("   4. Run: docker-compose logs server | grep '📧'")
    else:
        print("\n" + "=" * 70)
        print("⚠️  Email function returned False")
        print("=" * 70)
        print("Check the logs above for error details")
        
except Exception as e:
    print("\n" + "=" * 70)
    print("❌ ERROR SENDING EMAIL")
    print("=" * 70)
    print(f"Error: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    
    if 'Authentication' in str(e) or 'auth' in str(e).lower():
        print("\n💡 Authentication Error:")
        print("   1. Use Gmail App Password, not regular password")
        print("   2. Enable 2FA: https://myaccount.google.com/security")
        print("   3. Generate App Password: https://myaccount.google.com/apppasswords")
        print("   4. Update .env: EMAIL_HOST_PASSWORD=your-app-password")
        print("   5. Restart: docker-compose restart server")

# Cleanup
print(f"\n🧹 Cleaning up test booking...")
try:
    booking.delete()
    print("✅ Test booking deleted")
except:
    print("⚠️  Could not delete test booking")

print("\n" + "=" * 70)
print("Test complete!")
print("=" * 70)
