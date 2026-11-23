from concurrent.futures import ThreadPoolExecutor
import pytest
from django.db import connection
from apps.accounts.services import generate_next_employee_code

@pytest.mark.django_db(transaction=True)
def test_generate_next_employee_code_sequential():
    code1 = generate_next_employee_code()
    code2 = generate_next_employee_code()
    code3 = generate_next_employee_code()

    assert code1 == "SYS-0001"
    assert code2 == "SYS-0002"
    assert code3 == "SYS-0003"

@pytest.mark.django_db(transaction=True)
def test_generate_next_employee_code_concurrency():
    connection.close()

    def generate():
        connection.close()
        code = generate_next_employee_code()
        connection.close()
        return code

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(generate) for _ in range(20)]
        codes = [f.result() for f in futures]

    assert len(codes) == 20
    assert len(set(codes)) == 20
    numbers = sorted(int(code.replace("SYS-", "")) for code in codes)
    assert numbers == list(range(1, 21))
