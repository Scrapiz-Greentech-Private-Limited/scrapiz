from django.db import models
from authentication.models import User
from user.models import AddressModel

class Category(models.Model):
    name = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return self.name or "Unnamed Category"


class Product(models.Model):
    name = models.CharField(max_length=50, null=True, blank=True)
    max_rate = models.IntegerField(null=True, blank=True)
    min_rate = models.IntegerField(null=True, blank=True)
    unit = models.CharField(max_length=50, null=True, blank=True)
    description = models.CharField(max_length=50, null=True, blank=True) 
    category = models.ForeignKey(Category, related_name="products", on_delete=models.CASCADE)

    def __str__(self):
        return self.name or "Unnamed Product"


class Status(models.Model):
    name = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Status: {self.name}"


class OrderNo(models.Model):
    user = models.ForeignKey(User, related_name="orders", on_delete=models.CASCADE)
    order_number = models.CharField(max_length=20, unique=True)  # Invoice/order no
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.ForeignKey(Status, related_name="order_numbers", on_delete=models.CASCADE, null=True, blank=True)
    address = models.ForeignKey(AddressModel, related_name="address", on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"OrderNo {self.order_number} by {self.user}"


class Order(models.Model):
    order_no = models.ForeignKey(OrderNo, related_name="orders", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name="orders", on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.quantity} {self.product.unit} of {self.product.name}"
