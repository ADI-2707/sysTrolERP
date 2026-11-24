import argparse
import json
import sys
import urllib.error
import urllib.request

def check_endpoint(
    url: str,
    expected_status: int = 200,
    method: str = "GET",
    headers: dict | None = None,
    data: bytes | None = None,
) -> tuple[int, dict, str]:
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8")
            headers_dict = {k.lower(): v for k, v in resp.headers.items()}
            return resp.status, headers_dict, body
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        headers_dict = {k.lower(): v for k, v in e.headers.items()}
        return e.code, headers_dict, body
    except urllib.error.URLError as e:
        return 0, {}, str(e)

def run_smoke_test(base_url: str = "http://localhost:8000", return_errors: bool = False):
    errors = []

    health_url = f"{base_url.rstrip('/')}/api/health/"
    status, headers, body = check_endpoint(health_url)
    if status != 200:
        errors.append(f"Health check failed: expected 200, got {status} ({body})")
    else:
        try:
            data = json.loads(body)
            if data.get("status") not in ("ok", "healthy"):
                errors.append(f"Health check status not healthy: {data}")
        except Exception as e:
            errors.append(f"Invalid JSON from health endpoint: {e}")

    for sec_header in ["x-content-type-options", "x-frame-options", "referrer-policy"]:
        if sec_header not in headers:
            errors.append(f"Missing security header: {sec_header}")

    csrf_url = f"{base_url.rstrip('/')}/api/auth/csrf"
    status, _, body = check_endpoint(csrf_url)
    if status != 200:
        errors.append(f"CSRF check failed: expected 200, got {status}")

    login_url = f"{base_url.rstrip('/')}/api/auth/login"
    payload = json.dumps({"username": "nonexistent", "password": "badpassword123"}).encode("utf-8")
    status, _, body = check_endpoint(
        login_url,
        method="POST",
        headers={"Content-Type": "application/json"},
        data=payload,
    )
    if status not in (400, 401, 403):
        errors.append(f"Login failure test: expected 400/401/403, got {status} ({body})")

    if return_errors:
        return (len(errors) == 0, errors)

    return len(errors) == 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="sysTrol ERP deployment smoke test")
    parser.add_argument("--base-url", default="http://localhost:8000")
    args = parser.parse_args()

    success, errors = run_smoke_test(args.base_url, return_errors=True)
    if not success:
        for err in errors:
            print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)
    print("Deployment smoke test passed successfully!")
    sys.exit(0)
