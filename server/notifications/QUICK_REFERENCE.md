# Order Notification System - Quick Reference

## 🚀 Installation (One Command)

```bash
# Install all dependencies
pip install celery==5.3.4 redis==5.0.1 supabase==2.3.0 twilio==8.11.0 kombu==5.3.4
```

## 🔑 Required Environment Variables

```bash
# Minimum required for basic functionality
CELERY_BROKER_URL='redis://redis:6379/0'
SUPABASE_URL='https://your-project.supabase.co'
SUPABASE_SERVICE_KEY='your-service-key'
ADMIN_EMAILS='admin@example.com'
```

## 📋 Setup Checklist (5 Steps)

1. ✅ Install dependencies: `pip install -r requirements.txt`
2. ✅ Create Supabase project and run SQL schema
3. ✅ Add environment variables to `.env`
4. ✅ Start Docker: `docker-compose up -d`
5. ✅ Test: `curl http://localhost/api/notifications/health/`

## 🎯 Key Files Modified

```
server/server/settings.py          ← Celery & notification config added
server/server/urls.py               ← Notification routes added
server/inventory/views.py           ← Notification trigger added
server/requirements.txt             ← New dependencies added
server/.env.example                 ← New env vars documented
docker-compose.yml                  ← Redis, Celery services added
```

## 🔧 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f celery_worker

# Restart Celery
docker-compose restart celery_worker celery_beat

# Stop all
docker-compose down
```

## 🧪 Testing Commands

```bash
# Health check
curl http://localhost/api/notifications/health/

# Test notification
curl -X POST http://localhost/api/notifications/test/ \
  -H "Content-Type: application/json" \
  -d '{"order_no_id": 1}'

# Check unread count
curl http://localhost/api/notifications/unread-count/

# List notifications
curl http://localhost/api/notifications/?limit=10
```

## 📊 Monitoring Commands

```bash
# Check Celery tasks
docker exec -it celery_worker_scrapiz celery -A server inspect active

# Check Redis
docker exec -it redis_scrapiz redis-cli ping

# View Celery logs
docker-compose logs -f celery_worker

# View all logs
docker-compose logs -f
```

## 🔍 Troubleshooting (Quick Fixes)

| Issue | Quick Fix |
|-------|-----------|
| Celery not starting | `docker-compose restart celery_worker` |
| Email not sending | Check `EMAIL_HOST_PASSWORD` in `.env` |
| WhatsApp not sending | Verify Twilio credentials and sandbox |
| Supabase error | Check `SUPABASE_SERVICE_KEY` (not anon key) |
| Redis connection | `docker-compose restart redis` |

## 📱 Channel Configuration

```bash
# Enable all channels
NOTIFICATION_CHANNELS='email,whatsapp,dashboard'

# Email only
NOTIFICATION_CHANNELS='email'

# Email + Dashboard
NOTIFICATION_CHANNELS='email,dashboard'

# Disable all
NOTIFICATION_ENABLED='false'
```

## 🎨 Customization Points

| What | Where |
|------|-------|
| Email template | `server/notifications/templates/email/new_order_notification.html` |
| WhatsApp message | `server/notifications/services/whatsapp_service.py` → `_format_whatsapp_message()` |
| Retry logic | `server/notifications/tasks.py` → `send_order_notifications_task()` |
| Admin recipients | `.env` → `ADMIN_EMAILS`, `ADMIN_WHATSAPP_NUMBERS` |

## 📈 Production Checklist

- [ ] Use production Twilio number (not sandbox)
- [ ] Set strong `SUPABASE_SERVICE_KEY`
- [ ] Configure proper `ADMIN_DASHBOARD_URL`
- [ ] Set up monitoring/alerting
- [ ] Scale Celery workers if needed
- [ ] Enable Redis persistence
- [ ] Set up log aggregation
- [ ] Configure rate limiting

## 🔗 Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Twilio Console**: https://console.twilio.com/
- **Health Check**: http://localhost/api/notifications/health/
- **Admin Panel**: http://localhost/admin/

## 💡 Common Use Cases

### Disable notifications temporarily
```bash
# In .env
NOTIFICATION_ENABLED='false'

# Restart services
docker-compose restart server celery_worker
```

### Change admin emails
```bash
# In .env
ADMIN_EMAILS='new-admin@example.com,another@example.com'

# No restart needed - takes effect on next notification
```

### Retry failed notification
```bash
curl -X POST http://localhost/api/notifications/123/retry/
```

### View notification history
```bash
# In Supabase SQL Editor
SELECT * FROM order_notifications 
ORDER BY created_at DESC 
LIMIT 50;
```

## 🎓 Learning Resources

- **Full Setup Guide**: `server/notifications/SETUP.md`
- **Installation Details**: `server/notifications/INSTALLATION_SUMMARY.md`
- **SQL Schema**: `server/notifications/supabase_schema.sql`
- **Code Documentation**: Inline comments in all service files

## 🆘 Getting Help

1. Check health endpoint: `GET /api/notifications/health/`
2. View Celery logs: `docker-compose logs celery_worker`
3. Check Supabase logs in dashboard
4. Review Twilio console for WhatsApp errors
5. Test individual channels by disabling others

---

**Need more details?** See `SETUP.md` for comprehensive guide.
