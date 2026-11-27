import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IconMail,
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowRight,
  IconWarning,
  IconError,
  UiLock,
} from "@systrol/ui";
import { useAuth } from "../../auth";
import { ApiClientError } from "../../api";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <UiLock active={isSubmitting} message="Signing in..." />
      <h1 className={styles.srOnly}>sysTrol ERP</h1>

      <div className={styles.lockup}>
        <div className={styles.leftWindow}>
          <img
            src="/logo-full.png"
            alt="sysTROL Engineering Redefined"
            className={styles.logoFull}
          />
        </div>

        <div className={styles.rightWindow}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.formTitle}>Sign In</h2>
              <p className={styles.formSubtitle}>Enter your credentials to access the workspace</p>
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
                {errorType === "lockout" || errorType === "revoked" ? (
                  <IconError size={16} />
                ) : (
                  <IconWarning size={16} />
                )}
                <span>
                  <strong>
                    {errorType === "lockout" && "Account Locked: "}
                    {errorType === "revoked" && "Access Revoked: "}
                  </strong>
                  {errorMessage}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.fieldGroup}>
                <label htmlFor="identifier" className={styles.label}>
                  Email<span className={styles.srOnly}> (Employee Code or Email)</span>
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <IconMail size={16} />
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="operator@systrol.com"
                    disabled={isSubmitting}
                    required
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon} aria-hidden="true">
                    <IconLock size={16} />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    required
                    className={[styles.input, styles.inputPassword].join(" ")}
                  />
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className={styles.eyeToggleBtn}
                  >
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                <span>{isSubmitting ? "Signing In..." : "Sign In"}</span>
                <IconArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
