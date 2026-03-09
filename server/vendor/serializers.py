from rest_framework import serializers

from vendor.models import (
    ArrivalVerification,
    Vendor,
    VendorBiometric,
    VendorDocument,
)


class VendorDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorDocument
        fields = [
            'id', 'document_type', 'document_number',
            'document_image_front', 'document_image_back',
            'verification_status', 'rejection_reason',
            'uploaded_at', 'verified_at',
        ]
        read_only_fields = ['id', 'verification_status', 'rejection_reason', 'uploaded_at', 'verified_at']


class VendorDocumentUploadSerializer(serializers.Serializer):
    document_type = serializers.ChoiceField(choices=VendorDocument.DOCUMENT_TYPES)
    document_number = serializers.CharField(max_length=50)
    document_image_front = serializers.URLField(max_length=500)
    document_image_back = serializers.URLField(max_length=500, required=False, allow_blank=True)


class VendorBiometricSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorBiometric
        fields = ['model_version', 'created_at', 'updated_at']
        read_only_fields = fields


class VendorSerializer(serializers.ModelSerializer):
    documents = VendorDocumentSerializer(many=True, read_only=True)
    biometric = VendorBiometricSerializer(read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'full_name', 'age', 'profile_image',
            'service_city', 'service_area', 'latitude', 'longitude',
            'vehicle_type', 'vehicle_number', 'vehicle_owner_name',
            'verification_status', 'is_active_vendor',
            'created_at', 'updated_at',
            'documents', 'biometric',
        ]
        read_only_fields = [
            'id', 'verification_status', 'is_active_vendor',
            'created_at', 'updated_at',
        ]


class VendorCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100)
    age = serializers.IntegerField(required=False, allow_null=True)
    service_city = serializers.CharField(max_length=100)
    service_area = serializers.CharField(max_length=255)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    vehicle_type = serializers.CharField(max_length=50)
    vehicle_number = serializers.CharField(max_length=50)
    vehicle_owner_name = serializers.CharField(max_length=100)
    aadhaar_number = serializers.CharField(max_length=12, min_length=12)
    id_document_url = serializers.URLField(max_length=500)
    profile_image = serializers.URLField(max_length=500, required=False, allow_blank=True)


class VendorUpdateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=100, required=False)
    age = serializers.IntegerField(required=False, allow_null=True)
    service_city = serializers.CharField(max_length=100, required=False)
    service_area = serializers.CharField(max_length=255, required=False)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    vehicle_type = serializers.CharField(max_length=50, required=False)
    vehicle_number = serializers.CharField(max_length=50, required=False)
    vehicle_owner_name = serializers.CharField(max_length=100, required=False)
    profile_image = serializers.URLField(max_length=500, required=False, allow_blank=True)


class ArrivalVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArrivalVerification
        fields = [
            'id', 'vendor', 'order', 'selfie_url',
            'similarity_score', 'is_verified',
            'flag_for_manual_review', 'created_at',
        ]
        read_only_fields = fields


class VendorAdminActionSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
