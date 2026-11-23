from django.urls import path
from apps.employees.views import EmployeeListCreateView

urlpatterns = [
    path("", EmployeeListCreateView.as_view(), name="employee_list_create"),
]
