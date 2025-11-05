from rest_framework import serializers
from .models import WaitlistEntry
import re


class WaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaitlistEntry
        fields = ['email', 'phone_number', 'city']
    
    def validate_email(self, value):
        """Validate email format"""
        if value:
            value = value.strip().lower()
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', value):
                raise serializers.ValidationError("Invalid email format")
        return value
    
    def validate_phone_number(self, value):
        """Validate and clean phone number"""
        if value:
            # Remove any spaces, dashes, or parentheses
            cleaned = re.sub(r'[\s\-()]', '', value)
            if not re.match(r'^[6-9]\d{9}$', cleaned):
                raise serializers.ValidationError(
                    "Phone number must be 10 digits starting with 6-9"
                )
            return cleaned
        return value
    
    def validate(self, data):
        """Ensure at least one contact method is provided"""
        if not data.get('email') and not data.get('phone_number'):
            raise serializers.ValidationError(
                "At least one contact method (email or phone) is required"
            )
        return data
    
    def create(self, validated_data):
        """Create or update waitlist entry to prevent duplicates"""
        email = validated_data.get('email')
        phone = validated_data.get('phone_number')
        city = validated_data.get('city')
        
        # Check for existing entry with same contact info and city
        existing = None
        if email:
            existing = WaitlistEntry.objects.filter(
                email=email, 
                city=city
            ).first()
        
        if not existing and phone:
            existing = WaitlistEntry.objects.filter(
                phone_number=phone,
                city=city
            ).first()
        
        if existing:
            # Update existing entry
            for key, value in validated_data.items():
                setattr(existing, key, value)
            existing.save()
            return existing
        
        # Create new entry
        return WaitlistEntry.objects.create(**validated_data)
