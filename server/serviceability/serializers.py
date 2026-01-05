from rest_framework import serializers
from decimal import Decimal
from .models import ServiceableCity, ServiceablePincode, ServiceArea


class ServiceableCitySerializer(serializers.ModelSerializer):
    """Serializer for ServiceableCity model with full CRUD support."""
    
    pincode_count = serializers.IntegerField(read_only=True)
    
    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude coordinate (-90 to 90)"
    )
    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude coordinate (-180 to 180)"
    )
    radius_km = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Service radius in kilometers (must be > 0)"
    )
    
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
    
    def validate_latitude(self, value):
        if value < Decimal('-90') or value > Decimal('90'):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < Decimal('-180') or value > Decimal('180'):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value
    
    def validate_radius_km(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Radius must be greater than 0")
        return value
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("City name is required")
        return value.strip()
    
    def validate_state(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("State name is required")
        return value.strip()


class ServiceAreaSerializer(serializers.ModelSerializer):
    """Serializer for ServiceArea model - areas within a pincode."""
    
    pincode_code = serializers.CharField(source='pincode.pincode', read_only=True)
    city_name = serializers.CharField(source='pincode.city.name', read_only=True)
    city_state = serializers.CharField(source='pincode.city.state', read_only=True)
    city_status = serializers.CharField(source='pincode.city.status', read_only=True)
    agent_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = ServiceArea
        fields = [
            'id',
            'pincode',
            'pincode_code',
            'name',
            'latitude',
            'longitude',
            'is_active',
            'city_name',
            'city_state',
            'city_status',
            'agent_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'pincode_code', 'city_name', 'city_state', 'city_status', 'agent_count']
    
    def get_agent_count(self, obj):
        """Get count of agents assigned to this specific area + pincode-level agents"""
        area_agents = obj.agents.count() if hasattr(obj, 'agents') else 0
        pincode_agents = obj.pincode.pincode_agents.count() if hasattr(obj.pincode, 'pincode_agents') else 0
        return area_agents + pincode_agents
    
    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Area name is required")
        return value.strip()


class ServiceAreaListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for area list views."""
    
    pincode_code = serializers.CharField(source='pincode.pincode', read_only=True)
    city_name = serializers.CharField(source='pincode.city.name', read_only=True)
    
    class Meta:
        model = ServiceArea
        fields = ['id', 'name', 'pincode', 'pincode_code', 'city_name', 'is_active']


class ServiceablePincodeSerializer(serializers.ModelSerializer):
    """Serializer for ServiceablePincode model with full CRUD support."""
    
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_state = serializers.CharField(source='city.state', read_only=True)
    city_status = serializers.CharField(source='city.status', read_only=True)
    agent_count = serializers.SerializerMethodField(read_only=True)
    area_count = serializers.SerializerMethodField(read_only=True)
    areas = ServiceAreaSerializer(many=True, read_only=True)
    
    pincode = serializers.CharField(
        max_length=6,
        min_length=6,
        help_text="6-digit Indian postal code (must start with 1-9)"
    )
    
    class Meta:
        model = ServiceablePincode
        fields = [
            'id',
            'pincode',
            'city',
            'city_name',
            'city_state',
            'city_status',
            'area_name',  # Legacy field
            'area_count',
            'areas',
            'agent_count',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'city_name', 'city_state', 'city_status', 'agent_count', 'area_count', 'areas']
    
    def get_agent_count(self, obj):
        """Get total agents: pincode-level + all area-level agents"""
        pincode_agents = obj.pincode_agents.count() if hasattr(obj, 'pincode_agents') else 0
        area_agents = 0
        if hasattr(obj, 'areas'):
            for area in obj.areas.all():
                area_agents += area.agents.count() if hasattr(area, 'agents') else 0
        return pincode_agents + area_agents
    
    def get_area_count(self, obj):
        """Get count of areas under this pincode"""
        return obj.areas.count() if hasattr(obj, 'areas') else 0
    
    def validate_pincode(self, value):
        import re
        value = value.strip()
        if not re.match(r'^[1-9]\d{5}$', value):
            raise serializers.ValidationError(
                "Pincode must be exactly 6 digits and start with 1-9"
            )
        return value
    
    def validate(self, attrs):
        pincode = attrs.get('pincode')
        if pincode:
            existing_query = ServiceablePincode.objects.filter(pincode=pincode)
            if self.instance:
                existing_query = existing_query.exclude(pk=self.instance.pk)
            if existing_query.exists():
                raise serializers.ValidationError({'pincode': 'Pincode already exists'})
        return attrs
    
    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            error_message = str(e).lower()
            if 'unique' in error_message or 'duplicate' in error_message:
                raise serializers.ValidationError({'pincode': 'Pincode already exists'})
            raise


class PincodeCheckRequestSerializer(serializers.Serializer):
    """Serializer for pincode check request"""
    
    pincode = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="6-digit Indian postal code"
    )
    
    def validate_pincode(self, value):
        import re
        value = value.strip()
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
        if value < -90 or value > 90:
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value


class ServiceabilityResponseSerializer(serializers.Serializer):
    """Serializer for serviceability check response"""
    
    serviceable = serializers.BooleanField()
    city = ServiceableCitySerializer(required=False, allow_null=True)
    status = serializers.CharField(required=False, allow_null=True)
    distance_km = serializers.FloatField(required=False, allow_null=True)
    nearest_city = serializers.DictField(required=False, allow_null=True)
    message = serializers.CharField()
