from getpass import getpass
from django.contrib.auth.hashers import Argon2PasswordHasher
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Generate Argon2 password hash for the super admin environment variable"

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            type=str,
            default=None,
            help="Password to hash directly without prompt",
        )

    def handle(self, *args, **options):
        password = options.get("password")
        if not password:
            password = getpass("Enter Super Admin password: ")
            confirm = getpass("Confirm Super Admin password: ")
            if password != confirm:
                self.stderr.write("Passwords do not match.")
                return

        hasher = Argon2PasswordHasher()
        hashed = hasher.encode(password, hasher.salt())
        self.stdout.write(f"SUPER_ADMIN_PASSWORD_HASH={hashed}")
