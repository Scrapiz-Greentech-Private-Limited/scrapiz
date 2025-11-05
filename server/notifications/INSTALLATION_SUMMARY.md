# Order Notification System - Installation Summary

## 📦 Libraries to Install

Run this command in your server directory:

```bash
pip install celery==5.3.4 redis==5.0.1 supabase==2.3.0 twilio==8.11.0 kombu==5.3.4
```

Or simply update your requirements.txt and run:

```bash
pip install -r requirements.txt
```

### Library Details:

| Library | Version | Purpose |
|---------|---------|---------|
| celery | 5.3.4 | Asynchronous task queue for background processing |
| redis | 5.0.1 | Message broker and result backend for Celery |
| supabase | 2.3.0 | Python client for Supabase (notification storage) |
| twilio | 8.11.0 | WhatsApp messaging via Twilio API |
| kombu | 5.3.4 | Messaging library used by Celery |

---

## 🔧 Environment Variables to Add

Add these to your `server/.env` file:

```bash
# =====================================================
# CELERY & REDIS CONFIGURATION
# =====================================================
CELERY_BROKER_URL='redis://redis:6379/0'
CELERY_RESULT_BACKEND='redis://redis:6379/0'

# =====================================================
# SUPABASE CONFIGURATION
# =====================================================
# Get these from: https://supabase.com/dashboard/project/_/settings/api
SUPABASE_URL='https://your-project.supabase.co'
SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
SUPABASE_SERVICE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# =====================================================
# TWILIO CONFIGURATION (WhatsApp)
# =====================================================
# Get these from: https://console.twilio.com/
TWILIO_ACCOUNT_SID='ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
TWILIO_AUTH_TOKEN='your_auth_token_here'
TWILIO_WHATSAPP_NUMBER='whatsapp:+14155238886'

# =====================================================
# NOTIFICATION CONFIGURATION
# =====================================================
NOTIFICATION_ENABLED='true'
NOTIFICATION_CHANNELS='email,whatsapp,dashboard'

# Admin Recipients (comma-separated)
ADMIN_EMAILS='admin1@example.com,admin2@example.com'
ADMIN_WHATSAPP_NUMBERS='+919876543210,+919876543211'

# Retry Settings
NOTIFICATION_MAX_RETRIES='3'
NOTIFICATION_RETRY_DELAY='60'

# URLs
ADMIN_DASHBOARD_URL='http://localhost:8000/admin/'

# Email Settings
EMAIL_FROM_ADDRESS='noreply@scrapiz.com'
EMAIL_FROM_NAME='Scrapiz Order System'
```

---

## 🗄️ Supabase Setup

### 1. Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and set project name
4. Wait for project to be created

### 2. Run SQL Schema
1. Open SQL Editor in Supabase dashboard
2. Copy contents of `server/notifications/supabase_schema.sql`
3. Paste and run the SQL
4. Verify table `order_notifications` was created

### 3. Get API Keys
1. Go to Settings > API
2. Copy **Project URL** → Use as `SUPABASE_URL`
3. Copy **anon public** key → Use as `SUPABASE_ANON_KEY`
4. Copy **service_role** key → Use as `SUPABASE_SERVICE_KEY` (keep secret!)

---

## 📱 Twilio Setup (WhatsApp)

### 1. Create Twilio Account
1. Go to https://www.twilio.com/try-twilio
2. Sign up (get $15 free credit)
3. Verify your email and phone

### 2. Set Up WhatsApp Sandbox
1. Go to Console > Messaging > Try it out > Send a WhatsApp message
2. Scan QR code or send join code to sandbox number
3. Example: Send "join [code]" to +1 415 523 8886

### 3. Get Credentials
1. Go to Console Dashboard
2. Copy **Account SID** → Use as `TWILIO_ACCOUNT_SID`
3. Copy **Auth Token** → Use as `TWILIO_AUTH_TOKEN`
4. Sandbox number: `whatsapp:+14155238886` → Use as `TWILIO_WHATSAPP_NUMBER`

### 4. Add Admin WhatsApp Numbers
- Format: `+[country_code][number]`
- Example: `+919876543210` (India), `+12025551234` (USA)
- Multiple numbers: comma-separated in `ADMIN_WHATSAPP_NUMBERS`

---

## 🐳 Docker Services

The following services will be added to `docker-compose.yml`:

### 1. Redis
```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
```

### 2. Celery Worker
```yaml
celery_worker:
  build: ./server
  command: celery -A server worker -l info
  depends_on:
    - redis
```

### 3. Celery Beat
```yaml
celery_beat:
  build: ./server
  command: celery -A server beat -l info
  depends_on:
    - redis
```

