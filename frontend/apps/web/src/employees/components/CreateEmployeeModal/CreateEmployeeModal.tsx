import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import type { CreateEmployeePayload, EmployeeCreatedResponse, EmployeeRole } from "../../types";
import styles from "./CreateEmployeeModal.module.css";

export interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateEmployeePayload) => Promise<EmployeeCreatedResponse>;
  isSuperAdmin: boolean;
}

interface FieldErrors {
  fullName?: string;
  employeeCode?: string;
  role?: string;
}

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  isSuperAdmin,
}: CreateEmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("EMPLOYEE");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName("");
      setEmployeeCode("");
      setEmail("");
      setRole("EMPLOYEE");
      setDesignation("");
      setDepartment("");
      setPhone("");
      setError(null);
      setFieldErrors({});
      setShake(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedCode = employeeCode.trim();
    const trimmedEmail = email.trim();

    const errors: FieldErrors = {};

    if (!trimmedName) {
      errors.fullName = "Please enter employee's full name.";
    }

    if (!trimmedCode) {
      errors.employeeCode = "Please enter employee's 4-digit ID.";
    } else if (!/^\d{4}$/.test(trimmedCode)) {
      errors.employeeCode = "Employee ID must be a 4-digit numeric code (e.g. 0001).";
    } else if (trimmedCode === "9999") {
      errors.employeeCode = "Employee ID 9999 is reserved for Super Administrator.";
    }

    if (!role) {
      errors.role = "Please select a role.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        full_name: trimmedName,
        employee_code: trimmedCode,
        email: trimmedEmail || undefined,
        role,
        designation: designation.trim() || undefined,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create employee.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" size="md">
      <form onSubmit={handleSubmit} className={styles.form} data-testid="create-employee-form">
        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="create-employee-error">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="create-emp-name" className={styles.label}>
              Full Name <span className={styles.required}>*</span>
            </label>
            {fieldErrors.fullName && (
              <span className={styles.fieldErrorText} data-testid="error-name" role="alert">
                {fieldErrors.fullName}
              </span>
            )}
          </div>
          <input
            id="create-emp-name"
            type="text"
            className={`${styles.input} ${fieldErrors.fullName ? styles.inputError : ""}`}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) {
                setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
              }
            }}
            placeholder="e.g. Rahul Sharma"
            data-testid="create-emp-name-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="create-emp-code" className={styles.label}>
              Employee ID (4-digit numeric code) <span className={styles.required}>*</span>
            </label>
            {fieldErrors.employeeCode && (
              <span className={styles.fieldErrorText} data-testid="error-code" role="alert">
                {fieldErrors.employeeCode}
              </span>
            )}
          </div>
          <input
            id="create-emp-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            className={`${styles.input} ${fieldErrors.employeeCode ? styles.inputError : ""}`}
            value={employeeCode}
            onChange={(e) => {
              setEmployeeCode(e.target.value.replace(/\D/g, "").slice(0, 4));
              if (fieldErrors.employeeCode) {
                setFieldErrors((prev) => ({ ...prev, employeeCode: undefined }));
              }
            }}
            placeholder="e.g. 0001"
            data-testid="create-emp-code-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="create-emp-email" className={styles.label}>
            Email Address (Optional)
          </label>
          <input
            id="create-emp-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@example.com"
            data-testid="create-emp-email-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="create-emp-role" className={styles.label}>
              Role <span className={styles.required}>*</span>
            </label>
            {fieldErrors.role && (
              <span className={styles.fieldErrorText} data-testid="error-role" role="alert">
                {fieldErrors.role}
              </span>
            )}
          </div>
          <select
            id="create-emp-role"
            className={`${styles.select} ${fieldErrors.role ? styles.inputError : ""}`}
            value={role}
            onChange={(e) => {
              setRole(e.target.value as EmployeeRole);
              if (fieldErrors.role) {
                setFieldErrors((prev) => ({ ...prev, role: undefined }));
              }
            }}
            disabled={!isSuperAdmin}
            data-testid="create-emp-role-select"
          >
            <option value="EMPLOYEE">Employee</option>
            {isSuperAdmin && <option value="ADMIN">Administrator</option>}
          </select>
          {!isSuperAdmin && (
            <span className={styles.hint} data-testid="create-emp-role-hint">
              Only Super Admin can create Administrators.
            </span>
          )}
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="create-emp-designation" className={styles.label}>
              Designation
            </label>
            <input
              id="create-emp-designation"
              type="text"
              className={styles.input}
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Project Engineer"
              data-testid="create-emp-designation-input"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="create-emp-department" className={styles.label}>
              Department
            </label>
            <input
              id="create-emp-department"
              type="text"
              className={styles.input}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Mechanical"
              data-testid="create-emp-department-input"
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="create-emp-phone" className={styles.label}>
            Phone Number
          </label>
          <input
            id="create-emp-phone"
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98765 43210"
            data-testid="create-emp-phone-input"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="create-emp-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            className={shake ? styles.shakeBtn : ""}
            data-testid="create-emp-submit-btn"
          >
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
