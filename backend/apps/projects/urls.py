from django.urls import path
from apps.projects.views import (
    ProjectDetailView,
    ProjectListCreateView,
    ProjectStepStatusView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project_list_create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project_detail"),
    path("<int:project_id>/steps/<int:step_id>/status/", ProjectStepStatusView.as_view(), name="project_step_status"),
]
