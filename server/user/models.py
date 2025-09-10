from django.db import models
from authentication.models import User
# Create your models here.
class AddressModel(models.Model):
    name = models.CharField( max_length=50, null=True, blank=True) #ye delivery location ka naam hai
    user = models.ForeignKey(User, related_name="addresses", on_delete=models.CASCADE)
    phone_number = models.CharField( max_length=13, null=True, blank=True)
    room_number = models.CharField(max_length=50, null=True, blank=True)
    street =  models.CharField(max_length=50, null=True, blank=True)
    area =  models.CharField(max_length=50, null=True, blank=True)
    city =  models.CharField(max_length=50, null=True, blank=True)
    state =  models.CharField(max_length=50, null=True, blank=True)
    country =  models.CharField(max_length=50, null=True, blank=True)
    pincode = models.IntegerField(null= True, blank=True)
    delivery_suggestion = models.CharField(max_length=500, null=True, blank=True)


    def __str__(self):
        return f"{self.name} of user {self.user.email}"