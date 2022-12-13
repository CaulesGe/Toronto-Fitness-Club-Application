from django.contrib import admin
from subscription.models import *

# Register your models here.
admin.site.register(Subscription)
admin.site.register(Payment)
admin.site.register(Plan)
