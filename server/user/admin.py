from django.contrib import admin
from .models import AddressModel

class AddressModelAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'user', 'city')  # list me dikhe jo columns chahiye
    search_fields = ('id', 'name', 'user__email', 'city')  # search bar me search possible

# admin.site.register(AddressModel, AddressModelAdmin)
