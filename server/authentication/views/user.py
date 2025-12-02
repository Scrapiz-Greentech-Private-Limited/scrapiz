from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import jwt
import datetime
from django.utils import timezone
from ..models import User, AuditLog
from ..serializers import UserSerializer,PasswordResetRequestSerializer,PasswordResetSerializer,ReferredUserSerializer
from django.core.mail import send_mail
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.core.cache import cache
import ssl
from ..utils import validate_image, delete_s3_file
from ..models import AccountDeletionFeedback
from ..utils import anonymize_user_account, send_deletion_confirmation_email
from dotenv import load_dotenv
from django.db import transaction as db_transaction
from decimal import Decimal
from inventory.models import OrderNo
import os 
from utils.usercheck import authenticate_request
import uuid
from utils.audit_client_ip import get_client_ip
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import logging

logger = logging.getLogger(__name__)

load_dotenv()
# Disable SSL verification
ssl._create_default_https_context = ssl._create_unverified_context


# ------------------ Custom Throttles ------------------
class ResendOtpThrottle(UserRateThrottle):
    rate = '1/min'  # 1 request per minute per user

class LoginThrottle(AnonRateThrottle):
    rate = '5/min'  # 5 attempts per minute per IP (anon)

class PasswordResetRequestThrottle(AnonRateThrottle):
    rate = '6/hour'  # 1 request per 10 minutes per IP/email ✅ corrected below

class PasswordResetThrottle(UserRateThrottle):
    rate = '5/min'  # 5 attempts per minute per user ✅ corrected

