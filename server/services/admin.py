from django.contrib import admin
from django.utils.html import format_html
from .models import ServiceBooking


@admin.register(ServiceBooking)
class ServiceBookingAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'service',
        'name',
        'phone',
        'status',
        'meeting_link_display',
        'created_at',
    )
    list_filter = ('status', 'service', 'created_at')
    search_fields = ('service', 'name', 'phone', 'address', 'user__email')
    readonly_fields = ('meeting_link', 'meeting_event_id', 'created_at')
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('user', 'service', 'status')
        }),
        ('Contact Details', {
            'fields': ('name', 'phone', 'address')
        }),
        ('Schedule', {
            'fields': ('preferred_datetime', 'notes')
        }),
        ('Meeting Details', {
            'fields': ('meeting_link', 'meeting_event_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )
    
    def meeting_link_display(self, obj):
        """Display meeting link as clickable button in admin list"""
        if obj.meeting_link:
            return format_html(
                '<a href="{}" target="_blank" style="background-color: #2563eb; color: white; padding: 5px 10px; text-decoration: none; border-radius: 4px;">Join Meet</a>',
                obj.meeting_link
            )
        return '-'
    meeting_link_display.short_description = 'Meeting'
