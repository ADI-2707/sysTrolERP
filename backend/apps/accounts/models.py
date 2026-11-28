from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    ADMIN = "ADMIN", "Admin"
    EMPLOYEE = "EMPLOYEE", "Employee"


class UserManager(BaseUserManager):
    def create_user(self, email, employee_code, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not employee_code:
            raise ValueError("The Employee Code field must be set")
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            employee_code=employee_code,
            full_name=full_name,
            **extra_fields,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, employee_code, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, employee_code, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    employee_code = models.CharField(max_length=20, unique=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30, blank=True, default="")
    designation = models.CharField(max_length=100, blank=True, default="")
    department = models.CharField(max_length=100, blank=True, default="")
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="revoked_users",
    )
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["employee_code", "full_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["employee_code"]

    def __str__(self):
        return f"{self.employee_code} - {self.full_name}"


class EmployeeCodeSequence(models.Model):
    name = models.CharField(max_length=50, unique=True, default="employee_code")
    last_number = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Employee Code Sequence"
        verbose_name_plural = "Employee Code Sequences"

    def __str__(self):
        return f"{self.name}: {self.last_number}"


class LoginAttempt(models.Model):
    identifier = models.CharField(max_length=255, db_index=True)
    ip_address = models.GenericIPAddressField(db_index=True)
    device_id = models.CharField(max_length=64, db_index=True, blank=True, default="")
    attempted_at = models.DateTimeField(default=timezone.now, db_index=True)
    successful = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        verbose_name = "Login Attempt"
        verbose_name_plural = "Login Attempts"
        ordering = ["-attempted_at"]
        indexes = [
            models.Index(fields=["identifier", "device_id", "-attempted_at"]),
            models.Index(fields=["ip_address", "-attempted_at"]),
        ]

    def __str__(self):
        status_label = "Success" if self.successful else "Failed"
        return f"{self.identifier} ({self.ip_address}) - {status_label}"
