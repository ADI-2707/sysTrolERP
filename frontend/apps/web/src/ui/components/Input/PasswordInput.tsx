import { forwardRef, useState } from "react";
import { IconEye, IconEyeOff } from "../../icons";
import { Input, type InputProps } from "./Input";
import styles from "./Input.module.css";

export type PasswordInputProps = Omit<InputProps, "type" | "rightIcon">;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={styles["input-wrapper"]}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={styles["has-right-icon"]}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={styles["toggle-button"]}
          aria-label={visible ? "Hide password" : "Show password"}
          tabIndex={-1}
        >
          {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </button>
      </div>
    );
  }
);
