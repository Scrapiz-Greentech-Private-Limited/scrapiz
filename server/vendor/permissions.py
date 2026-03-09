from rest_framework.permissions import BasePermission


class IsVendor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_vendor
            and hasattr(request.user, 'vendor')
        )


class IsActiveVendor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_vendor
            and hasattr(request.user, 'vendor')
            and request.user.vendor.is_active_vendor
        )


class IsVerifiedVendor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_vendor
            and hasattr(request.user, 'vendor')
            and request.user.vendor.verification_status == 'approved'
        )


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )
