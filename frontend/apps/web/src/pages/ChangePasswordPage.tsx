import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, FormField, PasswordInput } from "@systrol/ui";
import { useAuth } from "../auth";
import { apiClient, ApiClientError } from "../api";
import styles from "./ChangePasswordPage.module.css";

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { isSuperAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (isSuperAdmin) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Super Administrator Notice</h1>
          </div>
          <div className={styles.superAdminNotice}>
            Super Administrator credentials are configured via environment variables and cannot be modified through the web interface. Please use the administrative management command on the host.
          </div>
          <Link to="/">
            <Button variant="primary" className={styles.submitBtn}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!currentPassword) {
      setFieldErrors({ current_password: ["Current password is required."] });
      return;
    }

    if (!newPassword) {
      setFieldErrors({ new_password: ["New password is required."] });
      return;
    }

    if (newPassword.length < 10) {
      setFieldErrors({ new_password: ["Password must be at least 10 characters long."] });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirm_password: ["New passwords do not match."] });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post("/api/auth/password/change", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields && Object.keys(err.fields).length > 0) {
          setFieldErrors(err.fields);
        } else {
          setGeneralError(err.message || "Failed to update password.");
        }
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Set New Password</h1>
          <div className={styles.notice}>
            Security requirement: You must establish a personalized password before proceeding to your workspace.
          </div>
        </div>

        {generalError && (
          <div role="alert" className={styles.alertError}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <FormField
            id="current-password"
            label="Current Password"
            error={fieldErrors.current_password?.[0]}
            required
          >
            <PasswordInput
              id="current-password"
              name="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <FormField
            id="new-password"
            label="New Password"
            error={fieldErrors.new_password?.[0]}
            required
          >
            <PasswordInput
              id="new-password"
              name="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              required
            />
          </FormField>
          <div className={styles.requirements}>
            Must be at least 10 characters, not common, and not similar to your account details.
          </div>

          <FormField
            id="confirm-password"
            label="Confirm New Password"
            error={fieldErrors.confirm_password?.[0]}
            required
          >
            <PasswordInput
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              required
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className={styles.submitBtn}
          >
            Update Password &amp; Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
