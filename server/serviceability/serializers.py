from rest_framework import serializers
from .models import ServiceableCity, ServiceablePincode


class ServiceableCitySerializer(serializers.ModelSerializer):
    """Serializer for ServiceableCity model"""
    
    pincode_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ServiceableCity
        fields = [
            'id',
            'name',
            'state',
            'latitude',
            'longitude',
            'radius_km',
            'status',
            'pincode_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'pincode_count']


class ServiceablePincodeSerializer(serializers.ModelSerializer):
    """Serializer for ServiceablePincode model"""
    
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_state = serializers.CharField(source='city.state', read_only=True)
    city_status = serializers.CharField(source='city.status', read_only=True)
    
    class Meta:
        model = ServiceablePincode
        fields = [
            'id',
            'pincode',
            'city',
            'city_name',
            'city_state',
            'city_status',
            'area_name',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'city_name', 'city_state', 'city_status']


class PincodeCheckRequestSerializer(serializers.Serializer):
    """Serializer for pincode check request"""
    
    pincode = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="6-digit Indian postal code"
    )
    
    def validate_pincode(self, value):
        """Validate pincode format"""
        import re
        
        # Remove whitespace
        value = value.strip()
        
        # Check format: exactly 6 digits, starting with 1-9
        if not re.match(r'^[1-9]\d{5}$', value):
            raise serializers.ValidationError(
                "Pincode must be exactly 6 digits and start with 1-9"
            )
        
        return value


class CoordinateCheckRequestSerializer(serializers.Serializer):
    """Serializer for coordinate-based serviceability check request"""
    
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True,
        help_text="Latitude coordinate (-90 to 90)"
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        required=True,
        help_text="Longitude coordinate (-180 to 180)"
    )
    
    def validate_latitude(self, value):
        """Validate latitude range"""
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                "Latitude must be between -90 and 90"
            )
        return value
    
    def validate_longitude(self, value):
        """Validate longitude range"""
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                "Longitude must be between -180 and 180"
            )
        return value


class ServiceabilityResponseSerializer(serializers.Serializer):
    """Serializer for serviceability check response"""
    
    serviceable = serializers.BooleanField()
    city = ServiceableCitySerializer(required=False, allow_null=True)
    status = serializers.CharField(required=False, allow_null=True)
    distance_km = serializers.FloatField(required=False, allow_null=True)
    nearest_city = serializers.DictField(required=False, allow_null=True)
    message = serializers.CharField()
