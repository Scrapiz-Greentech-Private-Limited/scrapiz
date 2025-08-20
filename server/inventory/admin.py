from django.contrib import admin
from .models import Category, Product, Status, OrderNo, Order, AddressModel

# Orders tabular inline
class OrderInline(admin.TabularInline):  
    model = Order
    extra = 0  
    fields = ('product', 'quantity')  
    readonly_fields = ('product', 'quantity')  # agar edit allowed nahi chahiye

# OrderNo admin
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
        'created_at'
    )
    list_filter = ('status', 'created_at')
    inlines = [OrderInline]

    readonly_fields = (
        'display_address', 
        'created_at', 
        'primary_phone', 
        'secondary_phone', 
        'delivery_suggestion'
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
                'created_at'
            )
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

# Address admin with list_display & search
class AddressModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'phone_number', 'city', 'delivery_suggestion')
    search_fields = ('id', 'name', 'user__email', 'city', 'phone_number')
    list_filter = ('city', 'user')  # optional filter

# Register models
admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Status)
admin.site.register(OrderNo, OrderNoAdmin)
admin.site.register(Order, admin.ModelAdmin)
admin.site.register(AddressModel, AddressModelAdmin)  # ✅ correct admin class
