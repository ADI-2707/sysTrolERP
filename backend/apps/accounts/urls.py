from django.urls import path
from apps.accounts.views import CsrfCookieView, LoginView, LogoutView, MeView

urlpatterns = [
    path("csrf", CsrfCookieView.as_view(), name="auth_csrf"),
    path("login", LoginView.as_view(), name="auth_login"),
    path("logout", LogoutView.as_view(), name="auth_logout"),
    path("me", MeView.as_view(), name="auth_me"),
]
