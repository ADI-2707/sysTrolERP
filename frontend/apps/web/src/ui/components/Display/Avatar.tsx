import styles from "./Display.module.css";

export type AvatarSize = "sm" | "md" | "lg";

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const initials = getInitials(name);

  return (
    <span
      className={[styles.avatar, styles[`avatar-${size}`], className]
        .filter(Boolean)
        .join(" ")}
      aria-label={name}
      role="img"
    >
      {src ? (
        <img src={src} alt={name ?? ""} className={styles["avatar-img"]} />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
