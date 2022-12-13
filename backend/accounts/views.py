from django.shortcuts import render
from accounts.models import *

from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView, get_object_or_404, UpdateAPIView
from rest_framework.permissions import IsAuthenticated


# Create your views here.


class RegisterSerializer(serializers.ModelSerializer):

    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = Account
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "phone",
            "password",
            "password2",
        ]

    def save(self):
        password = self.validated_data["password"]
        password2 = self.validated_data["password2"]
        username = self.validated_data["username"]
        if "first_name" not in self.validated_data:
            first_name = ""
        else:
            first_name = self.validated_data["first_name"]

        if "last_name" not in self.validated_data:
            last_name = ""
        else:
            last_name = self.validated_data["last_name"]

        if "email" not in self.validated_data:
            email = ""
        else:
            email = self.validated_data["email"]

        phone = self.validated_data["phone"]
        if len(phone) != 10 or not phone.isnumeric():
            raise serializers.ValidationError({"phone": "phone number is invalid"})

        if "avatar" not in self.validated_data:
            raise serializers.ValidationError({"avatar": "avatar required"})

        if password != password2:
            raise serializers.ValidationError({"passwords": "passwords do not match"})

        if Account.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "username already exists"})

        userdata = self.validated_data.copy()
        del userdata["password2"]
        new = Account(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email,
            avatar=self.validated_data["avatar"],
            phone=self.validated_data["phone"],
        )

        new.set_password(raw_password=password)
        new.save()

        return new


@api_view(["POST"])
def register(request):

    serializer = RegisterSerializer(data=request.data)
    response = {}
    if serializer.is_valid():
        serializer.save()
        response["response"] = "user created"
        return Response(response)
    else:
        response = serializer.errors
        return Response(response, status=status.HTTP_400_BAD_REQUEST)


class ProfileSerializer(serializers.ModelSerializer):

    password2 = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Account
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "phone",
            "password",
            "password2",
        ]
        read_only_fields = ["username"]
        write_only_fields = ["password2"]
        extra_kwargs = {"password": {"write_only": True, "required": False}}

    def validate(self, attrs):
        if "password" in attrs and "password2" in attrs:
            if attrs["password"] != attrs["password2"]:
                raise serializers.ValidationError(
                    {"password": "Passwords do not match."}
                )

        phone = attrs['phone']
        if len(phone) != 10 or not phone.isnumeric():
            raise serializers.ValidationError({"phone": "phone number is invalid"})

        return attrs

    def update(self, instance, validated_data):
        super().update(instance, validated_data)
        if "password" in validated_data:
            instance.set_password(validated_data["password"])
            instance.save()
        return instance


class ProfileView(RetrieveAPIView, UpdateAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer

    def get_object(self):
        user = get_object_or_404(Account, username=self.request.user.username)
        return user
