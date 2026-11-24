import { useState, useMemo, type FormEvent } from "react";
import { Button, FormField, PasswordInput, useToast } from "@systrol/ui";
import { useAuth } from "../../../auth";
import { apiClient, ApiClientError } from "../../../api";
import styles from "./ChangePasswordForm.module.css";

export interface ChangePasswordFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
}

export function ChangePasswordForm({ onSuccess, showTitle = true }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { refreshUser } = useAuth();
  const { addToast } = useToast();

  const rules = useMemo(() => {
    return {
      minLength: newPassword.length >= 10,
      mixedCase: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      specialChar: /[^A-Za-z0-9]/.test(newPassword),
      match: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "None", color: "transparent" };
    let s = 0;
    if (rules.minLength) s += 1;
    if (rules.mixedCase) s += 1;
    if (rules.number) s += 1;
    if (rules.specialChar) s += 1;

    switch (s) {
      case 1:
        return { score: 1, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 2, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 3, label: "Good", color: "#3b82f6" };
      case 4:
        return { score: 4, label: "Strong", color: "#16a34a" };
      default:
        return { score: 0, label: "Weak", color: "#ef4444" };
    }
  }, [newPassword, rules]);

  const allRulesSatisfied =
    rules.minLength &&
    rules.mixedCase &&
    rules.number &&
    rules.specialChar &&
    rules.match;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!currentPassword) {
      setFieldErrors({ current_password: ["Current password is required."] });
      return;
    }

    if (!allRulesSatisfied) {
      setGeneralError("Please satisfy all password complexity rules before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.post("/api/auth/password/change", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      addToast({
        type: "success",
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      await refreshUser();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.fields && Object.keys(err.fields).length > 0) {
          setFieldErrors(err.fields);
        } else {
          setGeneralError(err.message || "Failed to update password.");
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer} data-testid="change-password-form">
      {showTitle && (
        <>
          <h2 className={styles.title}>Change Password</h2>
          <p className={styles.description}>
            Update your account password with a strong combination of letters, digits, and symbols.
          </p>
        </>
      )}

      {generalError && (
        <div role="alert" className={styles.errorAlert} data-testid="change-password-error">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
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
            data-testid="input-current-password"
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
            data-testid="input-new-password"
            required
          />
        </FormField>

        {newPassword && (
          <div className={styles.strengthContainer} data-testid="password-strength-meter">
            <div className={styles.strengthHeader}>
              <span>Strength:</span>
              <span
                className={styles.strengthLabel}
                style={{ color: strength.color }}
                data-testid="password-strength-label"
              >
                {strength.label}
              </span>
            </div>
            <div className={styles.strengthTrack} data-testid="password-strength-track">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={styles.strengthSegment}
                  style={{
                    backgroundColor:
                      strength.score >= step ? strength.color : "transparent",
                  }}
                  data-testid={`strength-step-${step}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.rulesList} data-testid="password-rules-list">
          <div
            className={[styles.ruleItem, rules.minLength && styles.rulePassed].filter(Boolean).join(" ")}
            data-testid="rule-min-length"
          >
            <span className={styles.ruleIcon}>{rules.minLength ? "✓" : "○"}</span>
            <span>At least 10 characters</span>
          </div>
          <div
            className={[styles.ruleItem, rules.mixedCase && styles.rulePassed].filter(Boolean).join(" ")}
            data-testid="rule-mixed-case"
          >
            <span className={styles.ruleIcon}>{rules.mixedCase ? "✓" : "○"}</span>
            <span>Uppercase and lowercase letters</span>
          </div>
          <div
            className={[styles.ruleItem, rules.number && styles.rulePassed].filter(Boolean).join(" ")}
            data-testid="rule-number"
          >
            <span className={styles.ruleIcon}>{rules.number ? "✓" : "○"}</span>
            <span>At least one number</span>
          </div>
          <div
            className={[styles.ruleItem, rules.specialChar && styles.rulePassed].filter(Boolean).join(" ")}
            data-testid="rule-special-char"
          >
            <span className={styles.ruleIcon}>{rules.specialChar ? "✓" : "○"}</span>
            <span>At least one special character</span>
          </div>
          <div
            className={[styles.ruleItem, rules.match && styles.rulePassed].filter(Boolean).join(" ")}
            data-testid="rule-match"
          >
            <span className={styles.ruleIcon}>{rules.match ? "✓" : "○"}</span>
            <span>Passwords match</span>
          </div>
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
            data-testid="input-confirm-password"
            required
          />
        </FormField>

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting || !allRulesSatisfied}
          className={styles.submitBtn}
          data-testid="submit-change-password-btn"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
}
