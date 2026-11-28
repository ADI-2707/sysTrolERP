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
  onExportSiteDiary?: (format: "pdf" | "excel") => void;
}

export function ProjectDropdownCell({
  project,
  availableProjects,
  existingProjectIds,
  onSelectProject,
  onDeleteRow,
  canEdit,
  isEmptyRow = false,
  onExportSiteDiary,
}: ProjectDropdownCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isDiaryMenuOpen, setIsDiaryMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const diaryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (diaryMenuRef.current && !diaryMenuRef.current.contains(event.target as Node)) {
        setIsDiaryMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isDiaryMenuOpen]);

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
        <div className={styles.rowActionsGroup}>
          {onExportSiteDiary && (
            <div className={styles.diaryMenuWrapper} ref={diaryMenuRef}>
              <button
                type="button"
                className={styles.diaryExportBtn}
                onClick={() => setIsDiaryMenuOpen((prev) => !prev)}
                title="Site Diary Options"
                aria-label={`Export site diary for ${project.code}`}
                data-testid={`export-site-diary-btn-${project.id}`}
              >
                Diary ▾
              </button>
              {isDiaryMenuOpen && (
                <div className={styles.diaryDropdownPopover} role="menu">
                  <button
                    type="button"
                    className={styles.diaryMenuItem}
                    role="menuitem"
                    onClick={() => {
                      setIsDiaryMenuOpen(false);
                      onExportSiteDiary("pdf");
                    }}
                    data-testid={`export-pdf-${project.id}`}
                  >
                    📄 Download PDF
                  </button>
                  <button
                    type="button"
                    className={styles.diaryMenuItem}
                    role="menuitem"
                    onClick={() => {
                      setIsDiaryMenuOpen(false);
                      onExportSiteDiary("excel");
                    }}
                    data-testid={`export-excel-${project.id}`}
                  >
                    📊 Export Excel
                  </button>
                </div>
              )}
            </div>
          )}
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
      </div>
    );
  }

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
