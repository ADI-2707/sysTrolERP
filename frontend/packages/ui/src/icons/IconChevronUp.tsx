import { Icon, type IconProps } from "./Icon";

export function IconChevronUp(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <polyline points="18 15 12 9 6 15" />
    </Icon>
  );
}
