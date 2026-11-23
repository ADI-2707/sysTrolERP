import {
  cloneElement,
  isValidElement,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Portal, computePosition, useClickOutside, useEscape, type Placement } from "../../primitives";
import styles from "./Overlays.module.css";

export interface DropdownMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  placement?: Placement;
  className?: string;
}

export function DropdownMenu({
  trigger,
  items,
  placement = "bottom-end",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const toggle = () => {
    if (!isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = menuRef.current?.getBoundingClientRect() ?? {
        width: 180,
        height: items.length * 36,
        top: 0,
        left: 0,
        right: 180,
        bottom: items.length * 36,
      } as DOMRect;
      const pos = computePosition(triggerRect, contentRect, placement, 4);
      setCoords(pos);
      setActiveIndex(-1);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useClickOutside(menuRef, (e) => {
    if (!triggerRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, isOpen);

  useEscape(() => setIsOpen(false), isOpen);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && !items[activeIndex]?.disabled) {
          items[activeIndex]?.onClick?.();
          setIsOpen(false);
        }
        break;
    }
  };

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<HTMLAttributes<HTMLElement>>, {
        "aria-haspopup": "menu",
        "aria-expanded": isOpen,
        onClick: (e: MouseEvent<HTMLElement>) => {
          (trigger as ReactElement<HTMLAttributes<HTMLElement>>).props.onClick?.(e);
          toggle();
        },
      })
    : (
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
    );

  return (
    <>
      <div
        ref={triggerRef}
        style={{ display: "inline-flex" }}
      >
        {triggerNode}
      </div>
      {isOpen && (
        <Portal>
          <ul
            ref={menuRef}
            role="menu"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={[styles["dropdown-menu"], className].filter(Boolean).join(" ")}
            style={{ top: coords.top, left: coords.left }}
          >
            {items.map((item, idx) => {
              const isActive = idx === activeIndex;

              return (
                <li key={item.key} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (!item.disabled) {
                        item.onClick?.();
                        setIsOpen(false);
                      }
                    }}
                    className={[
                      styles["dropdown-item"],
                      item.danger && styles["is-danger"],
                      isActive && styles["is-active"],
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Portal>
      )}
    </>
  );
}
