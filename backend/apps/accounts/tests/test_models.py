import pytest

from apps.accounts.models import User, UserRole


@pytest.mark.django_db
def test_create_user_employee():
    user = User.objects.create_user(
        email="emp@example.com",
        employee_code="SYS-0001",
        full_name="Test Employee",
        password="ValidPassword123!",
    )
    assert user.pk is not None
    assert user.role == UserRole.EMPLOYEE
    assert user.is_active is True
    assert user.check_password("ValidPassword123!") is True
    assert str(user) == "SYS-0001 - Test Employee"


@pytest.mark.django_db
def test_create_user_optional_email():
    user = User.objects.create_user(
        employee_code="0002",
        full_name="No Email",
        password="ValidPassword123!",
    )
    assert user.pk is not None
    assert user.email is None
    assert user.employee_code == "0002"


@pytest.mark.django_db
def test_create_user_missing_code():
    with pytest.raises(ValueError, match="The Employee Code field must be set"):
        User.objects.create_user(
            email="test@example.com",
            employee_code="",
            full_name="No Code",
        )
