# Order Notification System - Setup Guide

## Overview
This guide will help you set up the Order Notification System with email, WhatsApp, and dashboard notifications.

## Prerequisites
- Python 3.8+
- Docker & Docker Compose
- Supabase account
- Twilio account (for WhatsApp)
- Gmail account (for email)

---

## Step 1: Install Dependencies

```bash
cd server
pip install -r requirements.txt
```

**New dependencies added:**
- `celery==5.3.4` - Async task processing
- `redis==5.0.1` - Message broker for Celery
- `supabase==2.3.0` - Supabase Python client
- `twilio==8.11.0` - WhatsApp messaging via Twilio
- `kombu==5.3.4` - Celery messaging library

---

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

### 2.2 Create Database Table
1. Open Supabase SQL Editor
2. Run the SQL script from `server/notifications/supabase_schema.sql`
3. Verify the table was created successfully

### 2.3 Get API Keys
- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: Found in Settings > API
- **Service Role Key**: Found in Settings > API (keep this secret!)

---

## Step 3: Set Up Twilio (WhatsApp)

### 3.1 Create Twilio Account
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Get $15 free credit for testing

### 3.2 Set Up WhatsApp Sandbox
1. Go to Messaging > Try it out > Send a WhatsApp message
2. Follow instructions to connect your WhatsApp number
3. Send the join code to the Twilio sandbox number

### 3.3 Get Credentials
- **Account SID**: Found in Console Dashboard
- **Auth Token**: Found in Console Dashboard
- **WhatsApp Number**: `whatsapp:+14155238886` (sandbox number)

### 3.4 Add Admin Numbers
- Format: `+[country_code][number]` (e.g., `+919876543210`)
- Multiple numbers: comma-separated

---

## Step 4: Configure Environment Variables

Update `server/.env` with the following:

```bash
# ----------------------
# Celery & Redis Configuration
# ----------------------
CELERY_BROKER_URL='redis://redis:6379/0'
CELERY_RESULT_BACKEND='redis://redis:6379/0'

# ----------------------
# Supabase Configuration
# ----------------------
SUPABASE_URL='https://your-project.supabase.co'
SUPABASE_ANON_KEY='your-anon-key-here'
SUPABASE_SERVICE_KEY='your-service-role-key-here'

# ----------------------
# Twilio Configuration (for WhatsApp)
# ----------------------
TWILIO_ACCOUNT_SID='your-account-sid-here'
TWILIO_AUTH_TOKEN='your-auth-token-here'
TWILIO_WHATSAPP_NUMBER='whatsapp:+14155238886'

# ----------------------
# Notification Configuration
# ----------------------
NOTIFICATION_ENABLED='true'
NOTIFICATION_CHANNELS='email,whatsapp,dashboard'
ADMIN_EMAILS='admin1@example.com,admin2@example.com'
ADMIN_WHATSAPP_NUMBERS='+919876543210,+919876543211'
NOTIFICATION_MAX_RETRIES='3'
NOTIFICATION_RETRY_DELAY='60'
ADMIN_DASHBOARD_URL='http://localhost:8000/admin/'
EMAIL_FROM_ADDRESS='noreply@scrapiz.com'
EMAIL_FROM_NAME='Scrapiz Order System'
```

---

## Step 5: Start Services with Docker

```bash
# From project root
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat
```

**Services started:**
- `server` - Django API
- `redis` - Message broker
- `celery_worker` - Background task processor
- `celery_beat` - Periodic task scheduler
- `nginx` - Reverse proxy

---

## Step 6: Verify Setup

### 6.1 Check Health Endpoint
```bash
curl http://localhost/api/notifications/health/
```

Expected response:
```json
{
  "status": "healthy",
  "notification_enabled": true,
  "enabled_channels": ["email", "whatsapp", "dashboard"],
  "celery_status": "configured",
  "configuration_valid": true
}
```

### 6.2 Test Notification System
```bash
# Create a test order first, then:
curl -X POST http://localhost/api/notifications/test/ \
  -H "Content-Type: application/json" \
  -d '{"order_no_id": 1}'
```

### 6.3 Check Celery Worker Logs
```bash
docker-compose logs -f celery_worker
```

You should see:
```
[INFO] Starting notification task for order ID 1
[INFO] Email notification sent for order ABC12345
[INFO] WhatsApp notification sent for order ABC12345
[INFO] Dashboard notification created for order ABC12345
```

