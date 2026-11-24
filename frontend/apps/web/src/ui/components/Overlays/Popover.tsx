import { useRef, useState, type ReactNode } from "react";
import { Portal, computePosition, useClickOutside, useEscape, type Placement } from "../../primitives";
import styles from "./Overlays.module.css";

export interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  placement?: Placement;
  className?: string;
}

export function Popover({
  trigger,
  content,
  placement = "bottom-start",
  className,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect() ?? {
        width: 240,
        height: 120,
        top: 0,
        left: 0,
        right: 240,
        bottom: 120,
      } as DOMRect;
      const pos = computePosition(triggerRect, contentRect, placement, 6);
      setCoords(pos);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useClickOutside(contentRef, (e) => {
    if (!triggerRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, isOpen);

  useEscape(() => setIsOpen(false), isOpen);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        style={{ display: "inline-flex", cursor: "pointer" }}
      >
        {trigger}
      </div>
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            className={[styles["popover-content"], className].filter(Boolean).join(" ")}
            style={{ top: coords.top, left: coords.left }}
          >
            {typeof content === "function" ? content({ close: () => setIsOpen(false) }) : content}
          </div>
        </Portal>
      )}
    </>
  );
}
