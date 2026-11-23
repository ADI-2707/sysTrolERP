import { Icon, type IconProps } from "./Icon";

export function IconSearch(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}
