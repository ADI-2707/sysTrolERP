import { useEffect, type MouseEvent, type ReactNode } from "react";
import { IconClose } from "../../icons";
import { FocusTrap, Portal, useEscape, useId } from "../../primitives";
import styles from "./Modal.module.css";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "left" | "right";
  children: ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const drawerId = useId("drawer");
  const titleId = `${drawerId}-title`;

  useEscape(onClose, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div className={styles["drawer-backdrop"]} onClick={handleBackdropClick}>
        <FocusTrap active={isOpen}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={[styles.drawer, styles[`drawer-${side}`], className].filter(Boolean).join(" ")}
          >
            {title && (
              <div className={styles.header}>
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles["close-button"]}
                  aria-label="Close drawer"
                >
                  <IconClose size={20} />
                </button>
              </div>
            )}
            <div className={styles.body}>{children}</div>
          </div>
        </FocusTrap>
      </div>
    </Portal>
  );
}
