import { Icon, type IconProps } from "./Icon";

export function IconDot(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />
    </Icon>
  );
}
