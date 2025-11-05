from django.urls import path
from .views import WaitlistCreateView

app_name = 'waitlist'

urlpatterns = [
    path('', WaitlistCreateView.as_view(), name='create'),
]
