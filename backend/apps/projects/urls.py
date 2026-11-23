from django.urls import path
from apps.projects.views import (
    ProjectDetailView,
    ProjectListCreateView,
    ProjectMemberDeleteView,
    ProjectMemberManageView,
    ProjectStepDetailManageView,
    ProjectStepStatusView,
    ProjectSubStepCreateView,
)

urlpatterns = [
    path("", ProjectListCreateView.as_view(), name="project_list_create"),
    path("<int:pk>/", ProjectDetailView.as_view(), name="project_detail"),
    path("<int:project_id>/steps/<int:step_id>/status/", ProjectStepStatusView.as_view(), name="project_step_status"),
    path("<int:project_id>/steps/<int:step_id>/", ProjectStepDetailManageView.as_view(), name="project_step_detail_manage"),
    path("<int:project_id>/sub-steps/", ProjectSubStepCreateView.as_view(), name="project_sub_step_create"),
    path("<int:project_id>/members/", ProjectMemberManageView.as_view(), name="project_members_manage"),
    path("<int:project_id>/members/<int:user_id>/", ProjectMemberDeleteView.as_view(), name="project_member_delete"),
]
