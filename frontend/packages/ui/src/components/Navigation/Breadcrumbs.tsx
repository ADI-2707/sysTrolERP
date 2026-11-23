import type { ReactNode } from "react";
import { IconChevronRight } from "../../icons";
import styles from "./Navigation.module.css";

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className={styles.breadcrumbs}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isCurrent = item.isCurrent ?? isLast;

          return (
            <li key={idx} className={styles["breadcrumb-item"]}>
              {isCurrent ? (
                <span className={styles["breadcrumb-current"]} aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <a href={item.href} onClick={item.onClick} className={styles["breadcrumb-link"]}>
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={styles["breadcrumb-link"]}
                  style={{ background: "none", border: "none", font: "inherit", padding: 0 }}
                >
                  {item.label}
                </button>
              )}
              {!isLast && (
                <span className={styles["breadcrumb-separator"]} aria-hidden="true">
                  <IconChevronRight size={14} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
