from django.urls import path

from vendor.views import (
    AdminApproveVendorView,
    AdminRejectVendorView,
    AdminVendorDetailView,
    AdminVendorListView,
    CreateVendorProfileView,
    SubmitVerificationView,
    UpdateVendorProfileView,
    UploadDocumentView,
    UploadFaceImageView,
    VendorProfileView,
    VerifyArrivalView,
)

urlpatterns = [
    # Vendor-facing
    path('create-profile/', CreateVendorProfileView.as_view(), name='vendor-create-profile'),
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('profile/update/', UpdateVendorProfileView.as_view(), name='vendor-profile-update'),
    path('upload-document/', UploadDocumentView.as_view(), name='vendor-upload-document'),
    path('submit-verification/', SubmitVerificationView.as_view(), name='vendor-submit-verification'),
    path('upload-face/', UploadFaceImageView.as_view(), name='vendor-upload-face'),
    path('verify-arrival/', VerifyArrivalView.as_view(), name='vendor-verify-arrival'),
    # Admin
    path('admin/list/', AdminVendorListView.as_view(), name='admin-vendor-list'),
    path('admin/<int:vendor_id>/', AdminVendorDetailView.as_view(), name='admin-vendor-detail'),
    path('admin/<int:vendor_id>/approve/', AdminApproveVendorView.as_view(), name='admin-vendor-approve'),
    path('admin/<int:vendor_id>/reject/', AdminRejectVendorView.as_view(), name='admin-vendor-reject'),
]
