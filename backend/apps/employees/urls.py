from django.urls import path
from apps.employees.views import EmployeeDetailView, EmployeeListCreateView

urlpatterns = [
    path("", EmployeeListCreateView.as_view(), name="employee_list_create"),
    path("<int:pk>/", EmployeeDetailView.as_view(), name="employee_detail"),
]
