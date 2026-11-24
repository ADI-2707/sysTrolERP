import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, ToastProvider } from "@systrol/ui";
import { queryClient } from "./query/queryClient";
import { AuthProvider } from "./auth";
import { RequireAnonymous, RequireAuth, RequireRole } from "./routes";
import { LoginPage } from "./pages/LoginPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { TimesheetsDashboardPage } from "./pages/TimesheetsDashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AppShell, SessionExpiryWatcher } from "./layout";
import { ComponentGallery } from "./gallery/ComponentGallery";

export function AppContent() {
  return (
    <>
      <SessionExpiryWatcher />
      <Routes>
        <Route element={<RequireAnonymous />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/timesheets" replace />} />
            <Route path="/timesheets" element={<TimesheetsDashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route element={<RequireRole allowedRoles={["ADMIN", "SUPER"]} />}>
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/audit" element={<LogsPage />} />
              <Route path="/logs" element={<Navigate to="/audit" replace />} />
            </Route>
            <Route path="/gallery" element={<ComponentGallery />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
