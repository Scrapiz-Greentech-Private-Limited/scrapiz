from rest_framework import serializers
from .models import ServiceBooking


class ServiceBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceBooking
        fields = [
            'id',
            'service',
            'name',
            'phone',
            'address',
            'preferred_datetime',
            'notes',
            'status',
            'meeting_link',
            'meeting_event_id',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'meeting_link', 'meeting_event_id', 'created_at']
