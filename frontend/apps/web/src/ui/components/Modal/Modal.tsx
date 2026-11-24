import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { IconClose } from "../../icons";
import { FocusTrap, Portal, useEscape, useId } from "../../primitives";
import styles from "./Modal.module.css";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
  closeOnBackdropClick = true,
}: ModalProps) {
  const modalId = useId("modal");
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;
  const contentRef = useRef<HTMLDivElement>(null);

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
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div className={styles.backdrop} onClick={handleBackdropClick}>
        <FocusTrap active={isOpen}>
          <div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            className={[styles.modal, styles[`size-${size}`], className].filter(Boolean).join(" ")}
          >
            {title && (
              <div className={styles.header}>
                <div>
                  <h2 id={titleId} className={styles.title}>
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className={styles.description}>
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles["close-button"]}
                  aria-label="Close dialog"
                >
                  <IconClose size={20} />
                </button>
              </div>
            )}
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </div>
        </FocusTrap>
      </div>
    </Portal>
  );
}
