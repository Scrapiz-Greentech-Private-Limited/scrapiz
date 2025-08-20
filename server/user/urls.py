from django.urls import path, include
from .views import AddressAPIView

urlpatterns = [
    path('address/', AddressAPIView.as_view(), name='address'),
]