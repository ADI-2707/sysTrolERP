from django.conf import settings


class SuperAdminPrincipal:
    is_authenticated = True
    is_anonymous = False
    is_active = True
    is_staff = True
    is_superuser = True
    role = "SUPER"
    id = "superadmin"
    pk = "superadmin"
    must_change_password = False

    def __init__(self, username: str | None = None):
        self.username = username or getattr(settings, "SUPER_ADMIN_USERNAME", "superadmin")
        self.email = self.username
        self.full_name = "Super Administrator"
        self.employee_code = "SUPER-ADMIN"

    def has_perm(self, perm, obj=None):
        return True

    def has_perms(self, perm_list, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    def __str__(self):
        return f"SUPER:{self.username}"

    def __eq__(self, other):
        if isinstance(other, SuperAdminPrincipal):
            return self.username == other.username
        return False
