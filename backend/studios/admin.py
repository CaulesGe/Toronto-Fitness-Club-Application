from django.contrib import admin
from studios.models import studio, amenity, images

# Register your models here.
#admin.site.register(studio, studioAdmin)
admin.site.register(amenity)
admin.site.register(images)