# Notification System Optimization Changes

## Changes Made

### 1. Task Time Limit Extended
**Changed:** `CELERY_TASK_TIME_LIMIT` from 30 minutes to 4 days
- **Before**: `30 * 60` (1,800 seconds)
- **After**: `4 * 24 * 60 * 60` (345,600 seconds)
- **Reason**: Allows long-running notification tasks to complete without timeout

### 2. Summary Report Frequency Changed
**Changed:** Daily summary to 4-day summary
- **Before**: Runs every 24 hours (86,400 seconds)
- **After**: Runs every 4 days (345,600 seconds)
- **Reason**: Reduces unnecessary processing and email frequency

### 3. Summary Report Optimization
**Changes in `send_daily_failure_summary_task()`:**
- Renamed to reflect 4-day period (function name kept for compatibility)
- Changed time window from 1 day to 4 days
- Reduced query limit from 100 to 50 notifications
- Only sends email if there are actual failures (saves SMTP resources)
- Updated email subject and content to reflect 4-day period

### 4. Resource Optimization Settings Added
**New Celery configurations:**

```python
# Acknowledge tasks after completion, not before
CELERY_TASK_ACKS_LATE = True

# Fetch one task at a time to reduce memory usage
CELERY_WORKER_PREFETCH_MULTIPLIER = 1

# Restart worker after 100 tasks to prevent memory leaks
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100

# Soft time limit at 3 days (gives time for cleanup before hard limit)
CELERY_TASK_SOFT_TIME_LIMIT = 3 * 24 * 60 * 60

# Results expire after 1 day to save Redis memory
CELERY_RESULT_EXPIRES = 86400

# Keep results for monitoring
CELERY_TASK_IGNORE_RESULT = False

# Store errors even if results ignored
CELERY_TASK_STORE_ERRORS_EVEN_IF_IGNORED = True
```

## Resource Savings

### Memory Optimization
- **Worker Prefetch**: Only 1 task loaded at a time (vs default 4)
- **Worker Restart**: Automatic restart after 100 tasks prevents memory leaks
- **Result Expiry**: Old results cleaned up after 1 day

### Processing Optimization
- **Summary Frequency**: 75% reduction (4 days vs 1 day)
- **Query Limit**: 50% reduction (50 vs 100 notifications)
- **Conditional Email**: Only sends if failures exist

### Network Optimization
- **Fewer SMTP Connections**: 75% fewer summary emails
- **Smaller Queries**: Reduced data transfer from Supabase

## Performance Impact

### Before Optimization
- Task timeout: 30 minutes
- Summary emails: 365 per year
- Worker memory: Grows over time
- Redis memory: Accumulates old results

### After Optimization
- Task timeout: 4 days (no premature failures)
- Summary emails: ~91 per year (75% reduction)
- Worker memory: Resets every 100 tasks
- Redis memory: Auto-cleanup after 1 day

## Schedule Summary

| Task | Frequency | Purpose |
|------|-----------|---------|
| `send_order_notifications_task` | On-demand | Send notifications for new orders |
| `retry_failed_notifications_task` | Every hour | Retry failed notifications |
| `send_daily_failure_summary_task` | Every 4 days | Send failure summary email |

## Restart Required

After these changes, restart the Celery services:

```bash
docker-compose restart celery_worker celery_beat
```

## Monitoring

Check that optimizations are working:

```bash
# View worker stats
docker exec -it celery_worker_scrapiz celery -A server inspect stats

# Check active tasks
docker exec -it celery_worker_scrapiz celery -A server inspect active

# Monitor Redis memory
docker exec -it redis_scrapiz redis-cli INFO memory
```

## Configuration Options

You can adjust these settings in `server/server/settings.py`:

```python
# Adjust worker restart frequency (default: 100)
CELERY_WORKER_MAX_TASKS_PER_CHILD = 50  # More frequent restarts

# Adjust result expiry (default: 1 day)
CELERY_RESULT_EXPIRES = 43200  # 12 hours

# Adjust prefetch (default: 1)
CELERY_WORKER_PREFETCH_MULTIPLIER = 2  # Fetch 2 tasks at a time
```

## Benefits

✅ **Reduced Memory Usage**: Worker restarts prevent memory leaks
✅ **Reduced Network Traffic**: Fewer emails and smaller queries
✅ **Reduced Redis Usage**: Automatic cleanup of old results
✅ **Better Reliability**: Longer task timeout prevents premature failures
✅ **Lower Costs**: Less SMTP usage, less database queries
✅ **Cleaner Inbox**: Fewer summary emails for admins

## Trade-offs

⚠️ **Less Frequent Summaries**: Admins get reports every 4 days instead of daily
- **Mitigation**: Failed notifications still retry every hour
- **Mitigation**: Real-time notifications still work immediately

⚠️ **Slower Task Processing**: Only 1 task prefetched at a time
- **Mitigation**: For notification system, this is acceptable
- **Mitigation**: Can increase if needed for high volume

## Rollback

To revert to original settings:

```python
# In settings.py
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_WORKER_PREFETCH_MULTIPLIER = 4  # Default
CELERY_WORKER_MAX_TASKS_PER_CHILD = None  # No restart

# In CELERY_BEAT_SCHEDULE
'daily-failure-summary': {
    'schedule': 86400.0,  # Daily
}
```

Then restart:
```bash
docker-compose restart celery_worker celery_beat
```
