from django.urls import path
from apps.projects.views import ProjectListCreateView

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project_list_create"),
]
