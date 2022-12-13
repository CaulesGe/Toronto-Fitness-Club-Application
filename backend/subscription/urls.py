from django.urls import path
from subscription.views import *


urlpatterns = [
    path('plans/', PlanView.as_view()),
    path('manage/', SubscriptionView.as_view()),
    path('payment/history/', PaymentView.as_view()),
    path('payment/future/', future_payment),
    path('payment/update/', check_is_payment_day),
]