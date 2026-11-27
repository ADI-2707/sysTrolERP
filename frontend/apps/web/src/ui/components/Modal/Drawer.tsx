import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { IconClose } from "../../icons";
import { FocusTrap, Portal, useEscape, useId } from "../../primitives";
import styles from "./Modal.module.css";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  side = "right",
  size = "sm",
  children,
  className,
}: DrawerProps) {
  const drawerId = useId("drawer");
  const titleId = `${drawerId}-title`;

  const [mounted, setMounted] = useState(isOpen);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsExiting(false);
    } else if (mounted) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setIsExiting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  useEscape(onClose, isOpen && !isExiting);

  useEffect(() => {
    if (!mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  if (!mounted) return null;

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isExiting) {
      onClose();
    }
  };

  const backdropClass = [
    styles["drawer-backdrop"],
    isExiting ? styles["drawer-backdrop-exit"] : undefined,
  ].filter(Boolean).join(" ");

  const drawerClass = [
    styles.drawer,
    styles[`drawer-${size}`],
    isExiting ? styles[`drawer-exit-${side}`] : styles[`drawer-${side}`],
    className,
  ].filter(Boolean).join(" ");

  return (
    <Portal>
      <div className={backdropClass} onClick={handleBackdropClick}>
        <FocusTrap active={isOpen && !isExiting}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={drawerClass}
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
                  disabled={isExiting}
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
