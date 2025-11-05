from rest_framework import serializers
from .models import Category, Product, Status, OrderNo, Order
from user.models import AddressModel



class ProductSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = '__all__'
class CategorySerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)  # ✅ nested products

    class Meta:
        model = Category
        fields = ["id", "name", "products"]


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = "__all__"


class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = Order
        fields = ["id", "order_no", "product", "product_id", "quantity"]


class OrderNoSerializer(serializers.ModelSerializer):
    orders = OrderSerializer(many=True, read_only=True)  # nested orders
    user = serializers.StringRelatedField(read_only=True)
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(), source="status", write_only=True, allow_null=True, required=False
    )
    address_id = serializers.PrimaryKeyRelatedField(
        queryset=AddressModel.objects.all(), source="address", write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = OrderNo
        fields = [
            "id", 
            "order_number", 
            "user", 
            "created_at", 
            "status", 
            "address", 
            "status_id", 
            "address_id", 
            "orders", 
            "images",
            "redeemed_referral_bonus",
            "estimated_order_value"
        ]