---

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Update Environment Variables
```bash
# Edit server/.env and add all variables listed above
nano server/.env
```

### 3. Set Up Supabase
```bash
# Run SQL schema in Supabase SQL Editor
# Copy from: server/notifications/supabase_schema.sql
```

### 4. Start Docker Services
```bash
# From project root
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f celery_worker
```

### 5. Test Notification System
```bash
# Health check
curl http://localhost/api/notifications/health/

# Test notification (replace 1 with actual order ID)
curl -X POST http://localhost/api/notifications/test/ \
  -H "Content-Type: application/json" \
  -d '{"order_no_id": 1}'
```

---

## ✅ Verification Checklist

- [ ] All libraries installed (`pip list | grep -E "celery|redis|supabase|twilio"`)
- [ ] Environment variables added to `.env`
- [ ] Supabase project created
- [ ] Supabase table `order_notifications` created
- [ ] Supabase API keys configured
- [ ] Twilio account created
- [ ] WhatsApp sandbox activated
- [ ] Twilio credentials configured
- [ ] Admin emails configured
- [ ] Admin WhatsApp numbers configured
- [ ] Docker services running (`docker-compose ps`)
- [ ] Redis accessible (`docker exec -it redis_scrapiz redis-cli ping`)
- [ ] Celery worker running (`docker-compose logs celery_worker`)
- [ ] Health check passes (`curl http://localhost/api/notifications/health/`)
- [ ] Test notification works

---

## 📊 File Structure Created

```
server/
├── notifications/
│   ├── __init__.py
│   ├── apps.py
│   ├── config.py
│   ├── tasks.py
│   ├── urls.py
│   ├── views.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── supabase_client.py
│   │   ├── notification_manager.py
│   │   ├── email_service.py
│   │   ├── whatsapp_service.py
│   │   └── dashboard_service.py
│   ├── templates/
│   │   └── email/
│   │       └── new_order_notification.html
│   ├── supabase_schema.sql
│   ├── SETUP.md
│   └── INSTALLATION_SUMMARY.md
├── server/
│   ├── __init__.py (updated)
│   ├── celery.py (new)
│   ├── settings.py (updated)
│   └── urls.py (updated)
├── inventory/
│   └── views.py (updated - notification trigger added)
├── requirements.txt (updated)
└── .env.example (updated)

docker-compose.yml (updated)
```

---

## 🔗 API Endpoints Added

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/` | GET | List all notifications with filters |
| `/api/notifications/<id>/` | GET | Get single notification details |
| `/api/notifications/<id>/mark-read/` | POST | Mark notification as read |
| `/api/notifications/<id>/retry/` | POST | Retry failed notification |
| `/api/notifications/unread-count/` | GET | Get unread notification count |
| `/api/notifications/health/` | GET | System health check |
| `/api/notifications/test/` | POST | Test notification system |

---

## 🎯 What Happens When Order is Created

1. **Order Created** → `CreateOrderAPIView` in `inventory/views.py`
2. **Notification Task Triggered** → `send_order_notifications_task.delay(order_no.id)`
3. **Celery Worker Picks Up Task** → Runs in background
4. **Notification Manager** → Sends through all enabled channels:
   - **Email Service** → Sends HTML email to admin emails
   - **WhatsApp Service** → Sends message to admin WhatsApp numbers
   - **Dashboard Service** → Creates record in Supabase
5. **Results Logged** → Success/failure logged for monitoring

---

## 🛠️ Troubleshooting Quick Reference

### Celery worker not starting
```bash
docker-compose restart celery_worker
docker-compose logs celery_worker
```

### Email not sending
- Check Gmail app password
- Verify `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`
- Check Celery logs for errors

### WhatsApp not sending
- Verify Twilio credentials
- Check WhatsApp sandbox is active
- Verify number format: `+[country_code][number]`

### Supabase connection failed
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check table exists in Supabase
- Verify RLS policies

### Redis connection failed
```bash
docker-compose ps redis
docker-compose restart redis
```

---

## 📚 Additional Resources

- **Celery Documentation**: https://docs.celeryq.dev/
- **Supabase Documentation**: https://supabase.com/docs
- **Twilio WhatsApp API**: https://www.twilio.com/docs/whatsapp
- **Redis Documentation**: https://redis.io/docs/

---

## 🎉 You're All Set!

The notification system is now ready to send alerts when new orders are created. Test it by creating an order and checking:
1. Admin email inbox
2. Admin WhatsApp messages
3. Supabase `order_notifications` table

For detailed setup instructions, see `SETUP.md`.
