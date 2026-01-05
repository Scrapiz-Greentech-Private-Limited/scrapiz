from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentication.views.superuser import SuperuserLoginView, SuperuserOTPVerifyView
from authentication.views.admin_auth import AdminLoginView, AdminVerifyOTPView, AdminResendOTPView
from notifications.admin import send_notification_view
from .views import HealthCheckView

# yaha override kar
admin.site.login = SuperuserLoginView.as_view() 


urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path("admin/otp-verify/", SuperuserOTPVerifyView.as_view(), name="admin_otp_verify"),
    path('admin/notifications/send-push/', send_notification_view, name='admin-send-push-notification'),
    # Admin Dashboard API endpoints (Next.js)
    path('api/admin/login/', AdminLoginView.as_view(), name='admin-dashboard-login'),
    path('api/admin/verify-otp/', AdminVerifyOTPView.as_view(), name='admin-dashboard-verify-otp'),
    path('api/admin/resend-otp/', AdminResendOTPView.as_view(), name='admin-dashboard-resend-otp'),
    path('admin/', admin.site.urls),
    path('api/authentication/',include('authentication.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/user/', include('user.urls')),
    path('api/services/', include('services.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/waitlist/',include('waitlist.urls')),
    path('api/content/', include('content.urls')),
    path('api/serviceability/', include('serviceability.urls')),
    path('api/agents/', include('agents.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/feedback/', include('feedback.urls')),
]
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
