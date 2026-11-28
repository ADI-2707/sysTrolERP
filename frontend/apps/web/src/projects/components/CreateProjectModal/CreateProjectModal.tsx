import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import type { CreateProjectPayload } from "../../../api/projects";
import styles from "./CreateProjectModal.module.css";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void> | void;
  isLoading?: boolean;
}

interface FieldErrors {
  code?: string;
  name?: string;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateProjectModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setName("");
      setClientName("");
      setDescription("");
      setError(null);
      setFieldErrors({});
      setShake(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    const errors: FieldErrors = {};

    if (!trimmedCode) {
      errors.code = "Please enter Project ID / Code.";
    } else if (!/^[a-zA-Z0-9]+$/.test(trimmedCode)) {
      errors.code = "Project ID / Code must be alphanumeric with no spaces or special characters.";
    } else if (trimmedCode.length > 15) {
      errors.code = "Project ID / Code cannot exceed 15 characters.";
    }

    if (!trimmedName) {
      errors.name = "Please enter project name.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    try {
      setError(null);
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        client_name: clientName.trim(),
        description: description.trim(),
        member_ids: [],
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create project.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project"
      description="Initialize a new client engineering project with standard 14 lifecycle steps."
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form} data-testid="create-project-form">
        {error && (
          <div role="alert" className={styles.errorAlert} data-testid="create-project-error">
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="project-code" className={styles.label}>
              Project ID / Code <span className={styles.required}>*</span>
            </label>
            {fieldErrors.code && (
              <span className={styles.fieldErrorText} data-testid="error-code" role="alert">
                {fieldErrors.code}
              </span>
            )}
          </div>
          <input
            id="project-code"
            type="text"
            className={`${styles.input} ${fieldErrors.code ? styles.inputError : ""}`}
            placeholder="e.g. PRJ001 or GTU2026"
            maxLength={15}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (fieldErrors.code) {
                setFieldErrors((prev) => ({ ...prev, code: undefined }));
              }
            }}
            data-testid="create-project-code-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="project-name" className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            {fieldErrors.name && (
              <span className={styles.fieldErrorText} data-testid="error-name" role="alert">
                {fieldErrors.name}
              </span>
            )}
          </div>
          <input
            id="project-name"
            type="text"
            className={`${styles.input} ${fieldErrors.name ? styles.inputError : ""}`}
            placeholder="e.g. 500kW Gas Turbine Upgrade"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            data-testid="create-project-name-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="client-name" className={styles.label}>
            Client Name
          </label>
          <input
            id="client-name"
            type="text"
            className={styles.input}
            placeholder="e.g. Apex Renewables"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            data-testid="create-project-client-input"
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="project-description" className={styles.label}>
            Description
          </label>
          <textarea
            id="project-description"
            className={styles.textarea}
            placeholder="Project scope and engineering objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="create-project-description-input"
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <div className={shake ? styles.shakeBtn : undefined}>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              data-testid="submit-create-project-btn"
            >
              Create Project
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
