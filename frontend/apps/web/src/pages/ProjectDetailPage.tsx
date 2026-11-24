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
  Input,
  FormField,
  useToast,
  IconChevronLeft,
  type StepperItem,
  type StepStatus,
} from "@systrol/ui";
import { useAuth } from "../auth";
import { fetchProjectDetail, updateStepStatus, insertSubStep } from "../api/projects";
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

  const [insertAfterStep, setInsertAfterStep] = useState<ProjectStepDetail | null>(null);
  const [subStepName, setSubStepName] = useState<string>("");
  const [insertError, setInsertError] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState<boolean>(false);

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

  const highestCompletedPosition = useMemo(() => {
    if (!project) return 0;
    const completed = project.steps.filter((s) => s.status === "COMPLETED");
    if (completed.length === 0) return 0;
    return Math.max(...completed.map((s) => s.position));
  }, [project]);

  const canInsertAfter = useCallback(
    (step: StepperItem) => {
      if (!canManage) return false;
      if (step.stepType === "AMC") return false;
      return step.position >= highestCompletedPosition;
    },
    [canManage, highestCompletedPosition]
  );

  const handleOpenInsertModal = (stepIdStr: string) => {
    if (!project || !canManage) return;
    const step = project.steps.find((s) => String(s.id) === stepIdStr);
    if (!step) return;
    setInsertAfterStep(step);
    setSubStepName("");
    setInsertError(null);
  };

  const handleCloseInsertModal = () => {
    if (isInserting) return;
    setInsertAfterStep(null);
    setSubStepName("");
    setInsertError(null);
  };

  const handleConfirmInsert = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!project || !insertAfterStep) return;
    const trimmed = subStepName.trim();
    if (!trimmed) {
      setInsertError("Sub-step name cannot be empty.");
      return;
    }
    setIsInserting(true);
    setInsertError(null);
    try {
      await insertSubStep(project.id, {
        after_step_id: insertAfterStep.id,
        name: trimmed,
      });
      addToast({
        type: "success",
        title: "Sub-step added",
        description: `Added "${trimmed}" after ${insertAfterStep.name}.`,
      });
      handleCloseInsertModal();
      await loadDetail();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add sub-step.";
      setInsertError(msg);
      addToast({
        type: "error",
        title: "Add failed",
        description: msg,
      });
    } finally {
      setIsInserting(false);
    }
  };

  const stepperItems: StepperItem[] = useMemo(() => {
    if (!project) return [];
    return project.steps.map((s) => ({
      id: String(s.id),
      title: s.name,
      stepType: s.key,
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
            onInsertAfter={canManage ? handleOpenInsertModal : undefined}
            canInsertAfter={canInsertAfter}
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

      <Modal
        isOpen={!!insertAfterStep}
        onClose={handleCloseInsertModal}
        title="Add Sub-Step"
        size="md"
      >
        <form onSubmit={handleConfirmInsert} data-testid="add-substep-modal">
          <p className={styles.modalText}>
            Inserting a custom sub-step after <strong>{insertAfterStep?.name}</strong>.
          </p>
          <FormField
            id="substep-name-input"
            label="Sub-step Name"
            required
            error={insertError || undefined}
          >
            <Input
              id="substep-name-input"
              value={subStepName}
              onChange={(e) => {
                setSubStepName(e.target.value);
                if (insertError) setInsertError(null);
              }}
              placeholder="e.g. Factory Acceptance Test"
              data-testid="substep-name-input"
              autoFocus
              disabled={isInserting}
            />
          </FormField>
          <div className={styles.modalFooter} style={{ marginTop: "var(--space-5)" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseInsertModal}
              data-testid="cancel-add-substep-btn"
              disabled={isInserting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              data-testid="confirm-add-substep-btn"
              loading={isInserting}
              disabled={!subStepName.trim() || isInserting}
            >
              Add Sub-Step
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
