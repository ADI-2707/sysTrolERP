import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  Topbar,
  Breadcrumbs,
  type BreadcrumbItem,
  ThemeToggle,
  ErrorBoundary,
  DropdownMenu,
  Avatar,
  Badge,
  IconDashboard,
  IconBriefcase,
  IconUsers,
  IconShieldAlert,
  IconSettings,
  IconLogout,
  type SidebarItem,
  type DropdownMenuItem,
} from "@systrol/ui";
import { useAuth } from "../../auth";
import styles from "./AppShell.module.css";

const STORAGE_KEY = "systrol_sidebar_collapsed";

export interface AppShellProps {
  breadcrumbs?: React.ReactNode;
}

export function AppShell({ breadcrumbs }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const { user, isSuperAdmin, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {}
  }, [collapsed]);

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  const segments = location.pathname.split("/").filter(Boolean);
  const defaultBreadcrumbs = (() => {
    if (segments.length === 0 || (segments.length === 1 && segments[0] === "timesheets")) {
      return (
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Timesheets", isCurrent: true },
          ]}
        />
      );
    }

    const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];
    let currentPath = "";

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      currentPath += `/${seg}`;
      const isCurrent = i === segments.length - 1;

      let label = seg.charAt(0).toUpperCase() + seg.slice(1);
      if (seg === "audit") label = "Audit Logs";
      if (seg === "projects") label = "Projects";
      if (seg === "employees") label = "Employees";
      if (seg === "timesheets") label = "Timesheets";
      if (seg === "change-password") label = "Change Password";
      if (seg === "settings") label = "Settings";

      items.push({
        label,
        isCurrent,
        ...(isCurrent ? {} : { href: currentPath }),
      });
    }

    return <Breadcrumbs items={items} />;
  })();

  const navItems: SidebarItem[] = [];

  navItems.push({
    key: "dashboard",
    label: "Dashboard",
    icon: <IconDashboard size={17} />,
    isActive: location.pathname === "/" || location.pathname.startsWith("/timesheets"),
    onClick: () => navigate("/timesheets"),
  });

  navItems.push({
    key: "projects",
    label: "Project Management",
    icon: <IconBriefcase size={17} />,
    isActive: location.pathname.startsWith("/projects"),
    onClick: () => navigate("/projects"),
  });

  if (isAdmin || isSuperAdmin) {
    navItems.push({
      key: "employees",
      label: "Employee Management",
      icon: <IconUsers size={17} />,
      isActive: location.pathname.startsWith("/employees"),
      onClick: () => navigate("/employees"),
    });

    navItems.push({
      key: "audit",
      label: "Audit Trail",
      icon: <IconShieldAlert size={17} />,
      isActive: location.pathname.startsWith("/audit"),
      onClick: () => navigate("/audit"),
    });
  }

  navItems.push({
    key: "settings",
    label: "Settings",
    icon: <IconSettings size={17} />,
    isActive: location.pathname.startsWith("/settings"),
    onClick: () => navigate("/settings"),
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    navigate("/login");
  };

  const userMenuItems: DropdownMenuItem[] = [];

  userMenuItems.push({
    key: "settings",
    label: "Settings",
    icon: <IconSettings size={16} />,
    onClick: () => navigate("/settings"),
  });

  if (!isSuperAdmin) {
    userMenuItems.push({
      key: "change-password",
      label: "Change Password",
      icon: <IconSettings size={16} />,
      onClick: () => navigate("/change-password"),
    });
  }

  userMenuItems.push({
    key: "logout",
    label: "Sign Out",
    icon: <IconLogout size={16} />,
    danger: true,
    onClick: handleLogout,
  });

  const roleBadgeVariant = isSuperAdmin ? "brand" : isAdmin ? "info" : "default";

  const userMenuTrigger = (
    <button type="button" className={styles.userMenuTrigger} aria-label="User Account Menu">
      <Avatar name={user?.full_name || "User"} size="sm" />
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user?.full_name || "Signed In"}</span>
        <span className={styles.userRole}>
          <Badge variant={roleBadgeVariant}>
            {user?.role || "USER"}
          </Badge>
        </span>
      </div>
    </button>
  );

  return (
    <div className={styles.shell} data-testid="app-shell">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onLogout={handleLogout}
        version="v2.11.0"
        items={navItems}
      />

      <div className={styles.mainWrapper}>
        <Topbar
          breadcrumbs={breadcrumbs || defaultBreadcrumbs}
          actions={
            <div className={styles.actionsGroup}>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                className={styles.topbarLogoutBtn}
                title="Sign Out"
                aria-label="Quick Sign Out"
              >
                <IconLogout size={18} />
              </button>
            </div>
          }
          userMenu={<DropdownMenu trigger={userMenuTrigger} items={userMenuItems} />}
        />

        <main className={styles.contentArea}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
