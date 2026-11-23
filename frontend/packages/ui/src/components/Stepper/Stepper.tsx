import { IconCheck, IconEdit, IconPlus, IconTrash } from "../../icons";
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
        const allowInsert = !isLast && onInsertAfter && canInsertAfter(step);

        return (
          <div key={step.id} className={styles["step-wrapper"]}>
            <div className={styles["timeline-column"]}>
              <div
                className={[styles["step-indicator"], getStatusClass(step.status)]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isCompleted ? <IconCheck size={14} /> : idx + 1}
              </div>
              <div
                className={[
                  styles["timeline-line"],
                  isCompleted && styles["is-completed"],
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
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
                      if (!onStatusChange) return;
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
                      cursor: onStatusChange ? "pointer" : "default",
                    }}
                  >
                    <Badge variant={getBadgeVariant(step.status)}>
                      {step.status.replace("_", " ")}
                    </Badge>
                  </button>
                </div>

                <div className={styles["step-actions"]}>
                  {step.isCustom && canEditCustom(step) && onEditCustom && (
                    <button
                      type="button"
                      onClick={() => onEditCustom(step.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      aria-label={`Edit ${step.title}`}
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

            {allowInsert && (
              <div className={styles["insert-affordance"]}>
                <button
                  type="button"
                  onClick={() => onInsertAfter(step.id)}
                  className={styles["insert-btn"]}
                  title={`Insert sub-step after ${step.title}`}
                  aria-label={`Insert sub-step after ${step.title}`}
                >
                  <IconPlus size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
