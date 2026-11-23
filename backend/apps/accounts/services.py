import time
from django.db import OperationalError, transaction
from apps.accounts.models import EmployeeCodeSequence

def generate_next_employee_code(prefix: str = "SYS-", padding: int = 4) -> str:
    max_retries = 20
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                seq, _ = EmployeeCodeSequence.objects.select_for_update().get_or_create(
                    name="employee_code",
                    defaults={"last_number": 0},
                )
                seq.last_number += 1
                seq.save(update_fields=["last_number"])
                return f"{prefix}{seq.last_number:0{padding}d}"
        except OperationalError:
            if attempt == max_retries - 1:
                raise
            time.sleep(0.05 * (attempt + 1))
