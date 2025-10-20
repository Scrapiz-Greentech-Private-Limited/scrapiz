from rest_framework import serializers
from .models import AddressModel, NotificationPreference


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddressModel
        fields = '__all__'


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'push_notifications',
            'pickup_reminders',
            'order_updates',
            'payment_alerts',
            'promotional_offers',
            'weekly_reports',
            'email_notifications',
            'sms_notifications',
        ]