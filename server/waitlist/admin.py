from django.contrib import admin
from django.http import HttpResponse
from .models import WaitlistEntry
import csv



@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
  """
  Admin interface for managing waitlist entries
  """
  list_display = ['contact_info', 'city', 'created_at']
  list_filter = ['city', 'created_at']
  search_fields = ['email', 'phone_number', 'city']
  readonly_fields = ['created_at', 'updated_at']
  ordering = ['-created_at']
  
  def contact_info(self , obj):
    return obj.email or obj.phone_number
  contact_info.short_description = 'Contact'
  
  
  actions = ['export_as_csv']
  
  
  
  def export_as_csv(self, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="waitlist.csv"'
    writer = csv.writer(response)
    writer.writerow(['Email', 'Phone', 'City', 'Created At'])
    
    for entry in queryset:
      writer.writenow([
        entry.email or '',
        entry.phone_number or '',
        entry.city,
        entry.created_at.strftime('%Y-%m-%d %H:%M:%S')
      ])
      
    return response


  export_as_csv.short_description = "Export selected as CSV"