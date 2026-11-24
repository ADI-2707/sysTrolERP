import { Icon, type IconProps } from "./Icon";

export function IconMoreHorizontal(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="1.5" />
  <circle cx="19" cy="12" r="1.5" />
  <circle cx="5" cy="12" r="1.5" />
    </Icon>
  );
}
