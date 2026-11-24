import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconCheck, IconChevronDown } from "../../icons";
import { useClickOutside, useEscape, useId } from "../../primitives";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Select({
  id: propId,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const generatedId = useId("select");
  const selectId = propId ?? generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);
  useEscape(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, isOpen);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  const selectIndex = (index: number) => {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    onChange?.(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0) {
          selectIndex(activeIndex);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={[styles["select-container"], className].filter(Boolean).join(" ")}>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={[styles.trigger, disabled && styles["is-disabled"]].filter(Boolean).join(" ")}
      >
        <span className={!selectedOption ? styles.placeholder : undefined}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IconChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <ul id={listboxId} role="listbox" tabIndex={-1} className={styles["options-list"]}>
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isActive = idx === activeIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => selectIndex(idx)}
                  className={[
                    styles.option,
                    isActive && styles["is-active"],
                    isSelected && styles["is-selected"],
                    opt.disabled && styles["is-disabled"],
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span>{opt.label}</span>
                  {isSelected && <IconCheck size={16} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
