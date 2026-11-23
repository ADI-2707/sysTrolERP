import { forwardRef, type TextareaHTMLAttributes } from "react";
import styles from "./Input.module.css";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className, id, "aria-describedby": ariaDescribedBy, ...props },
  ref
) {
  const hasError = Boolean(error);
  const textareaClass = [
    styles.textarea,
    hasError && styles["has-error"],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
  const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <textarea
      ref={ref}
      id={id}
      className={textareaClass}
      aria-invalid={hasError ? "true" : undefined}
      aria-describedby={combinedDescribedBy}
      {...props}
    />
  );
});
