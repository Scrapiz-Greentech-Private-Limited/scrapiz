from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from authentication.views.superuser import SuperuserLoginView, SuperuserOTPVerifyView
from notifications.admin import send_notification_view

# yaha override kar
admin.site.login = SuperuserLoginView.as_view() 


urlpatterns = [
    path("admin/otp-verify/", SuperuserOTPVerifyView.as_view(), name="admin_otp_verify"),
    path('admin/notifications/send-push/', send_notification_view, name='admin-send-push-notification'),
    path('admin/', admin.site.urls),
    path('api/authentication/',include('authentication.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/user/', include('user.urls')),
    path('api/services/', include('services.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/waitlist/',include('waitlist.urls'))
]
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
