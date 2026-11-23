from django.urls import path
from apps.projects.views import (
    ProjectDetailView,
    ProjectListCreateView,
    ProjectStepStatusView,
    ProjectSubStepCreateView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project_list_create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project_detail"),
    path("<int:project_id>/steps/<int:step_id>/status/", ProjectStepStatusView.as_view(), name="project_step_status"),
    path("<int:project_id>/sub-steps/", ProjectSubStepCreateView.as_view(), name="project_sub_step_create"),
]
