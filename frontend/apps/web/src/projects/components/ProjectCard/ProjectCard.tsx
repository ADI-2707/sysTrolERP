import { Badge, ProgressBar, Avatar } from "@systrol/ui";
import type { ProjectListItem } from "../../types";
import styles from "./ProjectCard.module.css";

export interface ProjectCardProps {
  project: ProjectListItem;
  onClick?: (project: ProjectListItem) => void;
  className?: string;
}

export function ProjectCard({ project, onClick, className }: ProjectCardProps) {
  const handleClick = () => {
    onClick?.(project);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_PROGRESS":
        return "brand";
      case "INITIATED":
        return "info";
      default:
        return "default";
    }
  };

  const formattedDate = new Date(project.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const displayedMembers = project.members.slice(0, 3);
  const remainingMembers = project.member_count > 3 ? project.member_count - 3 : 0;

  return (
    <div
      role="article"
      tabIndex={0}
      className={[styles.card, className].filter(Boolean).join(" ")}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      data-testid={`project-card-${project.id}`}
    >
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <div className={styles.nameRow}>
            <h3 className={styles.projectName}>{project.name}</h3>
            <span className={styles.projectCode} data-testid="project-code">
              {project.code}
            </span>
          </div>
          {project.client_name && (
            <p className={styles.clientName}>{project.client_name}</p>
          )}
        </div>

        <Badge
          variant={project.is_active ? getStatusVariant(project.status) : "default"}
          data-testid="project-status-badge"
        >
          {project.is_active ? project.status.replace("_", " ") : "INACTIVE"}
        </Badge>
      </div>

      {project.description && (
        <p className={styles.description}>{project.description}</p>
      )}

      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span className={styles.progressPercent}>
            {project.completion_percentage}%
          </span>
          <span className={styles.progressSteps}>
            {project.completed_steps} / {project.total_steps} steps
          </span>
        </div>
        <ProgressBar
          value={project.completion_percentage}
          data-testid="project-progress-bar"
        />
      </div>

      {project.current_step && (
        <div className={styles.stepSection} data-testid="project-current-step">
          <span className={styles.stepLabel}>Current step:</span>
          <Badge variant={getStatusVariant(project.current_step.status)}>
            {project.current_step.name}
          </Badge>
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.metaInfo}>
          <span className={styles.createdDate}>Created {formattedDate}</span>
        </div>

        <div className={styles.membersGroup} data-testid="project-members">
          {displayedMembers.map((m) => (
            <div key={m.id} className={styles.avatarStack}>
              <Avatar name={m.full_name} size="sm" />
            </div>
          ))}
          {remainingMembers > 0 && (
            <span className={styles.memberCount}>+{remainingMembers}</span>
          )}
        </div>
      </div>
    </div>
  );
}
