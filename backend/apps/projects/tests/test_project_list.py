import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.projects.services import create_project


@pytest.mark.django_db
def test_project_list_view_permissions_and_filtering():
    admin = User.objects.create_user(
        email="padmin@example.com",
        employee_code="SYS-0401",
        full_name="Project Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )
    emp = User.objects.create_user(
        email="pemp@example.com",
        employee_code="SYS-0402",
        full_name="Project Emp",
        password="ValidPassword123!",
        role=UserRole.EMPLOYEE,
    )

    proj1 = create_project(
        name="Active Blast Furnace",
        creator=admin,
        client_name="Client A",
    )
    proj2 = create_project(
        name="Completed Rolling Mill",
        creator=admin,
        client_name="Client B",
    )
    proj2.is_active = False
    proj2.save()

    emp_client = APIClient()
    emp_client.force_authenticate(user=emp)
    emp_resp = emp_client.get(reverse("project_list_create"))
    assert emp_resp.status_code == 200
    assert emp_resp.data["count"] == 1
    assert emp_resp.data["results"][0]["code"] == proj1.code

    admin_client = APIClient()
    admin_client.force_authenticate(user=admin)
    admin_resp = admin_client.get(reverse("project_list_create"))
    assert admin_resp.status_code == 200
    assert admin_resp.data["count"] == 2

    search_resp = admin_client.get(f"{reverse('project_list_create')}?search=Rolling")
    assert search_resp.status_code == 200
    assert search_resp.data["count"] == 1
    assert search_resp.data["results"][0]["code"] == proj2.code

    active_resp = admin_client.get(f"{reverse('project_list_create')}?status=ACTIVE")
    assert active_resp.status_code == 200
    assert active_resp.data["count"] == 2

    completed_resp = admin_client.get(f"{reverse('project_list_create')}?status=COMPLETED")
    assert completed_resp.status_code == 200
    assert completed_resp.data["count"] == 0

    create_payload = {
        "code": "PRJ003",
        "name": "New Project Via API",
        "client_name": "API Client",
    }
    create_resp = admin_client.post(reverse("project_list_create"), create_payload, format="json")
    assert create_resp.status_code == 201
    assert create_resp.data["total_steps"] == 14
    assert create_resp.data["completion_percentage"] == 0.0
    assert create_resp.data["current_step"]["key"] == "ENQUIRY"

    emp_create = emp_client.post(reverse("project_list_create"), create_payload, format="json")
    assert emp_create.status_code == 403


@pytest.mark.django_db
def test_project_list_granular_status_filters():
    from apps.projects.models import StepStatus

    admin = User.objects.create_user(
        email="status_admin@example.com",
        employee_code="SYS-0499",
        full_name="Status Admin",
        password="ValidPassword123!",
        role=UserRole.ADMIN,
    )

    p_not_started = create_project(
        name="Project Not Started",
        creator=admin,
        client_name="Client Alpha",
    )

    p_initiated = create_project(
        name="Project Initiated",
        creator=admin,
        client_name="Client Beta",
    )
    s_init = p_initiated.steps.first()
    s_init.status = StepStatus.INITIATED
    s_init.save()

    p_in_prog = create_project(
        name="Project In Progress",
        creator=admin,
        client_name="Client Gamma",
    )
    s_prog = p_in_prog.steps.first()
    s_prog.status = StepStatus.IN_PROGRESS
    s_prog.save()

    p_completed = create_project(
        name="Project Completed",
        creator=admin,
        client_name="Client Delta",
    )
    for step in p_completed.steps.all():
        step.status = StepStatus.COMPLETED
        step.save()

    client = APIClient()
    client.force_authenticate(user=admin)

    resp_ns = client.get(f"{reverse('project_list_create')}?status=NOT_STARTED")
    assert resp_ns.status_code == 200
    ns_codes = [r["code"] for r in resp_ns.data["results"]]
    assert p_not_started.code in ns_codes
    assert p_completed.code not in ns_codes
    assert p_in_prog.code not in ns_codes

    resp_init = client.get(f"{reverse('project_list_create')}?status=INITIATED")
    assert resp_init.status_code == 200
    init_codes = [r["code"] for r in resp_init.data["results"]]
    assert p_initiated.code in init_codes
    assert p_completed.code not in init_codes
    assert p_not_started.code not in init_codes

    resp_prog = client.get(f"{reverse('project_list_create')}?status=IN_PROGRESS")
    assert resp_prog.status_code == 200
    prog_codes = [r["code"] for r in resp_prog.data["results"]]
    assert p_in_prog.code in prog_codes
    assert p_completed.code not in prog_codes
    assert p_not_started.code not in prog_codes

    resp_comp = client.get(f"{reverse('project_list_create')}?status=COMPLETED")
    assert resp_comp.status_code == 200
    comp_codes = [r["code"] for r in resp_comp.data["results"]]
    assert p_completed.code in comp_codes
    assert p_not_started.code not in comp_codes
    assert p_in_prog.code not in comp_codes

    resp_act = client.get(f"{reverse('project_list_create')}?status=ACTIVE")
    assert resp_act.status_code == 200
    act_codes = [r["code"] for r in resp_act.data["results"]]
    assert p_not_started.code in act_codes
    assert p_initiated.code in act_codes
    assert p_in_prog.code in act_codes
    assert p_completed.code not in act_codes

    resp_client = client.get(f"{reverse('project_list_create')}?client_name=Alpha")
    assert resp_client.status_code == 200
    assert resp_client.data["count"] == 1
    assert resp_client.data["results"][0]["code"] == p_not_started.code

    p_in_prog.is_active = False
    p_in_prog.save()

    resp_archived = client.get(f"{reverse('project_list_create')}?is_active=false")
    assert resp_archived.status_code == 200
    arch_codes = [r["code"] for r in resp_archived.data["results"]]
    assert p_in_prog.code in arch_codes
    assert p_not_started.code not in arch_codes

    resp_order = client.get(f"{reverse('project_list_create')}?ordering=name")
    assert resp_order.status_code == 200
    names = [r["name"] for r in resp_order.data["results"]]
    assert names == sorted(names)
