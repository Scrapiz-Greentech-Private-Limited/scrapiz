import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings


SCOPES = ['https://www.googleapis.com/auth/calendar']


class GoogleMeetService:
    """Service for creating Google Calendar events with Google Meet links."""
    
    def __init__(self):
        """Initialize the Google Calendar service with credentials."""
        credentials_path = getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)
        
        if not credentials_path or not os.path.exists(credentials_path):
            raise ValueError(
                "Google Service Account credentials file not found. "
                "Please set GOOGLE_SERVICE_ACCOUNT_FILE in settings.py"
            )
        
        self.creds = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=SCOPES
        )
        self.calendar_id = getattr(settings, 'ADMIN_CALENDAR_ID', 'primary')
    
    def create_meeting(
        self, 
        summary: str, 
        start_time_iso: str, 
        duration_minutes: int = 30, 
        attendee_email: str = None,
        description: str = None
    ) -> dict:
        """
        Creates a Google Calendar event with a Google Meet link.
        
        Args:
            summary: Event title/summary
            start_time_iso: ISO format datetime string (e.g., "2024-01-15T10:00:00Z")
            duration_minutes: Meeting duration in minutes (default: 30)
            attendee_email: Email of the attendee to invite
            description: Event description
            
        Returns:
            dict: Contains 'meeting_url' and 'event_id'
            
        Raises:
            Exception: If meeting creation fails
        """
        try:
            service = build('calendar', 'v3', credentials=self.creds)
            
            # Parse start time
            start_dt = datetime.datetime.fromisoformat(start_time_iso.replace('Z', '+00:00'))
            end_dt = start_dt + datetime.timedelta(minutes=duration_minutes)
            
            # Build event body
            event_body = {
                'summary': summary,
                'description': description or 'Scrapiz Service Inspection',
                'start': {
                    'dateTime': start_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'end': {
                    'dateTime': end_dt.isoformat(),
                    'timeZone': 'Asia/Kolkata',
                },
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"scrapiz-{int(datetime.datetime.now().timestamp())}",
                        'conferenceSolutionKey': {
                            'type': 'hangoutsMeet'
                        }
                    }
                },
            }
            
            # Add attendee if provided
            if attendee_email:
                event_body['attendees'] = [{'email': attendee_email}]
            
            # Create the event
            event = service.events().insert(
                calendarId=self.calendar_id,
                body=event_body,
                conferenceDataVersion=1,
                sendUpdates='all'  # Send email notifications to attendees
            ).execute()
            
            return {
                'meeting_url': event.get('hangoutLink'),
                'event_id': event.get('id')
            }
            
        except Exception as e:
            raise Exception(f"Failed to create Google Meet: {str(e)}")
    
    def cancel_meeting(self, event_id: str) -> bool:
        """
        Cancels a Google Calendar event.
        
        Args:
            event_id: The Google Calendar event ID
            
        Returns:
            bool: True if successful
        """
        try:
            service = build('calendar', 'v3', credentials=self.creds)
            service.events().delete(
                calendarId=self.calendar_id,
                eventId=event_id,
                sendUpdates='all'
            ).execute()
            return True
        except Exception as e:
            print(f"Failed to cancel meeting: {str(e)}")
            return False
