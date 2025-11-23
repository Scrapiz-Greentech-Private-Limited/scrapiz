import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings


SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleMeetService:
    """Service for creating Google Calendar events."""
    
    def __init__(self):
        """Initialize the Google Calendar service with credentials."""
        credentials_path = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
        
        if not credentials_path:
            raise ValueError(
                "GOOGLE_SERVICE_ACCOUNT_FILE not set in settings. "
                "Please set it in .env file"
            )
        
        # Convert relative path to absolute if needed
        if not os.path.isabs(credentials_path):
            from django.conf import settings as django_settings
            credentials_path = os.path.join(django_settings.BASE_DIR, credentials_path)
        
        if not os.path.exists(credentials_path):
            raise ValueError(
                f"Google Service Account credentials file not found at: {credentials_path}"
            )
        
        self.creds = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=SCOPES
        )
        self.calendar_id = getattr(settings, 'ADMIN_CALENDAR_ID', 'primary')
        
        # Load the static meeting link from settings/env
        self.static_meeting_link = getattr(settings, 'SCRAPIZ_MEETING_LINK', 'https://meet.google.com/lookup/scrapiz-inspection')
    
    def create_meeting(
        self, 
        summary: str, 
        start_time_iso: str, 
        duration_minutes: int = 30, 
        attendee_email: str = None,
        description: str = None
    ) -> dict:
        """
        Creates a Google Calendar event.
        NOTE: On free Gmail accounts, Service Accounts cannot generate unique Meet links.
        We use a static meeting link instead.
        """
        try:
            print(f"?? Building Google Calendar service...")
            service = build('calendar', 'v3', credentials=self.creds)
            
            # Parse start time
            start_dt = datetime.datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
            end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)
            
            # Combine provided description with the meeting link
            full_description = (
                f"{description or 'Scrapiz Service Inspection'}\n\n"
                f"JOIN MEETING HERE: {self.static_meeting_link}"
            )

            # Build event body WITHOUT conferenceData (this fixes the 400 Error)
            event_body = {
                'summary': summary,
                'description': full_description,
                'location': self.static_meeting_link, # Add link to location field for easy access
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                # We removed conferenceData because it requires a Paid Workspace account
            }
            
            print(f"?? Creating calendar event on calendar: {self.calendar_id}")
            
            # Create the event
            event = service.events().insert(
                calendarId=self.calendar_id,
                body=event_body,
                # Removed conferenceDataVersion=1
                sendUpdates='none'
            ).execute()
            
            event_id = event.get('id')
            
            print(f"? Calendar event created successfully!")
            print(f"   - Event ID: {event_id}")
            print(f"   - Using Static Link: {self.static_meeting_link}")
            
            # Return the static link so your email service works exactly the same
            return {
                'meeting_url': self.static_meeting_link,
                'event_id': event_id
            }
            
        except Exception as e:
            print(f"? Error creating Calendar Event: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to create Calendar Event: {str(e)}")
    
    def cancel_meeting(self, event_id: str) -> bool:
        """Cancels a Google Calendar event."""
        try:
            service = build('calendar', 'v3', credentials=self.creds)
            service.events().delete(
                calendarId=self.calendar_id,
                eventId=event_id,
                sendUpdates='none' # Changed to none to avoid permissions issues
            ).execute()
            return True
        except Exception as e:
            print(f"Failed to cancel meeting: {str(e)}")
            return False