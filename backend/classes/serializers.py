from rest_framework import serializers
from taggit.serializers import TagListSerializerField, TaggitSerializer
from classes.models import Class, Event


class ClassSerializer(TaggitSerializer, serializers.ModelSerializer):
    keywords = TagListSerializerField()

    class Meta:
        model = Class
        fields = [
            "id",
            "name",
            "studio",
            "description",
            "coach",
            "keywords",
            "capacity",
        ]


class EventSerializer(serializers.ModelSerializer):
    classInfo = ClassSerializer(read_only=True)
    enrolled_num = serializers.SerializerMethodField("get_enrolled_num")

    def get_enrolled_num(self, obj):
        return obj.enrolled_user.count()

    class Meta:
        model = Event
        exclude = ("enrolled_user",)
