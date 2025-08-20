import os
import jwt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from .serializers import AddressSerializer
from .models import AddressModel
from authentication.models import User


class AddressAPIView(APIView):
    # ✅ helper function to get logged-in user
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
        user = self.authenticate_user(request)

        try:
            address = AddressModel.objects.get(pk=pk, user=user)
        except AddressModel.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        address.delete()
        return Response({"message": "Address deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
