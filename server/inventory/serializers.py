from rest_framework import serializers
from .models import Category, Product, Status, OrderNo, Order
from user.models import AddressModel


class ProductSerializer(serializers.ModelSerializer):

    image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = Product
        fields = ['id', 'name', 'max_rate', 'min_rate', 'unit','description', 'category', 'image_url', 'image']
        read_only_fields = ['image_url']



class CategorySerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)  # ✅ nested products
    image = serializers.ImageField(write_only=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "products", "image_url", "image"]
        read_only_fields = ['image_url']


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

    class Meta:
        model = OrderNo
        fields = ["id", "order_number", "user", "created_at", "status", "address", "status_id", "address_id",  "orders", "images", "redeemed_referral_bonus" , "estimated_order_value"]
