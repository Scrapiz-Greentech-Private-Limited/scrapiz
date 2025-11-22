# Google Meet Integration for Service Bookings

## Overview

This feature automatically creates Google Meet video conference links when users book services, sends confirmation emails with meeting details, and manages calendar events.

## What's New

### For Users
- 📧 Receive booking confirmation email with all details
- 📅 Get automatic calendar invite with Google Meet link
- 🎥 Join video inspection at scheduled time
- ✅ See success message: "Meeting details sent to your email"
- 🔄 Auto-redirect to services page after booking

### For Admins
- 📊 View all bookings with meeting links in admin panel
- 🔗 One-click "Join Meet" button for each booking
- 📆 All meetings appear in admin's Google Calendar
- 🔍 Search and filter bookings easily

## Documentation

### 📚 Complete Guides

1. **[GOOGLE_MEET_IMPLEMENTATION.md](./GOOGLE_MEET_IMPLEMENTATION.md)**
   - Complete implementation details
   - Architecture overview
   - Troubleshooting guide
   - Production deployment
   - ~50 pages of comprehensive documentation

2. **[GOOGLE_MEET_QUICK_REFERENCE.md](./GOOGLE_MEET_QUICK_REFERENCE.md)**
   - Quick setup (5 minutes)
   - File changes summary
   - Common issues & fixes
   - Testing commands
   - Monitoring checklist

3. **[GOOGLE_MEET_SETUP_CHECKLIST.md](./GOOGLE_MEET_SETUP_CHECKLIST.md)**
   - Step-by-step setup checklist
   - Pre-setup requirements
   - Testing procedures
   - Production checklist
   - Sign-off template

## Quick Start

### 1. Google Cloud Setup (5 min)
```bash
1. Go to console.cloud.google.com
2. Enable "Google Calendar API"
3. Create Service Account
4. Download JSON credentials
5. Share calendar with service account
```

### 2. Server Setup (3 min)
```bash
# Add to server/.env
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json
ADMIN_CALENDAR_ID=admin@scrapiz.in

# Run migration
cd server
python manage.py migrate services
```

### 3. Test (2 min)
```bash
# Create a booking via app
# Verify: Email + Calendar event + Meet link
```

## Features

### Automatic Meeting Creation
- ✅ Creates 30-minute Google Meet sessions
- ✅ Invites user automatically
- ✅ Sends calendar invite
- ✅ Stores meeting link in database

### Email Notifications
- ✅ HTML formatted emails
- ✅ Includes all booking details
- ✅ Clickable Google Meet link
- ✅ Professional design

### Error Handling
- ✅ Graceful degradation (bookings work even if meeting creation fails)
- ✅ Detailed error logging
- ✅ No user-facing errors

### Admin Features
- ✅ Enhanced admin panel
- ✅ "Join Meet" buttons
- ✅ Search and filter
- ✅ Meeting link display

## Technical Details

### Backend Changes
```
✓ server/services/meeting_service.py       (NEW)
✓ server/services/email_service.py         (NEW)
✓ server/services/views.py                 (MODIFIED)
✓ server/services/models.py                (MODIFIED)
✓ server/services/serializers.py           (MODIFIED)
✓ server/services/admin.py                 (MODIFIED)
✓ server/services/migrations/0002_*.py     (NEW)
✓ server/server/settings.py                (MODIFIED)
```

### Frontend Changes
```
✓ client/src/app/services/book.tsx         (MODIFIED)
✓ client/src/api/config.ts                 (MODIFIED)
```

### Database Changes
```sql
-- Added to ServiceBooking model
meeting_link VARCHAR(200) NULL
meeting_event_id VARCHAR(255) NULL
```

### API Changes
```json
// Response now includes:
{
  "booking": {
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "meeting_event_id": "event123abc"
  }
}
```

## Configuration

### Required Environment Variables
```bash
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json
ADMIN_CALENDAR_ID=admin@scrapiz.in
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Optional Configuration
```python
# In views.py - Change meeting duration
duration_minutes=30  # Default: 30 minutes

# In settings.py - Change timezone
TIME_ZONE='Asia/Kolkata'  # Default: Asia/Kolkata
```

## User Flow

```
1. User fills booking form
   ↓
