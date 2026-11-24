import React, { Children, cloneElement, isValidElement, type ReactNode } from "react";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export function Slot({ children, ...props }: SlotProps) {
  const child = Children.only(children);

  if (isValidElement<React.HTMLAttributes<HTMLElement>>(child)) {
    return cloneElement(child, {
      ...props,
      ...child.props,
      style: {
        ...props.style,
        ...child.props.style,
      },
      className: [props.className, child.props.className].filter(Boolean).join(" ") || undefined,
    });
  }

  return null;
}
