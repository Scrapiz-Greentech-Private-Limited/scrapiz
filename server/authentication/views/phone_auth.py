"""
Phone Authentication Views for handling phone number OTP verification.

This module provides API views for phone number authentication using Firebase.
Firebase handles OTP generation, SMS delivery, and verification - these views
verify the resulting Firebase ID token and manage user authentication.
"""

import re
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle
from utils.usercheck import authenticate_request
from utils.audit_client_ip import get_client_ip
from ..services import FirebasePhoneAuthService, UserService
from ..models import AuditLog, User
from ..utils import generate_referral_code
import logging

logger = logging.getLogger(__name__)


class PhoneVerifyThrottle(AnonRateThrottle):
    """Rate limiting for phone verification endpoint - 10 attempts per minute per IP."""
    rate = '10/min'


class PhoneProfileThrottle(AnonRateThrottle):
    """Rate limiting for phone profile completion endpoint - 5 attempts per minute per IP."""
    rate = '5/min'


class PhoneLinkThrottle(AnonRateThrottle):
    """Rate limiting for phone account linking endpoint - 5 attempts per minute per IP."""
    rate = '5/min'


@method_decorator(csrf_exempt, name='dispatch')
class PhoneVerifyView(APIView):
    """
    POST /api/authentication/phone/verify/
    
    Verify Firebase ID token and authenticate existing user or request profile completion.
    
    This endpoint is the first step in phone authentication:
    1. Validates the x-auth-app header
    2. Verifies the Firebase ID token
    3. Extracts phone number and Firebase UID from token claims
    4. Checks if phone number exists in database
    5. For existing users: generates new session and returns JWT
    6. For new users: returns profile_required response
    
    Request body:
        - firebase_token: Firebase ID token from client (required)
        
    Response scenarios:
        1. Success (existing user):
           {jwt, message, user: {id, email, name}}
           
        2. Profile required (new user):
           {profile_required: true, phone_number: "...", firebase_uid: "...", message: "..."}
           
        3. Error:
           {error: "..."} with appropriate status code
    """
    throttle_classes = [PhoneVerifyThrottle]
    
    def post(self, request):
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            # Extract Firebase token from request
            firebase_token = request.data.get('firebase_token')
            
            if not firebase_token:
                return Response(
                    {'error': 'Firebase token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify Firebase ID token
            try:
                token_claims = FirebasePhoneAuthService.verify_id_token(firebase_token)
            except ValueError as e:
                # Log failed authentication attempt
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address
                )
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Extract phone number and Firebase UID
            phone_number = FirebasePhoneAuthService.extract_phone_number(token_claims)
            firebase_uid = token_claims.get('firebase_uid') or token_claims.get('uid')
            
            # Check if phone number exists in database
            existing_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False
            ).first()
            
            if existing_user:
                # Existing user - authenticate and return JWT
                return self._authenticate_user(existing_user, request)
            
            # New user - return profile_required response
            return Response({
                'profile_required': True,
                'phone_number': phone_number,
                'firebase_uid': firebase_uid,
                'message': 'Please complete your profile'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Phone verify error: {str(e)}", exc_info=True)
            
            # Log failed authentication attempt
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address
                )
            except Exception:
                pass  # Don't fail if audit logging fails
            
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _authenticate_user(self, user, request):
        """
        Generate new session and JWT for authenticated user.
        
        Args:
            user: The User model instance to authenticate
            request: The HTTP request object
            
        Returns:
            Response: Success response with JWT and user info
        """
        # Generate new session_id for each authentication
        session_id = UserService.generate_session_id()
        user.session_id = session_id
        user.save(update_fields=['session_id'])
        
        # Create JWT token
        jwt_token = UserService.create_jwt_token(user.id, session_id)
        
        # Log the phone login
        ip_address = get_client_ip(request)
        AuditLog.objects.create(
            user=user,
            action='phone_login',
            ip_address=ip_address
        )
        
        # Return success response with JWT token
        return Response({
            'jwt': jwt_token,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class PhoneCompleteProfileView(APIView):
    """
    POST /api/authentication/phone/complete-profile/
    
    Complete profile for new phone auth users.
    
    This endpoint handles profile completion after phone verification:
    1. Validates the x-auth-app header
    2. Validates profile data (name, email, phone_number, firebase_uid)
    3. Checks if email already exists in database
    4. For new email: creates user and returns JWT
    5. For existing email: returns requires_link_confirmation response
    
    Request body:
        - name: User's full name (required, non-empty)
        - email: User's email address (required, valid format)
        - phone_number: Verified phone number in E.164 format (required)
        - firebase_uid: Firebase unique user identifier (required)
        
    Response scenarios:
        1. Success (new user created):
           {jwt, message, user: {id, email, name}}
           
        2. Email collision (requires link confirmation):
           {requires_link_confirmation: true, existing_email: "...", auth_provider: "...", message: "..."}
           
        3. Error:
           {error: "..."} with appropriate status code
    """
    throttle_classes = [PhoneProfileThrottle]
    
    def post(self, request):
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            # Extract profile data from request
            name = request.data.get('name', '').strip()
            email = request.data.get('email', '').strip().lower()
            phone_number = request.data.get('phone_number', '').strip()
            firebase_uid = request.data.get('firebase_uid', '').strip()
            
            # Validate required fields
            validation_errors = self._validate_profile_data(name, email, phone_number, firebase_uid)
            if validation_errors:
                return Response(
                    {'error': validation_errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if phone number is already linked to another account
            existing_phone_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False
            ).first()
            
            if existing_phone_user:
                return Response(
                    {'error': 'Phone number already linked to another account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email already exists
            existing_email_user = User.objects.filter(
                email=email,
                is_deleted=False
            ).first()
            
            if existing_email_user:
                # Email collision - check if phone is already linked
                if existing_email_user.phone_number:
                    return Response(
                        {'error': 'Phone number already linked to another account'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Determine auth provider for existing account
                auth_provider = self._determine_auth_provider(existing_email_user)
                
                return Response({
                    'requires_link_confirmation': True,
                    'existing_email': existing_email_user.email,
                    'auth_provider': auth_provider,
                    'message': 'An account with this email already exists. Would you like to link your phone number?'
                }, status=status.HTTP_200_OK)
            
            # Create new user
            return self._create_new_user(name, email, phone_number, firebase_uid, request)
            
        except Exception as e:
            logger.error(f"Phone complete profile error: {str(e)}", exc_info=True)
            
            # Log failed authentication attempt
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address
                )
            except Exception:
                pass  # Don't fail if audit logging fails
            
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _validate_profile_data(self, name: str, email: str, phone_number: str, firebase_uid: str) -> str:
        """
        Validate profile data fields.
        
        Args:
            name: User's full name
            email: User's email address
            phone_number: Phone number in E.164 format
            firebase_uid: Firebase unique user identifier
            
        Returns:
            str: Error message if validation fails, empty string if valid
        """
        # Validate name - must be non-empty and not whitespace-only
        if not name:
            return 'Name is required'
        
        if len(name) > 50:
            return 'Name must be 50 characters or less'
        
        # Validate email format
        if not email:
            return 'Email is required'
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return 'Invalid email format'
        
        # Validate phone number - must be in E.164 format
        if not phone_number:
            return 'Phone number is required'
        
        if not FirebasePhoneAuthService.is_valid_e164(phone_number):
            return 'Phone number must be in E.164 format (e.g., +919876543210)'
        
        # Validate firebase_uid
        if not firebase_uid:
            return 'Firebase UID is required'
        
        return ''
    
    def _determine_auth_provider(self, user: User) -> str:
        """
        Determine the authentication provider for an existing user.
        
        Args:
            user: The User model instance
            
        Returns:
            str: The auth provider type ('email', 'google', 'apple')
        """
        if user.apple_user_id:
            return 'apple'
        
        # Check if user has a usable password (email/password auth)
        if user.has_usable_password():
            return 'email'
        
        # Default to google for OAuth users without Apple ID
        return 'google'
    
    def _create_new_user(self, name: str, email: str, phone_number: str, firebase_uid: str, request) -> Response:
        """
        Create a new user with phone authentication.
        
        Args:
            name: User's full name
            email: User's email address
            phone_number: Phone number in E.164 format
            firebase_uid: Firebase unique user identifier
            request: The HTTP request object
            
        Returns:
            Response: Success response with JWT and user info
        """
        # Create new user
        user = User.objects.create(
            name=name,
            email=email,
            phone_number=phone_number,
            firebase_uid=firebase_uid,
            is_active=True,
            password='',
        )
        
        # Set unusable password for phone-only auth
        user.set_unusable_password()
        
        # Generate unique referral code
        user.referral_code = generate_referral_code()
        
        # Generate session_id
        session_id = UserService.generate_session_id()
        user.session_id = session_id
        
        user.save()
        
        # Create JWT token
        jwt_token = UserService.create_jwt_token(user.id, session_id)
        
        # Log the phone registration
        ip_address = get_client_ip(request)
        AuditLog.objects.create(
            user=user,
            action='phone_registration',
            ip_address=ip_address
        )
        
        # Return success response
        return Response({
            'jwt': jwt_token,
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            }
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class PhoneConfirmLinkView(APIView):
    """
    POST /api/authentication/phone/confirm-link/
    
    Confirm or cancel account linking for phone authentication.
    
    This endpoint handles the final step of account linking when a user's
    email already exists in the system:
    1. Validates the x-auth-app header
    2. If confirmed=false: returns cancellation message without modifying accounts
    3. If confirmed=true: verifies phone not already linked, links account, returns JWT
    
    Request body:
        - confirmed: Boolean - true to link account, false to cancel (required)
        - email: Email of the existing account to link (required)
        - phone_number: Verified phone number in E.164 format (required)
        - firebase_uid: Firebase unique user identifier (required)
        
    Response scenarios:
        1. Success (account linked):
           {jwt, message, user: {id, email, name}}
           
        2. Cancelled:
           {message: "Account linking cancelled..."}
           
        3. Error:
           {error: "..."} with appropriate status code
    """
    throttle_classes = [PhoneLinkThrottle]
    
    def post(self, request):
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            # Extract request data
            confirmed = request.data.get('confirmed', False)
            email = request.data.get('email', '').strip().lower()
            phone_number = request.data.get('phone_number', '').strip()
            firebase_uid = request.data.get('firebase_uid', '').strip()
            
            # Validate required fields
            validation_error = self._validate_link_data(email, phone_number, firebase_uid)
            if validation_error:
                return Response(
                    {'error': validation_error},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Handle cancellation - no account modification
            if not confirmed:
                return Response({
                    'message': 'Account linking cancelled. You can create a new account with a different email.'
                }, status=status.HTTP_200_OK)
            
            # Find the existing account by email
            user = User.objects.filter(
                email=email,
                is_deleted=False
            ).first()
            
            if not user:
                return Response(
                    {'error': 'Account not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Verify phone number is not already linked to another account
            existing_phone_user = User.objects.filter(
                phone_number=phone_number,
                is_deleted=False
            ).exclude(id=user.id).first()
            
            if existing_phone_user:
                # Log the failed linking attempt
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address
                )
                return Response(
                    {'error': 'Phone number already linked to another account'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if the existing account already has a phone number linked
            if user.phone_number and user.phone_number != phone_number:
                return Response(
                    {'error': 'This account already has a different phone number linked'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Link phone number and firebase_uid to existing account
            user.phone_number = phone_number
            user.firebase_uid = firebase_uid
            
            # Generate new session_id
            session_id = UserService.generate_session_id()
            user.session_id = session_id
            
            user.save(update_fields=['phone_number', 'firebase_uid', 'session_id'])
            
            # Create JWT token
            jwt_token = UserService.create_jwt_token(user.id, session_id)
            
            # Log the account linking
            ip_address = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='phone_account_linked',
                ip_address=ip_address
            )
            
            # Return success response
            return Response({
                'jwt': jwt_token,
                'message': 'Account linked successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Phone confirm link error: {str(e)}", exc_info=True)
            
            # Log failed authentication attempt
            try:
                ip_address = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,
                    action='phone_auth_failed',
                    ip_address=ip_address
                )
            except Exception:
                pass  # Don't fail if audit logging fails
            
            return Response(
                {'error': 'Account linking failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _validate_link_data(self, email: str, phone_number: str, firebase_uid: str) -> str:
        """
        Validate account linking data fields.
        
        Args:
            email: Email of the existing account
            phone_number: Phone number in E.164 format
            firebase_uid: Firebase unique user identifier
            
        Returns:
            str: Error message if validation fails, empty string if valid
        """
        # Validate email
        if not email:
            return 'Email is required'
        
        # Basic email format validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return 'Invalid email format'
        
        # Validate phone number - must be in E.164 format
        if not phone_number:
            return 'Phone number is required'
        
        if not FirebasePhoneAuthService.is_valid_e164(phone_number):
            return 'Phone number must be in E.164 format (e.g., +919876543210)'
        
        # Validate firebase_uid
        if not firebase_uid:
            return 'Firebase UID is required'
        
        return ''
