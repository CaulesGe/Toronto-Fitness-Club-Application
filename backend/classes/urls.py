from django.urls import path
from classes.views import (
    EnrollClassView,
    DropClassView,
    EnrollEventView,
    DropEventView,
    UserClassScheduleView,
    UserClassHistoryView,
)

urlpatterns = [
    path("enroll", EnrollClassView.as_view()),
    path("event/enroll", EnrollEventView.as_view()),
    path("drop", DropClassView.as_view()),
    path("event/drop", DropEventView.as_view()),
    path("schedule", UserClassScheduleView.as_view()),
    path("history", UserClassHistoryView.as_view()),
]
