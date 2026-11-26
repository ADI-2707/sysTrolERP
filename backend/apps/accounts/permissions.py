from rest_framework.permissions import BasePermission


class IsAuthenticatedPrincipal(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)


class IsAdminOrSuper(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        role = getattr(request.user, "role", "")
        return role in ("ADMIN", "SUPER")


class IsSuper(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return getattr(request.user, "role", "") == "SUPER"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return getattr(request.user, "role", "") == "ADMIN"
