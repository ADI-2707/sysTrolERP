import { IconChevronLeft, IconChevronRight } from "../../icons";
import styles from "./Navigation.module.css";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageSize, total, onChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("ellipsis");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav aria-label="Pagination" className={[styles.pagination, className].filter(Boolean).join(" ")}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={styles["pagination-btn"]}
        aria-label="Previous page"
      >
        <IconChevronLeft size={16} />
      </button>

      {getPages().map((p, idx) => {
        if (p === "ellipsis") {
          return (
            <span key={`ellipsis-${idx}`} className={styles["pagination-ellipsis"]}>
              …
            </span>
          );
        }
        const isActive = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={[styles["pagination-btn"], isActive && styles["is-active"]].filter(Boolean).join(" ")}
            aria-current={isActive ? "page" : undefined}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={styles["pagination-btn"]}
        aria-label="Next page"
      >
        <IconChevronRight size={16} />
      </button>
    </nav>
  );
}
