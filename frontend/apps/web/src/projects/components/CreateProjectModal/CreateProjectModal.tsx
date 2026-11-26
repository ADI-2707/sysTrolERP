import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button, Spinner } from "@systrol/ui";
import {
  fetchActiveEmployees,
  fetchEmployeeLookup,
  type EmployeeSummary,
  type CreateProjectPayload,
} from "../../../api/projects";
import styles from "./CreateProjectModal.module.css";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void> | void;
  isLoading?: boolean;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async (query = "") => {
    setIsLoadingEmployees(true);
    try {
      if (typeof fetchEmployeeLookup === "function") {
        const res = await fetchEmployeeLookup(query);
        if (Array.isArray(res)) {
          setEmployees(res);
          return;
        }
      }
      const fallback = await fetchActiveEmployees();
      setEmployees(fallback.results || []);
    } catch {
      try {
        const fallback = await fetchActiveEmployees();
        setEmployees(fallback.results || []);
      } catch {
      }
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName("");
      setClientName("");
      setDescription("");
      setSelectedMemberIds([]);
      setEmployeeSearch("");
      setError(null);
      loadEmployees();
    }
  }, [isOpen]);

  const handleToggleMember = (id: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Project name is required.");
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name: trimmedName,
        client_name: clientName.trim(),
        description: description.trim(),
        member_ids: selectedMemberIds,
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
          <label htmlFor="project-name" className={styles.label}>
            Project Name (Required)
          </label>
          <input
            id="project-name"
            type="text"
            className={styles.input}
            placeholder="e.g. 500kW Gas Turbine Upgrade"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
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

        <div className={styles.fieldGroup}>
          <span className={styles.label}>Initial Assigned Members</span>
          <input
            type="text"
            className={styles.input}
            placeholder="Search employees by name or code..."
            value={employeeSearch}
            onChange={(e) => {
              const q = e.target.value;
              setEmployeeSearch(q);
              loadEmployees(q);
            }}
            data-testid="create-project-employee-search"
            style={{ marginBottom: "var(--space-2)" }}
          />
          <div className={styles.membersBox} data-testid="initial-members-list">
            {isLoadingEmployees ? (
              <div className={styles.emptyMembers}>
                <Spinner size="sm" /> Loading employees...
              </div>
            ) : employees.length === 0 ? (
              <div className={styles.emptyMembers}>No active employees found</div>
            ) : (
              employees.map((emp) => {
                const isSelected = selectedMemberIds.includes(emp.id);
                return (
                  <label key={emp.id} className={styles.memberOption}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleMember(emp.id)}
                      className={styles.memberCheckbox}
                      data-testid={`member-checkbox-${emp.id}`}
                    />
                    <div className={styles.memberInfo}>
                      <span className={styles.memberCode}>{emp.employee_code}</span>
                      <span className={styles.memberName}>{emp.full_name}</span>
                      {emp.designation && (
                        <span className={styles.memberRole}>{emp.designation}</span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
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
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!name.trim() || isLoading}
            data-testid="submit-create-project-btn"
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
