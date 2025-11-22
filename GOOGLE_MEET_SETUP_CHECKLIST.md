# Google Meet Integration - Setup Checklist

Use this checklist to ensure proper setup of the Google Meet integration for service bookings.

## Pre-Setup Requirements

- [ ] Google account with admin access
- [ ] Access to Google Cloud Console
- [ ] Server access with environment variable configuration
- [ ] Database migration permissions

---

## Part 1: Google Cloud Console (15 minutes)

### Step 1: Project Setup
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project OR select existing project
- [ ] Note project ID: `_________________`

### Step 2: Enable API
- [ ] Navigate to "APIs & Services" > "Library"
- [ ] Search for "Google Calendar API"
- [ ] Click "Enable"
- [ ] Wait for confirmation (green checkmark)

### Step 3: Create Service Account
- [ ] Go to "APIs & Services" > "Credentials"
- [ ] Click "Create Credentials" > "Service Account"
- [ ] Enter name: `scrapiz-booking-service`
- [ ] Click "Create and Continue"
- [ ] Skip role assignment (click "Continue")
- [ ] Click "Done"

### Step 4: Generate Key
- [ ] Click on the created service account
- [ ] Go to "Keys" tab
- [ ] Click "Add Key" > "Create new key"
- [ ] Select "JSON" format
- [ ] Click "Create"
- [ ] File downloads automatically
- [ ] Rename file to: `scrapiz-service-account.json`
- [ ] Note service account email: `_________________@_________________`

### Step 5: Share Calendar
- [ ] Open https://calendar.google.com/
- [ ] Click Settings (gear icon) > Settings
- [ ] Select your calendar (e.g., admin@scrapiz.in)
- [ ] Scroll to "Share with specific people"
- [ ] Click "Add people"
- [ ] Paste service account email from Step 4
- [ ] Set permission: "Make changes to events"
- [ ] Uncheck "Send email notification"
- [ ] Click "Send"
- [ ] Verify service account appears in shared list

---

## Part 2: Server Configuration (10 minutes)

### Step 6: Upload Credentials
- [ ] Create credentials directory: `mkdir -p server/credentials`
- [ ] Copy JSON file to server: `server/credentials/scrapiz-service-account.json`
- [ ] Set file permissions: `chmod 400 server/credentials/scrapiz-service-account.json`
- [ ] Verify file exists: `ls -la server/credentials/`

### Step 7: Update Environment Variables
- [ ] Open `server/.env` file
- [ ] Add these lines:
  ```bash
  GOOGLE_SERVICE_ACCOUNT_FILE=/absolute/path/to/server/credentials/scrapiz-service-account.json
  ADMIN_CALENDAR_ID=admin@scrapiz.in
  ```
- [ ] Replace `/absolute/path/to/` with actual path
- [ ] Replace `admin@scrapiz.in` with your calendar email
- [ ] Save file

### Step 8: Verify Email Configuration
- [ ] Check EMAIL_HOST_USER is set in .env
- [ ] Check EMAIL_HOST_PASSWORD is set (use App Password for Gmail)
- [ ] Test email sending (optional):
  ```bash
  python manage.py shell
  >>> from django.core.mail import send_mail
  >>> send_mail('Test', 'Body', 'from@example.com', ['your@email.com'])
  ```

### Step 9: Run Database Migration
- [ ] Navigate to server directory: `cd server`
- [ ] Run migration: `python manage.py migrate services`
- [ ] Verify success message appears
- [ ] Check for errors (should be none)

### Step 10: Restart Server
- [ ] Stop server if running
- [ ] Start server: `python manage.py runserver` OR `docker-compose restart backend`
- [ ] Check for startup errors
- [ ] Verify server is accessible

---

## Part 3: Testing (10 minutes)

### Step 11: Create Test Booking
- [ ] Open mobile app or API client
- [ ] Navigate to service booking
- [ ] Fill in all required fields:
  - Service: `_________________`
  - Name: `_________________`
  - Phone: `_________________`
  - Address: `_________________`
  - Date: `_________________`
  - Time: `_________________`
- [ ] Submit booking
- [ ] Verify success message appears
- [ ] Note: "Meeting details sent to your email"

### Step 12: Verify Email
- [ ] Check user's email inbox
- [ ] Email received? (check spam if not)
- [ ] Email contains booking details?
- [ ] Email contains Google Meet link?
- [ ] Google Meet link format: `https://meet.google.com/...`

