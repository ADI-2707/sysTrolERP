import { Icon, type IconProps } from "./Icon";

export function IconInfo(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="16" x2="12" y2="12" />
  <line x1="12" y1="8" x2="12.01" y2="8" />
    </Icon>
  );
}
