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