# ------------------ Views ------------------
class RegisterView(APIView):
    @csrf_exempt
    def post(self, request):
        authenticate_request(request)
        email = request.data.get('email')
        name = request.data.get('name')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        

        if not email or not name or not password or not confirm_password:
            return Response({"message": "Email, name, password, and confirm_password are required"}, status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({"message": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user exists and is active
        existing_user = User.objects.filter(email=email).first()
        if existing_user and existing_user.is_active:
            return Response({"message": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        otp = get_random_string(length=6, allowed_chars='0123456789')
        promo_code = request.data.get('promo_code', None)

        if existing_user:
            # If user exists but inactive, update their details & OTP
            existing_user.name = name
            existing_user.set_password(password)
            existing_user.otp = otp
            existing_user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
            existing_user.is_active = False
            existing_user.save()
            user = existing_user
        else:
            # Create new user
            user = User.objects.create_user(email=email, name=name, password=password)
            user.otp = otp
            user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
            user.is_active = False
            from authentication.utils import generate_referral_code, validate_promo_code
            user.referral_code  = generate_referral_code()
            if promo_code:
              referrer = validate_promo_code(promo_code)
              if referrer and referrer.id:
                user.referred_by = referrer
            user.save()

        html_message = render_to_string('email/register_otp.html', {'otp': otp})
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}',
            'teamscrapiz@gmail.com',
            [email],
            fail_silently=False,
            html_message=html_message,
        )

        return Response({"message": "User created successfully. OTP sent to your email."}, status=status.HTTP_201_CREATED)


    def put(self, request):
        authenticate_request(request)
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
    throttle_classes = [ResendOtpThrottle]
    @csrf_exempt
    def post(self, request):
        authenticate_request(request)
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        

        if user:
            otp = get_random_string(length=6, allowed_chars='0123456789')
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




# ----------------- Login -----------------
class LoginView(APIView):
    throttle_classes = [LoginThrottle]

    @csrf_exempt
    def post(self, request):
        authenticate_request(request)
        email = request.data.get('email')
        password = request.data.get('password')
        user = User.objects.filter(email=email).first()
        

        if user is None:
            raise AuthenticationFailed('User Not found!')

        if not user.check_password(password):
            raise AuthenticationFailed('Incorrect Password')

        if not user.is_active:
            raise AuthenticationFailed('Account not activated. Please verify your email.')

        # Generate new session ID
        session_id = str(uuid.uuid4())
        user.session_id = session_id
        user.save()

        # Audit log
        ip = get_client_ip(request)
        AuditLog.objects.create(user=user, action="login", ip_address=ip)

        payload = {
            'id': user.id,
            'session_id': session_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
            'iat': datetime.datetime.utcnow()
        }

        token = jwt.encode(payload, 'secret', algorithm='HS256')
        return Response({'jwt': token})

# ----------------- Logout -----------------
class LogoutView(APIView):
    @csrf_exempt
    def post(self, request):
        user = authenticate_request(request, need_user=True)
        # Clear session
        user.session_id = None
        user.save()

        # Audit log
        ip = get_client_ip(request)
        AuditLog.objects.create(user=user, action="logout", ip_address=ip)

        response = Response()
        response.delete_cookie('jwt')
        response.data = {"message": "Logged out successfully"}
        return response

# ----------------- Password Reset Request -----------------
class PasswordResetRequestView(APIView):
    throttle_classes = [PasswordResetRequestThrottle]

    @csrf_exempt
    def post(self, request):
        authenticate_request(request)
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        # 6-digit OTP
        otp = get_random_string(length=6, allowed_chars='0123456789')
        user.otp = otp
        user.otp_expiration = timezone.now() + timezone.timedelta(minutes=5)
        user.save()

        # Send OTP email
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

# ----------------- Password Reset -----------------
class PasswordResetView(APIView):

    throttle_classes = [PasswordResetThrottle]
    @csrf_exempt
    def post(self, request):
        authenticate_request(request)
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']
        

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "User with this email does not exist."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate OTP
        if user.otp != otp or user.otp_expiration < timezone.now():
            return Response({"message": "Invalid OTP or OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Reset password & clear session/OTP
        user.set_password(new_password)
        user.session_id = None
        user.otp = None
        user.otp_expiration = None
        user.last_password_reset = timezone.now()
        user.save()

        # Audit log
        ip = get_client_ip(request)
        AuditLog.objects.create(user=user, action="password_reset", ip_address=ip)

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
# ----------------- Get User Details -----------------
class UserView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    @csrf_exempt
    def get(self, request):

        user = authenticate_request(request, need_user=True)
        serializer = UserSerializer(user)

        return Response(serializer.data)

    @csrf_exempt
    def patch(self, request):
        
        user = authenticate_request(request, need_user=True)

        data = request.data
        updated_fields = []
        if "name" in data:
          user.name = data["name"]
          updated_fields.append("name")
        if "profile_image" in request.FILES:
          try:
            uploaded_file = request.FILES["profile_image"]
            validate_image(uploaded_file)
            if user.profile_image:
              delete_s3_file(user.profile_image)
            file_extension = uploaded_file.name.split('.')[-1].lower()
            random_string = get_random_string(length=16)
            file_path = f"profiles/{user.id}/{random_string}.{file_extension}"
            # Upload to S3
            saved_path = default_storage.save(file_path, uploaded_file)
            file_url = default_storage.url(saved_path)
            user.profile_image = file_url
            updated_fields.append("profile_image")
          except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
          except Exception as e:
            return Response(
              {"error": f"Failed to upload image: {str(e)}"}, 
              status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        elif "profile_image" in data and data["profile_image"] == "":
          if user.profile_image:
            delete_s3_file(user.profile_image)
            user.profile_image = None
            updated_fields.append("profile_image")
        if updated_fields:
          user.save()
          if "name" in updated_fields:
            html_message = render_to_string('email/name_reset_sucessful.html', {'name': user.name})
            send_mail(
              'Name Reset Successful',
              'Your name has been reset successfully.',
              'teamscrapiz@gmail.com',
              [user.email],
              fail_silently=False,
              html_message=html_message,
            )
          serializer = UserSerializer(user)
          return Response(serializer.data, status=status.HTTP_200_OK)
        else:
          return Response({"error": "No valid fields to update"}, status=status.HTTP_400_BAD_REQUEST)
        
    @csrf_exempt
    def delete(self, request):
        user = authenticate_request(request, need_user=True)
        try:
          with db_transaction.atomic():
            if user.is_deleted:
              return Response(
                {"error": "Account has already been deleted"},
                status=status.HTTP_400_BAD_REQUEST
              )
            feedback_reason = request.data.get('reason', 'not_specified')
            feedback_comments = request.data.get('comments', '')
            valid_reasons = [choice[0] for choice in AccountDeletionFeedback.REASON_CHOICES]
            if feedback_reason not in valid_reasons and feedback_reason != 'not_specified':
              return Response(
                {"error": f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"}, 
                status=status.HTTP_400_BAD_REQUEST
              )
            if feedback_comments and len(feedback_comments) > 500:
              return Response(
                {"error": "Comments must not exceed 500 characters"}, 
                status=status.HTTP_400_BAD_REQUEST
              )
            user_email = user.email
            user_name = user.name
            user_id = user.id
            AccountDeletionFeedback.objects.create(
              user_id=user_id,
              user_email=user_email,
              user_name=user_name,
              reason=feedback_reason,
              comments=feedback_comments if feedback_comments else None
            )
            anonymize_user_account(user)
            send_deletion_confirmation_email(user_email, user_name)
            ip = get_client_ip(request)
            AuditLog.objects.create(
              user=None, 
              action="account_deleted",
              ip_address=ip
            )
            return Response({
              "message": "Your account has been deleted successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
          import traceback
          error_details = traceback.format_exc()
          logger.error(f"Account deletion failed for user {user.id}: {str(e)}")
          logger.error(f"Full traceback: {error_details}")
          print(f"ACCOUNT DELETION ERROR: {str(e)}")
          print(f"Full traceback:\n{error_details}")
        return Response(
          {"error": "Failed to delete account. Please try again later."},
          status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )    
        

class ReferredUsersView(APIView):
  """
  GET endpoint to retrieve list of users referred by the current user
  """
  @csrf_exempt
  def get(self, request):
    user = authenticate_request(request, need_user=True)
    referred_users = User.objects.filter(referred_by=user).order_by('-date_joined')
    serializer = ReferredUserSerializer(referred_users, many=True)
    return Response({
      'referrals': serializer.data
    }, status=status.HTTP_200_OK)
    
# ----------------- Referral Transaction History -----------------

class ReferralTransactionsView(APIView):
  @csrf_exempt
  def get(self, request):
    user = authenticate_request(request, need_user=True)
    transactions = []
    from inventory.models import OrderNo
    successful_referrals = User.objects.filter(
      referred_by=user,
      has_completed_first_order=True
    ).order_by('-date_joined')
    for referred_user in successful_referrals:
      first_order = OrderNo.objects.filter(
        user=referred_user,
        status__name__iexact='completed'
      ).order_by('created_at').first()
      if first_order:
        transactions.append({
          'id': f'earned-referral-{referred_user.id}',
          'type': 'earned',
          'amount': 20.00,
          'description': f'Referral reward from {referred_user.name}',
          'created_at': first_order.created_at.isoformat(),
          'related_user_name': referred_user.name,
          'order_number': first_order.order_number,
        })
    if user.referred_by and user.has_completed_first_order:
      first_order = OrderNo.objects.filter(
        user=user,
        status__name__iexact='completed'
      ).order_by('created_at').first()
      
      if first_order:
        transactions.append({
          'id': f'earned-signup-{user.id}',
          'type': 'earned',
          'amount': 5.00,
          'description': f'Sign-up bonus (referred by {user.referred_by.name})',
          'created_at': first_order.created_at.isoformat(),
          'related_user_name': user.referred_by.name,
          'order_number': first_order.order_number,
        })
    redeemed_orders = OrderNo.objects.filter(
      user=user,
      redeemed_referral_bonus__gt=0
    ).order_by('-created_at')
    for order in redeemed_orders:
      transactions.append({
        'id': f'redeemed-{order.id}',
        'type': 'redeemed',
        'amount': float(order.redeemed_referral_bonus),
        'description': f'Redeemed on order {order.order_number}',
        'created_at': order.created_at.isoformat(),
        'order_number': order.order_number,
      })
    transactions.sort(key=lambda x: x['created_at'], reverse=True)
    return Response({
      'transactions':transactions} , status=status.HTTP_200_OK)
@method_decorator(csrf_exempt, name='dispatch')
class RedeemReferralBalanceView(APIView):

  def post(self, request):
    """
    POST endpoint to redeem referral balance on an order. Deducts and adds it to database
    """
    try:
      user = authenticate_request(request, need_user=True)
      if not user:
        return Response({"error": "Authentication required"}, status=401)
    except Exception as e:
        return Response({"error": f"Authentication failed: {str(e)}"}, status=401)
      
    order_id = request.data.get('order_id')
    amount = request.data.get('amount')
    if not order_id:
      return Response(
        {"error": "order_id is required"},
        status=status.HTTP_400_BAD_REQUEST
      )
    if not amount:
      return Response(
        {"error": "amount is required"}, 
        status = status.HTTP_400_BAD_REQUEST
      )
      
    try:
      amount = Decimal(str(amount))
      if amount < 0:
        return Response(
          {"error": "Amount must be greater than 0"}, 
          status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
      return Response(
        {"error": "Invalid amount format"}, 
        status=status.HTTP_400_BAD_REQUEST
      )
      
    try:
      with db_transaction.atomic():
        user = User.objects.select_for_update().get(id=user.id)
        try:
          order = OrderNo.objects.select_for_update().get(
            id=order_id,
            user=user
          )
        except OrderNo.DoesNotExist:
          return Response(
            {"error": "Order not found or does not belong to you"},
            status=status.HTTP_404_NOT_FOUND
          )
        current_balance = Decimal(user.referred_balance or '0')
        if current_balance < amount:
          return Response(
            {"error": f"Insufficient balance. Available: ₹{current_balance}"},
            status=status.HTTP_400_BAD_REQUEST)
        if order.redeemed_referral_bonus and order.redeemed_referral_bonus > 0:
          return Response(
            {"error": "Referral bonus already redeemed for this order"},
            status=status.HTTP_400_BAD_REQUEST
          )
        user.referred_balance = current_balance - amount
        user.save()
        order.redeemed_referral_bonus = amount
        order.save()
        ip = get_client_ip(request)
        AuditLog.objects.create(
            user=user,
            action=f"referral_redeem_{amount}",
            ip_address=ip
        )
        return Response({
            "message": "Referral balance redeemed successfully",
            "redeemed_amount": float(amount),
            "new_balance": float(user.referred_balance),
            "order_id": order.id,
            "order_number": order.order_number
        },status=status.HTTP_200_OK)
    except Exception as e:
      return Response(
        {"error": f"Failed to redeem balance: {str(e)}"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
      )
  
  