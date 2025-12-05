from django.contrib import admin
from django.db.models import Count
from django.http import HttpResponse
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import render
from django.db.models import Q
import csv
import io
from .models import ServiceableCity, ServiceablePincode


class ServiceablePincodeInline(admin.TabularInline):
    """Inline admin for managing pincodes within a city"""
    model = ServiceablePincode
    extra = 1
    fields = ('pincode', 'area_name')
    verbose_name = 'Pincode'
    verbose_name_plural = 'Pincodes'


@admin.register(ServiceableCity)
class ServiceableCityAdmin(admin.ModelAdmin):
    """Admin interface for managing serviceable cities"""
    
    list_display = (
        'name_with_icon',
        'state',
        'status_badge',
        'pincode_count_display',
        'coordinates_display',
        'radius_km',
        'updated_at'
    )
    list_filter = ('status', 'state', 'created_at', 'updated_at')
    search_fields = ('name', 'state')
    readonly_fields = ('created_at', 'updated_at', 'pincode_count_display')
    inlines = [ServiceablePincodeInline]
    
    # Enable autocomplete for foreign key lookups
    def get_search_results(self, request, queryset, search_term):
        """Customize search for autocomplete"""
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        return queryset, use_distinct
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'state', 'status')
        }),
        ('Geographic Details', {
            'fields': ('latitude', 'longitude', 'radius_km')
        }),
        ('Statistics', {
            'fields': ('pincode_count_display',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_available', 'mark_as_coming_soon', 'export_cities_csv']
    
    def name_with_icon(self, obj):
        """Display city name with status icon"""
        icon = "✓" if obj.status == 'available' else "⏳"
        return f"{icon} {obj.name}"
    name_with_icon.short_description = 'City'
    
    def status_badge(self, obj):
        """Display status as a colored badge"""
        if obj.status == 'available':
            color = '#28a745'  # Green
            text = 'Available'
        else:
            color = '#ffc107'  # Yellow
            text = 'Coming Soon'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color, text
        )
    status_badge.short_description = 'Status'
    
    def pincode_count_display(self, obj):
        """Display the number of pincodes for this city"""
        count = obj.pincode_count
        if count == 0:
            return format_html('<span style="color: #dc3545;">0 pincodes</span>')
        return format_html('<span style="color: #28a745;">{} pincode{}</span>', 
                          count, 's' if count != 1 else '')
    pincode_count_display.short_description = 'Pincodes'
    
    def coordinates_display(self, obj):
        """Display coordinates in a readable format"""
        return f"{obj.latitude:.4f}, {obj.longitude:.4f}"
    coordinates_display.short_description = 'Coordinates'
    
    def mark_as_available(self, request, queryset):
        """Bulk action to mark cities as available"""
        updated = queryset.update(status='available')
        self.message_user(request, f'{updated} city/cities marked as available.')
    mark_as_available.short_description = 'Mark selected cities as Available'
    
    def mark_as_coming_soon(self, request, queryset):
        """Bulk action to mark cities as coming soon"""
        updated = queryset.update(status='coming_soon')
        self.message_user(request, f'{updated} city/cities marked as coming soon.')
    mark_as_coming_soon.short_description = 'Mark selected cities as Coming Soon'
    
    def export_cities_csv(self, request, queryset):
        """Export selected cities to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="serviceable_cities.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'City Name', 'State', 'Status', 'Latitude', 'Longitude', 
            'Radius (km)', 'Pincode Count', 'Created At', 'Updated At'
        ])
        
        for city in queryset:
            writer.writerow([
                city.name,
                city.state,
                city.get_status_display(),
                city.latitude,
                city.longitude,
                city.radius_km,
                city.pincode_count,
                city.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                city.updated_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_cities_csv.short_description = 'Export selected cities to CSV'
    
    def get_urls(self):
        """Add custom admin URLs"""
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_site.admin_view(self.dashboard_view), 
                 name='serviceability_dashboard'),
        ]
        return custom_urls + urls
    
    def dashboard_view(self, request):
        """Custom dashboard view with statistics"""
        context = {
            **self.admin_site.each_context(request),
            'title': 'Serviceability Dashboard',
            'total_cities': ServiceableCity.objects.count(),
            'available_cities': ServiceableCity.objects.filter(status='available').count(),
            'coming_soon_cities': ServiceableCity.objects.filter(status='coming_soon').count(),
            'total_pincodes': ServiceablePincode.objects.count(),
            'cities_by_state': ServiceableCity.objects.values('state').annotate(
                count=Count('id')
            ).order_by('-count'),
            'top_cities': ServiceableCity.objects.annotate(
                pincode_count=Count('pincodes')
            ).order_by('-pincode_count')[:10],
        }
        return render(request, 'admin/serviceability/dashboard.html', context)


@admin.register(ServiceablePincode)
class ServiceablePincodeAdmin(admin.ModelAdmin):
    """Admin interface for managing serviceable pincodes"""
    
    list_display = (
        'pincode',
        'city_link',
        'area_name',
        'city_status',
        'created_at'
    )
    list_filter = ('city__status', 'city__state', 'city', 'created_at')
    search_fields = ('pincode', 'area_name', 'city__name', 'city__state')
    readonly_fields = ('created_at',)
    autocomplete_fields = ['city']
    
    fieldsets = (
        ('Pincode Information', {
            'fields': ('pincode', 'city', 'area_name')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['export_pincodes_csv', 'bulk_import_pincodes']
    
    def city_link(self, obj):
        """Display city as a clickable link"""
        url = f'/admin/serviceability/serviceablecity/{obj.city.id}/change/'
        return format_html('<a href="{}">{}</a>', url, obj.city.name)
    city_link.short_description = 'City'
    
    def city_status(self, obj):
        """Display the status of the associated city"""
        if obj.city.status == 'available':
            color = '#28a745'
            text = 'Available'
        else:
            color = '#ffc107'
            text = 'Coming Soon'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; '
            'border-radius: 3px; font-size: 11px;">{}</span>',
            color, text
        )
    city_status.short_description = 'City Status'
    
    def export_pincodes_csv(self, request, queryset):
        """Export selected pincodes to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="serviceable_pincodes.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Pincode', 'City', 'State', 'Area Name', 'City Status', 'Created At'])
        
        for pincode in queryset.select_related('city'):
            writer.writerow([
                pincode.pincode,
                pincode.city.name,
                pincode.city.state,
                pincode.area_name or '',
                pincode.city.get_status_display(),
                pincode.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_pincodes_csv.short_description = 'Export selected pincodes to CSV'
    
    def bulk_import_pincodes(self, request, queryset):
        """Bulk import pincodes from CSV"""
        # This action will redirect to a custom import page
        # For now, we'll show a message with instructions
        self.message_user(
            request,
            'To bulk import pincodes, use the "Import Pincodes" button at the top of the page.',
            level='info'
        )
    bulk_import_pincodes.short_description = 'Bulk import pincodes from CSV'
    
    def get_urls(self):
        """Add custom admin URLs for bulk import"""
        urls = super().get_urls()
        custom_urls = [
            path('import/', self.admin_site.admin_view(self.import_pincodes_view), 
                 name='serviceability_import_pincodes'),
        ]
        return custom_urls + urls
    
    def import_pincodes_view(self, request):
        """Custom view for bulk importing pincodes"""
        if request.method == 'POST':
            csv_file = request.FILES.get('csv_file')
            city_id = request.POST.get('city')
            
            if not csv_file:
                self.message_user(request, 'Please select a CSV file.', level='error')
                return self._render_import_form(request)
            
            if not city_id:
                self.message_user(request, 'Please select a city.', level='error')
                return self._render_import_form(request)
            
            try:
                city = ServiceableCity.objects.get(id=city_id)
            except ServiceableCity.DoesNotExist:
                self.message_user(request, 'Invalid city selected.', level='error')
                return self._render_import_form(request)
            
            # Process CSV file
            try:
                decoded_file = csv_file.read().decode('utf-8')
                io_string = io.StringIO(decoded_file)
                reader = csv.reader(io_string)
                
                # Skip header if present
                first_row = next(reader, None)
                if first_row and not first_row[0].isdigit():
                    # This is a header row, skip it
                    pass
                else:
                    # First row is data, process it
                    io_string.seek(0)
                    reader = csv.reader(io_string)
                
                success_count = 0
                error_count = 0
                errors = []
                
                for row in reader:
                    if not row or not row[0].strip():
                        continue
                    
                    pincode = row[0].strip()
                    area_name = row[1].strip() if len(row) > 1 else ''
                    
                    # Validate pincode format
                    import re
                    if not re.match(r'^[1-9]\d{5}$', pincode):
                        error_count += 1
                        errors.append(f'{pincode}: Invalid format (must be 6 digits starting with 1-9)')
                        continue
                    
                    # Check if pincode already exists
                    if ServiceablePincode.objects.filter(pincode=pincode).exists():
                        error_count += 1
                        errors.append(f'{pincode}: Already exists')
                        continue
                    
                    # Create pincode
                    try:
                        ServiceablePincode.objects.create(
                            pincode=pincode,
                            city=city,
                            area_name=area_name
                        )
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        errors.append(f'{pincode}: {str(e)}')
                
                # Show results
                if success_count > 0:
                    self.message_user(
                        request,
                        f'Successfully imported {success_count} pincode(s).',
                        level='success'
                    )
                
                if error_count > 0:
                    error_message = f'Failed to import {error_count} pincode(s).'
                    if errors:
                        error_message += ' Errors: ' + '; '.join(errors[:10])
                        if len(errors) > 10:
                            error_message += f' ... and {len(errors) - 10} more'
                    self.message_user(request, error_message, level='warning')
                
                if success_count == 0 and error_count == 0:
                    self.message_user(request, 'No valid pincodes found in CSV file.', level='warning')
                
            except Exception as e:
                self.message_user(request, f'Error processing CSV file: {str(e)}', level='error')
            
            return self._render_import_form(request)
        
        return self._render_import_form(request)
    
    def _render_import_form(self, request):
        """Render the import form"""
        context = {
            **self.admin_site.each_context(request),
            'title': 'Import Pincodes',
            'cities': ServiceableCity.objects.all().order_by('name'),
            'opts': self.model._meta,
        }
        return render(request, 'admin/serviceability/import_pincodes.html', context)


# Customize the admin site header
admin.site.site_header = 'Scrapiz Service Area Management'
admin.site.site_title = 'Scrapiz Admin'
admin.site.index_title = 'Service Area Administration'
