"""
Test script to verify notification system configuration
Run with: python manage.py shell < test_notifications.py
"""

print("=" * 60)
print("NOTIFICATION SYSTEM TEST")
print("=" * 60)

# Test 1: Check if notification app is installed
print("\n1. Checking if notifications app is installed...")
try:
    from notifications.config import NotificationConfig
    print("   ✅ Notifications app found")
except ImportError as e:
    print(f"   ❌ Error: {e}")
    exit(1)

# Test 2: Validate configuration
print("\n2. Validating configuration...")
try:
    validation = NotificationConfig.validate_config()
    print(f"   Enabled: {validation['enabled']}")
    print(f"   Channels: {validation['channels']}")
    
    if validation['email']['configured']:
        print(f"   ✅ Email configured")
        print(f"      Recipients: {validation['email']['recipients']}")
    else:
        print(f"   ⚠️  Email not configured: {validation['email']['error']}")
    
    if validation['whatsapp']['configured']:
        print(f"   ✅ WhatsApp configured")
        print(f"      Recipients: {validation['whatsapp']['recipients']}")
    else:
        print(f"   ⚠️  WhatsApp not configured: {validation['whatsapp']['error']}")
    
    if validation['dashboard']['configured']:
        print(f"   ✅ Dashboard configured")
    else:
        print(f"   ⚠️  Dashboard not configured: {validation['dashboard']['error']}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Check Celery connection
print("\n3. Checking Celery connection...")
try:
    from celery import current_app
    inspect = current_app.control.inspect()
    active_workers = inspect.active()
    
    if active_workers:
        print(f"   ✅ Celery workers active: {list(active_workers.keys())}")
    else:
        print("   ⚠️  No active Celery workers found")
        print("      Make sure celery_worker container is running")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Check Redis connection
print("\n4. Checking Redis connection...")
try:
    from django.core.cache import cache
    cache.set('test_key', 'test_value', 10)
    value = cache.get('test_key')
    if value == 'test_value':
        print("   ✅ Redis connection working")
    else:
        print("   ⚠️  Redis connection issue")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 5: Check if signal is registered
print("\n5. Checking if order creation signal is registered...")
try:
    from django.db.models.signals import post_save
    from inventory.models import OrderNo
    
    receivers = post_save._live_receivers(OrderNo)
    if receivers:
        print(f"   ✅ Signal registered ({len(receivers)} receiver(s))")
        for receiver in receivers:
            print(f"      - {receiver.__name__}")
    else:
        print("   ❌ No signal receivers found")
        print("      Signal may not be registered properly")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 6: Test notification task (dry run)
print("\n6. Testing notification task (dry run)...")
try:
    from notifications.tasks import send_order_notifications_task
    print("   ✅ Task import successful")
    print("   ℹ️  To test with real order, create an order in the app")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 7: Check Supabase connection (if configured)
print("\n7. Checking Supabase connection...")
try:
    from notifications.services.supabase_client import SupabaseNotificationClient
    client = SupabaseNotificationClient()
    print("   ✅ Supabase client initialized")
    
    # Try to query (will fail if table doesn't exist)
    try:
        notifications = client.query_notifications({'limit': 1})
        print(f"   ✅ Supabase table accessible ({len(notifications)} records)")
    except Exception as e:
        print(f"   ⚠️  Table query failed: {str(e)}")
        print("      Make sure 'order_notifications' table exists")
        
except Exception as e:
    print(f"   ⚠️  Supabase not configured: {str(e)}")

# Summary
print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
print("\nIf you see ✅ for most tests, the system is ready!")
print("\nTo test end-to-end:")
print("1. Create an order in the app")
print("2. Check logs: docker-compose logs -f celery_worker")
print("3. Check email inbox")
print("4. Check WhatsApp messages")
print("5. Check Supabase table")
print("\n" + "=" * 60)