### Step 13: Verify Calendar Event
- [ ] Open Google Calendar
- [ ] Navigate to booking date/time
- [ ] Event appears on calendar?
- [ ] Event title correct?
- [ ] Event time correct?
- [ ] Google Meet link attached?
- [ ] User invited as attendee?

### Step 14: Test Meeting Link
- [ ] Click Google Meet link from email
- [ ] Meeting room loads?
- [ ] Can join meeting?
- [ ] Meeting ID visible?

### Step 15: Verify Database
- [ ] Go to Django admin: `https://api.scrapiz.in/admin/`
- [ ] Navigate to Services > Service Bookings
- [ ] Find test booking
- [ ] "Join Meet" button visible?
- [ ] Click button - meeting opens?
- [ ] meeting_link field populated?
- [ ] meeting_event_id field populated?

---

## Part 4: Production Checklist

### Security
- [ ] Service account JSON not committed to git
- [ ] `.gitignore` includes `*service-account*.json`
- [ ] `.gitignore` includes `server/credentials/`
- [ ] File permissions set to 400 (read-only)
- [ ] Environment variables not exposed in logs

### Docker (if applicable)
- [ ] Credentials mounted as volume in docker-compose.yml
- [ ] Volume set to read-only (`:ro`)
- [ ] Environment variables passed to container
- [ ] Container can access credentials file

### Monitoring
- [ ] Server logs accessible
- [ ] Email delivery monitoring enabled
- [ ] Calendar API quota monitoring set up
- [ ] Error alerting configured

### Documentation
- [ ] Team trained on new feature
- [ ] Support team aware of meeting links
- [ ] Troubleshooting guide accessible
- [ ] Rollback plan documented

---

## Part 5: Post-Launch Monitoring (First Week)

### Day 1
- [ ] Monitor first 10 bookings
- [ ] Verify all emails sent
- [ ] Check all meeting links work
- [ ] Review server logs for errors

### Day 3
- [ ] Check booking success rate (target: 100%)
- [ ] Check meeting creation rate (target: 95%+)
- [ ] Check email delivery rate (target: 98%+)
- [ ] Collect user feedback

### Day 7
- [ ] Review week's statistics
- [ ] Identify any patterns in failures
- [ ] Optimize if needed
- [ ] Document lessons learned

---

## Troubleshooting Quick Reference

| Symptom | Check | Fix |
|---------|-------|-----|
| No meeting link | GOOGLE_SERVICE_ACCOUNT_FILE set? | Add to .env |
| "Credentials not found" | File path correct? | Use absolute path |
| Meeting wrong time | TIME_ZONE setting | Set to Asia/Kolkata |
| No email | EMAIL_HOST_PASSWORD correct? | Use App Password |
| Calendar not shared | Service account in shared list? | Re-share calendar |
| API quota exceeded | Too many requests? | Request quota increase |

---

## Success Criteria

✅ **Setup Complete When:**
- [ ] Test booking creates meeting link
- [ ] User receives email with meeting details
- [ ] Calendar event appears in admin calendar
- [ ] Meeting link is accessible and works
- [ ] Auto-redirect works on mobile app
- [ ] Admin panel shows "Join Meet" button
- [ ] No errors in server logs

---

## Rollback Instructions

If something goes wrong:

1. **Immediate Rollback (keeps bookings working)**
   ```bash
   # Comment out in .env:
   # GOOGLE_SERVICE_ACCOUNT_FILE=...
   
   # Restart server
   docker-compose restart backend
   ```

2. **Full Rollback (removes meeting fields)**
   ```bash
   # Revert database migration
   python manage.py migrate services 0001_initial
   
   # Revert code changes
   git revert <commit-hash>
   ```

---

## Support

- **Full Documentation**: See `GOOGLE_MEET_IMPLEMENTATION.md`
- **Quick Reference**: See `GOOGLE_MEET_QUICK_REFERENCE.md`
- **Google Calendar API**: https://developers.google.com/calendar
- **Service Accounts**: https://cloud.google.com/iam/docs/service-accounts

---

## Sign-Off

Setup completed by: `_________________`

Date: `_________________`

Verified by: `_________________`

Production deployment approved: ☐ Yes ☐ No

Notes:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```
