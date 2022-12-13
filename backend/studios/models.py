from django.db import models
from django.contrib import admin
from django.core.exceptions import ValidationError

# Create your models here.
class studio(models.Model):
    name = models.CharField(max_length=200)
    address = models.CharField(max_length=200)
    longitude = models.FloatField(max_length=200)
    latitude = models.FloatField(max_length=200)
    postal_code = models.CharField(max_length=6)
    phone_number = models.CharField(max_length=20, unique=True)
    distance = models.FloatField(max_length=200, null=True, blank=True)
    
    
    def clean(self):

        if self.longitude and (self.longitude < -90 or self.longitude > 90):
            raise ValidationError({"longitude": "Longitude should between -90 and 90"})
        if self.latitude and (self.latitude < -90 or self.latitude > 90):
            raise ValidationError({"latitude": "Latitude should between -90 and 90"})
        if len(self.phone_number) != 10 or not self.phone_number.isnumeric():
            raise ValidationError(
                {"phone_number": "Phone number should be 10 integers"}
            )
        if len(self.postal_code) != 6:
            raise ValidationError({"postal_code": "Postal code's length should be 6"})

    def __str__(self):
        return self.name


class images(models.Model):
    studio = models.ForeignKey(to=studio, on_delete=models.CASCADE)
    image = models.ImageField(null=True, blank=True, upload_to="images/")


class amenity(models.Model):
    studio = models.ForeignKey(
        to=studio, related_name="amenities", on_delete=models.CASCADE, null=True
    )
    type = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return self.type


class amenitiesAdmin(admin.StackedInline):
    model = amenity


class imagesAdmin(admin.StackedInline):
    model = images


class studioAdmin(admin.ModelAdmin):
    inlines = [amenitiesAdmin, imagesAdmin]
    exclude = ('distance',)


admin.site.register(studio, studioAdmin)
