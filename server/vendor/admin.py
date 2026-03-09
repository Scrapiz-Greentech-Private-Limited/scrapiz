from django.contrib import admin

from vendor.models import (
    ArrivalVerification,
    Vendor,
    VendorAuditLog,
    VendorBiometric,
    VendorDocument,
)


class VendorDocumentInline(admin.TabularInline):
    model = VendorDocument
    extra = 0
    readonly_fields = ('uploaded_at', 'verified_at', 'verified_by')


class VendorAuditLogInline(admin.TabularInline):
    model = VendorAuditLog
    extra = 0
    readonly_fields = ('action', 'actor', 'timestamp', 'previous_value', 'new_value', 'details')
    fields = ('action', 'actor', 'timestamp', 'details')
    ordering = ['-timestamp']
    max_num = 10

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'user', 'verification_status', 'is_active_vendor', 'service_city', 'created_at')
    list_filter = ('verification_status', 'is_active_vendor')
    search_fields = ('full_name', 'user__email', 'user__name', 'service_city')
    ordering = ('-created_at',)
    inlines = [VendorDocumentInline, VendorAuditLogInline]
    readonly_fields = ('aadhaar_hash', 'created_at', 'updated_at')


@admin.register(VendorDocument)
class VendorDocumentAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'document_type', 'verification_status', 'uploaded_at', 'verified_at')
    list_filter = ('verification_status', 'document_type')
    search_fields = ('vendor__full_name',)
    ordering = ('-uploaded_at',)


@admin.register(VendorBiometric)
class VendorBiometricAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'model_version', 'created_at', 'updated_at')
    search_fields = ('vendor__full_name',)
    readonly_fields = ('embedding_vector', 'created_at', 'updated_at')


@admin.register(VendorAuditLog)
class VendorAuditLogAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'action', 'actor', 'timestamp')
    list_filter = ('action',)
    search_fields = ('vendor__full_name',)
    ordering = ('-timestamp',)
    readonly_fields = ('vendor', 'action', 'actor', 'timestamp', 'previous_value', 'new_value', 'details')


@admin.register(ArrivalVerification)
class ArrivalVerificationAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'similarity_score', 'is_verified', 'flag_for_manual_review', 'created_at')
    list_filter = ('is_verified', 'flag_for_manual_review')
    search_fields = ('vendor__full_name',)
    ordering = ('-created_at',)