2. Submits booking
   ↓
3. Server creates booking
   ↓
4. Server creates Google Meet (if configured)
   ↓
5. Server sends confirmation email
   ↓
6. User sees success message
   ↓
7. User receives email with meeting link
   ↓
8. User gets calendar invite
   ↓
9. Auto-redirect to services page (3 seconds)
   ↓
10. User joins meeting at scheduled time
```

## Monitoring

### Key Metrics
- Booking success rate: 100% (target)
- Meeting creation rate: 95%+ (target)
- Email delivery rate: 98%+ (target)

### What to Monitor
- Server logs for errors
- Email delivery status
- Calendar API quota usage
- User feedback

## Troubleshooting

### Common Issues

**No meeting link created**
- Check GOOGLE_SERVICE_ACCOUNT_FILE path
- Verify calendar is shared with service account

**"Credentials not found"**
- Use absolute path in .env
- Check file permissions (should be readable)

**Meeting at wrong time**
- Verify TIME_ZONE='Asia/Kolkata' in settings.py

**No email received**
- Check spam folder
- Verify EMAIL_HOST_PASSWORD (use App Password for Gmail)

**Calendar not showing event**
- Re-share calendar with service account
- Give "Make changes to events" permission

## Security

### Best Practices
- ✅ Never commit credentials to git
- ✅ Use read-only file permissions (400)
- ✅ Store credentials outside web root
- ✅ Use environment variables
- ✅ Rotate service account keys regularly

### .gitignore
```
server/credentials/
*service-account*.json
*.json
```

## Rollback

### Quick Disable (keeps bookings working)
```bash
# Comment out in .env:
# GOOGLE_SERVICE_ACCOUNT_FILE=...

# Restart server
docker-compose restart backend
```

### Full Rollback
```bash
# Revert database
python manage.py migrate services 0001_initial

# Revert code
git revert <commit-hash>
```

## Testing

### Manual Test
1. Create booking via app
2. Check email received
3. Verify calendar event created
4. Test meeting link works
5. Check admin panel shows "Join Meet"

### Automated Test (Future)
```python
# tests/test_meeting_service.py
def test_create_meeting():
    # Test meeting creation
    pass

def test_send_email():
    # Test email sending
    pass
```

## Future Enhancements

### Planned Features
- [ ] Meeting cancellation when booking cancelled
- [ ] Meeting rescheduling
- [ ] SMS notifications with meeting link
- [ ] Meeting reminders (1 hour before)
- [ ] Multiple service accounts for high volume
- [ ] Meeting recording option
- [ ] Post-meeting feedback

### Nice to Have
- [ ] WhatsApp notifications with meeting link
- [ ] In-app meeting join
- [ ] Meeting history
- [ ] Analytics dashboard

## Support

### Documentation
- Full Guide: `GOOGLE_MEET_IMPLEMENTATION.md`
- Quick Reference: `GOOGLE_MEET_QUICK_REFERENCE.md`
- Setup Checklist: `GOOGLE_MEET_SETUP_CHECKLIST.md`

### External Resources
- [Google Calendar API](https://developers.google.com/calendar)
- [Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Google Meet API](https://developers.google.com/calendar/api/guides/create-events#conferencing)

### Getting Help
1. Check documentation first
2. Review server logs
3. Test with simple booking
4. Check Google Cloud Console for API errors

## License

This implementation is part of the Scrapiz project.

## Contributors

- Backend Implementation: Google Meet Service, Email Service
- Frontend Updates: Booking flow, Success messages
- Documentation: Complete setup and troubleshooting guides

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ Google Meet integration
- ✅ Email notifications
- ✅ Calendar event creation
- ✅ Admin panel enhancements
- ✅ Auto-redirect after booking
- ✅ Comprehensive documentation

---

**Ready to get started?** Follow the [Setup Checklist](./GOOGLE_MEET_SETUP_CHECKLIST.md)

**Need help?** Check the [Implementation Guide](./GOOGLE_MEET_IMPLEMENTATION.md)

**Quick reference?** See the [Quick Reference](./GOOGLE_MEET_QUICK_REFERENCE.md)
