from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
import jwt
import datetime
from django.utils import timezone
from .models import User
from .serializer import UserSerializer,PasswordResetRequestSerializer,PasswordResetSerializer
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils.crypto import get_random_string
from django.core.cache import cache
import ssl
# Disable SSL verification
ssl._create_default_https_context = ssl._create_unverified_context
class RegisterView(APIView):
    @csrf_exempt
    def post(self, request):
        email = request.data.get('email')
        name = request.data.get('name')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not email or not name or not password or not confirm_password:
            return Response({"message": "Email, name, password, and confirm_password are required"}, status=status.HTTP_400_BAD_REQUEST)
        if password != confirm_password:
            return Response({"message": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"message": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
        otp = get_random_string(length=4, allowed_chars='0123456789')
        user = User.objects.create_user(email=email, name=name, password=password)
        user.otp = otp
        user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
        user.is_active = False  # Set user as inactive until email verification
        user.save()
        html_message = render_to_string('email/registeration_otp.html', {'otp': otp})
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}',
            'teamscrapiz@gmail.com',  # Replace with your email
            [email],
            fail_silently=False,
            html_message=html_message,
        )
        return Response({"message": "User created successfully. OTP sent to your email."}, status=status.HTTP_201_CREATED)


    def put(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        user = User.objects.filter(email=email).first()
        if user and user.otp == otp and user.otp_expiration > timezone.now():
            user.is_active = True
            user.otp = None
            user.otp_expiration = None
            user.save()
            # Send a welcome email or any other post-verification action
            html_message = render_to_string('email/welcome.html', {'name': user.name})
            send_mail(
                'Welcome to Scrapiz',
                'Thank you for verifying your email.',
                'teamscrapiz@gmail.com',  # Replace with your email
                [email],
                fail_silently=False,
                html_message=html_message,
            )

            return Response({'message': 'User verified successfully'})
        else:
            return Response({'error': 'Invalid OTP or OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
        # return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ResendotpView(APIView):
    @csrf_exempt
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if user and not user.is_active:
            otp = get_random_string(length=4, allowed_chars='0123456789')
            user.otp = otp
            user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
            user.save()
            html_message = render_to_string('email/otp_resend.html', {'otp': otp})
            send_mail(
                'Your OTP Code',
                f'Your OTP code is {otp}',
                'teamscrapiz@gmail.com',  # Replace with your email
                [email],
                fail_silently=False,
                html_message=html_message,
            )
            return Response({"message": "OTP resent successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)




class LoginView(APIView):
    @csrf_exempt
    def post(self, request):
        email = request.data['email']

        password = request.data['password']

        user = User.objects.filter(email=email).first()

        if user is None:
            raise AuthenticationFailed('User Not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect Password')

        if not user.is_active:
            raise AuthenticationFailed('Account not activated. Please verify your email.')

        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')

        response = Response()
        response.data = {
            'jwt': token  # No "Bearer" prefix
        }

        return response
    




class LogoutView(APIView):
    @csrf_exempt
    def post(self, request):
        response = Response()
        response.delete_cookie('jwt')
        response.data = {
            'message': "Logged out successfully"
        }
        return response



# views.py



class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        otp = get_random_string(length=4, allowed_chars='0123456789')
        # cache.set(f'otp_{email}', otp, timeout=300)  # OTP valid for 5 minutes
        user.otp = otp
        user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
        user.save()
        html_message = render_to_string('email/password_reset.html', {'otp': otp})

        send_mail(
            'Password Reset OTP',
            f'Your OTP for password reset is {otp}.',
            'teamscrapiz@gmail.com',
            [email],
            fail_silently=False,
            html_message=html_message,
        )
        return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
            if user.otp != otp or user.otp_expiration < timezone.now():
                return Response({"message": "Invalid OTP or OTP expired."}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            cache.delete(f'otp_{email}')
            # Send confirmation email
            html_message = render_to_string('email/password_reset_sucessful.html', {'name': user.name})
            send_mail(
                'Password Reset Successful',
                'Your password has been reset successfully.',
                'teamscrapiz@gmail.com',
                [email],
                fail_silently=False,
                html_message=html_message,
            )
            return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"message": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)



class OAuthLoginView(APIView):
    @csrf_exempt
    def post(self, request):

        email = request.data.get('email')
        name = request.data.get('name')

        if not email or not name:
            return Response({"error": "Email and name are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()

        if not user:
            # Create a new user if the email does not exist in the database
            user = User.objects.create_user(email=email, name=name, password=None)
            user.is_active = True  # Ensure the user is marked as active
            user.save()
            # Send a welcome email or any other post-verification action
            html_message = render_to_string('email/welcome.html', {'name': user.name})
            send_mail(
                'Welcome to Scrapiz',
                'Thank you for signing up.',
                'teamscrapiz@gmail.com',  # Replace with your email
                [email],
                fail_silently=False,
                html_message=html_message,
            )

        # Generate JWT token
        payload = {
            'id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }
        token = jwt.encode(payload, 'secret', algorithm='HS256')

        return Response({'jwt': token}, status=status.HTTP_200_OK)