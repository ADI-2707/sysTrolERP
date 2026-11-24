import { useState, useMemo, useRef, useEffect, type FormEvent } from "react";
import { Modal, Button } from "@systrol/ui";
import type { ProjectSummary } from "../../types";
import styles from "./AddProjectRowModal.module.css";

export interface AddProjectRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRow: (projectId: number, description: string) => Promise<void> | void;
  assignedProjects: ProjectSummary[];
  existingProjectIds: number[];
  isLoading?: boolean;
}

export function AddProjectRowModal({
  isOpen,
  onClose,
  onAddRow,
  assignedProjects,
  existingProjectIds,
  isLoading = false,
}: AddProjectRowModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedProjectId(null);
      setDescription("");
      setIsDropdownOpen(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return assignedProjects;
    return assignedProjects.filter(
      (p) =>
        p.code.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term)
    );
  }, [assignedProjects, searchTerm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project");
      return;
    }
    if (existingProjectIds.includes(selectedProjectId)) {
      setError("This project is already added to the timesheet");
      return;
    }

    try {
      setError(null);
      await onAddRow(selectedProjectId, description.trim());
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add project row");
      }
    }
  };

  const handleSelectProject = (project: ProjectSummary) => {
    if (existingProjectIds.includes(project.id)) {
      return;
    }
    setSelectedProjectId(project.id);
    setSearchTerm(`${project.code} - ${project.name}`);
    setIsDropdownOpen(false);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Project Row"
      description="Select an assigned project to log hours for this week."
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div role="alert" className={styles.errorAlert}>
            {error}
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="project-combobox" className={styles.label}>
            Project
          </label>
          <div ref={containerRef} className={styles.comboboxWrapper}>
            <input
              id="project-combobox"
              type="text"
              role="combobox"
              aria-expanded={isDropdownOpen}
              aria-autocomplete="list"
              className={styles.searchInput}
              placeholder="Search assigned projects..."
              value={searchTerm}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProjectId(null);
                setIsDropdownOpen(true);
                if (error) setError(null);
              }}
              data-testid="project-combobox-input"
            />

            {isDropdownOpen && (
              <ul
                role="listbox"
                className={styles.dropdownList}
                data-testid="project-combobox-list"
              >
                {filteredProjects.length === 0 ? (
                  <li className={styles.emptyMessage}>No matching assigned projects</li>
                ) : (
                  filteredProjects.map((project) => {
                    const isDuplicate = existingProjectIds.includes(project.id);
                    const isSelected = project.id === selectedProjectId;

                    return (
                      <li
                        key={project.id}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isDuplicate}
                        className={[
                          styles.optionItem,
                          isSelected && styles.optionSelected,
                          isDuplicate && styles.optionDisabled,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => handleSelectProject(project)}
                        data-testid={`project-option-${project.id}`}
                      >
                        <div className={styles.optionInfo}>
                          <span className={styles.projectCode}>{project.code}</span>
                          <span className={styles.projectName}>{project.name}</span>
                        </div>
                        {isDuplicate && (
                          <span className={styles.duplicateBadge} data-testid="duplicate-badge">
                            Already added
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="row-description" className={styles.label}>
            Description (Optional)
          </label>
          <input
            id="row-description"
            type="text"
            className={styles.descriptionInput}
            placeholder="e.g. PLC programming and diagnostics"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            data-testid="row-description-input"
          />
        </div>

        <div className={styles.footerActions}>
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
            disabled={!selectedProjectId || existingProjectIds.includes(selectedProjectId)}
            data-testid="add-row-submit-button"
          >
            Add Row
          </Button>
        </div>
      </form>
    </Modal>
  );
}
