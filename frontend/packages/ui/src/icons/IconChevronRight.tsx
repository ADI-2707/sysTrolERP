import { Icon, type IconProps } from "./Icon";

export function IconChevronRight(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <polyline points="9 18 15 12 9 6" />
    </Icon>
  );
}
