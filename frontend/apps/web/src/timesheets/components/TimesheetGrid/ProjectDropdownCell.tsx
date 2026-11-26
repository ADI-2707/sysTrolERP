import { useState, useRef, useEffect, useMemo } from "react";
import type { AssignedProject } from "../../types";
import styles from "./ProjectDropdownCell.module.css";

export interface ProjectDropdownCellProps {
  project?: { id: number; code: string; name: string } | null;
  availableProjects: AssignedProject[];
  existingProjectIds: number[];
  onSelectProject: (projectId: number) => void;
  onDeleteRow?: () => void;
  canEdit: boolean;
  isEmptyRow?: boolean;
}

export function ProjectDropdownCell({
  project,
  availableProjects,
  existingProjectIds,
  onSelectProject,
  onDeleteRow,
  canEdit,
  isEmptyRow = false,
}: ProjectDropdownCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filter available projects (active and not already added to the week)
  const selectableProjects = useMemo(() => {
    return availableProjects.filter((p) => {
      if (existingProjectIds.includes(p.id) && p.id !== project?.id) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    });
  }, [availableProjects, existingProjectIds, project?.id, search]);

  const handleSelect = (projectId: number) => {
    onSelectProject(projectId);
    setIsOpen(false);
    setSearch("");
  };

  // If this is an existing row with a project assigned
  if (project) {
    return (
      <div className={styles.assignedContainer}>
        <div className={styles.projectInfo}>
          <span className={styles.projectCode} title={project.code}>
            {project.code}
          </span>
          <span className={styles.projectName} title={project.name}>
            {project.name}
          </span>
        </div>
        {canEdit && onDeleteRow && isEmptyRow && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onDeleteRow}
            title="Remove row"
            aria-label={`Remove row for ${project.code}`}
          >
            ✕
          </button>
        )}
      </div>
    );
  }

  // Placeholder row ready for selection
  return (
    <div
      className={[styles.placeholderContainer, isOpen && styles.isOpen].filter(Boolean).join(" ")}
      ref={containerRef}
    >
      {canEdit ? (
        <>
          <button
            type="button"
            className={styles.selectBtn}
            onClick={() => setIsOpen((prev) => !prev)}
            data-testid="select-project-cell-btn"
          >
            + Select Project
          </button>

          {isOpen && (
            <div className={styles.dropdownPopover} role="dialog" aria-label="Select Project">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.searchInput}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
              />
              <ul className={styles.projectList} role="listbox">
                {selectableProjects.length > 0 ? (
                  selectableProjects.map((p) => (
                    <li
                      key={p.id}
                      role="option"
                      aria-selected={false}
                      className={styles.projectItem}
                      onClick={() => handleSelect(p.id)}
                    >
                      <span className={styles.itemCode}>{p.code}</span>
                      <span className={styles.itemName}>{p.name}</span>
                    </li>
                  ))
                ) : (
                  <li className={styles.noProjects}>No matching projects</li>
                )}
              </ul>
            </div>
          )}
        </>
      ) : (
        <span className={styles.emptyPlaceholderText}>—</span>
      )}
    </div>
  );
}
