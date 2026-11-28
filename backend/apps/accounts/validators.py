import re

from django.core.exceptions import ValidationError


class ComplexPasswordValidator:
    def validate(self, password, user=None):
        if len(password) < 8:
            raise ValidationError(
                "Password must be at least 8 characters long.",
                code="password_too_short",
            )
        if not re.search(r"[A-Z]", password):
            raise ValidationError(
                "Password must contain at least one uppercase letter (A-Z).",
                code="password_no_upper",
            )
        if not re.search(r"[a-z]", password):
            raise ValidationError(
                "Password must contain at least one lowercase letter (a-z).",
                code="password_no_lower",
            )
        if not re.search(r"[0-9]", password):
            raise ValidationError(
                "Password must contain at least one number (0-9).",
                code="password_no_number",
            )
        if not re.search(r'[!@#$%^&*(),.?":{}|<>\-_=+;~`\[\]/\\]', password):
            raise ValidationError(
                "Password must contain at least one special character.",
                code="password_no_special",
            )

    def get_help_text(self):
        return (
            "Your password must be at least 8 characters long and contain at least "
            "one uppercase letter, one lowercase letter, one number, and one special character."
        )
