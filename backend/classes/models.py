from django.db import models
from studios.models import studio
from taggit.managers import TaggableManager
from recurrence.fields import RecurrenceField
from accounts.models import Account


class Class(models.Model):
    name = models.CharField(max_length=200)
    studio = models.ForeignKey(
        to=studio, related_name="classes", on_delete=models.CASCADE, null=True
    )
    description = models.TextField()
    coach = models.CharField(max_length=200)
    keywords = TaggableManager(verbose_name="keywords", blank=True)
    capacity = models.PositiveIntegerField(default=0)
    recurrences = RecurrenceField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name = "Class"
        verbose_name_plural = "Classes"

    def __str__(self):
        return self.name


class Event(models.Model):
    classInfo = models.ForeignKey(
        to=Class, related_name="events", on_delete=models.CASCADE
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    cancelled = models.BooleanField(default=False)
    enrolled_user = models.ManyToManyField(
        to=Account, related_name="enrolled", blank=True
    )
