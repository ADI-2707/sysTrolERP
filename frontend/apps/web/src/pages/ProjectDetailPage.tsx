import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge, ProgressBar, Avatar, Stepper, Spinner, IconChevronLeft, type StepperItem, type StepStatus } from "@systrol/ui";
import { fetchProjectDetail } from "../api/projects";
import type { ProjectDetailData } from "../projects/types";
import styles from "./ProjectDetailPage.module.css";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProjectDetail(id);
      setProject(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load project details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const stepperItems: StepperItem[] = useMemo(() => {
    if (!project) return [];
    return project.steps.map((s) => ({
      id: String(s.id),
      title: s.name,
      status: s.status as StepStatus,
      isCustom: s.is_custom,
      position: s.position,
      description: s.confirmed_at
        ? `Confirmed by ${s.confirmed_by_label || "Admin"} on ${new Date(s.confirmed_at).toLocaleDateString()}`
        : undefined,
    }));
  }, [project]);

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

  if (isLoading) {
    return (
      <div className={styles.loadingContainer} data-testid="project-detail-loading">
        <Spinner size="lg" />
        <span>Loading project details...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.pageContainer} data-testid="project-detail-error">
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => navigate("/projects")}
            data-testid="back-to-projects-btn"
          >
            <IconChevronLeft size={16} />
            <span>Back to Projects</span>
          </button>
        </div>
        <div role="alert" className={styles.errorAlert}>
          {error || "Project not found."}
        </div>
      </div>
    );
  }

  const formattedCreatedDate = new Date(project.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const creatorLabel = project.creator?.full_name || project.creator?.employee_code || "System";

  return (
    <div className={styles.pageContainer} data-testid="project-detail-page">
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate("/projects")}
          data-testid="back-to-projects-btn"
        >
          <IconChevronLeft size={16} />
          <span>Back to Projects</span>
        </button>
      </div>

      <div className={styles.headerCard}>
        <div className={styles.titleArea}>
          <div className={styles.titleGroup}>
            <div className={styles.nameRow}>
              <h1 className={styles.projectName}>{project.name}</h1>
              <span className={styles.projectCode} data-testid="project-detail-code">
                {project.code}
              </span>
            </div>
            {project.client_name && (
              <span className={styles.clientName} data-testid="project-client-name">
                {project.client_name}
              </span>
            )}
          </div>

          <Badge
            variant={project.is_active ? getStatusVariant(project.status) : "default"}
            data-testid="project-detail-status-badge"
          >
            {project.is_active ? project.status.replace("_", " ") : "INACTIVE"}
          </Badge>
        </div>

        {project.description && (
          <p className={styles.description}>{project.description}</p>
        )}

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Created On</span>
            <span className={styles.statValue} data-testid="project-created-date">
              {formattedCreatedDate}
            </span>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Created By</span>
            <span className={styles.statValue} data-testid="project-creator">
              {creatorLabel}
            </span>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statLabel}>Project Status</span>
            <span className={styles.statValue} data-testid="project-active-status">
              {project.is_active ? "Active" : "Archived"}
            </span>
          </div>

          <div className={styles.progressItem}>
            <div className={styles.progressHeader}>
              <span className={styles.statLabel}>Lifecycle Completion</span>
              <span className={styles.statValue} data-testid="project-progress-percentage">
                {project.completion_percentage}% ({project.completed_steps} / {project.total_steps} steps)
              </span>
            </div>
            <ProgressBar value={project.completion_percentage} />
          </div>
        </div>
      </div>

      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Lifecycle Step Timeline</h2>
        <div className={styles.timelineWrapper} data-testid="project-stepper-timeline">
          <Stepper items={stepperItems} />
        </div>
      </div>

      <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>
          Assigned Members ({project.members.length})
        </h2>
        {project.members.length === 0 ? (
          <p className={styles.description}>No team members currently assigned.</p>
        ) : (
          <div className={styles.membersGrid} data-testid="project-members-grid">
            {project.members.map((member) => (
              <div key={member.id} className={styles.memberCard}>
                <Avatar name={member.full_name} size="md" />
                <div className={styles.memberDetails}>
                  <span className={styles.memberName}>{member.full_name}</span>
                  <span className={styles.memberMeta}>
                    {member.employee_code}
                    {member.designation ? ` &bull; ${member.designation}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
