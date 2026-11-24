import { Icon, type IconProps } from "./Icon";

export function IconChevronLeft(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <polyline points="15 18 9 12 15 6" />
    </Icon>
  );
}
