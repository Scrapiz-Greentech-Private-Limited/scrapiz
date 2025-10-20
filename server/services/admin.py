from django.contrib import admin
from .models import ServiceBooking


@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'service',
        'name',
        'phone',
        'status',
        'created_at',
    )
    list_filter = ('status', 'service', 'created_at')
    search_fields = ('service', 'name', 'phone', 'address')
