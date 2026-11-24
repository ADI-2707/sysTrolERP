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

export function CreateEmployeeModal({
  isOpen,
  onClose,
  onSubmit,
  isSuperAdmin,
}: CreateEmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EmployeeRole>("EMPLOYEE");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName("");
      setEmail("");
      setRole("EMPLOYEE");
      setDesignation("");
      setDepartment("");
      setPhone("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    if (!trimmedEmail) {
      setError("Email address is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        full_name: trimmedName,
        email: trimmedEmail,
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
          <label htmlFor="create-emp-name" className={styles.label}>
            Full Name <span className={styles.required}>*</span>
          </label>
          <input
            id="create-emp-name"
            type="text"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            data-testid="create-emp-name-input"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="create-emp-email" className={styles.label}>
            Email Address <span className={styles.required}>*</span>
          </label>
          <input
            id="create-emp-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rahul@example.com"
            data-testid="create-emp-email-input"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="create-emp-role" className={styles.label}>
            Role <span className={styles.required}>*</span>
          </label>
          <select
            id="create-emp-role"
            className={styles.select}
            value={role}
            onChange={(e) => setRole(e.target.value as EmployeeRole)}
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
            data-testid="create-emp-submit-btn"
          >
            Create Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
