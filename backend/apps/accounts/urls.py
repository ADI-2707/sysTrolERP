from django.urls import path
from apps.accounts.password_views import PasswordChangeView
from apps.accounts.views import CsrfCookieView, LoginView, LogoutView, MeView

urlpatterns = [
    path("csrf/", CsrfCookieView.as_view(), name="auth_csrf"),
    path("csrf", CsrfCookieView.as_view()),
    path("login/", LoginView.as_view(), name="auth_login"),
    path("login", LoginView.as_view()),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
    path("logout", LogoutView.as_view()),
    path("me/", MeView.as_view(), name="auth_me"),
    path("me", MeView.as_view()),
    path("password/change/", PasswordChangeView.as_view(), name="auth_password_change"),
    path("password/change", PasswordChangeView.as_view()),
]
