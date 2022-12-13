from django.contrib import admin
from django.contrib.admin.filters import DateFieldListFilter
from django import forms
from classes.models import Class, Event
from datetime import datetime, date
from django.contrib.auth.models import Group
from taggit.admin import Tag


@admin.action(description="Cancel all future occurrences")
def CancelClassAction(modeladmin, request, queryset):
    """Cancel all future occurrences of selected classes."""
    for obj in queryset:
        events = (
            obj.events.all()
            .filter(date__gte=datetime.now().date())
            .exclude(
                date=datetime.now().date(),
                start_time__lte=datetime.now().time(),
            )
        )
        for event in events:
            if not event.cancelled:
                event.cancelled = True
            event.save()


@admin.action(description="Uncancel all future occurrences")
def UncancelClassAction(modeladmin, request, queryset):
    """Uncancel all future occurrences of selected classes."""
    for obj in queryset:
        events = (
            obj.events.all()
            .filter(date__gte=datetime.now().date())
            .exclude(
                date=datetime.now().date(),
                start_time__lte=datetime.now().time(),
            )
        )
        for event in events:
            if event.cancelled:
                event.cancelled = False
            event.save()


@admin.action(description="Cancel selected class events")
def CancelEventAction(modeladmin, request, queryset):
    """Cancel selected events."""
    for event in queryset:
        if not event.cancelled:
            event.cancelled = True
        event.save()


@admin.action(description="Uncancel selected class events")
def UncancelEventAction(modeladmin, request, queryset):
    """Uncancel selected events."""
    for event in queryset:
        if event.cancelled:
            event.cancelled = False
        event.save()


class ClassForm(forms.ModelForm):
    class Meta:
        model = Class
        fields = "__all__"
        help_texts = {
            "coach": "Enter the name of the coach",
            "keywords": "A comma-separated list of keywords",
            "recurrences": "Must select one recurrence rule with end time",
            "recurrences": "Setting the recurrence rule will set date of all future events",
            "start_time": "Setting the time will set time of all furture events",
            "end_time": "Setting the time will set time of all furture events",
            "capacity": "Capacity can not be modified in the future",
        }

    def clean(self):
        cleaned_data = super(ClassForm, self).clean()
        start_time = cleaned_data.get("start_time")
        end_time = cleaned_data.get("end_time")
        recurrences = cleaned_data.get("recurrences")

        if start_time and end_time and end_time <= start_time:
            self.add_error("end_time", "End time must be later than the start time.")

        if recurrences:
            if not recurrences.rrules:
                self.add_error(
                    "recurrences",
                    "Must add one recurrence rule.",
                )
            elif len(recurrences.rrules) > 1:
                self.add_error(
                    "recurrences",
                    "Must have only one recurrence rule.",
                )
            else:
                for rule in recurrences.rrules:
                    if rule.until is None and rule.count is None:
                        self.add_error(
                            "recurrences",
                            "Recurrence rule must contain an end date.",
                        )
                        break
                    elif rule.until and rule.until.date() <= datetime.now().date():
                        self.add_error(
                            "recurrences",
                            "End date of a recurrence rule must be later than today.",
                        )
                        break

        return cleaned_data


class ClassAdmin(admin.ModelAdmin):
    list_display = ("name", "get_recurrence_time", "studio")
    list_filter = ("studio",)
    actions = [CancelClassAction, UncancelClassAction]
    form = ClassForm

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ("capacity",)
        return self.readonly_fields

    @admin.display(description="Recurrence")
    def get_recurrence_time(self, obj):
        text_rules_inclusion = ""
        for rule in obj.recurrences.rrules:
            text_rules_inclusion += rule.to_text()
        return text_rules_inclusion

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            for date in obj.recurrences.occurrences():
                event = Event(
                    classInfo=obj,
                    date=date.date(),
                    start_time=obj.start_time,
                    end_time=obj.end_time,
                )
                event.save()
        if change:
            old_object = self.model.objects.get(id=obj.id)
            old_recurrences = old_object.recurrences
            super().save_model(request, obj, form, change)
            future_events = (
                obj.events.all()
                .filter(date__gte=datetime.now().date())
                .exclude(
                    date=datetime.now().date(),
                    start_time__lte=datetime.now().time(),
                )
                .order_by("id")
            )
            if "start_time" in form.changed_data or "end_time" in form.changed_data:
                for event in future_events:
                    event.start_time = obj.start_time
                    event.end_time = obj.end_time
                    event.save()

            if old_recurrences != obj.recurrences:
                new_date = [date for date in obj.recurrences.occurrences()]
                if len(new_date) > len(future_events):
                    for i in range(len(new_date)):
                        if i >= len(future_events):
                            event = Event(
                                classInfo=obj,
                                date=new_date[i],
                                start_time=obj.start_time,
                                end_time=obj.end_time,
                            )
                            event.save()
                        else:
                            future_events[i].date = new_date[i]
                            future_events[i].save()

                else:
                    if len(new_date) < len(future_events):
                        for i in range(len(new_date), len(future_events)):
                            future_events[i].cancelled = True
                            future_events[i].save()
                    for i in range(len(new_date)):
                        future_events[i].date = new_date[i]
                        future_events[i].save()


class CustomDateFieldListFilter(DateFieldListFilter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        today = date.today()

        self.links = [
            (("Any date"), {}),
        ]
        self.links.append(
            (
                "Past",
                {
                    self.lookup_kwarg_until: str(today),
                },
            )
        )
        self.links.append(
            (
                "Upcoming",
                {
                    self.lookup_kwarg_since: str(today),
                },
            ),
        )


class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = "__all__"

    def clean(self):
        cleaned_data = super(EventForm, self).clean()
        start_time = cleaned_data.get("start_time")
        end_time = cleaned_data.get("end_time")
        enrolled_user = cleaned_data.get("enrolled_user")
        class_info = cleaned_data.get("classInfo")

        if start_time and end_time and end_time <= start_time:
            self.add_error("end_time", "End time must be later than the start time.")

        if class_info and len(enrolled_user) > class_info.capacity:
            self.add_error(
                "enrolled_user", "Can't enroll more than the class capacity."
            )

        return cleaned_data


class ClassEventAdmin(admin.ModelAdmin):
    list_display = (
        "get_class_name",
        "start_time",
        "date",
        "get_class_studio",
        "cancelled",
    )
    actions = [CancelEventAction, UncancelEventAction]
    list_filter = (
        "classInfo__studio",
        "classInfo",
        "cancelled",
        ("date", CustomDateFieldListFilter),
    )
    form = EventForm

    @admin.display(description="Name")
    def get_class_name(self, obj):
        return obj.classInfo.name

    @admin.display(description="Studio")
    def get_class_studio(self, obj):
        return obj.classInfo.studio


admin.site.register(Class, ClassAdmin)
admin.site.register(Event, ClassEventAdmin)
admin.site.unregister(Group)
admin.site.unregister(Tag)
