from django.db import models
from django.contrib.auth.models import AbstractUser


class Account(AbstractUser):
    phone = models.CharField(max_length=20)
    avatar = models.ImageField(upload_to="avatar/", default=None)
