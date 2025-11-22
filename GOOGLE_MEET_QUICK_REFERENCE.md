# Google Meet Integration - Quick Reference

## Quick Setup (5 Minutes)

### 1. Google Cloud Console
```
1. Go to console.cloud.google.com
2. Enable "Google Calendar API"
3. Create Service Account
4. Download JSON credentials
5. Share your calendar with service account email
   - Permission: "Make changes to events"
```

### 2. Server Configuration
```bash
# Add to server/.env
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json
ADMIN_CALENDAR_ID=admin@scrapiz.in

# Run migration
cd server
python manage.py migrate services
```

### 3. Test
```bash
# Create a booking via app
# Check: Email received + Calendar event created + Meet link works
```

---

## File Changes Summary

### Backend Files Created/Modified
```
✓ server/services/meeting_service.py       (NEW - Google Calendar integration)
✓ server/services/email_service.py         (NEW - Email notifications)
✓ server/services/views.py                 (MODIFIED - Added meeting creation)
✓ server/services/models.py                (MODIFIED - Added meeting fields)
✓ server/services/serializers.py           (MODIFIED - Added meeting fields)
✓ server/services/admin.py                 (MODIFIED - Enhanced admin view)
✓ server/services/migrations/0002_*.py     (NEW - Database migration)
✓ server/server/settings.py                (MODIFIED - Added config)
✓ server/.env.example                      (MODIFIED - Added variables)
```

### Frontend Files Modified
```
✓ client/src/app/services/book.tsx         (MODIFIED - Success message + redirect)
✓ client/src/api/config.ts                 (MODIFIED - Added meeting fields)
```

---

## API Changes

### Request (No Change)
```json
POST /api/services/bookings/
{
  "service": "AC Repair",
  "name": "John Doe",
  "phone": "+919876543210",
  "address": "123 Main St",
  "preferred_datetime": "2024-01-15T10:00:00Z",
  "notes": "Optional notes"
}
```

### Response (New Fields)
```json
{
  "message": "Service booking submitted successfully",
  "booking": {
    "id": 123,
    "meeting_link": "https://meet.google.com/abc-defg-hij",  // NEW
    "meeting_event_id": "event123abc",                       // NEW
    // ... other fields
  }
}
```

---

## User Experience Flow

### Before Integration
```
1. User books service
2. Sees success message
3. Waits for team to contact
```

### After Integration
```
1. User books service
2. Sees: "Booking Confirmed! Meeting details sent to your email"
3. Receives email with:
   - Booking details
   - Google Meet link
   - Calendar invite
4. Auto-redirects to services page (3 seconds)
5. Can join video inspection at scheduled time
```

---

## Environment Variables

### Required
```bash
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json
ADMIN_CALENDAR_ID=admin@scrapiz.in
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Optional
```bash
# Defaults shown
TIME_ZONE=Asia/Kolkata
```

---

## Common Issues & Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| No meeting link created | Check GOOGLE_SERVICE_ACCOUNT_FILE path |
| "Credentials not found" | Use absolute path in .env |
| Meeting at wrong time | Verify TIME_ZONE in settings.py |
| No email received | Check spam folder, verify EMAIL_HOST_PASSWORD |
| Calendar not showing event | Re-share calendar with service account |

---

## Testing Commands

```bash
# Check if credentials file exists
ls -la /path/to/credentials.json

# Test email configuration
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Body', 'from@example.com', ['to@example.com'])

# Check migration status
python manage.py showmigrations services

# View logs
tail -f server/logs/django.log  # or wherever your logs are
```

---

## Disable/Enable Feature

### Temporarily Disable
```bash
# In .env, comment out or remove:
# GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json

# Bookings will still work, just without meeting links
```

### Re-enable
```bash
# Uncomment in .env
GOOGLE_SERVICE_ACCOUNT_FILE=/path/to/credentials.json

# Restart server
```

---

## Admin Panel

View bookings with meeting links:
```
https://api.scrapiz.in/admin/services/servicebooking/

Features:
- Click "Join Meet" button to open meeting
- Filter by status, service, date
- Search by name, phone, email
- View meeting event ID
```

---

## Monitoring Checklist

Daily:
- [ ] Check booking success rate
- [ ] Verify emails are being sent
- [ ] Test a sample meeting link

Weekly:
- [ ] Review failed meeting creations in logs
- [ ] Check Google Calendar API quota usage
- [ ] Verify calendar events are being created

Monthly:
- [ ] Rotate service account keys (security best practice)
- [ ] Review and clean up old calendar events

---

## Support Contacts

- Google Calendar API Issues: Check Google Cloud Console > APIs & Services
- Email Issues: Verify Gmail App Password settings
- Server Issues: Check Django logs

---

## Next Steps

After successful implementation:

1. **Monitor for 1 week**
   - Track booking success rate
   - Collect user feedback
   - Check email delivery rate

2. **Consider enhancements**
   - SMS notifications with meeting link
   - Meeting reminders (1 hour before)
   - Rescheduling functionality
   - Meeting cancellation when booking cancelled

3. **Scale considerations**
   - Monitor Google Calendar API quota
   - Consider multiple service accounts for high volume
   - Implement retry logic for failed meeting creations

---

## Rollback Plan

If issues occur:

```bash
# 1. Disable meeting creation
# Comment out in .env:
# GOOGLE_SERVICE_ACCOUNT_FILE=...

# 2. Restart server
docker-compose restart backend

# 3. Bookings continue working without meeting links

# 4. To fully rollback database changes:
python manage.py migrate services 0001_initial
```

---

## Success Metrics

Track these to measure success:

- **Booking Completion Rate**: Should remain 100%
- **Meeting Creation Rate**: Target 95%+
- **Email Delivery Rate**: Target 98%+
- **User Satisfaction**: Survey users about video inspection experience
- **No-Show Rate**: Should decrease with calendar invites

---

## Documentation Links

- Full Implementation Guide: `GOOGLE_MEET_IMPLEMENTATION.md`
- Google Calendar API: https://developers.google.com/calendar
- Service Accounts: https://cloud.google.com/iam/docs/service-accounts
