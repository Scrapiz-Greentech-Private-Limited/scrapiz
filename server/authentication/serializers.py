from rest_framework import serializers
from .models import User
from django.utils import timezone
from inventory.serializers import OrderNoSerializer
from user.serializers import AddressSerializer


class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True, required=False)
    promo_code = serializers.CharField(
        write_only=True, 
        required=False, 
        allow_blank=True,
        max_length=10,
        help_text="Referral code from another user (optional)"
    )
    orders = OrderNoSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'password',
            'confirm_password',
            'otp',
            'promo_code',
            'is_staff',
            'referral_code',
            'referral_balance',
            'has_completed_first_order',
            'profile_image',
            'orders',
            'addresses',
            ]
        extra_kwargs = {
            'password': {'write_only': True},
            'referral_code': {'read_only': True},
            'referral_balance': {'read_only': True},
            'has_completed_first_order': {'read_only': True},
        }
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data


class ReferredUserSerializer(serializers.ModelSerializer):
    """Serializer for users referred by the current user"""
    earned_amount = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'date_joined',
            'has_completed_first_order',
            'earned_amount',
        ]
        read_only_fields = fields
    
    def get_earned_amount(self, obj):
        """Calculate the amount earned from this referral"""
        # ₹20 if the referred user has completed their first order, otherwise 0
        return 20.00 if obj.has_completed_first_order else 0.00

