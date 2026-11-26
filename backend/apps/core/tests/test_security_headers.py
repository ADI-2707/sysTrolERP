import pytest
from django.test import Client


@pytest.mark.django_db
def test_security_headers_present_on_api_responses():
    client = Client()
    response = client.get("/api/health/")
    assert response.status_code == 200
    assert "Content-Security-Policy" in response.headers
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]
    assert "Permissions-Policy" in response.headers
    assert "camera=()" in response.headers["Permissions-Policy"]
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_prod_settings_security_configuration():
    from config.settings import prod

    assert prod.DEBUG is False
    assert prod.SECURE_BROWSER_XSS_FILTER is True
    assert prod.SECURE_CONTENT_TYPE_NOSNIFF is True
    assert prod.X_FRAME_OPTIONS == "DENY"
    assert prod.SECURE_HSTS_SECONDS >= 31536000
    assert prod.SECURE_HSTS_INCLUDE_SUBDOMAINS is True
    assert prod.SECURE_HSTS_PRELOAD is True
    assert prod.SECURE_REFERRER_POLICY == "strict-origin-when-cross-origin"
    assert prod.SESSION_COOKIE_SECURE is True
    assert prod.SESSION_COOKIE_HTTPONLY is True
    assert prod.SESSION_COOKIE_SAMESITE == "Lax"
    assert prod.CSRF_COOKIE_SECURE is True
    assert prod.CSRF_COOKIE_SAMESITE == "Lax"
    assert prod.SECURE_PROXY_SSL_HEADER == ("HTTP_X_FORWARDED_PROTO", "https")
