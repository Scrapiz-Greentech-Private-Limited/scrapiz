from rest_framework import serializers
from .models import User, AuditLog
from django.utils import timezone
from inventory.serializers import OrderNoSerializer
from user.serializers import AddressSerializer


class UserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True, required=False)
    promo_code = serializers.CharField(write_only=True, required=False , allow_blank=True , max_length=10)
    orders = OrderNoSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    
    # Avatar fields
    avatar_provider = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=50)
    avatar_style = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=50)
    avatar_seed = serializers.CharField(required=False, allow_null=True, allow_blank=True, max_length=100)
    
    # Valid avatar styles for DiceBear
    VALID_AVATAR_STYLES = ['avataaars', 'pixel-art', 'bottts', 'lorelei', 'adventurer', 'fun-emoji']
    
    class Meta:
        model = User
        fields = [
            'id',
            'name',
            'email',
            'password',
            'confirm_password',
            'promo_code',
            'otp',
            'phone_number',
            'gender',
            'referral_code',
            'referred_balance',
            'has_completed_first_order',
            'profile_image',
            'avatar_provider',
            'avatar_style',
            'avatar_seed',
            'is_staff',
            'is_superuser',
            'is_active',
            'date_joined',
            'orders',
            'addresses',
            ]
        extra_kwargs = {
            'password': {'write_only': True},
            'referral_code': {'read_only': True},
            'referred_balance': {'read_only': True},
            'has_completed_first_order': {'read_only': True},
            'is_superuser': {'read_only': True},
            'is_active': {'read_only': True},
            'date_joined': {'read_only': True},
        }
    
    def validate_avatar_style(self, value):
        """Validate that avatar_style is one of the supported DiceBear styles."""
        if value and value not in self.VALID_AVATAR_STYLES:
            raise serializers.ValidationError(
                f"Invalid avatar style. Must be one of: {', '.join(self.VALID_AVATAR_STYLES)}"
            )
        return value
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
    return 20.00 if obj.has_completed_first_order else 0.00


class AuditLogSerializer(serializers.ModelSerializer):
  user = serializers.SerializerMethodField()
  deletion_feedback = serializers.SerializerMethodField()
  
  class Meta:
    model = AuditLog
    fields = ['id', 'user', 'action', 'ip_address', 'timestamp', 'deleted_user_id', 'deleted_user_email', 'deleted_user_name', 'deletion_feedback']
    read_only_fields = fields
  
  def get_user(self, obj):
    """Return user information if user exists, or deleted user info for account_deleted actions"""
    if obj.user:
      return {
        'id': obj.user.id,
        'email': obj.user.email,
        'name': obj.user.name,
      }
    # For account_deleted actions, return the preserved user info
    if obj.action == 'account_deleted' and obj.deleted_user_email:
      return {
        'id': obj.deleted_user_id,
        'email': obj.deleted_user_email,
        'name': obj.deleted_user_name or 'Deleted User',
      }
    return None
  
  def get_deletion_feedback(self, obj):
    """Return deletion feedback if available"""
    if obj.deletion_feedback:
      return {
        'id': obj.deletion_feedback.id,
        'reason': obj.deletion_feedback.reason,
        'reason_display': dict(obj.deletion_feedback.REASON_CHOICES).get(obj.deletion_feedback.reason, obj.deletion_feedback.reason),
        'comments': obj.deletion_feedback.comments,
        'deleted_at': obj.deletion_feedback.deleted_at.isoformat() if obj.deletion_feedback.deleted_at else None,
      }
    return None


from .models import AccountDeletionFeedback

class DeletionFeedbackSerializer(serializers.ModelSerializer):
  reason_display = serializers.SerializerMethodField()
  
  class Meta:
    model = AccountDeletionFeedback
    fields = ['id', 'user_id', 'user_email', 'user_name', 'reason', 'reason_display', 'comments', 'deleted_at']
    read_only_fields = fields
  
  def get_reason_display(self, obj):
    """Return human-readable reason"""
    return dict(obj.REASON_CHOICES).get(obj.reason, obj.reason)
