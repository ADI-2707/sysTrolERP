import io
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.core.management import call_command
from apps.accounts.principals import SuperAdminPrincipal

def test_super_admin_principal_attributes():
    principal = SuperAdminPrincipal("admin_root")
    assert principal.is_authenticated is True
    assert principal.is_anonymous is False
    assert principal.is_active is True
    assert principal.is_staff is True
    assert principal.is_superuser is True
    assert principal.role == "SUPER"
    assert principal.username == "admin_root"
    assert principal.must_change_password is False
    assert principal.has_perm("any_perm") is True
    assert str(principal) == "SUPER:admin_root"

def test_generate_super_admin_hash_command():
    out = io.StringIO()
    call_command("generate_super_admin_hash", password="TestSuperPassword123!", stdout=out)
    output = out.getvalue().strip()
    assert output.startswith("SUPER_ADMIN_PASSWORD_HASH=argon2")

    hasher = Argon2PasswordHasher()
    hashed = output.split("=", 1)[1]
    assert hasher.verify("TestSuperPassword123!", hashed) is True
