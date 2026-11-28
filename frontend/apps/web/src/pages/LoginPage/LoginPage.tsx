import { useState, useEffect, useRef, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
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
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"general" | "lockout" | "revoked" | null>(null);

  const digit0Ref = useRef<HTMLInputElement>(null);
  const digit1Ref = useRef<HTMLInputElement>(null);
  const digit2Ref = useRef<HTMLInputElement>(null);
  const digit3Ref = useRef<HTMLInputElement>(null);
  const digitRefs = [digit0Ref, digit1Ref, digit2Ref, digit3Ref];

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  useEffect(() => {
    const prevTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prevTheme) {
        document.documentElement.setAttribute("data-theme", prevTheme);
      }
    };
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }
    if (cleaned.length === 1) {
      const next = [...digits];
      next[index] = cleaned;
      setDigits(next);
      if (index < 3) {
        digitRefs[index + 1].current?.focus();
      }
    } else {
      const chars = cleaned.slice(0, 4).split("");
      const next = [...digits];
      for (let i = 0; i < chars.length && index + i < 4; i++) {
        next[index + i] = chars[i];
      }
      setDigits(next);
      const nextIdx = Math.min(index + chars.length, 3);
      digitRefs[nextIdx].current?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        digitRefs[index - 1].current?.focus();
      } else {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const chars = pasted.split("");
    const next = ["", "", "", ""];
    chars.forEach((c, i) => {
      if (i < 4) next[i] = c;
    });
    setDigits(next);
    const focusIdx = Math.min(chars.length - 1, 3);
    digitRefs[Math.max(0, focusIdx)].current?.focus();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = digits.join("").trim();
    if (code.length !== 4 || !password) {
      setErrorType("general");
      setErrorMessage("Please enter both your 4-digit Employee ID and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      if (honeypot) {
        await login(code, password, honeypot);
      } else {
        await login(code, password);
      }
      navigate(fromPath, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 429 || err.code === "account_locked") {
          setErrorType("lockout");
          setErrorMessage(
            err.message ||
              "Too many failed login attempts. Account is temporarily locked."
          );
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
    <div className={styles.container} data-theme="light" data-testid="login-container">
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
              <div className={styles.trapField} aria-hidden="true">
                <input
                  type="text"
                  name="company_tax_id"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label id="employee-id-label" className={styles.label}>
                  Employee ID (4-digit numeric code)
                </label>
                <div
                  className={styles.otpContainer}
                  onPaste={handlePaste}
                  data-testid="employee-code-container"
                  role="group"
                  aria-labelledby="employee-id-label"
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={digitRefs[idx]}
                      id={idx === 0 ? "identifier" : undefined}
                      name={`digit${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className={styles.otpBox}
                      data-testid={`employee-code-digit-${idx}`}
                      aria-label={`Digit ${idx + 1}`}
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                  ))}
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

              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                rightIcon={<IconArrowRight size={16} />}
                className={styles.submitBtn}
                data-testid="login-submit-btn"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
