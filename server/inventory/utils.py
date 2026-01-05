from .models import Status
from django.core.cache import cache

def get_status_by_name(status_name):
    """
    Get or create a status by name with caching to reduce DB queries.
    """
    if not status_name:
        return None
        
    cache_key = f"status_{status_name.lower()}"
    status_id = cache.get(cache_key)
    
    if status_id:
        try:
            return Status.objects.get(id=status_id)
        except Status.DoesNotExist:
            cache.delete(cache_key)
            
    status, created = Status.objects.get_or_create(
        name__iexact=status_name,
        defaults={'name': status_name.capitalize()}
    )
    
    # Cache the ID for 1 hour
    cache.set(cache_key, status.id, 3600)
    return status
