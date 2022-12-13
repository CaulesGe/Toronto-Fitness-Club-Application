from rest_framework import serializers

from studios.models import studio


class StudioSerializer(serializers.ModelSerializer):
  
    class Meta:
        model = studio
        fields = ['id', 'name', 'address', 'distance', 'longitude', 'latitude']

        ordering = ["distance"]
