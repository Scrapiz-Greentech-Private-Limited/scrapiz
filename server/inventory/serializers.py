from rest_framework import serializers
from .models import Category, Product, Status, OrderNo, Order
from user.models import AddressModel


class ProductSerializer(serializers.ModelSerializer):

    image = serializers.ImageField(write_only=True, required=False)
    class Meta:
        model = Product
        fields = ['id', 'name', 'max_rate', 'min_rate', 'unit', 'description', 'category', 'image_url', 'image', 'trees_saved_per_unit', 'co2_reduced_per_unit']
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


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for address details in order responses"""
    class Meta:
        model = AddressModel
        fields = [
            "id", "name", "phone_number", "room_number", "street", 
            "area", "city", "state", "country", "pincode", "delivery_suggestion"
        ]


class AssignedAgentSerializer(serializers.Serializer):
    """Serializer for assigned agent info in order responses"""
    id = serializers.IntegerField()
    agent_code = serializers.CharField()
    name = serializers.CharField()
    phone = serializers.CharField()
    availability = serializers.CharField()


class OrderNoSerializer(serializers.ModelSerializer):
    orders = OrderSerializer(many=True, read_only=True)  # nested orders
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    status = StatusSerializer(read_only=True)
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=Status.objects.all(), source="status", write_only=True, allow_null=True, required=False
    )
    address_details = AddressSerializer(source='address', read_only=True)
    assigned_agent_details = serializers.SerializerMethodField()
    has_push_token = serializers.SerializerMethodField()

    class Meta:
        model = OrderNo
        fields = [
            "id", "order_number", "user", "user_id", "user_email", "user_phone",
            "created_at", "status", "address", "address_details", "status_id", "address_id",
            "orders", "images", "redeemed_referral_bonus", "estimated_order_value",
            "assigned_agent", "assigned_agent_details", "assigned_at", "has_push_token"
        ]

    def get_assigned_agent_details(self, obj):
        """Get assigned agent details if available"""
        if obj.assigned_agent:
            return {
                'id': obj.assigned_agent.id,
                'agent_code': obj.assigned_agent.agent_code,
                'name': obj.assigned_agent.name,
                'phone': obj.assigned_agent.phone,
                'availability': obj.assigned_agent.availability,
            }
        return None

    def get_has_push_token(self, obj):
        """Check if the order's user has an active push token and notifications enabled"""
        from user.models import PushToken
        # Check if user has active push tokens
        has_token = PushToken.objects.filter(user=obj.user, is_active=True).exists()
        if not has_token:
            return False
        # Also check if user has push notifications enabled for order updates
        return obj.user.push_notification_enabled and obj.user.notify_order_updates
