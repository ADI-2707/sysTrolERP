import { Icon, type IconProps } from "./Icon";

export function IconOvertime(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 14 10" />
  <path d="M16 16l4 4" />
    </Icon>
  );
}
