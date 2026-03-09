import os
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .serializers import AddressSerializer, NotificationPreferenceSerializer
from .models import AddressModel, NotificationPreference
from authentication.models import User

# Use the same JWT secret as usercheck.py for consistency
JWT_SECRET = getattr(settings, "SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"


class AuthenticatedAPIView(APIView):
    def authenticate_user(self, request):
        token = request.headers.get('Authorization')
        secret_key = request.headers.get('x-auth-app')

        if not secret_key or secret_key != os.getenv('MY_FRONTEND_SECRET'):
            raise AuthenticationFailed('Invalid secret key')

        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        # Strip 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired!')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token!')

        user = User.objects.filter(id=payload['id']).first()
        if not user:
            raise AuthenticationFailed('User not found!')

        return user


class AddressAPIView(AuthenticatedAPIView):

    # ✅ Get all addresses of logged-in user
    def get(self, request):
        user = self.authenticate_user(request)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # ✅ sirf current user ke addresses
        addresses = AddressModel.objects.filter(user=user)
        serializer = AddressSerializer(addresses, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    # ✅ Create address for logged-in user
    def post(self, request):
        user = self.authenticate_user(request)

        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)  # user attach
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Update apna hi address
    def put(self, request, pk):
        user = self.authenticate_user(request)

        try:
            address = AddressModel.objects.get(pk=pk, user=user)
        except AddressModel.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AddressSerializer(address, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=user)  # ensure correct user
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ✅ Delete apna hi address
    def delete(self, request, pk):
        try:
          user = self.authenticate_user(request)
          try:
            address = AddressModel.objects.get(pk=pk, user=user)
          except AddressModel.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)
          address.delete()
          return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
          print(f"Error deleting address: {str(e)}")
          return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SetDefaultAddressAPIView(AuthenticatedAPIView):
    """Set a specific address as the user's default, unsetting all others."""

    def post(self, request, pk):
        user = self.authenticate_user(request)

        try:
            address = AddressModel.objects.get(pk=pk, user=user)
        except AddressModel.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        # Unset all defaults for this user, then set the chosen one
        AddressModel.objects.filter(user=user).update(is_default=False)
        address.is_default = True
        address.save(update_fields=['is_default'])

        serializer = AddressSerializer(address)
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationPreferenceAPIView(AuthenticatedAPIView):
    def get(self, request):
        user = self.authenticate_user(request)
        preference, _ = NotificationPreference.objects.get_or_create(user=user)
        serializer = NotificationPreferenceSerializer(preference)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        user = self.authenticate_user(request)
        preference, _ = NotificationPreference.objects.get_or_create(user=user)
        serializer = NotificationPreferenceSerializer(preference, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegisterPushTokenAPIView(AuthenticatedAPIView):
    """
    Register Expo Push Token for authenticated user
    
    POST /api/user/register-push-token/
    Body:
        {
            "token": "ExponentPushToken[...]",
            "device_name": "iPhone 13" (optional)
        }
    """
    
    def post(self, request):
        try:
            user = self.authenticate_user(request)
        except AuthenticationFailed as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = request.data.get('token', '').strip()
        device_name = request.data.get('device_name', '').strip()
        
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate token format using PushNotificationService
        try:
            from notifications.services.push import PushNotificationService
            push_service = PushNotificationService()
            
            if not push_service.validate_token_format(token):
                return Response(
                    {'error': 'Invalid token format. Expected format: ExponentPushToken[...]'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': f'Failed to validate token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create or update token
        try:
            # Import here to avoid circular import issues
            from .models import PushToken
            
            push_token, created = PushToken.objects.update_or_create(
                token=token,
                defaults={
                    'user': user,
                    'device_name': device_name if device_name else None,
                    'is_active': True
                }
            )
            
            return Response({
                'success': True,
                'message': 'Token registered successfully',
                'created': created
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to register token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UnregisterPushTokenAPIView(AuthenticatedAPIView):
    """
    Unregister Expo Push Token for authenticated user
    
    POST /api/user/unregister-push-token/
    Body:
        {
            "token": "ExponentPushToken[...]"
        }
    """
    
    def post(self, request):
        try:
            user = self.authenticate_user(request)
        except AuthenticationFailed as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = request.data.get('token', '').strip()
        
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Import here to avoid circular import issues
            from .models import PushToken
            
            deleted_count = PushToken.objects.filter(
                user=user,
                token=token
            ).delete()[0]
            
            return Response({
                'success': True,
                'message': 'Token unregistered successfully',
                'deleted': deleted_count > 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to unregister token: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PushNotificationPreferencesAPIView(AuthenticatedAPIView):
    """
    Get and update user's push notification preferences
    
    GET /api/user/notification-preferences/
    Returns user's notification preferences
    
    PUT /api/user/notification-preferences/
    Body:
        {
            "push_notification_enabled": true,
            "order_updates": true,
            "promotions": false,
            "announcements": true,
            "general": true
        }
    """
    
    def get(self, request):
        try:
            user = self.authenticate_user(request)
        except AuthenticationFailed as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            'success': True,
            'preferences': {
                'push_notification_enabled': user.push_notification_enabled,
                'order_updates': user.notify_order_updates,
                'promotions': user.notify_promotions,
                'announcements': user.notify_announcements,
                'general': user.notify_general
            }
        }, status=status.HTTP_200_OK)
    
    def put(self, request):
        try:
            user = self.authenticate_user(request)
        except AuthenticationFailed as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Update preferences if provided in request
            if 'push_notification_enabled' in request.data:
                user.push_notification_enabled = request.data['push_notification_enabled']
            if 'order_updates' in request.data:
                user.notify_order_updates = request.data['order_updates']
            if 'promotions' in request.data:
                user.notify_promotions = request.data['promotions']
            if 'announcements' in request.data:
                user.notify_announcements = request.data['announcements']
            if 'general' in request.data:
                user.notify_general = request.data['general']
            
            user.save()
            
            return Response({
                'success': True,
                'message': 'Preferences updated successfully',
                'preferences': {
                    'push_notification_enabled': user.push_notification_enabled,
                    'order_updates': user.notify_order_updates,
                    'promotions': user.notify_promotions,
                    'announcements': user.notify_announcements,
                    'general': user.notify_general
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update preferences: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
