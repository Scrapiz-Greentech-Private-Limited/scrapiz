from django.contrib import admin
from django.utils.html import format_html
from decimal import Decimal
from .models import Category, Product, Status, OrderNo, Order, AddressModel

class OrderInline(admin.TabularInline):  
    model = Order
    extra = 0  
    fields = ('product', 'quantity')  
    readonly_fields = ('product', 'quantity')  

class OrderNoAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'order_number', 
        'get_user', 
        'primary_phone', 
        'secondary_phone', 
        'delivery_suggestion', 
        'get_address', 
        'status',
        'estimated_order_value',
        'redeemed_referral_bonus',
        'image_count',
        'created_at'
    )
    list_filter = (
      'status', 
      'created_at',

    )
    inlines = [OrderInline]

    readonly_fields = (
        'display_address', 
        'created_at', 
        'primary_phone', 
        'secondary_phone', 
        'delivery_suggestion',
        'display_images',
        'order_number',
        'display_financial_summary'
    )

    fieldsets = (
        (None, {
            'fields': (
                'order_number',
                'user',
                'primary_phone',
                'secondary_phone',
                'delivery_suggestion',
                'status',
                'display_address',
                'display_images',
                'created_at'
            )
        }),
        ('Financial Information',{
          'fields': (
            'estimated_order_value',
            'redeemed_referral_bonus',
            'display_financial_summary'
          ),
          'classes': ('collapse',)  
        }),
    )

    def get_user(self, obj):
        return obj.user
    get_user.short_description = "User"

    def primary_phone(self, obj):
        return getattr(obj.user, 'phone_number', '-')
    primary_phone.short_description = "Primary Phone"

    def secondary_phone(self, obj):
        if obj.address and obj.address.phone_number:
            return obj.address.phone_number
        return "-"
    secondary_phone.short_description = "Secondary Phone"

    def delivery_suggestion(self, obj):
        if obj.address and obj.address.delivery_suggestion:
            return obj.address.delivery_suggestion
        return "-"
    delivery_suggestion.short_description = "Delivery Suggestion"

    def get_address(self, obj):
        address = obj.address
        if address:
            return f"{address.id} | {address.name}, {address.room_number}, {address.street}, {address.area}, {address.city}, {address.state}, {address.country} - {address.pincode}"
        return "-"
    get_address.short_description = "Address"

    def display_address(self, obj):
        return self.get_address(obj)
    display_address.short_description = "Address"

    def image_count(self, obj):
        """Display count of images in list view"""
        if obj.images and isinstance(obj.images, list):
            return f"{len(obj.images)} image(s)"
        return "0 images"
    image_count.short_description = "Images"

    def display_images(self, obj):
        """Display images with clickable links in detail view"""
        from django.utils.html import format_html
        
        if not obj.images or len(obj.images) == 0:
            return "No images uploaded"
        html_parts = []
        for idx, image_url in enumerate(obj.images, 1):
            html_parts.append(
            f'<div style="margin-bottom: 10px;">'
            f'<strong>Image {idx}:</strong><br>'
            f'<a href="{image_url}" target="_blank">{image_url}</a><br>'
            f'<img src="{image_url}" style="max-width: 200px; max-height: 200px; margin-top: 5px;" />'
            f'</div>'
            )
        return format_html('<br>'.join(html_parts))
    display_images.short_description = "Order Images"
    def display_financial_summary(self, obj):
      estimated = obj.estimated_order_value or Decimal('0.00')
      referral = obj.redeemed_referral_bonus or Decimal('0.00')
      total_payout = estimated + referral
      html = f'''
      <div style="padding: 10px; background: #f0fdf4; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 5px;"><strong>Estimated Order Value:</strong></td>
                    <td style="padding: 5px; text-align: right;">₹{estimated}</td>
                </tr>
                <tr>
                    <td style="padding: 5px;"><strong>Referral Bonus Applied:</strong></td>
                    <td style="padding: 5px; text-align: right; color: #16a34a;">+₹{referral}</td>
                </tr>
                <tr style="border-top: 2px solid #16a34a;">
                    <td style="padding: 5px;"><strong>Total Payout:</strong></td>
                    <td style="padding: 5px; text-align: right; font-size: 16px; color: #16a34a;">
                        <strong>₹{total_payout}</strong>
                    </td>
                </tr>
            </table>
      </div>
      '''
      return format_html(html)
    display_financial_summary.short_description = "Financial Summary"

# Address admin with list_display & search
class AddressModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'phone_number', 'city', 'delivery_suggestion')
    search_fields = ('id', 'name', 'user__email', 'city', 'phone_number')
    list_filter = ('city', 'user')  # optional filter
    
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'unit', 'image_thumbnail', 'max_rate', 'min_rate')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    readonly_fields = ('display_image',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'category', 'unit', 'description', 'max_rate', 'min_rate')
        }),
        ('Image', {
            'fields': ('image_url', 'display_image'),
        }),
    )
    
    def image_thumbnail(self, obj):
        """Display thumbnail in list view"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;" />',
                obj.image_url
            )
        return "No image"
    image_thumbnail.short_description = "Image"
    
    def display_image(self, obj):
        """Display full image in detail view"""
        if obj.image_url:
            return format_html(
                '<a href="{}" target="_blank">{}</a><br>'
                '<img src="{}" style="max-width: 300px; max-height: 300px; margin-top: 10px;" />',
                obj.image_url, obj.image_url, obj.image_url
            )
        return "No image uploaded"
    display_image.short_description = "Product Image"


class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'image_thumbnail', 'product_count')
    search_fields = ('name',)
    readonly_fields = ('display_image',)
    
    fieldsets = (
        (None, {
            'fields': ('name',)
        }),
        ('Image', {
            'fields': ('image_url', 'display_image'),
        }),
    )
    
    def image_thumbnail(self, obj):
        """Display thumbnail in list view"""
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;" />',
                obj.image_url
            )
        return "No image"
    image_thumbnail.short_description = "Image"
    
    def display_image(self, obj):
        """Display full image in detail view"""
        if obj.image_url:
            return format_html(
                '<a href="{}" target="_blank">{}</a><br>'
                '<img src="{}" style="max-width: 300px; max-height: 300px; margin-top: 10px;" />',
                obj.image_url, obj.image_url, obj.image_url
            )
        return "No image uploaded"
    display_image.short_description = "Category Image"
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"

  

admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(Status)
admin.site.register(OrderNo, OrderNoAdmin)
admin.site.register(Order, admin.ModelAdmin)
admin.site.register(AddressModel, AddressModelAdmin)  # ✅ correct admin class
