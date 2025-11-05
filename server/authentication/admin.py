from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AuditLog, AccountDeletionFeedback


# ✅ Register User model in admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('name', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2'),
        }),
    )


# ✅ Register AuditLog model in admin
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'ip_address', 'timestamp')
    list_filter = ('action', 'user')
    search_fields = ('user__email', 'user__name', 'ip_address')
    ordering = ('-timestamp',)


# ✅ Register AccountDeletionFeedback model in admin
@admin.register(AccountDeletionFeedback)
class AccountDeletionFeedbackAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'user_name', 'reason', 'deleted_at')
    list_filter = ('reason', 'deleted_at')
    search_fields = ('user_email', 'user_name', 'comments')
    ordering = ('-deleted_at',)
    readonly_fields = ('user_id', 'user_email', 'user_name', 'reason', 'comments', 'deleted_at')
    
    def has_add_permission(self, request):
        # Prevent manual creation of feedback records
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of feedback records for audit purposes
        return False


# ✅ Admin branding
admin.site.site_header = "Scrapiz Administrator"
admin.site.site_title = "Scrapiz Admin Portal"
admin.site.index_title = "Welcome to Scrapiz Admin Dashboard"
admin.site.site_footer = "This inventory system is proudly made by Crodlin Technology"
