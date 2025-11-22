# Google Meet Integration for Service Bookings - Implementation Guide

## Overview
This implementation automatically creates Google Meet links for service bookings and sends confirmation emails to users with meeting details.

## Architecture

### Backend Components
1. **meeting_service.py** - Google Calendar API integration
2. **email_service.py** - Email notification service
3. **views.py** - Updated booking endpoint
4. **models.py** - Added meeting fields to ServiceBooking

### Frontend Components
1. **book.tsx** - Updated success message and auto-redirect

---

## Setup Guide

### Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Create a new project or select existing one
   - Name it something like "Scrapiz Service Bookings"

3. **Enable Google Calendar API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name: `scrapiz-booking-service`
   - Role: None needed (we'll grant calendar access directly)
   - Click "Done"

5. **Generate Service Account Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the file (e.g., `scrapiz-service-account.json`)

6. **Share Calendar with Service Account**
   - Open Google Calendar (calendar.google.com)
   - Go to Settings > Your calendar (e.g., admin@scrapiz.in)
   - Scroll to "Share with specific people"
   - Click "Add people"
   - Add the service account email (found in the JSON file, looks like: `scrapiz-booking-service@project-id.iam.gserviceaccount.com`)
   - Give permission: **"Make changes to events"**
   - Click "Send"

### Step 2: Server Configuration

1. **Place Service Account File**
   ```bash
   # Copy the downloaded JSON file to your server
   # Recommended location: server/credentials/
   mkdir -p server/credentials
   cp scrapiz-service-account.json server/credentials/
   ```

2. **Update .env File**
   ```bash
   # Add these lines to server/.env
   GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/server/credentials/scrapiz-service-account.json
   ADMIN_CALENDAR_ID=admin@scrapiz.in
   ```

   **Important Notes:**
   - Use absolute path for production
   - For Docker, mount the credentials file as a volume
   - Never commit the JSON file to git (already in .gitignore)

3. **Update .gitignore**
   ```bash
   # Add to .gitignore if not already present
   server/credentials/
   *service-account*.json
   ```

### Step 3: Database Migration

Run the migration to add meeting fields:

```bash
cd server
python manage.py migrate services
```

This adds two new fields to ServiceBooking:
- `meeting_link` (URLField) - Google Meet URL
- `meeting_event_id` (CharField) - Calendar event ID for cancellation

### Step 4: Email Configuration

Ensure your email settings are configured in `.env`:

```bash
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password (not your regular password)

### Step 5: Test the Integration

1. **Start the server**
   ```bash
   cd server
   python manage.py runserver
   ```

2. **Create a test booking**
   - Use the mobile app or API client
   - Fill in booking details
   - Submit the booking

3. **Verify**
   - Check user's email for confirmation
   - Check admin calendar for the event
   - Verify Google Meet link is present

---

## How It Works

### Booking Flow

1. **User submits booking** → Client sends POST to `/api/services/bookings/`

2. **Server creates booking** → Saves to database with status='pending'

3. **Google Meet creation** (if configured):
   - Parses preferred_datetime
   - Creates 30-minute calendar event
   - Generates Google Meet link
   - Invites user via email
   - Saves meeting_link and meeting_event_id

4. **Email notification**:
   - Sends HTML email with booking details
   - Includes Google Meet link (if available)
   - User receives calendar invite from Google

5. **Client response**:
   - Shows success message
   - Displays "Check your email for meeting details"
   - Auto-redirects to services page after 3 seconds

### API Response Example

```json
{
  "message": "Service booking submitted successfully",
  "booking": {
    "id": 123,
    "service": "AC Repair",
    "name": "John Doe",
    "phone": "+919876543210",
    "address": "123 Main St",
    "preferred_datetime": "2024-01-15T10:00:00Z",
    "notes": "Please call before arriving",
    "status": "pending",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "meeting_event_id": "event123abc",
    "created_at": "2024-01-10T08:30:00Z"
  }
}
```

---

## Configuration Options

### Meeting Duration
Default: 30 minutes

To change, edit `server/services/views.py`:
```python
meeting_info = meet_service.create_meeting(
    # ... other params
    duration_minutes=45,  # Change to 45 minutes
)
```

### Calendar Selection
Default: Uses 'primary' calendar or ADMIN_CALENDAR_ID

To use a specific calendar:
```bash
# In .env
ADMIN_CALENDAR_ID=bookings@scrapiz.in
```

### Email Template
Customize the email in `server/services/email_service.py`

---

## Troubleshooting

### Issue: "Google Service Account credentials file not found"

**Solution:**
- Verify GOOGLE_SERVICE_ACCOUNT_FILE path in .env
- Use absolute path, not relative
- Check file permissions (readable by Django process)

### Issue: "Failed to create Google Meet"

**Possible causes:**
1. **Service account not shared with calendar**
   - Go to Google Calendar settings
   - Verify service account email has "Make changes to events" permission

2. **Calendar API not enabled**
   - Go to Google Cloud Console
   - Enable Google Calendar API

3. **Invalid credentials**
   - Re-download service account JSON
   - Verify JSON file is not corrupted

### Issue: "Meeting link not in email"

**Check:**
- Is GOOGLE_SERVICE_ACCOUNT_FILE set?
- Check server logs for errors
- Verify email template includes meeting_link

### Issue: "User not receiving calendar invite"

**Solution:**
- Ensure user's email is valid
- Check spam folder
- Verify `sendUpdates='all'` in meeting_service.py

### Issue: Booking succeeds but no meeting created

**This is by design** - Meeting creation failures don't block bookings.

Check server logs:
```bash
# Look for these messages
"Failed to create Google Meet: [error details]"
"Failed to send confirmation email: [error details]"
```

---

## Production Deployment

### Docker Setup

1. **Mount credentials as volume**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       volumes:
         - ./credentials:/app/credentials:ro
       environment:
         - GOOGLE_SERVICE_ACCOUNT_FILE=/app/credentials/scrapiz-service-account.json
   ```

2. **Security considerations**
   - Never expose credentials in environment variables
   - Use read-only volume mounts
   - Restrict file permissions: `chmod 400 scrapiz-service-account.json`

### Environment Variables

```bash
# Production .env
GOOGLE_SERVICE_ACCOUNT_FILE=/app/credentials/scrapiz-service-account.json
ADMIN_CALENDAR_ID=admin@scrapiz.in
EMAIL_HOST_USER=noreply@scrapiz.in
EMAIL_HOST_PASSWORD=your-app-password
```

---

## Potential Breaking Points

### 1. Service Account Permissions Revoked
**Symptom:** Meetings stop being created
**Fix:** Re-share calendar with service account

### 2. Credentials File Missing/Moved
**Symptom:** "credentials file not found" error
**Fix:** Update GOOGLE_SERVICE_ACCOUNT_FILE path

### 3. Calendar API Quota Exceeded
**Symptom:** API errors after many bookings
**Fix:** Request quota increase in Google Cloud Console

### 4. Invalid DateTime Format
**Symptom:** Meeting creation fails
**Fix:** Ensure client sends ISO 8601 format: `2024-01-15T10:00:00Z`

### 5. Email Sending Failures
**Symptom:** Users don't receive confirmation
**Fix:** 
- Check EMAIL_HOST_PASSWORD is app password
- Verify Gmail 2FA is enabled
- Check email quota limits

### 6. Time Zone Issues
**Symptom:** Meetings scheduled at wrong time
**Fix:** Verify TIME_ZONE='Asia/Kolkata' in settings.py

### 7. Database Migration Not Run
**Symptom:** "no such column: meeting_link"
**Fix:** Run `python manage.py migrate services`

---

## Testing Checklist

- [ ] Service account created and JSON downloaded
- [ ] Calendar shared with service account
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Email settings configured
- [ ] Test booking creates meeting
- [ ] User receives email with meeting link
- [ ] Meeting appears in admin calendar
- [ ] Google Meet link is accessible
- [ ] Auto-redirect works on client
- [ ] Error handling works (disable credentials and verify booking still succeeds)

---

## Monitoring

### Key Metrics to Track
1. Booking success rate
2. Meeting creation success rate
3. Email delivery rate
4. Average response time

### Logs to Monitor
```python
# In views.py
print(f"Failed to create Google Meet: {str(e)}")
print(f"Failed to send confirmation email: {str(e)}")
```

Consider adding proper logging:
```python
import logging
logger = logging.getLogger(__name__)

logger.error(f"Meeting creation failed for booking {booking.id}: {str(e)}")
```

---

## Future Enhancements

1. **Meeting Cancellation**
   - When booking is cancelled, delete calendar event
   - Use `meeting_service.cancel_meeting(event_id)`

2. **Meeting Rescheduling**
   - Update calendar event when booking time changes
   - Implement `meeting_service.update_meeting()`

3. **SMS Notifications**
   - Send meeting link via SMS using Twilio
   - Already have Twilio configured

4. **Admin Dashboard**
   - View all scheduled meetings
   - Bulk reschedule/cancel

5. **Meeting Reminders**
   - Send reminder 1 hour before meeting
   - Use Celery beat for scheduling

---

## Support

For issues or questions:
1. Check server logs first
2. Verify all setup steps completed
3. Test with a simple booking
4. Check Google Cloud Console for API errors

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Service Account Authentication](https://developers.google.com/identity/protocols/oauth2/service-account)
- [Google Meet API](https://developers.google.com/calendar/api/guides/create-events#conferencing)
