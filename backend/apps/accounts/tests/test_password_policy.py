import pytest
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from apps.accounts.models import User


def test_argon2_hasher():
    hasher = Argon2PasswordHasher()
    encoded = hasher.encode("SysTrol@9999", "randomsalt123")
    assert encoded.startswith("argon2")
    assert hasher.verify("SysTrol@9999", encoded) is True
    assert hasher.verify("WrongPassword123!", encoded) is False


def test_password_too_short():
    with pytest.raises(ValidationError) as exc:
        validate_password("Short1!")
    error_messages = [msg for error in exc.value.error_list for msg in error.messages]
    assert any("at least 8 characters" in m for m in error_messages)


def test_password_missing_uppercase():
    with pytest.raises(ValidationError) as exc:
        validate_password("nouppercase123!")
    error_messages = [msg for error in exc.value.error_list for msg in error.messages]
    assert any("uppercase" in m for m in error_messages)


def test_password_missing_lowercase():
    with pytest.raises(ValidationError) as exc:
        validate_password("NOLOWERCASE123!")
    error_messages = [msg for error in exc.value.error_list for msg in error.messages]
    assert any("lowercase" in m for m in error_messages)


def test_password_missing_number():
    with pytest.raises(ValidationError) as exc:
        validate_password("NoNumberHere!!")
    error_messages = [msg for error in exc.value.error_list for msg in error.messages]
    assert any("number" in m for m in error_messages)


def test_password_missing_special():
    with pytest.raises(ValidationError) as exc:
        validate_password("NoSpecial1234")
    error_messages = [msg for error in exc.value.error_list for msg in error.messages]
    assert any("special" in m for m in error_messages)


def test_password_similarity():
    user = User(
        email="john.doe@company.com",
        full_name="John Doe",
        employee_code="SYS-0042",
    )
    with pytest.raises(ValidationError):
        validate_password("john.doe@company.com", user=user)


def test_password_valid():
    validate_password("Systrol@9999")
    validate_password("SysTrol@9999")
    validate_password("ValidPassword123!")
