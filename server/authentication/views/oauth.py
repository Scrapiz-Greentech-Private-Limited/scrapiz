from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils.usercheck import authenticate_request
from utils.audit_client_ip import get_client_ip
from ..services import GoogleOAuthService, UserService, AppleOAuthService
from ..models import AuditLog, User
import logging

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class GoogleOAuthLoginView(APIView):
    """Handle Google OAuth login"""
    
    def post(self, request):
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            # Extract ID token from request
            id_token = request.data.get('id_token')
            
            if not id_token:
                return Response(
                    {'error': 'ID token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify Google ID token
            try:
                token_data = GoogleOAuthService.verify_id_token(id_token)
            except ValueError as e:
                return Response(
                    {'error': f'Invalid token: {str(e)}'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Extract user information
            email = token_data.get('email')
            name = token_data.get('name', email.split('@')[0])
            
            # Get or create user
            try:
                user = UserService.get_or_create_oauth_user(email, name)
            except Exception as e:
                return Response(
                    {'error': 'Failed to create user account'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate new session ID
            session_id = UserService.generate_session_id()
            user.session_id = session_id
            user.save()
            
            # Create JWT token
            jwt_token = UserService.create_jwt_token(user.id, session_id)
            
            # Log the OAuth login
            ip_address = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='oauth_login',
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
            
        except Exception as e:
            logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Authentication error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AppleOAuthLoginView(APIView):
    """Handle Apple OAuth login with nonce verification and account linking."""
    
    def post(self, request):
        """
        Process Apple Sign-In request.
        
        Request body:
            - identity_token: Apple's identity JWT (required)
            - nonce: Raw nonce for verification (required)
            - user: Optional {firstName, lastName} from first sign-in
            - email: Optional email from first sign-in
            - platform_info: Optional {os, osVersion, deviceModel}
            
        Response scenarios:
            1. Success (new user or existing Apple user):
               {jwt, message, user: {id, email, name}}
               
            2. Account linking required (email matches existing account):
               {requires_link_confirmation: true, existing_email: "..."}
               
            3. Error:
               {error: "..."} with appropriate status code
        """
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            identity_token = request.data.get('identity_token')
            nonce = request.data.get('nonce')
            
            if not identity_token:
                return Response(
                    {'error': 'Identity token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not nonce:
                return Response(
                    {'error': 'Nonce is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify token with nonce
            try:
                token_data = AppleOAuthService.verify_identity_token(
                    identity_token, nonce
                )
            except ValueError as e:
                return Response(
                    {'error': f'Invalid token: {str(e)}'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            apple_user_id = token_data.get('sub')
            email = token_data.get('email') or request.data.get('email')
            user_info = request.data.get('user', {})
            name = None
            if user_info:
                first_name = user_info.get('firstName', '') or ''
                last_name = user_info.get('lastName', '') or ''
                name = f"{first_name} {last_name}".strip()
            
            # Check if user exists by Apple ID
            existing_apple_user = User.objects.filter(
                apple_user_id=apple_user_id,
                is_deleted=False
            ).first()
            
            if existing_apple_user:
                # Existing Apple user - authenticate directly
                return self._authenticate_user(existing_apple_user, request)
            
            # Check if email matches existing account (requires confirmation)
            if email:
                existing_email_user = User.objects.filter(
                    email=email,
                    is_deleted=False,
                    apple_user_id__isnull=True  # Not already linked
                ).first()
                
                if existing_email_user:
                    # Return confirmation required response
                    return Response({
                        'requires_link_confirmation': True,
                        'existing_email': email,
                        'message': 'An account with this email already exists. '
                                   'Would you like to link your Apple ID to this account?'
                    }, status=status.HTTP_200_OK)
            
            # Create new user
            user = UserService.create_apple_oauth_user(
                apple_user_id=apple_user_id,
                email=email,
                name=name or (email.split('@')[0] if email else 'Apple User')
            )
            
            return self._authenticate_user(user, request)
            
        except Exception as e:
            logger.error(f"Apple OAuth error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _authenticate_user(self, user, request):
        """Generate new session and JWT for authenticated user."""
        # ALWAYS generate new session_id for each authentication
        session_id = UserService.generate_session_id()
        user.session_id = session_id
        user.save()
        
        jwt_token = UserService.create_jwt_token(user.id, session_id)
        
        # Log the authentication
        ip_address = get_client_ip(request)
        
        AuditLog.objects.create(
            user=user,
            action='apple_oauth_login',
            ip_address=ip_address
        )
        
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
class AppleOAuthConfirmLinkView(APIView):
    """Handle explicit user confirmation for account linking."""
    
    def post(self, request):
        """
        Confirm or reject Apple account linking to existing email account.
        
        Request body:
            - identity_token: Apple's identity JWT (required)
            - nonce: Raw nonce for verification (required)
            - confirmed: Boolean - true to link, false to cancel
            
        Response:
            - If confirmed=true and valid: {jwt, user}
            - If confirmed=false: {message: "Linking cancelled"}
            - If error: {error: "..."}
        """
        try:
            # Validate x-auth-app header
            authenticate_request(request)
            
            identity_token = request.data.get('identity_token')
            nonce = request.data.get('nonce')
            confirmed = request.data.get('confirmed', False)
            
            if not identity_token:
                return Response(
                    {'error': 'Identity token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not nonce:
                return Response(
                    {'error': 'Nonce is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Re-verify token (tokens are short-lived, this ensures freshness)
            try:
                token_data = AppleOAuthService.verify_identity_token(
                    identity_token, nonce
                )
            except ValueError as e:
                return Response(
                    {'error': f'Invalid token: {str(e)}'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not confirmed:
                return Response({
                    'message': 'Account linking cancelled. '
                               'You can create a new account instead.'
                }, status=status.HTTP_200_OK)
            
            apple_user_id = token_data.get('sub')
            email = token_data.get('email')
            
            if not email:
                return Response(
                    {'error': 'Email not found in token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find the existing account
            user = User.objects.filter(
                email=email,
                is_deleted=False
            ).first()
            
            if not user:
                return Response(
                    {'error': 'Account not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Link Apple ID to existing account
            user.apple_user_id = apple_user_id
            user.save()
            
            # Authenticate with new session
            session_id = UserService.generate_session_id()
            user.session_id = session_id
            user.save()
            
            jwt_token = UserService.create_jwt_token(user.id, session_id)
            
            ip_address = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='apple_oauth_login',
                ip_address=ip_address
            )
            
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
            logger.error(f"Apple OAuth link error: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Account linking failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
