from django.db import models
from accounts.models import Account

# Create your models here.


class Plan(models.Model):
    plan_choices = (('Month','Month'), ('Year', 'Year'))
    amount = models.FloatField()
    duration = models.CharField(max_length=6, choices=plan_choices)

    def __str__(self):

        return str(self.amount) + " per " + self.duration


class Subscription(models.Model):

    account = models.ForeignKey(to=Account, on_delete=models.CASCADE)
    plan = models.ForeignKey(to=Plan, on_delete=models.CASCADE)
    card = models.CharField(max_length=200)
    date = models.DateField(auto_now_add=True)

    def __str__(self) -> str:
        
        return self.account.username + " with " + str(self.plan) + " on " + str(self.date)


class Payment(models.Model):
    account = models.ForeignKey(to=Account, on_delete=models.CASCADE)
    datetime = models.DateTimeField(auto_now_add=True)
    amount = models.FloatField()
    card = models.CharField(max_length=200)

    def __str__(self) -> str:

        return self.account.username + " paid " + str(self.amount) + " on " + str(self.datetime)