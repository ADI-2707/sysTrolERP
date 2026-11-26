import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, ToastProvider, UiLockProvider } from "@systrol/ui";
import { queryClient } from "./query/queryClient";
import { AuthProvider } from "./auth";
import { RequireAnonymous, RequireAuth, RequireRole } from "./routes";
import {
  LoginPage,
  ChangePasswordPage,
  TimesheetsDashboardPage,
  ProjectsPage,
  ProjectDetailPage,
  EmployeesPage,
  LogsPage,
  SettingsPage,
  NotFoundPage,
} from "./pages";
import { AppShell, SessionExpiryWatcher } from "./layout";
import { ComponentGallery } from "./gallery";

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
          <UiLockProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </AuthProvider>
          </UiLockProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
