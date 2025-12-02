#!/usr/bin/env python
"""
Test script to verify email configuration
Run this to test if emails are working
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email():
    print("=" * 50)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 50)
    
    # Check settings
    print(f"\n📧 Email Backend: {settings.EMAIL_BACKEND}")
    print(f"📧 Email Host: {settings.EMAIL_HOST}")
    print(f"📧 Email Port: {settings.EMAIL_PORT}")
    print(f"📧 Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"📧 Email User: {settings.EMAIL_HOST_USER}")
    print(f"📧 Email Password: {'*' * len(settings.EMAIL_HOST_PASSWORD) if settings.EMAIL_HOST_PASSWORD else 'NOT SET'}")
    
    if not settings.EMAIL_HOST_USER:
        print("\n❌ ERROR: EMAIL_HOST_USER is not set in .env file")
        return False
    
    if not settings.EMAIL_HOST_PASSWORD:
        print("\n❌ ERROR: EMAIL_HOST_PASSWORD is not set in .env file")
        return False
    
    # Try sending test email
    print("\n📤 Attempting to send test email...")
    
    try:
        result = send_mail(
            subject='Test Email from Scrapiz',
            message='This is a test email to verify email configuration.',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[settings.EMAIL_HOST_USER],  # Send to self
            fail_silently=False,
        )
        
        if result == 1:
            print("✅ SUCCESS! Test email sent successfully")
            print(f"✅ Check inbox: {settings.EMAIL_HOST_USER}")
            return True
        else:
            print(f"⚠️  WARNING: send_mail returned {result}")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: Failed to send email")
        print(f"❌ Error type: {type(e).__name__}")
        print(f"❌ Error message: {str(e)}")
        
        if "authentication" in str(e).lower():
            print("\n💡 SOLUTION:")
            print("   1. Make sure you're using an App Password, not your regular Gmail password")
            print("   2. Enable 2-Factor Authentication on your Gmail account")
            print("   3. Generate an App Password: https://myaccount.google.com/apppasswords")
            print("   4. Update EMAIL_HOST_PASSWORD in .env with the App Password")
        
        return False

if __name__ == '__main__':
    test_email()
