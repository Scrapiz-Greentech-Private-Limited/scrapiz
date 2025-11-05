from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import MultiPartParser, FormParser
import jwt
import datetime
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from ..models import User, AuditLog
from ..serializers import UserSerializer,PasswordResetRequestSerializer,PasswordResetSerializer,ReferredUserSerializer
from ..utils import validate_profile_image, delete_s3_file
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.core.cache import cache
import ssl
from dotenv import load_dotenv
import os 
from utils.usercheck import authenticate_request
import uuid
from utils.audit_client_ip import get_client_ip
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

load_dotenv()
# Disable SSL verification
ssl._create_default_https_context = ssl._create_unverified_context


# ------------------ Custom Throttles ------------------
class ResendOtpThrottle(UserRateThrottle):
    rate = '1/min'  # 1 request per minute per user

class LoginThrottle(AnonRateThrottle):
    rate = '5/min'  # 5 attempts per minute per IP (anon)

class PasswordResetRequestThrottle(AnonRateThrottle):
    rate = '6/hour'  # 6 requests per hour per IP (roughly 1 per 10 minutes)

class PasswordResetThrottle(UserRateThrottle):
    rate = '5/min'  # 5 attempts per minute per user

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
            
            # Generate referral code for new user
            from authentication.utils import generate_referral_code, validate_promo_code
            user.referral_code = generate_referral_code()
            
            # Link to referrer if promo_code provided
            if promo_code:
                referrer = validate_promo_code(promo_code)
                if referrer and referrer.id != user.id:  # Prevent self-referral
                    user.referred_by = referrer
            
            user.save()

        html_message = render_to_string('email/register_otp.html', {'otp': otp})
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}',
            'crodlintech@gmail.com',
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
                'Welcome to Crodlin Connect',
                'Thank you for verifying your email.',
                'crodlintech@gmail.com',  # Replace with your email
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
                'crodlintech@gmail.com',  # Replace with your email
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
            'crodlintech@gmail.com',
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
            'crodlintech@gmail.com',
            [email],
            fail_silently=False,
            html_message=html_message,
        )

        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
