from rest_framework import viewsets
from .models import Category, Product, Status, OrderNo, Order
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    StatusSerializer,
    OrderNoSerializer,
    OrderSerializer,
)
from utils import validate_images
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.crypto import get_random_string
from authentication.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import jwt
import datetime
from django.utils import timezone
import os
from dotenv import load_dotenv
from user.models import AddressModel
from utils.usercheck import authenticate_request
from django.core.files.storage import default_storage
from django.conf import settings
from decimal import Decimal
from django.db import transaction as db_transaction
import random

load_dotenv()

def generate_order_number():
    """
    Generate unique order number in format: SCR-XXXXXXXX
    Total 12 characters: SCR- (4 chars) + 8 random digits
    """
    while True:
        # Generate 8 random digits
        random_digits = ''.join([str(random.randint(0, 9)) for _ in range(8)])
        order_number = f"SCR-{random_digits}"
        
        # Check if this order number already exists
        if not OrderNo.objects.filter(order_number=order_number).exists():
            return order_number
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer


class OrderNoViewSet(viewsets.ModelViewSet):
    serializer_class = OrderNoSerializer
    
    def get_queryset(self):
        """
        Filter orders to show only the authenticated user's orders
        """
        try:
            user = authenticate_request(self.request, need_user=True)
            return (OrderNo.objects
                    .filter(user=user)
                    .select_related("user", "status")
                    .prefetch_related("orders")
                    .order_by('-created_at'))
        except Exception as e:
            print(f"Error in get_queryset: {str(e)}")
            return OrderNo.objects.none()
    
    def perform_create(self, serializer):
        """
        Automatically set user from request when creating order
        """
        try:
            user = authenticate_request(self.request, need_user=True)
            serializer.save(user=user)
        except Exception as e:
            print(f"Error in perform_create: {str(e)}")
            raise


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related("order_no", "product")
    serializer_class = OrderSerializer


class CreateOrderAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        # Initialize variables at the start to avoid UnboundLocalError
        redeemed_amount = Decimal('0.00')
        
        try:
            data = request.data
            #Check - 1
            items = data.get("items", [])
            if isinstance(items, str):
                import json
                items = json.loads(items)
            
            #Check - 2 
            address_id = data.get("address_id")
            if address_id and isinstance(address_id, str):
                address_id = int(address_id) if address_id.isdigit() else None
            
            # Check - 3: Referral balance redemption
            redeem_referral_balance = data.get("redeem_referral_balance", False)
            if isinstance(redeem_referral_balance, str):
                redeem_referral_balance = redeem_referral_balance.lower() in ['true', '1', 'yes']
            
            # Check - 4: Parse estimated_order_value from request data
            estimated_order_value = Decimal('0.00')
            estimated_value_raw = data.get("estimated_order_value")
            if estimated_value_raw is not None:
                try:
                    estimated_order_value = Decimal(str(estimated_value_raw))
                except (ValueError, TypeError):
                    estimated_order_value = Decimal('0.00')

            token = request.headers.get('Authorization')
            secret_key = request.headers.get('x-auth-app')

            if not secret_key or secret_key != 'Scrapiz#0nn$(tab!z':
                return Response({"error": "Invalid secret key"}, status=status.HTTP_401_UNAUTHORIZED)

            if not token:
                raise AuthenticationFailed('Unauthenticated!')

            try:
                payload = jwt.decode(token, 'secret', algorithms="HS256")
            except jwt.ExpiredSignatureError:
                raise AuthenticationFailed('Token expired!')
            except jwt.InvalidTokenError:
                raise AuthenticationFailed('Invalid token!')

            user = User.objects.filter(id=payload['id']).first()
            
            # Handle referral balance redemption
            if redeem_referral_balance:
                if user.referral_balance >= Decimal('120.00'):
                    redeemed_amount = user.referral_balance
                else:
                    return Response({
                        "error": f"Insufficient referral balance. You have ₹{user.referral_balance}. Minimum ₹120 required to redeem."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Fetch AddressModel
            address = None
            if address_id:
                try:
                    address = AddressModel.objects.get(id=address_id, user=user)
                except AddressModel.DoesNotExist:
                    return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

            # Check - 3 
            image_urls = []
            uploaded_files = request.FILES.getlist('images')
            
            print(f"📸 Received {len(uploaded_files)} image files for upload")
            
            for idx, uploaded_file in enumerate(uploaded_files, 1):
                try:
                    validate_images(uploaded_file)
                    file_extension = uploaded_file.name.split('.')[-1]
                    unique_filename = f"orders/{user.id}/{get_random_string(16)}.{file_extension}"
                    
                    print(f"  Uploading image {idx}: {uploaded_file.name} -> {unique_filename}")
                    file_path = default_storage.save(unique_filename, uploaded_file)
                    
                    # Use default_storage.url() which handles the correct S3 URL generation
                    file_url = default_storage.url(file_path)
                    
                    image_urls.append(file_url)
                    print(f"✅ Image {idx} uploaded successfully: {file_url}")
                except Exception as img_error:
                    print(f"   Error uploading image {idx}: {str(img_error)}")

            print(f"📦 Total images uploaded: {len(image_urls)}")
            print(f"🔗 Image URLs: {image_urls}")

            # Create OrderNo with images and redeemed referral bonus
            with db_transaction.atomic():
                # Deduct referral balance if redeeming
                if redeemed_amount > Decimal('0.00'):
                    user.referral_balance = Decimal('0.00')
                    user.save(update_fields=['referral_balance'])
                    print(f"💰 Redeemed ₹{redeemed_amount} from referral balance")
                
                order_no = OrderNo.objects.create(
                    user=user,
                    order_number=generate_order_number(),
                    address=address,
                    images=image_urls if image_urls else [],
                    redeemed_referral_bonus=redeemed_amount,
                    estimated_order_value=estimated_order_value
                )
            
            print(f"✅ Order created: {order_no.order_number}")
            print(f"📸 Images saved to database: {order_no.images}")
            
            # Trigger async notification task
            try:
                from notifications.tasks import send_order_notifications_task
                send_order_notifications_task.delay(order_no.id)
                print(f"📧 Notification task triggered for order {order_no.order_number}")
            except Exception as notif_error:
                # Don't fail order creation if notification fails
                print(f"⚠️ Failed to trigger notification: {str(notif_error)}")

            created_orders = []
            
            # Debug logging
            print(f"Processing items: {items}")
            print(f"Items type: {type(items)}")
            
            for item in items:
                print(f"Processing item: {item}, type: {type(item)}")
                
                # Handle if item is a string (shouldn't happen but just in case)
                if isinstance(item, str):
                    import json
                    item = json.loads(item)
                
                product_id = item.get("product_id")
                quantity = item.get("quantity")

                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    return Response({"error": f"Product {product_id} not found"}, status=status.HTTP_404_NOT_FOUND)

                order = Order.objects.create(
                    order_no=order_no,
                    product=product,
                    quantity=quantity
                )
                created_orders.append({
                    "id": order.id,
                    "product": product.name,
                    "quantity": quantity,
                    "unit": product.unit
                })

            response_data = {
                "message": "Order created successfully",
                "order_id": order_no.id,  # Add order ID for frontend redirect
                "order_no": order_no.order_number,
                "email": user.email,
                "address": f"{address.name}, {address.street}, {address.area}, {address.city}" if address else None,
                "orders": created_orders,
                "images": image_urls,
                "estimated_order_value": str(estimated_order_value)
            }
            
            # Add redeemed amount to response if applicable
            if redeemed_amount > Decimal('0.00'):
                response_data["redeemed_amount"] = str(redeemed_amount)
            
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(f"Error creating order: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateOrderStatusAPIView(APIView):
    """
    Update the status of an order
    POST /api/inventory/update-order-status/
    Body: {
        "order_number": "ABC123" OR "order_id": 1,
        "status_id": 2
    }
    """
    def post(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error

        order_number = request.data.get("order_number")
        order_id = request.data.get("order_id")
        status_id = request.data.get("status_id")

        if not order_number and not order_id:
            return Response(
                {"error": "order_number or order_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not status_id:
            return Response(
                {"error": "status_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the order
        order_queryset = OrderNo.objects.filter(user=user)
        order = None

        if order_number:
            order = order_queryset.filter(order_number=order_number).first()
        elif order_id:
            order = order_queryset.filter(id=order_id).first()

        if not order:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        # Validate status exists
        try:
            new_status = Status.objects.get(id=status_id)
        except Status.DoesNotExist:
            return Response({"error": "Status not found"}, status=status.HTTP_404_NOT_FOUND)

        # Update status
        order.status = new_status
        order.save(update_fields=["status"])

        serialized_order = OrderNoSerializer(order)
        return Response(
            {"message": "Order status updated successfully", "order": serialized_order.data},
            status=status.HTTP_200_OK,
        )


class CancelOrderAPIView(APIView):
    def post(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error

        order_number = request.data.get("order_number")
        order_id = request.data.get("order_id")
        #Verify the user owns the order
        if not order_number and not order_id:
            return Response(
                {"error": "order_number or order_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order_queryset = OrderNo.objects.filter(user=user)
        order = None

        if order_number:
            order = order_queryset.filter(order_number=order_number).first()
        elif order_id:
            order = order_queryset.filter(id=order_id).first()

        if not order:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.status and order.status.name.lower() == "cancelled":
            serialized = OrderNoSerializer(order)
            return Response(
                {"message": "Order already cancelled", "order": serialized.data},
                status=status.HTTP_200_OK,
            )

        cancelled_status = Status.objects.filter(name__iexact="cancelled").first()
        if not cancelled_status:
            cancelled_status = Status.objects.create(name="Cancelled")

        order.status = cancelled_status
        order.save(update_fields=["status"])

        serialized_order = OrderNoSerializer(order)
        return Response(
            {"message": "Order cancelled successfully", "order": serialized_order.data},
            status=status.HTTP_200_OK,
        )
