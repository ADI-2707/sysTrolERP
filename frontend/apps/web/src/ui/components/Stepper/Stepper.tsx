import { IconCheck, IconEdit, IconLock, IconPlus, IconTrash } from "../../icons";
import { Badge } from "../Display";
import styles from "./Stepper.module.css";

export type StepStatus = "NOT_STARTED" | "INITIATED" | "IN_PROGRESS" | "COMPLETED";

export interface StepperItem {
  id: string;
  title: string;
  stepType?: string;
  status: StepStatus;
  isCustom?: boolean;
  position: number;
  description?: string;
  completedAt?: string;
}

export interface StepperProps {
  items: StepperItem[];
  onStatusChange?: (stepId: string, status: StepStatus) => void;
  onAdvanceStep?: (stepId: string) => void;
  onInsertAfter?: (stepId: string) => void;
  onEditCustom?: (stepId: string) => void;
  onDeleteCustom?: (stepId: string) => void;
  canInsertAfter?: (step: StepperItem) => boolean;
  canEditCustom?: (step: StepperItem) => boolean;
  canDeleteCustom?: (step: StepperItem) => boolean;
  className?: string;
}

export function Stepper({
  items,
  onStatusChange,
  onAdvanceStep,
  onInsertAfter,
  onEditCustom,
  onDeleteCustom,
  canInsertAfter = () => true,
  canEditCustom = (s) => Boolean(s.isCustom && s.status === "NOT_STARTED"),
  canDeleteCustom = (s) => Boolean(s.isCustom && s.status === "NOT_STARTED"),
  className,
}: StepperProps) {
  const getBadgeVariant = (status: StepStatus) => {
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

  const getStatusClass = (status: StepStatus) => {
    switch (status) {
      case "COMPLETED":
        return styles["status-completed"];
      case "IN_PROGRESS":
        return styles["status-in-progress"];
      case "INITIATED":
        return styles["status-initiated"];
      default:
        return styles["status-not-started"];
    }
  };

  return (
    <div className={[styles.stepper, className].filter(Boolean).join(" ")}>
      {items.map((step, idx) => {
        const isCompleted = step.status === "COMPLETED";
        const isLast = idx === items.length - 1;
        const nextStep = !isLast ? items[idx + 1] : null;
        const isLineCompleted = nextStep?.status === "COMPLETED";
        const isSubStep = Boolean(step.isCustom);
        const nextIsSubStep = Boolean(nextStep?.isCustom);
        const allowInsert = !isLast && onInsertAfter && canInsertAfter(step);

        return (
          <div
            key={step.id}
            className={[styles["step-wrapper"], isSubStep && styles["is-substep"]]
              .filter(Boolean)
              .join(" ")}
            data-testid={`step-row-${step.id}`}
          >
            <div className={styles["timeline-col"]}>
              {!isLast && (
                <svg
                  className={styles["connector-svg"]}
                  preserveAspectRatio="none"
                  viewBox="0 0 60 100"
                  aria-hidden="true"
                  data-testid={`connector-svg-${step.id}`}
                >
                  {!isSubStep && !nextIsSubStep && (
                    <line
                      x1="13"
                      y1="26"
                      x2="13"
                      y2="100"
                      className={[
                        styles["connector-line"],
                        isLineCompleted && styles["is-completed"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {!isSubStep && nextIsSubStep && (
                    <path
                      d="M 13 26 C 13 60, 35 60, 35 100"
                      fill="none"
                      className={[
                        styles["connector-line"],
                        isLineCompleted && styles["is-completed"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {isSubStep && !nextIsSubStep && (
                    <path
                      d="M 35 24 C 35 60, 13 60, 13 100"
                      fill="none"
                      className={[
                        styles["connector-line"],
                        isLineCompleted && styles["is-completed"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {isSubStep && nextIsSubStep && (
                    <line
                      x1="35"
                      y1="24"
                      x2="35"
                      y2="100"
                      className={[
                        styles["connector-line"],
                        isLineCompleted && styles["is-completed"],
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
              )}

              <div
                className={[
                  styles["step-indicator"],
                  getStatusClass(step.status),
                  isSubStep ? styles["is-substep"] : styles["main"],
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-testid={`step-indicator-${step.id}`}
              >
                {isCompleted ? <IconCheck size={14} /> : idx + 1}
              </div>

              {allowInsert && (
                <div
                  className={[
                    styles["add-substep-container"],
                    isSubStep && nextIsSubStep && styles["between-substeps"],
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => onInsertAfter(step.id)}
                    className={styles["add-substep-btn"]}
                    title={`Insert sub-step after ${step.title}`}
                    aria-label={`Insert sub-step after ${step.title}`}
                    data-testid={`insert-substep-after-${step.id}`}
                  >
                    <IconPlus size={10} />
                  </button>
                </div>
              )}
            </div>

            <div className={styles["step-content"]}>
              <div className={styles["step-header"]}>
                <div className={styles["step-title-group"]}>
                  <span className={styles["step-title"]}>{step.title}</span>
                  {step.isCustom && (
                    <span className={styles["custom-tag"]}>Custom Sub-step</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!onStatusChange || isCompleted) return;
                      const nextMap: Record<StepStatus, StepStatus> = {
                        NOT_STARTED: "INITIATED",
                        INITIATED: "IN_PROGRESS",
                        IN_PROGRESS: "COMPLETED",
                        COMPLETED: "COMPLETED",
                      };
                      onStatusChange(step.id, nextMap[step.status]);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: onStatusChange && !isCompleted ? "pointer" : "default",
                    }}
                    disabled={!onStatusChange || isCompleted}
                    aria-label={`Status: ${step.status}`}
                    data-testid={`step-status-btn-${step.id}`}
                  >
                    <Badge variant={getBadgeVariant(step.status)}>
                      {step.status.replace("_", " ")}
                    </Badge>
                  </button>
                  {isCompleted && (
                    <span className={styles["locked-tag"]} data-testid={`step-locked-tag-${step.id}`}>
                      <IconLock size={12} />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                <div className={styles["step-actions"]}>
                  {!isCompleted && onAdvanceStep && (
                    <button
                      type="button"
                      onClick={() => onAdvanceStep(step.id)}
                      className={styles["advance-btn"]}
                      data-testid={`advance-step-btn-${step.id}`}
                    >
                      Advance Status
                    </button>
                  )}
                  {step.isCustom && canEditCustom(step) && onEditCustom && (
                    <button
                      type="button"
                      onClick={() => onEditCustom(step.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      aria-label={`Edit ${step.title}`}
                      data-testid={`edit-substep-btn-${step.id}`}
                    >
                      <IconEdit size={16} />
                    </button>
                  )}
                  {step.isCustom && canDeleteCustom(step) && onDeleteCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustom(step.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      aria-label={`Delete ${step.title}`}
                      data-testid={`delete-substep-btn-${step.id}`}
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>
              </div>

              {step.description && (
                <div className={styles["step-description"]}>{step.description}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
