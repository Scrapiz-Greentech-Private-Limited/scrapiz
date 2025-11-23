#!/usr/bin/env python
"""
Test script to verify Google Calendar/Meet integration
"""
import os
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from services.meeting_service import GoogleMeetService

def test_google_meet():
    print("=" * 60)
    print("GOOGLE MEET INTEGRATION TEST")
    print("=" * 60)
    
    try:
        print("\n1. Initializing GoogleMeetService...")
        meet_service = GoogleMeetService()
        print("✅ Service initialized successfully")
        
        print("\n2. Creating test meeting...")
        # Create a meeting for tomorrow at 10 AM
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        start_time_iso = start_time.isoformat()
        
        print(f"   Meeting time: {start_time}")
        
        meeting_info = meet_service.create_meeting(
            summary="Test Meeting - Scrapiz",
            start_time_iso=start_time_iso,
            duration_minutes=30,
            attendee_email="teamscrapiz@gmail.com",
            description="This is a test meeting to verify Google Meet integration"
        )
        
        print("\n✅ SUCCESS! Meeting created:")
        print(f"   Meeting URL: {meeting_info['meeting_url']}")
        print(f"   Event ID: {meeting_info['event_id']}")
        print(f"\n✅ Check your calendar: teamscrapiz@gmail.com")
        print(f"✅ The meeting should appear for: {start_time.strftime('%Y-%m-%d at %I:%M %p')}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        
        print("\n💡 TROUBLESHOOTING:")
        print("   1. Verify service account email has access to the calendar")
        print("   2. Check that calendar is shared with 'Make changes to events' permission")
        print("   3. Verify ADMIN_CALENDAR_ID in .env matches the calendar email")
        print("   4. Check service account credentials are valid")
        
        return False

if __name__ == '__main__':
    test_google_meet()
