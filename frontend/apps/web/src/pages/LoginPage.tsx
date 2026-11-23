import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, FormField, Input, PasswordInput, IconCheck } from "@systrol/ui";
import { useAuth } from "../auth";
import { ApiClientError } from "../api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"general" | "lockout" | "revoked" | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorType("general");
      setErrorMessage("Please enter both your identifier and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      await login(identifier.trim(), password);
      navigate(fromPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 429 || err.code === "account_locked") {
          setErrorType("lockout");
          setErrorMessage("Too many failed login attempts. Account is temporarily locked for 15 minutes.");
        } else if (
          err.message.toLowerCase().includes("revoked") ||
          err.message.toLowerCase().includes("deactivated") ||
          err.code === "account_revoked"
        ) {
          setErrorType("revoked");
          setErrorMessage("Account access has been deactivated or revoked. Please contact your system administrator.");
        } else {
          setErrorType("general");
          setErrorMessage(err.message || "Invalid credentials. Please verify your details.");
        }
      } else {
        setErrorType("general");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <aside className={styles.brandPanel} aria-label="Brand Overview">
        <div className={styles.brandHeader}>
          <img src="/logo-mark.png" alt="sysTrol logo" className={styles.logoImage} />
          <h1 className={styles.brandTitle}>sysTrol ERP</h1>
        </div>

        <div className={styles.brandBody}>
          <div className={styles.brandHeroText}>Precision Operations & Project Execution</div>
          <p className={styles.brandDescription}>
            Unified enterprise project lifecycle management, automated weekly timesheets, and authoritative auditing for mission-critical engineering.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <IconCheck size={18} />
              <span>14-Step Ordered Project Progression & Milestone Tracking</span>
            </li>
            <li className={styles.featureItem}>
              <IconCheck size={18} />
              <span>Strict Company Timezone Weekly Timesheet Authorization</span>
            </li>
            <li className={styles.featureItem}>
              <IconCheck size={18} />
              <span>Tamper-Proof Append-Only Audit & Telemetry Logging</span>
            </li>
          </ul>
        </div>

        <div className={styles.brandFooter}>
          &copy; {new Date().getFullYear()} sysTrol Engineering &amp; Automation. All rights reserved.
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign In</h2>
            <p className={styles.formSubtitle}>Enter your employee code or email address to continue</p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className={[
                styles.alertBanner,
                errorType === "lockout" || errorType === "revoked"
                  ? styles.alertDanger
                  : styles.alertWarning,
              ].join(" ")}
              data-testid={`banner-${errorType}`}
            >
              <strong>
                {errorType === "lockout" && "Account Locked: "}
                {errorType === "revoked" && "Access Revoked: "}
              </strong>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <FormField id="identifier" label="Employee Code or Email" required>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. SYS-0001 or name@company.com"
                disabled={isSubmitting}
                required
              />
            </FormField>

            <FormField id="password" label="Password" required>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Sign In
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
