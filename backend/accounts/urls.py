from django.urls import path
from accounts.views import *
from rest_framework_simplejwt.views import TokenObtainPairView


urlpatterns = [
    path('register/', register),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('profile/', ProfileView.as_view()),
]