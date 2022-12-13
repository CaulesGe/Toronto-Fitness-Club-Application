from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response

from django_filters import rest_framework as django_filters
from rest_framework import filters
from datetime import datetime, date, time


from classes.serializers import EventSerializer
from classes.models import Class, Event
from studios.models import studio
from subscription.models import Subscription


class HasValidSubscription(BasePermission):
    message = "Account does not have valid subscription"

    def has_permission(self, request, view):
        if Subscription.objects.filter(account=request.user).exists():
            return True
        else:
            return False


class ClassEventFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="classInfo__name")
    coach = django_filters.CharFilter(field_name="classInfo__coach")
    start_date = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    end_date = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    start_time = django_filters.TimeFilter(field_name="start_time", lookup_expr="gte")
    end_time = django_filters.TimeFilter(field_name="start_time", lookup_expr="lte")
    keyword = django_filters.CharFilter(field_name="classInfo__keywords__name")

    class Meta:
        model = Event
        fields = [
            "name",
            "coach",
            "date",
            "start_date",
            "end_date",
            "start_time",
            "end_time",
            "keyword",
        ]


class StudioClassView(ListAPIView):
    serializer_class = EventSerializer
    filter_backends = (
        filters.SearchFilter,
        django_filters.DjangoFilterBackend,
    )
    search_fields = (
        "classInfo__name",
        "classInfo__coach",
        "classInfo__keywords__name",
    )
    filterset_class = ClassEventFilter

    def get_queryset(self):
        st = get_object_or_404(studio, id=self.kwargs["studio_id"])
        classes = Class.objects.filter(studio=st)
        events = (
            Event.objects.filter(
                classInfo__in=classes, date__gte=date.today(), cancelled=False
            )
            .exclude(date=date.today(), start_time__lte=datetime.now().time())
            .order_by("date", "start_time")
        )
        return events


class EnrollEventView(APIView):
    permission_classes = [IsAuthenticated, HasValidSubscription]

    def post(self, request, *args, **kwargs):
        response_data = {}
        event_id = request.data.get("id")
        if event_id is None:
            response_data["message"] = "id is required"
            return Response(status=400, data=response_data)

        if not event_id.isnumeric():
            response_data["message"] = "Invalid id format"
            return Response(status=400, data=response_data)

        events = (
            Event.objects.all()
            .filter(date__gte=date.today())
            .exclude(date=date.today(), start_time__lte=datetime.now().time())
        )

        if not events.filter(id=event_id).exists():
            response_data["message"] = "No available class event found with id " + str(
                event_id
            )
            return Response(status=404, data=response_data)

        target_event = events.get(id=event_id)

        if target_event.enrolled_user.filter(id=request.user.id).exists():
            response_data["message"] = "You already enrolled selected class event"
            return Response(status=400, data=response_data)

        if target_event.cancelled:
            response_data["message"] = "Selected class event is cancelled"
            return Response(status=400, data=response_data)

        if target_event.enrolled_user.count() >= target_event.classInfo.capacity:
            response_data["message"] = "Selected class event is already full"
            return Response(status=400, data=response_data)

        target_event.enrolled_user.add(request.user)
        response_data["message"] = "Enrolled class event"

        return Response(response_data)


class EnrollClassView(APIView):
    permission_classes = [IsAuthenticated, HasValidSubscription]

    def post(self, request, *args, **kwargs):
        response_data = {}
        class_id = request.data.get("id")
        if class_id is None:
            response_data["message"] = "id is required"
            return Response(status=400, data=response_data)

        if not class_id.isnumeric():
            response_data["message"] = "Invalid id format"
            return Response(status=400, data=response_data)

        clss = get_object_or_404(Class, id=class_id)
        events = clss.events.filter(date__gte=date.today()).exclude(
            date=date.today(), start_time__lte=datetime.now().time()
        )

        for event in events:
            if event.enrolled_user.count() >= clss.capacity or event.cancelled:
                continue
            event.enrolled_user.add(request.user)

        response_data["message"] = "Enrolled all avalilable future class events"
        return Response(response_data)


class DropEventView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response_data = {}
        event_id = request.data.get("id")

        if event_id is None:
            response_data["message"] = "id is required"
            return Response(status=400, data=response_data)

        if not event_id.isnumeric():
            response_data["message"] = "Invalid id format"
            return Response(status=400, data=response_data)

        events = (
            Event.objects.all()
            .filter(date__gte=date.today())
            .exclude(date=date.today(), start_time__lte=datetime.now().time())
        )

        if not events.filter(id=event_id).exists():
            response_data["message"] = "No available class event found with id " + str(
                event_id
            )
            return Response(status=404, data=response_data)

        target_event = events.get(id=event_id)
        if not target_event.enrolled_user.filter(id=request.user.id).exists():
            response_data["message"] = "Not enrolled in class event with id " + str(
                event_id
            )
            return Response(status=400, data=response_data)

        target_event.enrolled_user.remove(request.user)
        response_data["message"] = "Dropped class event"
        return Response(response_data)


class DropClassView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        response_data = {}
        class_id = request.data.get("id")

        if class_id is None:
            response_data["message"] = "id is required"
            return Response(status=400, data=response_data)

        if not class_id.isnumeric():
            response_data["message"] = "Invalid id format"
            return Response(status=400, data=response_data)

        clss = get_object_or_404(Class, id=class_id)
        events = clss.events.filter(date__gte=date.today()).exclude(
            date=date.today(), start_time__lte=datetime.now().time()
        )

        for event in events:
            if event.enrolled_user.filter(id=request.user.id).exists():
                event.enrolled_user.remove(request.user)
        response_data["message"] = "Dropped all future class"
        return Response(response_data)


class UserClassScheduleView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        enrolled_events = self.request.user.enrolled.all()
        result = (
            enrolled_events.filter(date__gte=date.today(), cancelled=False)
            .exclude(date=date.today(), start_time__lte=datetime.now().time())
            .order_by("date", "start_time")
        )
        return result


class UserClassHistoryView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        enrolled_events = self.request.user.enrolled.all()
        result = (
            enrolled_events.filter(date__lte=date.today())
            .exclude(date=date.today(), start_time__gt=datetime.now().time())
            .order_by("-date", "start_time")
        )
        return result
