from django.urls import path

from studios.views import DetailsView, studioView
from django.conf import settings
from django.conf.urls.static import static
from classes.views import StudioClassView

app_name = "studios"

urlpatterns = [
    path("<int:studio_id>/classes", StudioClassView.as_view()),
    path("<int:studio_id>/details/", DetailsView.as_view(), name="studio_detail"),
    path("all/", studioView.as_view(), name="all"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
