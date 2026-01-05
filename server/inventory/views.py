from rest_framework import viewsets
from .models import Category, Product, Status, OrderNo, Order
from .utils import get_status_by_name
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    StatusSerializer,
    OrderNoSerializer,
    OrderSerializer,
)
#from utils.validation_check import validate_images
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
from django.core.exceptions import ValidationError
from decimal import Decimal
from django.db import transaction as db_transaction
from django.utils import timezone
import os
import random
import sys
import logging
from dotenv import load_dotenv
from user.models import AddressModel
from authentication.utils import delete_s3_file
from utils.usercheck import authenticate_request
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.exceptions import ValidationError as DRFValidationError
from utils.validation_check import validate_images
load_dotenv()

logger = logging.getLogger(__name__)

def generate_order_number():
  """
  Generate unique order numbers in SCR-XXXXXX format
  """
  while True:
    random_digits = ''.join([str(random.randint(0, 9)) for _ in range(8)])
    order_number = f"SCR-{random_digits}"
    if not OrderNo.objects.filter(order_number=order_number).exists():
      return order_number

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def perform_create(self, serializer):
        image_file = self.request.FILES.get('image')
        image_url = self.request.data.get('image_url')
        
        # DEBUG: Log what we're receiving
        logger.warning("=" * 60)
        logger.warning("[CategoryViewSet.perform_create] DEBUG:")
        logger.warning(f"  request.data = {dict(self.request.data)}")
        logger.warning(f"  image_file = {image_file}")
        logger.warning(f"  image_url = {repr(image_url)} (type: {type(image_url).__name__})")
        logger.warning(f"  content_type = {self.request.content_type}")
        logger.warning("=" * 60)
        sys.stdout.flush()
        
        if image_file:
            try:
                validate_images(image_file)
                category = serializer.save()
                file_extension = image_file.name.split('.')[-1].lower()
                random_string = get_random_string(length=16)
                file_path = f"images/categories/{category.id}/{random_string}.{file_extension}"
                saved_path = default_storage.save(file_path, image_file)
                file_url = default_storage.url(saved_path)
                category.image_url = file_url
                category.save(update_fields=['image_url'])
                logger.warning(f"[CategoryViewSet] SUCCESS: Saved with file, image_url={category.image_url}")
            except Exception as e:
                if 'category' in locals():
                    category.delete()
                if isinstance(e, ValidationError):
                    raise DRFValidationError({"error": str(e)})
                raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
        elif image_url and str(image_url).strip() and image_url != 'null':
            category = serializer.save()
            category.image_url = str(image_url).strip()
            category.save(update_fields=['image_url'])
            logger.warning(f"[CategoryViewSet] SUCCESS: Saved with URL, image_url={category.image_url}")
        else:
            serializer.save()
            logger.warning(f"[CategoryViewSet] INFO: Saved without image")
            
    def perform_update(self, serializer):
        image_file = self.request.FILES.get('image')
        image_url = self.request.data.get('image_url')
        category = self.get_object()
        
        # DEBUG
        logger.warning("=" * 60)
        logger.warning("[CategoryViewSet.perform_update] DEBUG:")
        logger.warning(f"  request.data = {dict(self.request.data)}")
        logger.warning(f"  image_file = {image_file}")
        logger.warning(f"  image_url = {repr(image_url)} (type: {type(image_url).__name__})")
        logger.warning("=" * 60)
        sys.stdout.flush()
        
        if 'image' in self.request.data and not image_file:
            if category.image_url:
                delete_s3_file(category.image_url)
                category.image_url = None
                category.save(update_fields=['image_url'])
        elif image_file:
            try:
                validate_images(image_file)
                if category.image_url:
                    delete_s3_file(category.image_url)
                file_extension = image_file.name.split('.')[-1].lower()
                random_string = get_random_string(length=16)
                file_path = f"images/categories/{category.id}/{random_string}.{file_extension}"
                saved_path = default_storage.save(file_path, image_file)
                file_url = default_storage.url(saved_path)
                category.image_url = file_url
                category.save(update_fields=['image_url'])
                logger.warning(f"[CategoryViewSet] SUCCESS: Updated with file")
            except Exception as e:
                if isinstance(e, ValidationError):
                    raise DRFValidationError({"error": str(e)})
                raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
        elif image_url and str(image_url).strip() and image_url != 'null':
            if category.image_url and category.image_url != str(image_url).strip():
                delete_s3_file(category.image_url)
            category.image_url = str(image_url).strip()
            category.save(update_fields=['image_url'])
            logger.warning(f"[CategoryViewSet] SUCCESS: Updated with URL, image_url={category.image_url}")
        else:
            logger.warning(f"[CategoryViewSet] INFO: No image update")
        serializer.save()
        
    def perform_destroy(self, instance):
        if instance.image_url:
            delete_s3_file(instance.image_url)
        instance.delete()


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def perform_create(self, serializer):
        image_file = self.request.FILES.get('image')
        image_url = self.request.data.get('image_url')
        
        # DEBUG
        logger.warning("=" * 60)
        logger.warning("[ProductViewSet.perform_create] DEBUG:")
        logger.warning(f"  request.data = {dict(self.request.data)}")
        logger.warning(f"  image_file = {image_file}")
        logger.warning(f"  image_url = {repr(image_url)} (type: {type(image_url).__name__})")
        logger.warning(f"  content_type = {self.request.content_type}")
        logger.warning("=" * 60)
        sys.stdout.flush()
        
        if image_file:
            try:
                validate_images(image_file)
                product = serializer.save()
                file_extension = image_file.name.split('.')[-1].lower()
                random_string = get_random_string(length=16)
                file_path = f"images/products/{product.id}/{random_string}.{file_extension}"
                saved_path = default_storage.save(file_path, image_file)
                file_url = default_storage.url(saved_path)
                product.image_url = file_url
                product.save(update_fields=['image_url'])
                logger.warning(f"[ProductViewSet] SUCCESS: Saved with file, image_url={product.image_url}")
            except Exception as e:
                if 'product' in locals():
                    product.delete()
                if isinstance(e, ValidationError):
                    raise DRFValidationError({"error": str(e)})
                raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
        elif image_url and str(image_url).strip() and image_url != 'null':
            product = serializer.save()
            product.image_url = str(image_url).strip()
            product.save(update_fields=['image_url'])
            logger.warning(f"[ProductViewSet] SUCCESS: Saved with URL, image_url={product.image_url}")
        else:
            serializer.save()
            logger.warning(f"[ProductViewSet] INFO: Saved without image")
            
    def perform_update(self, serializer):
        image_file = self.request.FILES.get('image')
        image_url = self.request.data.get('image_url')
        product = self.get_object()
        
        # DEBUG
        logger.warning("=" * 60)
        logger.warning("[ProductViewSet.perform_update] DEBUG:")
        logger.warning(f"  request.data = {dict(self.request.data)}")
        logger.warning(f"  image_file = {image_file}")
        logger.warning(f"  image_url = {repr(image_url)} (type: {type(image_url).__name__})")
        logger.warning("=" * 60)
        sys.stdout.flush()
        
        if 'image' in self.request.data and not image_file:
            if product.image_url:
                delete_s3_file(product.image_url)
                product.image_url = None
                product.save(update_fields=['image_url'])
        elif image_file:
            try:
                validate_images(image_file)
                if product.image_url:
                    delete_s3_file(product.image_url)
                file_extension = image_file.name.split('.')[-1].lower()
                random_string = get_random_string(length=16)
                file_path = f"images/products/{product.id}/{random_string}.{file_extension}"
                saved_path = default_storage.save(file_path, image_file)
                file_url = default_storage.url(saved_path)
                product.image_url = file_url
                product.save(update_fields=['image_url'])
                logger.warning(f"[ProductViewSet] SUCCESS: Updated with file")
            except Exception as e:
                if isinstance(e, ValidationError):
                    raise DRFValidationError({"error": str(e)})
                raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
        elif image_url and str(image_url).strip() and image_url != 'null':
            if product.image_url and product.image_url != str(image_url).strip():
                delete_s3_file(product.image_url)
            product.image_url = str(image_url).strip()
            product.save(update_fields=['image_url'])
            logger.warning(f"[ProductViewSet] SUCCESS: Updated with URL, image_url={product.image_url}")
        else:
            logger.warning(f"[ProductViewSet] INFO: No image update")
        serializer.save()
        
    def perform_destroy(self, instance):
        if instance.image_url:
            delete_s3_file(instance.image_url)
        instance.delete()


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
        return OrderNo.objects.filter(user=user).select_related("user", "status").prefetch_related("orders").order_by('-created_at')
      except Exception as e:
        print(f"Error in get_queryset: {str(e)}")
        return OrderNo.objects.none()

    def perform_create(self, serializer):
        # Automatically set user from request
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

            if not secret_key or secret_key != os.getenv('MY_FRONTEND_SECRET'):
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
            redeemed_amount = Decimal(0.0)
            if redeem_referral_balance:
              if user.referred_balance >= Decimal('120.00'):
                redeemed_amount = user.referred_balance
              else:
                return Response({
                "error": f"Insufficient referral balance. You have ?{user.referred_balance}. Minimum ?120 required to redeem."
                
                },status=status.HTTP_400_BAD_REQUEST)

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
            
            print(f"?? Received {len(uploaded_files)} image files for upload")
            
            for idx, uploaded_file in enumerate(uploaded_files, 1):
                try:
                    #validate_images(uploaded_file)
                    file_extension = uploaded_file.name.split('.')[-1]
                    unique_filename = f"orders/{user.id}/{get_random_string(16)}.{file_extension}"
                    
                    print(f"  Uploading image {idx}: {uploaded_file.name} -> {unique_filename}")
                    file_path = default_storage.save(unique_filename, uploaded_file)
                    
                    file_url = default_storage.url(file_path)
                    
                    
                    image_urls.append(file_url)
                    print(f" Image {idx} uploaded successfully: {file_url}")
                except Exception as img_error:
                    print(f"   Error uploading image {idx}: {str(img_error)}")

            print(f"?? Total images uploaded: {len(image_urls)}")
            print(f"?? Image URLs: {image_urls}")

            # Create OrderNo with images
            with db_transaction.atomic():
              if redeemed_amount > Decimal('0.0'):
                user.referred_balance = Decimal('0.00')
                user.save(update_fields=['referred_balance'])
                print(f"Redeemed ?{redeemed_amount} from referral balance")
                
              order_no = OrderNo.objects.create(
              user=user,
              order_number=generate_order_number(),
              address=address,
              images=image_urls if image_urls else [],
              redeemed_referral_bonus= redeemed_amount,
              estimated_order_value=estimated_order_value,
              status=get_status_by_name("pending")
              )
            
            print(f"? Order created: {order_no.order_number}")
            print(f"?? Images saved to database: {order_no.images}")
            #Trigger notifications
            try:
              from notifications.tasks import send_order_notifications_task
              send_order_notifications_task.delay(order_no.id)
              print("Nottification triggered bhaugele for order {order_no.order_number}")
            except Exception as e:
              print("Failed to trigger notifications:{str(notif_error)}")

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
                "order_id": order_no.id,  
                "order_no": order_no.order_number,
                "email": user.email,
                "address": f"{address.name}, {address.street}, {address.area}, {address.city}" if address else None,
                "orders": created_orders,
                "images": image_urls,
                "estimated_order_value": str(estimated_order_value)
            }
            if redeemed_amount > Decimal('0.00'):
              response_data["redeemed_amount"] = str(redeemed_amount)
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(f"Error creating order: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


# ============================================================================
# ADMIN DASHBOARD API VIEWS
# ============================================================================

class AdminOrderListAPIView(APIView):
    """
    Admin endpoint to get all orders with full details.
    Requires admin/staff privileges.
    """
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all orders with related data
        orders = OrderNo.objects.all().select_related(
            "user", "status", "address"
        ).prefetch_related("orders__product").order_by('-created_at')
        
        serializer = OrderNoSerializer(orders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminOrderDetailAPIView(APIView):
    """
    Admin endpoint to get a single order with full details.
    Requires admin/staff privileges.
    """
    def get(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.select_related(
                "user", "status", "address"
            ).prefetch_related("orders__product").get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = OrderNoSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminUpdateOrderStatusAPIView(APIView):
    """
    Admin endpoint to update order status.
    Requires admin/staff privileges.
    """
    def patch(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        status_id = request.data.get("status_id")
        status_name = request.data.get("status")
        
        if status_id:
            try:
                new_status = Status.objects.get(id=status_id)
            except Status.DoesNotExist:
                return Response(
                    {"error": "Status not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif status_name:
            # Find or create status by name
            new_status, _ = Status.objects.get_or_create(
                name__iexact=status_name,
                defaults={"name": status_name.capitalize()}
            )
        else:
            return Response(
                {"error": "status_id or status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save(update_fields=["status"])
        
        serializer = OrderNoSerializer(order)
        return Response({
            "message": "Order status updated successfully",
            "order": serializer.data
        }, status=status.HTTP_200_OK)


class AdminCancelOrderAPIView(APIView):
    """
    Admin endpoint to cancel any order.
    Requires admin/staff privileges.
    """
    def post(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order_number = request.data.get("order_number")
        order_id = request.data.get("order_id")
        
        if not order_number and not order_id:
            return Response(
                {"error": "order_number or order_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order = None
        if order_number:
            order = OrderNo.objects.filter(order_number=order_number).first()
        elif order_id:
            order = OrderNo.objects.filter(id=order_id).first()
        
        if not order:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if order.status and order.status.name.lower() == "cancelled":
            serializer = OrderNoSerializer(order)
            return Response({
                "message": "Order already cancelled",
                "order": serializer.data
            }, status=status.HTTP_200_OK)
        
        cancelled_status, _ = Status.objects.get_or_create(
            name__iexact="cancelled",
            defaults={"name": "Cancelled"}
        )
        
        order.status = cancelled_status
        order.save(update_fields=["status"])
        
        serializer = OrderNoSerializer(order)
        return Response({
            "message": "Order cancelled successfully",
            "order": serializer.data
        }, status=status.HTTP_200_OK)


class AdminStatusListAPIView(APIView):
    """
    Admin endpoint to get all available statuses.
    """
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        statuses = Status.objects.all()
        serializer = StatusSerializer(statuses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminAssignAgentAPIView(APIView):
    """
    Admin endpoint to assign an agent to an order.
    Requires admin/staff privileges.
    
    POST /api/inventory/admin/orders/{order_id}/assign-agent/
    Body: { "agent_id": <int> }
    """
    def post(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.select_related("assigned_agent").get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        agent_id = request.data.get("agent_id")
        if not agent_id:
            return Response(
                {"error": "agent_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Import Agent model
        from agents.models import Agent
        
        try:
            agent = Agent.objects.get(id=agent_id)
        except Agent.DoesNotExist:
            return Response(
                {"error": "Agent not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if agent is eligible (active and verified)
        if agent.status != 'active':
            return Response(
                {"error": f"Agent is not active (current status: {agent.status})"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Assign agent to order
        order.assigned_agent = agent
        order.assigned_at = timezone.now()
        
        # Update order status to scheduled if it's pending
        if order.status and order.status.name.lower() == 'pending':
            scheduled_status, _ = Status.objects.get_or_create(
                name__iexact="scheduled",
                defaults={"name": "Scheduled"}
            )
            order.status = scheduled_status
            order.save(update_fields=["assigned_agent", "assigned_at", "status"])
        else:
            order.save(update_fields=["assigned_agent", "assigned_at"])
        
        # Update agent's current day orders count
        agent.current_day_orders += 1
        agent.total_orders += 1
        agent.save(update_fields=["current_day_orders", "total_orders"])
        
        serializer = OrderNoSerializer(order)
        return Response({
            "message": f"Agent {agent.agent_code} assigned to order {order.order_number}",
            "order": serializer.data
        }, status=status.HTTP_200_OK)


class AdminUnassignAgentAPIView(APIView):
    """
    Admin endpoint to unassign an agent from an order.
    Requires admin/staff privileges.
    
    POST /api/inventory/admin/orders/{order_id}/unassign-agent/
    """
    def post(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.select_related("assigned_agent").get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not order.assigned_agent:
            return Response(
                {"error": "No agent is assigned to this order"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Decrement agent's order count
        agent = order.assigned_agent
        if agent.current_day_orders > 0:
            agent.current_day_orders -= 1
            agent.save(update_fields=["current_day_orders"])
        
        # Unassign agent
        order.assigned_agent = None
        order.assigned_at = None
        order.save(update_fields=["assigned_agent", "assigned_at"])
        
        serializer = OrderNoSerializer(order)
        return Response({
            "message": "Agent unassigned from order",
            "order": serializer.data
        }, status=status.HTTP_200_OK)


class AdminSendOrderNotificationAPIView(APIView):
    """
    Admin endpoint to send a push notification to the order's user.
    Requires admin/staff privileges.
    
    POST /api/inventory/admin/orders/{order_id}/send-notification/
    Body: { "title": "...", "message": "..." }
    """
    def post(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.select_related("user").get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        title = request.data.get("title", "").strip()
        message = request.data.get("message", "").strip()
        
        if not title or not message:
            return Response(
                {"error": "title and message are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has push tokens
        from user.models import PushToken
        push_tokens = PushToken.objects.filter(user=order.user, is_active=True)
        
        if not push_tokens.exists():
            return Response(
                {"error": "User does not have any active push tokens"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send notification using PushNotificationService directly
        try:
            from notifications.services.push import PushNotificationService
            service = PushNotificationService()
            result = service.send_push_notification(
                title=title,
                message=message,
                category='order_updates',
                deep_link_data={
                    "type": "order_update",
                    "order_id": str(order.id),
                    "order_number": order.order_number
                },
                user_ids=[order.user.id]
            )
            
            return Response({
                "message": "Notification sent successfully",
                "sent_count": result.get("sent_count", 0),
                "order_number": order.order_number
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to send notification: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminSendOrderEmailAPIView(APIView):
    """
    Admin endpoint to send an email to the order's user.
    Requires admin/staff privileges.
    
    POST /api/inventory/admin/orders/{order_id}/send-email/
    Body: { "title": "...", "subject": "...", "body": "..." }
    """
    def post(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
        except AuthenticationFailed as auth_error:
            raise auth_error
        
        # Check admin privileges
        if not user.is_staff and not user.is_superuser:
            return Response(
                {"error": "Admin privileges required"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            order = OrderNo.objects.select_related("user").get(id=order_id)
        except OrderNo.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        title = request.data.get("title", "").strip()
        subject = request.data.get("subject", "").strip()
        body = request.data.get("body", "").strip()
        
        if not subject or not body:
            return Response(
                {"error": "subject and body are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user has email
        if not order.user.email:
            return Response(
                {"error": "User does not have an email address"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send email using Django's send_mail
        try:
            from django.core.mail import send_mail
            from django.template.loader import render_to_string
            from django.conf import settings
            
            # Try to render HTML template, fallback to plain text
            try:
                html_message = render_to_string('email/admin_custom_email.html', {
                    'title': title,
                    'subject': subject,
                    'body': body,
                    'order_number': order.order_number,
                    'user_name': order.user.name or order.user.email,
                })
            except Exception:
                html_message = None
            
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[order.user.email],
                fail_silently=False,
                html_message=html_message,
            )
            
            logger.info(f"Email sent to {order.user.email} for order {order.order_number} by admin {user.email}")
            
            return Response({
                "message": "Email sent successfully",
                "recipient": order.user.email,
                "order_number": order.order_number
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Failed to send email for order {order.order_number}: {str(e)}")
            return Response(
                {"error": f"Failed to send email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
