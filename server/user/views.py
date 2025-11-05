import os
import jwt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .serializers import AddressSerializer, NotificationPreferenceSerializer
from .models import AddressModel, NotificationPreference
from authentication.models import User


class AuthenticatedAPIView(APIView):
    def authenticate_user(self, request):
        token = request.headers.get('Authorization')
        secret_key = request.headers.get('x-auth-app')

        if not secret_key or secret_key != os.getenv('FRONTEND_SECRET'):
            raise AuthenticationFailed('Invalid secret key')

        if not token:
            raise AuthenticationFailed('Unauthenticated!')

        try:
            payload = jwt.decode(token, 'secret', algorithms=["HS256"])
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
            # Return 204 No Content (standard for successful DELETE with no body)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(f"Error deleting address: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
