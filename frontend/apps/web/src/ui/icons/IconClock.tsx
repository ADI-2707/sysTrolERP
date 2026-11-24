import { Icon, type IconProps } from "./Icon";

export function IconClock(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}