class UserView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    
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
        
        # Handle name update
        if "name" in data:
            user.name = data["name"]
            updated_fields.append("name")
        
        # Handle profile image upload
        if "profile_image" in request.FILES:
            try:
                uploaded_file = request.FILES["profile_image"]
                
                # Validate the image
                validate_profile_image(uploaded_file)
                
                # Delete old image if exists
                if user.profile_image:
                    delete_s3_file(user.profile_image)
                
                # Generate unique filename
                file_extension = uploaded_file.name.split('.')[-1].lower()
                random_string = get_random_string(length=16)
                file_path = f"profiles/{user.id}/{random_string}.{file_extension}"
                
                # Upload to S3
                saved_path = default_storage.save(file_path, uploaded_file)
                
                # Get public URL
                file_url = default_storage.url(saved_path)
                
                # Update user profile
                user.profile_image = file_url
                updated_fields.append("profile_image")
                
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response(
                    {"error": f"Failed to upload image: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Handle profile image removal (empty string means remove)
        elif "profile_image" in data and data["profile_image"] == "":
            if user.profile_image:
                delete_s3_file(user.profile_image)
                user.profile_image = None
                updated_fields.append("profile_image")
        
        # Save user if any fields were updated
        if updated_fields:
            user.save()
            
            # Send email notification for name change
            if "name" in updated_fields:
                html_message = render_to_string('email/name_reset_sucessful.html', {'name': user.name})
                send_mail(
                    'Name Reset Successful',
                    'Your name has been reset successfully.',
                    'crodlintech@gmail.com',
                    [user.email],
                    fail_silently=False,
                    html_message=html_message,
                )
            
            # Return updated user data
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No valid fields to update"}, status=status.HTTP_400_BAD_REQUEST)

        
    @csrf_exempt
    def delete(self, request):
        from django.db import transaction as db_transaction
        from ..models import AccountDeletionFeedback
        from ..utils import anonymize_user_account, send_deletion_confirmation_email
        
        user = authenticate_request(request, need_user=True)
        
        # Use atomic transaction to ensure data consistency
        try:
            with db_transaction.atomic():
                # Check if user is already deleted
                if user.is_deleted:
                    return Response(
                        {"error": "Account has already been deleted"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Extract feedback data from request body
                feedback_reason = request.data.get('reason', 'not_specified')
                feedback_comments = request.data.get('comments', '')
                
                # Validate reason if provided
                valid_reasons = [choice[0] for choice in AccountDeletionFeedback.REASON_CHOICES]
                if feedback_reason not in valid_reasons and feedback_reason != 'not_specified':
                    return Response(
                        {"error": f"Invalid reason. Must be one of: {', '.join(valid_reasons)}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate comments length
                if feedback_comments and len(feedback_comments) > 500:
                    return Response(
                        {"error": "Comments must not exceed 500 characters"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Store user info before anonymization for email and feedback
                user_email = user.email
                user_name = user.name
                user_id = user.id
                
                # Create AccountDeletionFeedback record before anonymization
                AccountDeletionFeedback.objects.create(
                    user_id=user_id,
                    user_email=user_email,
                    user_name=user_name,
                    reason=feedback_reason,
                    comments=feedback_comments if feedback_comments else None
                )
                
                # Anonymize user account (preserves order history)
                anonymize_user_account(user)
                
                # Send confirmation email
                send_deletion_confirmation_email(user_email, user_name)
                
                # Create audit log entry
                ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=None,  # User is anonymized, so no reference
                    action="account_deleted",
                    ip_address=ip
                )
                
                return Response({
                    "message": "Your account has been deleted successfully"
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Account deletion failed for user {user.id}: {str(e)}")
            
            return Response(
                {"error": "Failed to delete account. Please try again later."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ----------------- Referred Users List -----------------
class ReferredUsersView(APIView):
    """
    GET endpoint to retrieve list of users referred by the current user
    """
    @csrf_exempt
    def get(self, request):
        user = authenticate_request(request, need_user=True)
        
        # Get all users referred by the current user
        referred_users = User.objects.filter(referred_by=user).order_by('-date_joined')
        
        # Serialize the data
        serializer = ReferredUserSerializer(referred_users, many=True)
        
        return Response({
            'referrals': serializer.data
        }, status=status.HTTP_200_OK)


# ----------------- Referral Transaction History -----------------
class ReferralTransactionsView(APIView):
    """
    GET endpoint to retrieve referral transaction history for the current user.
    Derives transactions from:
    - Earned: Rewards from successful referrals (₹20 per completed referral)
    - Earned: Bonus from being referred (₹5 on first order completion)
    - Redeemed: Balance used on orders
    """
    @csrf_exempt
    def get(self, request):
        user = authenticate_request(request, need_user=True)
        
        transactions = []
        
        # Import OrderNo model
        from inventory.models import OrderNo
        
        # 1. Get earned transactions from successful referrals (₹20 each)
        successful_referrals = User.objects.filter(
            referred_by=user,
            has_completed_first_order=True
        ).order_by('-date_joined')
        
        for referred_user in successful_referrals:
            # Find the first completed order for this referred user
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
        
        # 2. Get earned transaction from being referred (₹5 bonus)
        if user.referred_by and user.has_completed_first_order:
            # Find user's first completed order
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
        
        # 3. Get redeemed transactions from orders
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
        
        # Sort all transactions by date (most recent first)
        
        
        # Sort all transactions by date (most recent first)
        transactions.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response({
            'transactions': transactions
        }, status=status.HTTP_200_OK)


# ----------------- Redeem Referral Balance -----------------
class RedeemReferralBalanceView(APIView):
    """
    POST endpoint to redeem referral balance on an order.
    Deducts the specified amount from user's referred_balance and
    adds it to the order's redeemed_referral_bonus field.
    """
    @csrf_exempt
    def post(self, request):
        from django.db import transaction as db_transaction
        from decimal import Decimal
        from inventory.models import OrderNo
        
        # Authenticate user (let AuthenticationFailed propagate to DRF)
        user = authenticate_request(request, need_user=True)
        
        # Get request data
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')
        
        # Validate inputs
        if not order_id:
            return Response(
                {"error": "order_id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not amount:
            return Response(
                {"error": "amount is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response(
                    {"error": "Amount must be greater than 0"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid amount format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use atomic transaction to ensure data consistency
        try:
            with db_transaction.atomic():
                # Lock user row for update
                user_locked = User.objects.select_for_update().get(id=user.id)
                
                # Get the order
                try:
                    order = OrderNo.objects.select_for_update().get(
                        id=order_id,
                        user=user_locked
                    )
                except OrderNo.DoesNotExist:
                    return Response(
                        {"error": "Order not found or does not belong to you"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Check if user has sufficient balance (use referred_balance as per EC2 backend)
                current_balance = Decimal(user_locked.referred_balance or '0')
                if current_balance < amount:
                    return Response(
                        {"error": f"Insufficient balance. Available: ₹{current_balance}"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Check if order already has redeemed bonus
                if order.redeemed_referral_bonus and order.redeemed_referral_bonus > 0:
                    return Response(
                        {"error": "Referral bonus already redeemed for this order"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Deduct from user's balance
                user_locked.referred_balance = current_balance - amount
                user_locked.save()
                
                # Add to order's redeemed bonus
                order.redeemed_referral_bonus = amount
                order.save()
                
                # Audit log
                ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=user_locked, 
                    action=f"referral_redeem_{amount}", 
                    ip_address=ip
                )
                
                return Response({
                    "message": "Referral balance redeemed successfully",
                    "redeemed_amount": float(amount),
                    "new_balance": float(user_locked.referred_balance),
                    "order_id": order.id,
                    "order_number": order.order_number
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response(
                {"error": f"Failed to redeem balance: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