---

## Step 7: Verify Notifications

### Email
- Check admin email inbox
- Look for "🛒 New Order #ABC12345"
- Verify order details are correct

### WhatsApp
- Check WhatsApp on registered admin numbers
- Look for "🛒 *New Order Alert*"
- Verify message format

### Dashboard (Supabase)
1. Open Supabase Table Editor
2. Go to `order_notifications` table
3. Verify new record was created
4. Check `status` is 'SENT' or 'PENDING'

---

## API Endpoints

### List Notifications
```bash
GET /api/notifications/
Query params: status, notification_type, date_from, date_to, limit, offset
```

### Get Notification Details
```bash
GET /api/notifications/<id>/
```

### Mark as Read
```bash
POST /api/notifications/<id>/mark-read/
```

### Retry Failed Notification
```bash
POST /api/notifications/<id>/retry/
```

### Get Unread Count
```bash
GET /api/notifications/unread-count/
```

### Health Check
```bash
GET /api/notifications/health/
```

---

## Troubleshooting

### Issue: Celery worker not starting
**Solution:**
```bash
# Check Redis is running
docker-compose ps redis

# Restart Celery worker
docker-compose restart celery_worker

# Check logs
docker-compose logs celery_worker
```

### Issue: Email not sending
**Solution:**
1. Verify Gmail app password is correct
2. Check `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` in `.env`
3. Enable "Less secure app access" in Gmail (if needed)
4. Check Celery worker logs for errors

### Issue: WhatsApp not sending
**Solution:**
1. Verify Twilio credentials are correct
2. Check WhatsApp sandbox is active
3. Verify admin numbers are in correct format: `+[country_code][number]`
4. Check Twilio console for error messages

### Issue: Supabase connection failed
**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
2. Check Supabase project is active
3. Verify table `order_notifications` exists
4. Check RLS policies allow service role access

### Issue: Notifications not triggered on order creation
**Solution:**
1. Check `NOTIFICATION_ENABLED=true` in `.env`
2. Verify Celery worker is running
3. Check Django logs for errors
4. Test manually: `POST /api/notifications/test/`

---

## Configuration Options

### Disable Specific Channels
```bash
# Email only
NOTIFICATION_CHANNELS='email'

# Email and Dashboard only
NOTIFICATION_CHANNELS='email,dashboard'

# All channels
NOTIFICATION_CHANNELS='email,whatsapp,dashboard'
```

### Adjust Retry Settings
```bash
# Max retry attempts
NOTIFICATION_MAX_RETRIES='5'

# Retry delay in seconds
NOTIFICATION_RETRY_DELAY='120'
```

### Disable Notifications Completely
```bash
NOTIFICATION_ENABLED='false'
```

---

## Monitoring

### View Celery Tasks
```bash
# List active tasks
docker exec -it celery_worker_scrapiz celery -A server inspect active

# View registered tasks
docker exec -it celery_worker_scrapiz celery -A server inspect registered
```

### View Redis Queue
```bash
# Connect to Redis
docker exec -it redis_scrapiz redis-cli

# Check queue length
LLEN celery

# View keys
KEYS *
```

### View Notification Statistics
```sql
-- Run in Supabase SQL Editor
SELECT 
    notification_type,
    status,
    COUNT(*) as count
FROM order_notifications
GROUP BY notification_type, status
ORDER BY notification_type, status;
```

---

## Production Considerations

1. **Use Production Twilio Number**: Replace sandbox number with verified WhatsApp Business number
2. **Secure API Keys**: Use environment variables, never commit to git
3. **Scale Celery Workers**: Add more workers for high volume
4. **Monitor Queue Length**: Set up alerts for long queues
5. **Database Backups**: Regular backups of Supabase data
6. **Rate Limiting**: Implement rate limiting on notification endpoints
7. **Logging**: Set up centralized logging (e.g., Sentry)

---

## Next Steps

1. Customize email template in `server/notifications/templates/email/new_order_notification.html`
2. Add more notification channels (SMS, Slack, etc.)
3. Implement notification preferences per admin
4. Add notification analytics dashboard
5. Set up monitoring and alerting

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f celery_worker`
2. Test health endpoint: `GET /api/notifications/health/`
3. Review Supabase logs in dashboard
4. Check Twilio console for WhatsApp errors
