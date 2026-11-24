import { Icon, type IconProps } from "./Icon";

export function IconSuccess(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
  <polyline points="16 9 10 15 8 13" />
    </Icon>
  );
}
