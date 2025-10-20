from rest_framework import viewsets
from .models import Category, Product, Status, OrderNo, Order
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    StatusSerializer,
    OrderNoSerializer,
    OrderSerializer,
)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.crypto import get_random_string
from authentication.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import AuthenticationFailed
import jwt
import datetime
from django.utils import timezone
import os
from dotenv import load_dotenv
from user.models import AddressModel
from utils.usercheck import authenticate_request

load_dotenv()
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
    queryset = OrderNo.objects.all().select_related("user", "status").prefetch_related("orders")
    serializer_class = OrderNoSerializer

    def perform_create(self, serializer):
        # Automatically set user from request
        serializer.save(user=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().select_related("order_no", "product")
    serializer_class = OrderSerializer


class CreateOrderAPIView(APIView):
    def post(self, request):
        try:
            data = request.data
            items = data.get("items", []) 
            address_id = data.get("address_id")
            print(id)  # ✅ new

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

            # ✅ fetch AddressModel
            address = None
            if address_id:
                try:
                    address = AddressModel.objects.get(id=address_id, user=user)
                except AddressModel.DoesNotExist:
                    return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

            # ✅ naya OrderNo create kar
            order_no = OrderNo.objects.create(
                user=user,
                order_number=get_random_string(8),
                address=address  # ✅ set address
            )

            created_orders = []
            for item in items:
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

            return Response({
                "message": "Order created successfully",
                "order_no": order_no.order_number,
                "email": user.email,
                "address": f"{address.name}, {address.street}, {address.area}, {address.city}" if address else None,
                "orders": created_orders
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
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
