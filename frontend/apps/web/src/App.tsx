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
            <Route element={<RequireRole allowedRoles={["ADMIN", "SUPER"]} />}>
              <Route path="/employees" element={<div data-testid="employees-view">Employees View</div>} />
              <Route path="/audit" element={<div data-testid="audit-view">Audit Logs View</div>} />
            </Route>
            <Route path="/gallery" element={<ComponentGallery />} />
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
