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
from rest_framework.exceptions import ValidationError
from group_8958.pagination import AdaptiveLimitOffsetPagination
from group_8958.feature_flags import is_degraded_mode
from group_8958.redis_client import redis_client
import random

import json



# Create your views here.


class DetailsView(APIView):
    def get(self, request, *args, **kwargs):
        target = get_object_or_404(studio, id=kwargs["studio_id"])
        degraded = is_degraded_mode()
        
        
        # Get user location from query parameters instead of IP geolocation
        longitude = request.query_params.get('longitude')
        latitude = request.query_params.get('latitude')
        
        if longitude and latitude and isfloat(longitude) and isfloat(latitude):
            user_lon = float(longitude)
            user_lat = float(latitude)
            d = distance.distance((user_lat, user_lon), (target.latitude, target.longitude)).km
            distance_km = round(d, 2)
        else:
            # If no coordinates provided, set distance as None or 0
            distance_km = None
        
        image_urls = []
        for image in images.objects.all():
            if image.studio == target:
                # Return relative URL instead of absolute
                # image.image.url returns '/media/images/filename.png'
                if degraded and image.image_small:
                    image_urls.append(image.image_small.url)   # low-res
                else:
                    image_urls.append(image.image.url)         # normal

        amenities = []
        for a in amenity.objects.all():
            if a.studio == target:
                amenities.append({"type": a.type, "quantity": a.quantity})

        response_data = {
            "name": target.name,
            "address": target.address,
            "longitude": target.longitude,
            "latitude": target.latitude,
            "postal code": target.postal_code,
            "phone number": target.phone_number,
            "amenities": amenities,
            "images": image_urls,
        }
        
        if distance_km is not None:
            response_data["distance (km)"] = distance_km
        
        return Response(response_data)



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
    filterset_class = StudioFilter
    pagination_class = AdaptiveLimitOffsetPagination
    
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

            if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
                raise ValidationError(detail="longitude should be between -180 and 180, latitude between -90 and 90")
        else:
            raise ValidationError(detail="longitude and latitude are required")
    
        # Return the base queryset - we'll calculate distances later
        return studio.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Get the filtered queryset (after search/filter backends are applied)
        studios = self.filter_queryset(self.get_queryset())
        degraded = is_degraded_mode()

        if degraded:
            # ignore user location and return cached paginated results if available
            params = request.query_params.copy()
            params.pop("longitude", None)
            params.pop("latitude", None)
            normalized_query = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
            cache_key = f"studios:degraded:{normalized_query}"

            cached = redis_client.get(cache_key)
            if cached is not None:
                # 'cached' is the dict we stored earlier (paginated or not)
                data = json.loads(cached)
                return Response(data)

            # Paginate the sorted results
            page = self.paginate_queryset(studios)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                paginated_response = self.get_paginated_response(serializer.data)
                redis_client.setex(
                    cache_key,
                    600 + random.randint(1, 60),
                    json.dumps(paginated_response.data),
                )
                return paginated_response
            
            serializer = self.get_serializer(studios, many=True)
            response = Response(serializer.data)

            redis_client.setex(
                cache_key,
                600 + random.randint(1, 60),
                json.dumps(response.data),
            )
            return response
                
        else:
            # Get user coordinates
            longitude = float(request.query_params.get('longitude'))
            latitude = float(request.query_params.get('latitude'))
            
            # Calculate distances and sort
            studios_with_distance = []
            for s in studios:
                d = distance.distance((latitude, longitude), (s.latitude, s.longitude)).km
                s.distance = d  # Add as attribute (not saved to DB)
                studios_with_distance.append(s)
            
            # Sort by distance
            studios_with_distance.sort(key=lambda x: x.distance)
            
            # Paginate the sorted results
            page = self.paginate_queryset(studios_with_distance)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(studios_with_distance, many=True)
            return Response(serializer.data)
