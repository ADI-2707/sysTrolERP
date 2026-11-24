import { Icon, type IconProps } from "./Icon";

export function IconChevronDown(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}
