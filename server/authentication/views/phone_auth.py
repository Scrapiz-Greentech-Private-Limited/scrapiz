import re
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from utils.usercheck import authenticate_request
from utils.audit_client_ip import get_client_ip
from ..services import UserService
from ..services.otp_service import (
    check_phone_rate_limit,
    create_phone_otp,
    verify_phone_otp,
)
from ..models import AuditLog, User, PhoneOTP
from ..utils import generate_referral_code, is_valid_e164
from ..services.gupshup_service import send_whatsapp_otp
import logging

logger = logging.getLogger(__name__)


class PhoneOTPSendThrottle(AnonRateThrottle):
    rate = '10/min'


class PhoneVerifyThrottle(AnonRateThrottle):
    rate = '10/min'


class PhoneProfileThrottle(AnonRateThrottle):
    rate = '5/min'


class PhoneLinkThrottle(AnonRateThrottle):
    rate = '5/min'


@method_decorator(csrf_exempt, name='dispatch')
class SendPhoneOTPView(APIView):
    """POST /api/authentication/phone/send-otp/"""
    throttle_classes = [PhoneOTPSendThrottle]

    def post(self, request):
        try:
            authenticate_request(request)
            phone_number = request.data.get('phone_number', '').strip()

            if not phone_number or not is_valid_e164(phone_number):
                return Response(
                    {'error': 'A valid phone number in E.164 format is required (e.g., +919876543210)'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            rate_check = check_phone_rate_limit(phone_number)
            if not rate_check['allowed']:
                return Response(
                    {'error': rate_check['reason']},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            otp = create_phone_otp(phone_number)
            send_whatsapp_otp(phone_number, otp)

            ip_address = get_client_ip(request)
            AuditLog.objects.create(
                user=None,
                action='phone_otp_sent',
                ip_address=ip_address,
            )

            return Response({'message': 'OTP sent'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Send OTP error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to send OTP'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name='dispatch')
class VerifyPhoneOTPView(APIView):
    """POST /api/authentication/phone/verify/"""
    throttle_classes = [PhoneVerifyThrottle]

    def post(self, request):
        try:
            authenticate_request(request)
            phone_number = request.data.get('phone_number', '').strip()
            otp = request.data.get('otp', '').strip()

            if not phone_number or not is_valid_e164(phone_number):
                return Response(
                    {'error': 'A valid phone number in E.164 format is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not otp:
                return Response(
                    {'error': 'OTP is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            result = verify_phone_otp(phone_number, otp)
            if not result['valid']:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address,
                )
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False,
            ).first()

            if existing_user:
                return self._authenticate_user(existing_user, request)

            return Response(
                {
                    'profile_required': True,
                    'phone_number': phone_number,
                    'message': 'Please complete your profile',
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Phone verify error: {str(e)}", exc_info=True)
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address,
                )
            except Exception:
                pass
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _authenticate_user(self, user, request):
        session_id = UserService.generate_session_id()
        user.session_id = session_id
        user.save(update_fields=['session_id'])
        jwt_token = UserService.create_jwt_token(user.id, session_id)
        ip_address = get_client_ip(request)
        AuditLog.objects.create(
            user=user,
            action='phone_login',
            ip_address=ip_address,
        )
        return Response(
            {
                'jwt': jwt_token,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                },
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_exempt, name='dispatch')
class PhoneCompleteProfileView(APIView):
    """
    POST /api/authentication/phone/complete-profile/
    Request body:
      - name: User's full name (required, non-empty)
      - email: User's email address (required, valid format)
      - phone_number: Verified phone number in E.164 format (required)
    """
    throttle_classes = [PhoneProfileThrottle]

    def post(self, request):
        try:
            authenticate_request(request)
            name = request.data.get('name', '').strip()
            email = request.data.get('email', '').strip().lower()
            phone_number = request.data.get('phone_number', '').strip()

            validation_errors = self._validate_profile_data(name, email, phone_number)
            if validation_errors:
                return Response(
                    {'error': validation_errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Ensure phone was verified via OTP
            if not PhoneOTP.objects.filter(phone_number=phone_number, is_verified=True).exists():
                return Response(
                    {'error': 'Phone number has not been verified'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_phone_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False,
            ).first()
            if existing_phone_user:
                return Response(
                    {'error': 'Phone number already linked to another account'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_email_user = User.objects.filter(
                email=email,
                is_deleted=False,
            ).first()
            if existing_email_user:
                if existing_email_user.phone_number:
                    return Response(
                        {'error': 'Phone number already linked to another account'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                auth_provider = self._determine_auth_provider(existing_email_user)
                return Response(
                    {
                        'requires_link_confirmation': True,
                        'existing_email': existing_email_user.email,
                        'auth_provider': auth_provider,
                        'message': 'An account with this email already exists. Would you like to link your phone number?',
                    },
                    status=status.HTTP_200_OK,
                )

            return self._create_new_user(name, email, phone_number, request)

        except Exception as e:
            logger.error(f"Phone complete profile error: {str(e)}", exc_info=True)
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address,
                )
            except Exception:
                pass
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _validate_profile_data(self, name: str, email: str, phone_number: str) -> str:
        if not name:
            return 'Name is required'
        if len(name) > 50:
            return 'Name must be 50 characters or less'
        if not email:
            return 'Email is required'
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return 'Invalid email format'
        if not phone_number:
            return 'Phone number is required'
        if not is_valid_e164(phone_number):
            return 'Phone number must be in E.164 format (e.g., +919876543210)'
        return ''

    def _determine_auth_provider(self, user: User) -> str:
        if user.apple_user_id:
            return 'apple'
        if user.has_usable_password():
            return 'email'
        return 'google'

    def _create_new_user(self, name: str, email: str, phone_number: str, request) -> Response:
        user = User.objects.create(
            name=name,
            email=email,
            phone_number=phone_number,
            is_active=True,
            password='',
        )
        user.set_unusable_password()

        user.referral_code = generate_referral_code()
        session_id = UserService.generate_session_id()
        user.session_id = session_id
        user.save()

        jwt_token = UserService.create_jwt_token(user.id, session_id)

        ip_address = get_client_ip(request)
        AuditLog.objects.create(
            user=user,
            action='phone_registration',
            ip_address=ip_address,
        )

        return Response(
            {
                'jwt': jwt_token,
                'message': 'Account created successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


@method_decorator(csrf_exempt, name='dispatch')
class PhoneConfirmLinkView(APIView):
    """
    POST /api/authentication/phone/confirm-link/

    Confirm or cancel account linking for phone authentication.

    Request body:
        - confirmed: Boolean - true to link account, false to cancel (required)
        - email: Email of the existing account to link (required)
        - phone_number: Verified phone number in E.164 format (required)
    """
    throttle_classes = [PhoneLinkThrottle]

    def post(self, request):
        try:
            authenticate_request(request)

            confirmed = request.data.get('confirmed', False)
            email = request.data.get('email', '').strip().lower()
            phone_number = request.data.get('phone_number', '').strip()

            validation_error = self._validate_link_data(email, phone_number)
            if validation_error:
                return Response(
                    {'error': validation_error},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Ensure phone was verified via OTP
            if not PhoneOTP.objects.filter(phone_number=phone_number, is_verified=True).exists():
                return Response(
                    {'error': 'Phone number has not been verified'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not confirmed:
                return Response(
                    {'message': 'Account linking cancelled. You can create a new account with a different email.'},
                    status=status.HTTP_200_OK,
                )

            user = User.objects.filter(
                email=email,
                is_deleted=False,
            ).first()

            if not user:
                return Response(
                    {'error': 'Account not found'},
                    status=status.HTTP_404_NOT_FOUND,
                )

            existing_phone_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False,
            ).exclude(id=user.id).first()

            if existing_phone_user:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address,
                )
                return Response(
                    {'error': 'Phone number already linked to another account'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user.phone_number and user.phone_number != phone_number:
                return Response(
                    {'error': 'This account already has a different phone number linked'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.phone_number = phone_number
            session_id = UserService.generate_session_id()
            user.session_id = session_id
            user.save(update_fields=['phone_number', 'session_id'])

            jwt_token = UserService.create_jwt_token(user.id, session_id)

            ip_address = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='phone_account_linked',
                ip_address=ip_address,
            )

            return Response(
                {
                    'jwt': jwt_token,
                    'message': 'Account linked successfully',
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'name': user.name,
                    },
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Phone confirm link error: {str(e)}", exc_info=True)
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address,
                )
            except Exception:
                pass
            return Response(
                {'error': 'Account linking failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _validate_link_data(self, email: str, phone_number: str) -> str:
        if not email:
            return 'Email is required'
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return 'Invalid email format'
        if not phone_number:
            return 'Phone number is required'
        if not is_valid_e164(phone_number):
            return 'Phone number must be in E.164 format (e.g., +919876543210)'
        return ''