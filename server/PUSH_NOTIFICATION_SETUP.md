# Push Notification Configuration Guide

## Overview

This document provides instructions for configuring the push notification service in the docker-compose environment.

## Docker Compose Configuration Verification

### ✅ Celery Workers Configuration

The Celery workers are properly configured to handle push notification tasks:

**Service: `celery_worker`**
- **Command**: `celery -A server worker -l info -c 2`
- **Concurrency**: 2 workers
- **Dependencies**: Redis, Server
- **Environment**: Loaded from `./server/.env`
- **Status**: ✅ Ready to handle push notification tasks

**Service: `celery_beat`**
- **Command**: `celery -A server beat -l info --scheduler django_celery_beat.schedulers.DatabaseScheduler`
- **Purpose**: Handles scheduled tasks
- **Dependencies**: Redis, Server
- **Environment**: Loaded from `./server/.env`
- **Status**: ✅ Configured correctly

### ✅ Redis Configuration

Redis is properly configured as the Celery broker:

**Service: `redis`**
- **Image**: `redis:7-alpine`
- **Port**: 6379 (exposed internally)
- **Network**: templet
- **Status**: ✅ Ready for Celery task queue

**Environment Variables**:
```bash
CELERY_BROKER_URL='redis://redis:6379/0'
CELERY_RESULT_BACKEND='redis://redis:6379/0'
```

### ⚠️ EXPO_ACCESS_TOKEN Configuration

**Current Status**: Placeholder value needs to be replaced

**Location**: `server/.env`

**Current Value**:
```bash
EXPO_ACCESS_TOKEN='your-expo-access-token-here'
```

## Setup Instructions

### Step 1: Obtain Expo Access Token

1. Go to [Expo Dashboard](https://expo.dev/)
2. Sign in to your Expo account
3. Navigate to **Account Settings** → **Access Tokens**
4. Click **Create Token**
5. Give it a descriptive name (e.g., "Scrapiz Push Notifications")
6. Copy the generated token

### Step 2: Update Environment Variable

1. Open `server/.env`
2. Replace the placeholder with your actual token:

```bash
EXPO_ACCESS_TOKEN='your-actual-expo-token-here'
```

### Step 3: Restart Docker Services

After updating the token, restart the services:

```bash
# Development environment
docker-compose down
docker-compose up -d

# Production environment
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Verify Configuration

Check that Celery workers can access the token:

```bash
# Check celery worker logs
docker logs celery_worker_scrapiz

# Check server logs
docker logs server_scrapiz_api
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_ACCESS_TOKEN` | Expo Push Service access token | `your-expo-access-token-here` | ✅ Yes |
| `PUSH_NOTIFICATION_ENABLED` | Enable/disable push notifications | `true` | ✅ Yes |
| `CELERY_BROKER_URL` | Redis URL for Celery broker | `redis://redis:6379/0` | ✅ Yes |
| `CELERY_RESULT_BACKEND` | Redis URL for Celery results | `redis://redis:6379/0` | ✅ Yes |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUSH_NOTIFICATION_BATCH_SIZE` | Batch size for Expo API calls | `100` |
| `PUSH_NOTIFICATION_MAX_RETRIES` | Max retry attempts | `3` |
| `NOTIFICATION_CHANNELS` | Enabled notification channels | `email,whatsapp,dashboard,push` |

## Production Deployment Notes

### docker-compose.prod.yml

The production configuration uses an external Redis instance. Ensure:

1. **External Redis**: The production environment assumes Redis is hosted externally (not in docker-compose)
2. **Update CELERY_BROKER_URL**: Point to your production Redis instance
3. **Secure Token Storage**: Consider using Docker secrets or environment variable injection for sensitive tokens

Example production Redis configuration:

```bash
# In production .env
CELERY_BROKER_URL='redis://your-production-redis-host:6379/0'
CELERY_RESULT_BACKEND='redis://your-production-redis-host:6379/0'
```

### Security Recommendations

1. **Never commit** the actual `EXPO_ACCESS_TOKEN` to version control
2. Use `.env` files that are in `.gitignore`
3. Rotate access tokens periodically
4. Use separate tokens for development and production
5. Monitor token usage in Expo Dashboard

## Troubleshooting

### Issue: Push notifications not sending

**Check:**
1. Verify `EXPO_ACCESS_TOKEN` is set correctly
2. Check Celery worker logs: `docker logs celery_worker_scrapiz`
3. Verify Redis is running: `docker ps | grep redis`
4. Test Redis connection: `docker exec -it redis_scrapiz redis-cli ping`

### Issue: Celery tasks not executing

**Check:**
1. Verify Celery worker is running: `docker ps | grep celery`
2. Check worker logs for errors
3. Verify Redis connection in worker logs
4. Restart Celery worker: `docker-compose restart celery_worker`

### Issue: Invalid token errors

**Check:**
1. Verify token format (should be a long string from Expo)
2. Check token hasn't expired in Expo Dashboard
3. Verify token has push notification permissions
4. Try generating a new token

## Testing the Configuration

### 1. Test Redis Connection

```bash
docker exec -it redis_scrapiz redis-cli ping
# Expected output: PONG
```

### 2. Test Celery Worker

```bash
# Check if worker is processing tasks
docker logs celery_worker_scrapiz --tail 50
```

### 3. Send Test Notification

From Django admin:
1. Navigate to `/admin/notifications/send-push-notification/`
2. Fill in test notification details
3. Click "Send Notification"
4. Check Celery logs for task execution

## Additional Resources

- [Expo Push Notifications Documentation](https://docs.expo.dev/push-notifications/overview/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Redis Documentation](https://redis.io/documentation)
- [Django Celery Beat](https://django-celery-beat.readthedocs.io/)

## Configuration Checklist

- [x] Celery workers configured with correct command
- [x] Redis service running and accessible
- [x] CELERY_BROKER_URL pointing to Redis
- [x] CELERY_RESULT_BACKEND pointing to Redis
- [x] PUSH_NOTIFICATION_ENABLED set to 'true'
- [x] NOTIFICATION_CHANNELS includes 'push'
- [ ] EXPO_ACCESS_TOKEN replaced with actual token (⚠️ **ACTION REQUIRED**)
- [x] Environment variables loaded in all services
- [x] Celery worker depends on Redis and Server
- [x] Celery beat configured with DatabaseScheduler

## Next Steps

1. **Obtain Expo Access Token** from Expo Dashboard
2. **Update server/.env** with the actual token
3. **Restart Docker services** to apply changes
4. **Run database migrations** to create push notification models
5. **Grant permissions** to admin users via Django admin
6. **Send test notification** to verify configuration
