from rest_framework import serializers
from django.utils import timezone
from .models import Agent, AgentDocument, AgentAuditLog
from serviceability.serializers import ServiceablePincodeSerializer
from serviceability.models import ServiceablePincode


class AgentServiceAreaSerializer(serializers.Serializer):
    """
    Nested serializer for agent's service areas with full details.
    """
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    pincode_code = serializers.CharField(source='pincode.pincode', read_only=True)
    pincode_id = serializers.IntegerField(source='pincode.id', read_only=True)
    city_name = serializers.CharField(source='pincode.city.name', read_only=True)
    city_state = serializers.CharField(source='pincode.city.state', read_only=True)
    city_status = serializers.CharField(source='pincode.city.status', read_only=True)
    assignment_type = serializers.SerializerMethodField()
    
    def get_assignment_type(self, obj):
        return 'area'



class ServiceAreaSerializer(serializers.Serializer):
  id = serializers.IntegerField(read_only=True)
  pincode = serializers.CharField(read_only=True)
  area_name = serializers.CharField(read_only=True)
  city_name = serializers.CharField(source='city.name', read_only=True)
  city_state = serializers.CharField(source='city.state', read_only=True)
  city_status = serializers.CharField(source='city.status', read_only=True)


class AgentDocumentSerializer(serializers.ModelSerializer):

    verified_by_email = serializers.CharField(source='verified_by.email', read_only=True, allow_null=True)
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    verification_status_display = serializers.CharField(source='get_verification_status_display', read_only=True)

    class Meta:
        model = AgentDocument
        fields = [
            'id',
            'document_type',
            'document_type_display',
            'document_url',
            'verification_status',
            'verification_status_display',
            'rejection_reason',
            'uploaded_at',
            'verified_at',
            'verified_by',
            'verified_by_email',
        ]
        read_only_fields = [
            'id',
            'uploaded_at',
            'verified_at',
            'verified_by',
            'verified_by_email',
            'document_type_display',
            'verification_status_display',
        ]



class AgentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new agents with validation.
    Requirements: 9.3
    
    Validates:
    - Required fields (name, phone, email, address)
    - Phone and email uniqueness
    """
    service_area_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    service_pincode_ids = serializers.ListField(
      child=serializers.IntegerField(),
      write_only=True,
      required=False,
      default=list
    )

    class Meta:
        model = Agent
        fields = [
            'name',
            'phone',
            'email',
            'address',
            'profile_image_url',
            'vehicle_number',
            'vehicle_type',
            'vehicle_registration_url',
            'daily_capacity',
            'coverage_location',
            'service_area_ids',
            'service_pincode_ids',
        ]

    def __init__(self, *args, **kwargs):
      super().__init__(*args, **kwargs)
      from serviceability.models import ServiceArea, ServiceablePincode
      self.fields['service_area_ids'].queryset = ServiceArea.objects.all()
      self.fields['service_pincode_ids'].queryset = ServiceablePincode.objects.all()
      
    def validate_service_area_ids(self, value):
      if value:
        from serviceability.models import ServiceArea
        existing_ids = set(ServiceArea.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
          raise serializers.ValidationError(f"Invalid service area IDs: {invalid_ids}")
      return value
      
    def validate_service_pincode_ids(self, value):
      if value:
        from serviceability.models import ServiceablePincode
        existing_ids = set(ServiceablePincode.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
          raise serializers.ValidationError(f"Invalid service pincode IDs: {invalid_ids}")
      return value
        
    def validate_name(self, value):
        """Validate name is not empty or whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Agent name is required and cannot be empty.")
        return value.strip()

    def validate_phone(self, value):
        """Validate phone uniqueness"""
        if Agent.objects.filter(phone=value).exists():
            raise serializers.ValidationError("An agent with this phone number already exists.")
        return value

    def validate_email(self, value):
        """Validate email uniqueness"""
        if Agent.objects.filter(email=value).exists():
            raise serializers.ValidationError("An agent with this email already exists.")
        return value

    def validate_address(self, value):
        """Validate address is not empty or whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Agent address is required and cannot be empty.")
        return value.strip()

    def create(self, validated_data):  
        """Create agent with service areas"""
        service_area_ids = validated_data.pop('service_area_ids', [])
        service_pincode_ids = validated_data.pop('service_pincode_ids', [])
        agent = Agent.objects.create(**validated_data)
        if service_area_ids:
            from serviceability.models import ServiceArea
            agent.service_areas.set(ServiceArea.objects.filter(id__in=service_area_ids))
        if service_pincode_ids:
            from serviceability.models import ServiceablePincode
            agent.service_pincodes.set(ServiceablePincode.objects.filter(id__in=service_pincode_ids))
        return agent


class AgentAuditLogSerializer(serializers.ModelSerializer):

    actor_email = serializers.CharField(source='actor.email', read_only=True, allow_null=True)
    actor_name = serializers.CharField(source='actor.name', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    agent_code = serializers.CharField(source='agent.agent_code', read_only=True)

    class Meta:
        model = AgentAuditLog
        fields = [
            'id',
            'agent',
            'agent_code',
            'action',
            'action_display',
            'actor',
            'actor_email',
            'actor_name',
            'timestamp',
            'previous_value',
            'new_value',
            'details',
        ]
        read_only_fields = [
            'id',
            'timestamp',
            'agent_code',
            'action_display',
            'actor_email',
            'actor_name',
        ]


class AgentListSerializer(serializers.ModelSerializer):

    today_orders = serializers.IntegerField(read_only=True)
    is_eligible = serializers.BooleanField(read_only=True)
    service_area_count = serializers.SerializerMethodField()
    service_pincode_count = serializers.SerializerMethodField()
    total_coverage_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    kyc_status_display = serializers.CharField(source='get_kyc_status_display', read_only=True)

    class Meta:
        model = Agent
        fields = [
            'id',
            'agent_code',
            'name',
            'phone',
            'email',
            'profile_image_url',
            'status',
            'status_display',
            'kyc_status',
            'kyc_status_display',
            'availability',
            'vehicle_number',
            'average_rating',
            'total_orders',
            'today_orders',
            'is_eligible',
            'service_area_count',
            'service_pincode_count',
            'total_coverage_count',
            'coverage_location',
            'created_at',
        ]

    def get_service_area_count(self, obj):
        """Return count of service areas"""
        return obj.service_areas.count()
    def get_service_pincode_count(self, obj):
        return obj.service_pincodes.count()
    def get_total_coverage_count(self, obj):
        return obj.service_areas.count() + obj.service_pincodes.count()
        
class AgentServicePincodeSerializer(serializers.Serializer):
    """
    Nested serializer for agent's pincode-level assignments.
    """
    id = serializers.IntegerField(read_only=True)
    pincode = serializers.CharField(read_only=True)
    area_name = serializers.CharField(read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_state = serializers.CharField(source='city.state', read_only=True)
    city_status = serializers.CharField(source='city.status', read_only=True)
    area_count = serializers.SerializerMethodField()
    assignment_type = serializers.SerializerMethodField()
    
    def get_area_count(self, obj):
        return obj.areas.count() if hasattr(obj, 'areas') else 0
    
    def get_assignment_type(self, obj):
        return 'pincode'
        
              
class DocumentUploadSerializer(serializers.ModelSerializer):

    class Meta:
        model = AgentDocument
        fields = [
            'document_type',
            'document_url',
        ]

    def validate(self, data):
        """Validate document type uniqueness for agent"""
        agent = self.context.get('agent')
        if agent and AgentDocument.objects.filter(
            agent=agent,
            document_type=data['document_type']
        ).exists():
            raise serializers.ValidationError({
                'document_type': f"A {data['document_type']} document already exists for this agent."
            })
        return data

    def create(self, validated_data):
        """Create document with agent from context"""
        agent = self.context.get('agent')
        if not agent:
            raise serializers.ValidationError("Agent context is required.")
        validated_data['agent'] = agent
        return super().create(validated_data)


class DocumentVerifySerializer(serializers.Serializer):
    """
    Serializer for verifying/rejecting agent documents.
    """
    action = serializers.ChoiceField(choices=['verify', 'reject'])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        """Validate rejection reason is provided when rejecting"""
        if data['action'] == 'reject' and not data.get('rejection_reason'):
            raise serializers.ValidationError({
                'rejection_reason': "Rejection reason is required when rejecting a document."
            })
        return data


class AgentStatsSerializer(serializers.Serializer):
    """
    Serializer for agent statistics response.
    Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
    """
    total = serializers.IntegerField()
    active = serializers.IntegerField()
    inactive = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    
class AgentSerializer(serializers.ModelSerializer):

    # Computed fields
    today_orders = serializers.IntegerField(read_only=True)
    is_eligible = serializers.BooleanField(read_only=True)
    
    # Nested serializers
    service_areas = ServiceAreaSerializer(many=True, read_only=True)
    service_pincodes = AgentServicePincodeSerializer(many=True, read_only=True)
    documents = AgentDocumentSerializer(many=True, read_only=True)
    all_assignments = serializers.SerializerMethodField()
    
    # Display fields for choices
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    kyc_status_display = serializers.CharField(source='get_kyc_status_display', read_only=True)
    availability_display = serializers.CharField(source='get_availability_display', read_only=True)
    
    # Service area IDs for write operations
    service_area_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    service_pincode_ids= serializers.ListField(
      child=serializers.IntegerField(),
      write_only=True,
      required=False,
      default=list
    )

    class Meta:
        model = Agent
        fields = [
            # Core fields
            'id',
            'agent_code',
            'name',
            'phone',
            'email',
            'address',
            'profile_image_url',
            # Status fields
            'status',
            'status_display',
            'kyc_status',
            'kyc_status_display',
            'availability',
            'availability_display',
            # Vehicle details
            'vehicle_number',
            'vehicle_type',
            'vehicle_registration_url',
            # Capacity management
            'daily_capacity',
            'current_day_orders',
            'last_order_reset',
            # Performance metrics
            'total_orders',
            'completed_orders',
            'total_weight_collected',
            'average_rating',
            'rating_count',
            # Computed fields
            'today_orders',
            'is_eligible',
            'service_pincodes',
            'service_pincode_ids',
            'all_assignments',
            # Nested relationships
            'service_areas',
            'service_area_ids',
            'documents',
            # Coverage location
            'coverage_location',
            # Timestamps
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'agent_code',
            'kyc_status',
            'current_day_orders',
            'last_order_reset',
            'total_orders',
            'completed_orders',
            'total_weight_collected',
            'average_rating',
            'rating_count',
            'today_orders',
            'is_eligible',
            'created_at',
            'updated_at',
            'status_display',
            'kyc_status_display',
            'all_assignments',
            'availability_display',
        ]


    def __init__(self,*args,**kwargs):
      super().__init__(*args, **kwargs)
      from serviceability.models import ServiceArea, ServiceablePincode
      self.fields['service_area_ids'].queryset = ServiceArea.objects.all()
      self.fields['service_pincode_ids'].queryset = ServiceablePincode.objects.all()
    
    def validate_service_area_ids(self, value):
      if value:
        from serviceability.models import ServiceArea
        existing_ids = set(ServiceArea.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
          raise serializers.ValidationError(f"Invalid service area IDs: {invalid_ids}")
      return value
    def validate_service_pincode_ids(self, value):
      if value:
        from serviceability.models import ServiceablePincode
        existing_ids = set(ServiceablePincode.objects.filter(id__in=value).values_list('id', flat=True))
        invalid_ids = set(value) - existing_ids
        if invalid_ids:
          raise serializers.ValidationError(f"Invalid service pincode IDs: {invalid_ids}")
      return value  
    def get_all_assignments(self, obj):
      assignments = []
      for area in obj.service_areas.all():
        assignments.append({
          'id': area.id,
          'type':'area',
          'name': area.name,
          'pincode': area.pincode.pincode,
          'pincode_id': area.pincode.id,
          'city_name': area.pincode.city.name,
          'city_state': area.pincode.city.state,
        })
        
      for pincode in obj.service_pincodes.all():
        assignments.append({
          'id': pincode.id,
          'type': 'pincode',
          'name': f"All areas in {pincode.pincode}",
          'pincode': pincode.pincode,
          'pincode_id': pincode.id,
          'city_name': pincode.city.name,
          'city_state': pincode.city.state,
          'area_count': pincode.areas.count(),
        })
      return assignments
    def validate_phone(self, value):
        """Validate phone uniqueness on update"""
        instance = self.instance
        if instance and Agent.objects.filter(phone=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("An agent with this phone number already exists.")
        return value

    def validate_email(self, value):
        """Validate email uniqueness on update"""
        instance = self.instance
        if instance and Agent.objects.filter(email=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("An agent with this email already exists.")
        return value
    def update(self, instance, validated_data):
      service_area_ids = validated_data.pop('service_area_ids', None)
      service_pincode_ids = validated_data.pop('service_pincode_ids', None)
      instance = super().update(instance, validated_data)
      if service_area_ids is not None:
        from serviceability.models import ServiceArea
        instance.service_areas.set(ServiceArea.objects.filter(id__in=service_area_ids))
      if service_pincode_ids is not None:
        from serviceability.models import ServiceablePincode
        instance.service_pincodes.set(ServiceablePincode.objects.filter(id__in=service_pincode_ids))
      return instance
    

