"""
Admin User Management Views

Admin endpoints for managing user addresses and related data.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import logging

from .models import AddressModel
from .serializers import AddressSerializer
from authentication.models import User
from utils.usercheck import authenticate_request

logger = logging.getLogger(__name__)


def require_admin(func):
    """Decorator to require admin privileges"""
    def wrapper(self, request, *args, **kwargs):
        try:
            user = authenticate_request(request, need_user=True)
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {"error": "Admin privileges required"},
                    status=status.HTTP_403_FORBIDDEN
                )
            request.admin_user = user
            return func(self, request, *args, **kwargs)
        except AuthenticationFailed as e:
            return Response(
                {"error": str(e.detail)},
                status=status.HTTP_401_UNAUTHORIZED
            )
    return wrapper


@method_decorator(csrf_exempt, name='dispatch')
class AdminUserAddressesView(APIView):
    """
    Admin endpoint to get addresses for a specific user.
    
    GET /user/admin/addresses/<user_id>/
    Returns all addresses for the specified user.
    """
    
    @require_admin
    def get(self, request, user_id):
        try:
            # Verify user exists
            user = User.objects.filter(id=user_id, is_deleted=False).first()
            if not user:
                return Response(
                    {"error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get all addresses for this user
            addresses = AddressModel.objects.filter(user=user).order_by('-id')
            serializer = AddressSerializer(addresses, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching addresses for user {user_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch addresses"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class AdminAddressDetailView(APIView):
    """
    Admin endpoint for single address operations.
    
    GET /user/admin/address/<address_id>/
    DELETE /user/admin/address/<address_id>/
    """
    
    @require_admin
    def get(self, request, address_id):
        try:
            address = AddressModel.objects.filter(id=address_id).first()
            if not address:
                return Response(
                    {"error": "Address not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = AddressSerializer(address)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching address {address_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch address"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @require_admin
    def delete(self, request, address_id):
        try:
            address = AddressModel.objects.filter(id=address_id).first()
            if not address:
                return Response(
                    {"error": "Address not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            address.delete()
            return Response(
                {"message": "Address deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error deleting address {address_id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to delete address"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
