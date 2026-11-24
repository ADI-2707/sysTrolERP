import { useRef, useState, type ReactElement, type ReactNode } from "react";
import { Portal, computePosition, useId, type Placement } from "../../primitives";
import styles from "./Overlays.module.css";

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: Placement;
  delay?: number;
}

export function Tooltip({
  content,
  children,
  placement = "top",
  delay = 200,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId("tooltip");

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current?.getBoundingClientRect() ?? {
          width: 80,
          height: 24,
          top: 0,
          left: 0,
          right: 80,
          bottom: 24,
        } as DOMRect;
        const pos = computePosition(triggerRect, contentRect, placement, 6);
        setCoords(pos);
        setIsOpen(true);
      }
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsOpen(false);
  };

  return (
    <>
      <span
        ref={(el) => {
          triggerRef.current = el;
        }}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={isOpen ? tooltipId : undefined}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            id={tooltipId}
            role="tooltip"
            className={styles.tooltip}
            style={{ top: coords.top, left: coords.left }}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
