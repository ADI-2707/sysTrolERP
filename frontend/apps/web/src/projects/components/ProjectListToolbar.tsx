import { Button } from "@systrol/ui";
import styles from "./ProjectListToolbar.module.css";

export interface ProjectListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  canCreateProject?: boolean;
  onCreateProject?: () => void;
}

export function ProjectListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  canCreateProject = false,
  onCreateProject,
}: ProjectListToolbarProps) {
  return (
    <div className={styles.toolbar} data-testid="project-list-toolbar">
      <div className={styles.filterGroup}>
        <input
          type="search"
          placeholder="Search projects by name, code, client..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.searchInput}
          data-testid="project-search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className={styles.selectInput}
          data-testid="project-status-filter"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="INITIATED">Initiated</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {canCreateProject && onCreateProject && (
        <div className={styles.actionGroup}>
          <Button
            type="button"
            variant="primary"
            onClick={onCreateProject}
            data-testid="create-project-btn"
          >
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
}
