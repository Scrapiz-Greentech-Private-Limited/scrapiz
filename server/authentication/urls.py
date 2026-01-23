from django.urls import path
from .views.user import  RegisterView, LoginView, LogoutView, PasswordResetView, PasswordResetRequestView, ResendotpView, UserView,ReferredUsersView , ReferralTransactionsView,RedeemReferralBalanceView, AuditLogView, DeletionFeedbackView
from .views.oauth import GoogleOAuthLoginView, AppleOAuthLoginView, AppleOAuthConfirmLinkView
from .views.phone_auth import PhoneVerifyView, PhoneCompleteProfileView, PhoneConfirmLinkView
from .views.admin_referral import (
    AdminAllReferredUsersView,
    AdminAllReferralTransactionsView,
    AdminUserReferralDetailsView,
    AdminReferralStatsView,
)
from .views.admin_users import (
    AdminUserListView,
    AdminUserDetailView,
    AdminUserStatusView,
    AdminUserBulkActionView,
    AdminUserStatsView,
    AdminUserExportView,
)
# Admin Dashboard Authentication Views
from .views.admin_auth import (
    AdminLoginView,
    AdminUserCreateView,
    AdminVerifyEmailView,
    AdminResendOTPView,
    AdminUserListView as AdminDashboardUserListView,
    AdminUserDetailView as AdminDashboardUserDetailView,
    AdminCurrentUserView,
    AdminLogoutView,
)
from .views.admin_permissions import (
    PagePermissionListView,
    RolePermissionListView,
    RolePermissionUpdateView,
    AllRolesPermissionsView,
    AdminAuditLogListView,
    AdminStatsView,
)

urlpatterns = [
    path('register/',RegisterView.as_view()),
    path('resendotp/',ResendotpView.as_view()),
    path('login/',LoginView.as_view()),
    path('user/',UserView.as_view()),
    path('logout/',LogoutView.as_view()),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/', PasswordResetView.as_view(), name='password-reset'),
    path('google-login/', GoogleOAuthLoginView.as_view(), name='google-login'),
    path('apple-login/', AppleOAuthLoginView.as_view(), name='apple-login'),
    path('apple-login/confirm-link/', AppleOAuthConfirmLinkView.as_view(), name='apple-login-confirm'),
    # Phone authentication endpoints
    path('phone/verify/', PhoneVerifyView.as_view(), name='phone-verify'),
    path('phone/complete-profile/', PhoneCompleteProfileView.as_view(), name='phone-complete-profile'),
    path('phone/confirm-link/', PhoneConfirmLinkView.as_view(), name='phone-confirm-link'),
    # User referral endpoints (for regular users)
    path('referrals/users/', ReferredUsersView.as_view(), name='referred-users'),
    path('referrals/transactions/', ReferralTransactionsView.as_view(), name='referral-transactions'),
    path('referrals/redeem/', RedeemReferralBalanceView.as_view(), name='redeem-referral-balance'),
    # Admin referral endpoints
    path('referrals/all-users/', AdminAllReferredUsersView.as_view(), name='admin-all-referred-users'),
    path('referrals/all-transactions/', AdminAllReferralTransactionsView.as_view(), name='admin-all-referral-transactions'),
    path('referrals/user/<int:user_id>/', AdminUserReferralDetailsView.as_view(), name='admin-user-referral-details'),
    path('referrals/stats/', AdminReferralStatsView.as_view(), name='admin-referral-stats'),
    path('audit-logs/', AuditLogView.as_view(), name='audit-logs'),
    path('deletion-feedback/', DeletionFeedbackView.as_view(), name='deletion-feedback'),
    # Admin user management endpoints
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/stats/', AdminUserStatsView.as_view(), name='admin-user-stats'),
    path('admin/users/export/', AdminUserExportView.as_view(), name='admin-user-export'),
    path('admin/users/bulk/', AdminUserBulkActionView.as_view(), name='admin-user-bulk'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:user_id>/status/', AdminUserStatusView.as_view(), name='admin-user-status'),
    
    # Admin Dashboard Authentication endpoints
    path('admin-auth/login/', AdminLoginView.as_view(), name='admin-auth-login'),
    path('admin-auth/logout/', AdminLogoutView.as_view(), name='admin-auth-logout'),
    path('admin-auth/verify-email/', AdminVerifyEmailView.as_view(), name='admin-auth-verify-email'),
    path('admin-auth/resend-otp/', AdminResendOTPView.as_view(), name='admin-auth-resend-otp'),
    path('admin-auth/me/', AdminCurrentUserView.as_view(), name='admin-auth-me'),
    path('admin-auth/users/', AdminUserCreateView.as_view(), name='admin-auth-users-create'),
    path('admin-auth/users/list/', AdminDashboardUserListView.as_view(), name='admin-auth-users-list'),
    path('admin-auth/users/<int:user_id>/', AdminDashboardUserDetailView.as_view(), name='admin-auth-user-detail'),
    
    # Admin Dashboard Permission endpoints
    path('admin-auth/pages/', PagePermissionListView.as_view(), name='admin-auth-pages'),
    path('admin-auth/permissions/', AllRolesPermissionsView.as_view(), name='admin-auth-all-permissions'),
    path('admin-auth/permissions/<str:role_name>/', RolePermissionListView.as_view(), name='admin-auth-role-permissions'),
    path('admin-auth/permissions/<str:role_name>/update/', RolePermissionUpdateView.as_view(), name='admin-auth-update-permissions'),
    path('admin-auth/audit-logs/', AdminAuditLogListView.as_view(), name='admin-auth-audit-logs'),
    path('admin-auth/stats/', AdminStatsView.as_view(), name='admin-auth-stats'),
]
