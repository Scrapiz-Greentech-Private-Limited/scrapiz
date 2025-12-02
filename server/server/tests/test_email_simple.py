#!/usr/bin/env python
"""
Simple email test script that can run in Docker
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load from environment
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')

print("=" * 60)
print("📧 EMAIL CONFIGURATION TEST")
print("=" * 60)
print(f"Email Host: {EMAIL_HOST}")
print(f"Email Port: {EMAIL_PORT}")
print(f"Email User: {EMAIL_HOST_USER}")
print(f"Email Password: {'*' * len(EMAIL_HOST_PASSWORD) if EMAIL_HOST_PASSWORD else 'NOT SET'}")
print("=" * 60)

if not EMAIL_HOST_USER:
    print("\n❌ ERROR: EMAIL_HOST_USER not set")
    print("Add to .env: EMAIL_HOST_USER=your-email@gmail.com")
    exit(1)

if not EMAIL_HOST_PASSWORD:
    print("\n❌ ERROR: EMAIL_HOST_PASSWORD not set")
    print("Add to .env: EMAIL_HOST_PASSWORD=your-app-password")
    exit(1)

try:
    print("\n🔄 Connecting to SMTP server...")
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Test Email from Scrapiz'
    msg['From'] = EMAIL_HOST_USER
    msg['To'] = EMAIL_HOST_USER
    
    text = "This is a test email to verify email configuration."
    html = """
    <html>
      <body>
        <h2>✅ Email Configuration Working!</h2>
        <p>This is a test email from Scrapiz backend.</p>
        <p>If you received this, your email configuration is correct.</p>
      </body>
    </html>
    """
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    msg.attach(part1)
    msg.attach(part2)
    
    # Connect and send
    server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
    server.set_debuglevel(1)  # Show SMTP conversation
    server.starttls()
    
    print(f"\n🔐 Authenticating as {EMAIL_HOST_USER}...")
    server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
    
    print(f"\n📤 Sending test email to {EMAIL_HOST_USER}...")
    server.send_message(msg)
    server.quit()
    
    print("\n" + "=" * 60)
    print("✅ SUCCESS! Test email sent successfully")
    print(f"✅ Check inbox: {EMAIL_HOST_USER}")
    print("=" * 60)
    
except smtplib.SMTPAuthenticationError as e:
    print("\n" + "=" * 60)
    print("❌ AUTHENTICATION FAILED")
    print("=" * 60)
    print(f"Error: {e}")
    print("\n💡 Solutions:")
    print("1. Make sure you're using a Gmail App Password, not your regular password")
    print("2. Enable 2-Factor Authentication on your Gmail account")
    print("3. Generate an App Password: https://myaccount.google.com/apppasswords")
    print("4. Update EMAIL_HOST_PASSWORD in .env with the App Password (no spaces)")
    print("=" * 60)
    
except Exception as e:
    print("\n" + "=" * 60)
    print("❌ ERROR")
    print("=" * 60)
    print(f"Error: {e}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    print("=" * 60)
