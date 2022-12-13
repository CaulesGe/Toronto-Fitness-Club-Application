from django.shortcuts import render
from subscription.models import *
from classes.models import *

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.generics import RetrieveAPIView, get_object_or_404, UpdateAPIView, ListAPIView, CreateAPIView, DestroyAPIView
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist

from datetime import date
from dateutil.relativedelta import relativedelta

# Create your views here.


class PlanSerializer(serializers.ModelSerializer):

    class Meta:
        model = Plan
        fields = ['id', 'amount', 'duration']
    

class PlanView(ListAPIView):
    serializer_class = PlanSerializer

    def get_queryset(self):
        
        return Plan.objects.all()


class SubscriptionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Subscription
        fields = ['plan', 'card', 'date',]
    

    def create(self, validated_data):

        user = self.context['request'].user
        plan = self.validated_data['plan']

        if Subscription.objects.filter(account = user):
            raise serializers.ValidationError({'account': 'you already have a subscription'})

        instance = Subscription.objects.create(**validated_data, account = user)

        Payment.objects.create(account = user, card = validated_data['card'], amount = plan.amount)

        return instance


class SubscriptionView(RetrieveAPIView, CreateAPIView, UpdateAPIView, DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubscriptionSerializer

    def get_object(self):

        return get_object_or_404(Subscription, account = self.request.user)
    

    def destroy(self, request, *args, **kwargs):
        
        try:
            sub = Subscription.objects.get(account = request.user)
        except ObjectDoesNotExist:
            return Response({'details' : 'you do not have a subscription'}, status=status.HTTP_404_NOT_FOUND)

        counter = 0
        if sub.plan.duration == 'Month':
            expire = sub.date + relativedelta(months=1)
        else:
            expire = sub.date + relativedelta(years=1)

        events = request.user.enrolled.all()

        for event in events:
            if event.date > expire:
                event.enrolled_user.remove(request.user)
                event.save()
                counter += 1

        super().destroy(request, *args, **kwargs)
        return Response({'class events removed' : f'{counter}'})


class PaymentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Payment
        fields = ['amount', 'card', 'datetime']


class PaymentView(ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(account = self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def future_payment(request):

    try:
        sub = Subscription.objects.get(account = request.user)
    
    except ObjectDoesNotExist:
        return Response({'details' : 'you do not have a subscription'}, status = status.HTTP_404_NOT_FOUND)

    data = {}

    if sub.plan.duration == 'Month':
        day = str(sub.date)[-2:]
        data['future'] = f'{sub.plan.amount}$ on {day} of every month'

    elif sub.plan.duration == 'Year':
        month = str(sub.date)[-5:]
        data['future'] = f'{sub.plan.amount}$ on {month} of every year'

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_is_payment_day(request):

    #go through all subscriptions and check if user need to pay today or not

    if not request.user.is_superuser:
        return Response({'details': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    counter = 0
    subs = Subscription.objects.all()
    today = str(date.today())

    for sub in subs:
        # do not charge again
        if today == str(sub.date):
            continue
        
        if sub.plan.duration == 'Month':
            pay_day = str(sub.date)[-2:]
            today_day = today[-2:]
            if pay_day == today_day:
                Payment.objects.create(account = sub.account, card = sub.card, amount = sub.plan.amount)
                counter += 1

        elif sub.plan.duration == 'Year':
            pay_month = str(sub.date)[-5:]
            today_month = today[-5:]
            if pay_month == today_month:
                Payment.objects.create(account = sub.account, card = sub.card, amount = sub.plan.amount)
                counter += 1
    
    return Response({'payment processed' : f'{counter}'})
