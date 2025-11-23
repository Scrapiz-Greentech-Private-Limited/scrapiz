from rest_framework import serializers
from .models import ServiceBooking


class ServiceBookingSerializer(serializers.ModelSerializer):
    # Optional fields for Google Meet integration (only if migration is run)
    meeting_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    meeting_event_id = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=255)
    
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
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']
    
    def to_representation(self, instance):
        """Add meeting fields to response if they exist"""
        data = super().to_representation(instance)
        if hasattr(instance, 'meeting_link'):
            data['meeting_link'] = instance.meeting_link
        if hasattr(instance, 'meeting_event_id'):
            data['meeting_event_id'] = instance.meeting_event_id
        return data
