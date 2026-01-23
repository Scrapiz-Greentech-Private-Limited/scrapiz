from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db import models
from .models import CarouselImage, AppConfig


@admin.register(AppConfig)
class AppConfigAdmin(admin.ModelAdmin):
    list_display = ['id', 'min_app_version', 'enforce_sell_screen_gate', 'maintenance_mode', 'enable_location_skip', 'updated_at', 'updated_by']
    readonly_fields = ['updated_at', 'updated_by']
    
    fieldsets = (
        ('Version Control', {
            'fields': ('min_app_version', 'force_update_url_android', 'force_update_url_ios'),
            'description': 'Control app version requirements and update URLs'
        }),
        ('Feature Flags', {
            'fields': ('enforce_sell_screen_gate', 'enable_location_skip', 'maintenance_mode'),
            'description': 'Toggle app features and modes'
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',),
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one instance
        return not AppConfig.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion
        return False
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(CarouselImage)
class CarouselImageAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'title', 'order', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'image_url')
    list_editable = ('order', 'is_active')
    ordering = ('order', '-created_at')
    
    fieldsets = (
        ('Carousel Image Information', {
            'fields': ('title', 'image_url', 'image_preview_large'),
            'description': 'Add carousel images by uploading to S3 and pasting the URL here.'
        }),
        ('Display Settings', {
            'fields': ('order', 'is_active'),
            'description': 'Control the order and visibility of carousel images.'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ('image_preview_large', 'created_at', 'updated_at')
    
    def image_preview(self, obj):
        """Display small thumbnail in list view"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="width: 80px; height: 40px; object-fit: cover; border-radius: 4px;" />',
                obj.image_url
            )
        return "No Image"
    image_preview.short_description = 'Preview'
    
    def image_preview_large(self, obj):
        """Display larger preview in detail view"""
        if obj.image_url:
            return format_html(
                '<div style="margin: 10px 0;">'
                '<img src="{}" style="max-width: 600px; max-height: 300px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />'
                '<p style="margin-top: 8px; color: #666; font-size: 12px;">Preview of carousel image</p>'
                '</div>',
                obj.image_url
            )
        return format_html(
            '<p style="color: #999;">No image URL provided yet. Add an S3 URL above to see preview.</p>'
        )
    image_preview_large.short_description = 'Image Preview'
    
    class Media:
        css = {
            'all': ('admin/css/carousel_admin.css',)
        }
        js = ('admin/js/carousel_admin.js',)
    
    def save_model(self, request, obj, form, change):
        """Custom save to handle ordering"""
        if not change:  # New object
            # If no order specified, put it at the end
            if obj.order == 0:
                max_order = CarouselImage.objects.aggregate(
                    max_order=models.Max('order')
                )['max_order']
                obj.order = (max_order or 0) + 1
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Order by display order"""
        qs = super().get_queryset(request)
        return qs.order_by('order', '-created_at')
