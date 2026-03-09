import logging

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.usercheck import authenticate_request

from vendor.models import Vendor, VendorDocument
from vendor.permissions import IsActiveVendor, IsAdminUser, IsVendor, IsVerifiedVendor
from vendor.serializers import (
    ArrivalVerificationSerializer,
    VendorAdminActionSerializer,
    VendorCreateSerializer,
    VendorDocumentUploadSerializer,
    VendorSerializer,
    VendorUpdateSerializer,
)
from vendor.services import BiometricService, VendorService, VerificationService

logger = logging.getLogger(__name__)


# ─── Vendor-facing views ────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class CreateVendorProfileView(APIView):
    """POST /vendor/create-profile/"""

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        if hasattr(user, 'vendor'):
            return Response({'error': 'Vendor profile already exists'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VendorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        vendor = VendorService.create_vendor(user, serializer.validated_data)
        return Response(VendorSerializer(vendor).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class VendorProfileView(APIView):
    """GET /vendor/profile/"""

    def get(self, request):
        user = authenticate_request(request, need_user=True)
        vendor = VendorService.get_vendor_profile(user)
        if not vendor:
            return Response({'error': 'Vendor profile not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(VendorSerializer(vendor).data)


@method_decorator(csrf_exempt, name='dispatch')
class UpdateVendorProfileView(APIView):
    """PATCH /vendor/profile/"""

    def patch(self, request):
        user = authenticate_request(request, need_user=True)
        vendor = VendorService.get_vendor_profile(user)
        if not vendor:
            return Response({'error': 'Vendor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        vendor = VendorService.update_vendor_profile(vendor, serializer.validated_data, actor=user)
        return Response(VendorSerializer(vendor).data)


@method_decorator(csrf_exempt, name='dispatch')
class UploadDocumentView(APIView):
    """POST /vendor/upload-document/"""
    permission_classes = [IsVendor]

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        serializer = VendorDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        document = VerificationService.upload_document(
            vendor=user.vendor,
            doc_type=data['document_type'],
            doc_number=data['document_number'],
            front_url=data['document_image_front'],
            back_url=data.get('document_image_back'),
            actor=user,
        )
        from vendor.serializers import VendorDocumentSerializer
        return Response(VendorDocumentSerializer(document).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class SubmitVerificationView(APIView):
    """POST /vendor/submit-verification/"""
    permission_classes = [IsVendor]

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        try:
            VendorService.submit_for_verification(user.vendor, actor=user)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Verification submitted'})


@method_decorator(csrf_exempt, name='dispatch')
class UploadFaceImageView(APIView):
    """POST /vendor/upload-face/"""
    permission_classes = [IsVendor, IsVerifiedVendor]

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        image_url = request.data.get('image_url', '').strip()
        if not image_url:
            return Response({'error': 'image_url is required'}, status=status.HTTP_400_BAD_REQUEST)

        from vendor.tasks import generate_face_embedding_task
        generate_face_embedding_task.delay(user.vendor.id, image_url)
        return Response({'message': 'Face image processing started'}, status=status.HTTP_202_ACCEPTED)


@method_decorator(csrf_exempt, name='dispatch')
class VerifyArrivalView(APIView):
    """POST /vendor/verify-arrival/"""
    permission_classes = [IsActiveVendor]

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        selfie_url = request.data.get('selfie_url', '').strip()
        order_id = request.data.get('order_id')
        if not selfie_url:
            return Response({'error': 'selfie_url is required'}, status=status.HTTP_400_BAD_REQUEST)

        order = None
        if order_id:
            from inventory.models import OrderNo
            order = OrderNo.objects.filter(id=order_id).first()

        from vendor.tasks import compare_face_embedding_task
        # Create a placeholder verification record first
        from vendor.models import ArrivalVerification
        verification = ArrivalVerification.objects.create(
            vendor=user.vendor,
            order=order,
            selfie_url=selfie_url,
            similarity_score=0.0,
            is_verified=False,
        )
        compare_face_embedding_task.delay(user.vendor.id, selfie_url, verification.id)
        return Response(
            {'message': 'Arrival verification processing', 'verification_id': verification.id},
            status=status.HTTP_202_ACCEPTED,
        )


# ─── Admin views ────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class AdminVendorListView(APIView):
    """GET /admin/vendor/list/"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        status_filter = request.query_params.get('status')
        qs = Vendor.objects.select_related('user').all()
        if status_filter:
            qs = qs.filter(verification_status=status_filter)
        return Response(VendorSerializer(qs, many=True).data)


@method_decorator(csrf_exempt, name='dispatch')
class AdminVendorDetailView(APIView):
    """GET /admin/vendor/<vendor_id>/"""
    permission_classes = [IsAdminUser]

    def get(self, request, vendor_id):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        try:
            vendor = Vendor.objects.select_related('user', 'biometric').prefetch_related('documents').get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(VendorSerializer(vendor).data)


@method_decorator(csrf_exempt, name='dispatch')
class AdminApproveVendorView(APIView):
    """POST /admin/vendor/<vendor_id>/approve/"""
    permission_classes = [IsAdminUser]

    def post(self, request, vendor_id):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
        VerificationService.approve_vendor(vendor, user)
        return Response({'message': 'Vendor approved'})


@method_decorator(csrf_exempt, name='dispatch')
class AdminRejectVendorView(APIView):
    """POST /admin/vendor/<vendor_id>/reject/"""
    permission_classes = [IsAdminUser]

    def post(self, request, vendor_id):
        user = authenticate_request(request, need_user=True)
        request.user = user
        self.check_permissions(request)

        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = VendorAdminActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')
        VerificationService.reject_vendor(vendor, user, reason)
        return Response({'message': 'Vendor rejected'})
