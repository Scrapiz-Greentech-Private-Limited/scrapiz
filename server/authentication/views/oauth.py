from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from utils.usercheck import authenticate_request
from utils.audit_client_ip import get_client_ip
from ..services import GoogleOAuthService, UserService
from ..models import AuditLog, User


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
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Google OAuth error: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Authentication error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
