import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Badge,
  ProgressBar,
  Avatar,
  Stepper,
  Spinner,
  Button,
  Modal,
  useToast,
  IconChevronLeft,
  type StepperItem,
  type StepStatus,
} from "@systrol/ui";
import { useAuth } from "../auth";
import { fetchProjectDetail, updateStepStatus } from "../api/projects";
import type { ProjectDetailData, ProjectStepDetail, StepStatusType } from "../projects/types";
import styles from "./ProjectDetailPage.module.css";

const nextStatusMap: Record<StepStatusType, StepStatusType> = {
  NOT_STARTED: "INITIATED",
  INITIATED: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "COMPLETED",
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useAuth();
  const { addToast } = useToast();
  const canManage = isSuperAdmin || isAdmin;

  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stepToComplete, setStepToComplete] = useState<ProjectStepDetail | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

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

  const executeStatusChange = async (
    stepId: number,
    status: StepStatusType,
    confirm: boolean
  ) => {
    if (!project) return;
    setIsUpdatingStatus(true);
    try {
      await updateStepStatus(project.id, stepId, status, confirm);
      addToast({
        type: "success",
        title: "Status updated",
        description: `Step status updated to ${status.replace("_", " ")}.`,
      });
      await loadDetail();
    } catch (err: unknown) {
      addToast({
        type: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update step status.",
      });
    } finally {
      setIsUpdatingStatus(false);
      setStepToComplete(null);
    }
  };

  const handleAdvanceStep = (stepIdStr: string) => {
    if (!project || !canManage) return;
    const step = project.steps.find((s) => String(s.id) === stepIdStr);
    if (!step || step.status === "COMPLETED") return;

    const nextStatus = nextStatusMap[step.status];
    if (nextStatus === "COMPLETED") {
      setStepToComplete(step);
    } else {
      executeStatusChange(step.id, nextStatus, false);
    }
  };

  const handleStatusChange = (stepIdStr: string, nextStatus: StepStatus) => {
    if (!project || !canManage) return;
    const step = project.steps.find((s) => String(s.id) === stepIdStr);
    if (!step || step.status === "COMPLETED") return;

    if (nextStatus === "COMPLETED") {
      setStepToComplete(step);
    } else {
      executeStatusChange(step.id, nextStatus as StepStatusType, false);
    }
  };

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
          <Stepper
            items={stepperItems}
            onStatusChange={canManage ? handleStatusChange : undefined}
            onAdvanceStep={canManage ? handleAdvanceStep : undefined}
          />
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
                    {member.designation ? ` • ${member.designation}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!stepToComplete}
        onClose={() => !isUpdatingStatus && setStepToComplete(null)}
        title="Confirm Step Completion"
        size="sm"
      >
        <div data-testid="complete-step-modal">
          <p className={styles.modalText}>
            Are you sure you want to mark step &ldquo;{stepToComplete?.name}&rdquo; as COMPLETED? Once completed, this step is locked and cannot be reopened.
          </p>
          <div className={styles.modalFooter}>
            <Button
              variant="secondary"
              onClick={() => setStepToComplete(null)}
              data-testid="cancel-complete-step-btn"
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (stepToComplete) {
                  executeStatusChange(stepToComplete.id, "COMPLETED", true);
                }
              }}
              data-testid="confirm-complete-step-btn"
              loading={isUpdatingStatus}
            >
              Confirm Completion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
