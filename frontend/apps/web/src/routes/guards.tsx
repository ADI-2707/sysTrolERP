import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@systrol/ui";
import { useAuth, type UserRole } from "../auth";
import { ForbiddenPage } from "../pages/ForbiddenPage";

export function RequireAuth() {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

export interface RequireRoleProps {
  allowedRoles: UserRole[];
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}

export function RequireAnonymous() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        data-testid="auth-loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";
    return <Navigate to={fromPath} replace />;
  }

  return <Outlet />;
}
