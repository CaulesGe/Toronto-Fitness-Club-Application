from rest_framework.generics import RetrieveAPIView, ListAPIView
from rest_framework.views import APIView

from studios.models import studio, amenity, images

from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.conf import settings
from classes.models import Class
from studios.serializers import StudioSerializer
from django_filters import rest_framework as django_filters
from rest_framework import filters

from geopy import distance
import requests
import json
from rest_framework.exceptions import ValidationError
# Create your views here.


class DetailsView(APIView):
    def get(self, request, *args, **kwargs):
        target = get_object_or_404(studio, id=kwargs["studio_id"])
        temp = []
        ip = requests.get("https://api.ipify.org?format=json")
        ip_data = json.loads(ip.text)
        res = requests.get("http://ip-api.com/json/" + ip_data["ip"])
        location_data = res.text
        data = json.loads(location_data)
        user_lon = data["lon"]
        user_lat = data["lat"]
        for image in images.objects.all():
            if image.studio == target:
                absolute_url = (
                    self.request.build_absolute_uri("/").strip("/")
                    + settings.MEDIA_URL
                    + str(image.image)
                )
                temp.append(absolute_url)

        amenities = []
        for a in amenity.objects.all():
            if a.studio == target:
                amenities.append({"type": a.type, "quantity": a.quantity})

        d = str(
            distance.distance((user_lat, user_lon), (target.latitude, target.longitude))
        ).split(" ")
        return Response(
            {
                "name": target.name,
                "address": target.address,
                "longitude": target.longitude,
                "latitude": target.latitude,
                "postal code": target.postal_code,
                "phone number": target.phone_number,
                "distance (km)": float(d[0]),
                "amenities": amenities,
                "images": temp,
            }
        )



class StudioFilter(django_filters.FilterSet):
    amenity_type = django_filters.CharFilter(field_name="amenities__type")
    class_name = django_filters.CharFilter(field_name="classes__name")
    class_coach = django_filters.CharFilter(field_name="classes__coach")

    class Meta:
        model = studio
        fields = [
            "name",
            "amenity_type",
            "class_name",
            "class_coach",
        ]


def isfloat(num):
    try:
        float(num)
        return True
    except ValueError:
        return False


class studioView(ListAPIView):
    serializer_class = StudioSerializer
    filter_backends = (
        filters.SearchFilter,
        django_filters.DjangoFilterBackend,
    )
    search_fields = (
        "name",
        "amenities__type",
        "classes__name",
        "classes__coach",
    )
    
    lookup_url_kwarg1 = "longitude"
    lookup_url_kwarg2 = "latitude"

    def get_queryset(self):
        longitude = self.request.query_params.get('longitude')
        latitude = self.request.query_params.get('latitude')

        if longitude and latitude:
            if not isfloat(longitude) or not isfloat(latitude):
                 raise ValidationError(detail="longitude and latitude should be number")

            longitude = float(longitude)
            latitude = float(latitude)

            if 90 >= longitude >= -90 and 90 >= latitude >= -90:
                for x in studio.objects.all():
                    user_lon = longitude
                    user_lat = latitude
                    d = str(
                        distance.distance((user_lat, user_lon), (x.latitude, x.longitude))
                    ).split(" ")
                    x.distance = float(d[0])
                    x.save()
            else:
                raise ValidationError(detail="longitude and latitude should between -90 and 90")
        else:
            raise ValidationError(detail="longitude and latitude are required")
    
        queryset = studio.objects.all().order_by('distance').values()
   
        return queryset
   
    filterset_class = StudioFilter
