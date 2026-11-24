import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import type { EmployeeDetailData, UpdateEmployeePayload } from "../../types";
import styles from "./EditEmployeeModal.module.css";

export interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeDetailData | null;
  onSubmit: (id: number, payload: UpdateEmployeePayload) => Promise<void>;
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  onSubmit,
}: EditEmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employee) {
      setFullName(employee.full_name || "");
      setEmail(employee.email || "");
      setDesignation(employee.designation || "");
      setDepartment(employee.department || "");
      setPhone(employee.phone || "");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, employee]);

  if (!employee) return null;

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
      await onSubmit(employee.id, {
        full_name: trimmedName,
        email: trimmedEmail,
        designation: designation.trim() || "",
        department: department.trim() || "",
        phone: phone.trim() || "",
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update employee profile.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Profile: ${employee.employee_code}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form} data-testid="edit-employee-form">
        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="edit-employee-error">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="edit-emp-name" className={styles.label}>
            Full Name <span className={styles.required}>*</span>
          </label>
          <input
            id="edit-emp-name"
            type="text"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            data-testid="edit-emp-name-input"
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="edit-emp-email" className={styles.label}>
            Email Address <span className={styles.required}>*</span>
          </label>
          <input
            id="edit-emp-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="edit-emp-email-input"
            required
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="edit-emp-designation" className={styles.label}>
              Designation
            </label>
            <input
              id="edit-emp-designation"
              type="text"
              className={styles.input}
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              data-testid="edit-emp-designation-input"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="edit-emp-department" className={styles.label}>
              Department
            </label>
            <input
              id="edit-emp-department"
              type="text"
              className={styles.input}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              data-testid="edit-emp-department-input"
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="edit-emp-phone" className={styles.label}>
            Phone Number
          </label>
          <input
            id="edit-emp-phone"
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="edit-emp-phone-input"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="edit-emp-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            data-testid="edit-emp-submit-btn"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
