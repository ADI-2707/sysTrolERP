import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  Topbar,
  ThemeToggle,
  ErrorBoundary,
  DropdownMenu,
  Avatar,
  Badge,
  IconCalendar,
  IconProjects,
  IconUsers,
  IconLogs,
  IconSettings,
  IconLogout,
  type SidebarItem,
  type DropdownMenuItem,
} from "@systrol/ui";
import { useAuth } from "../auth";
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

  const navItems: SidebarItem[] = [];

  navItems.push({
    key: "timesheets",
    label: "Timesheets",
    icon: <IconCalendar size={18} />,
    isActive: location.pathname === "/" || location.pathname.startsWith("/timesheets"),
    onClick: () => navigate("/timesheets"),
  });

  navItems.push({
    key: "projects",
    label: "Projects",
    icon: <IconProjects size={18} />,
    isActive: location.pathname.startsWith("/projects"),
    onClick: () => navigate("/projects"),
  });

  if (isAdmin || isSuperAdmin) {
    navItems.push({
      key: "employees",
      label: isSuperAdmin ? "Admins & Staff" : "Employees",
      icon: <IconUsers size={18} />,
      isActive: location.pathname.startsWith("/employees"),
      onClick: () => navigate("/employees"),
    });

    navItems.push({
      key: "audit",
      label: isSuperAdmin ? "System Telemetry" : "Audit Logs",
      icon: <IconLogs size={18} />,
      isActive: location.pathname.startsWith("/audit"),
      onClick: () => navigate("/audit"),
    });
  }

  const userMenuItems: DropdownMenuItem[] = [];

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
    onClick: async () => {
      try {
        await logout();
      } catch {}
      navigate("/login");
    },
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
        logo={
          <Link to="/" className={styles.brandLogo}>
            <img src="/logo-mark.png" alt="sysTrol" className={styles.logoImg} />
            <span>sysTrol ERP</span>
          </Link>
        }
        collapsedLogo={
          <Link to="/" className={styles.brandLogoCollapsed}>
            <img src="/logo-mark.png" alt="sysTrol" className={styles.logoImg} />
          </Link>
        }
        items={navItems}
      />

      <div className={styles.mainWrapper}>
        <Topbar
          breadcrumbs={breadcrumbs}
          actions={
            <div className={styles.actionsGroup}>
              <ThemeToggle />
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
