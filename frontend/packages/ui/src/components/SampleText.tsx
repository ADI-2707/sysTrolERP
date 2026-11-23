import styles from "./SampleText.module.css";

export interface SampleTextProps {
  children: React.ReactNode;
}

export function SampleText({ children }: SampleTextProps) {
  return <span className={styles.sample}>{children}</span>;
}
