from rest_framework import viewsets
from .models import Category, Product, Status, OrderNo, Order
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
from dotenv import load_dotenv
from user.models import AddressModel
from authentication.utils import delete_s3_file
from utils.usercheck import authenticate_request
from django.core.files.storage import default_storage
from django.conf import settings
from rest_framework.exceptions import ValidationError as DRFValidationError
from utils.validation_check import validate_images
load_dotenv()

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
    def perform_create(self, serializer):
      image_file = self.request.FILES.get('image')
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
        except Exception as e:
          if 'category' in locals():
            category.delete()
          if isinstance(e, ValidationError):
            raise DRFValidationError({"error": str(e)})
          raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
      else:
        serializer.save()
    def perform_update(self, serializer):
       image_file = self.request.FILES.get('image')
       category = self.get_object()
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
         except Exception as e:
           if isinstance(e, ValidationError):
             raise DRFValidationError({"error": str(e)})
           raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
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
        except Exception as e:
          if 'product' in locals():
            product.delete()
          if isinstance(e, ValidationError):
            raise DRFValidationError({"error": str(e)})
          raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
      else:
        serializer.save()
    def perform_update(self, serializer):
      image_file = self.request.FILES.get('image')
      product = self.get_object()
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
          except Exception as e:
            if isinstance(e, ValidationError):
              raise DRFValidationError({"error": str(e)})
            raise DRFValidationError({"error": f"Failed to upload image: {str(e)}"})
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
              estimated_order_value=estimated_order_value
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
