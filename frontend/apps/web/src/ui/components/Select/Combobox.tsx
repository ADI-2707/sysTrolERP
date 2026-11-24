import { useDeferredValue, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { IconCheck, IconChevronDown } from "../../icons";
import { useClickOutside, useEscape, useId } from "../../primitives";
import styles from "./Select.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Combobox({
  id: propId,
  options,
  value,
  onChange,
  placeholder = "Select or search...",
  searchPlaceholder = "Type to filter...",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const generatedId = useId("combobox");
  const comboId = propId ?? generatedId;
  const listboxId = `${comboId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);
  useEscape(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, isOpen);

  const filteredOptions = options.filter((opt) => {
    const q = deferredSearch.toLowerCase();
    return opt.label.toLowerCase().includes(q) || (opt.description?.toLowerCase().includes(q) ?? false);
  });

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setActiveIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectIndex = (index: number) => {
    const opt = filteredOptions[index];
    if (!opt || opt.disabled) return;
    onChange?.(opt.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          selectIndex(activeIndex);
        }
        break;
    }
  };

  return (
    <div ref={containerRef} className={[styles["select-container"], className].filter(Boolean).join(" ")}>
      <button
        ref={triggerRef}
        id={comboId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={[styles.trigger, disabled && styles["is-disabled"]].filter(Boolean).join(" ")}
      >
        <span className={!selectedOption ? styles.placeholder : undefined}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <IconChevronDown size={16} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} onKeyDown={handleKeyDown}>
          <div className={styles["search-input-wrapper"]}>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={searchPlaceholder}
              className={styles["search-input"]}
            />
          </div>

          <ul id={listboxId} role="listbox" tabIndex={-1} className={styles["options-list"]}>
            {filteredOptions.length === 0 ? (
              <li className={styles["empty-message"]}>No matching items</li>
            ) : (
              filteredOptions.map((opt, idx) => {
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
                    <div>
                      <div>{opt.label}</div>
                      {opt.description && (
                        <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                          {opt.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <IconCheck size={16} />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
