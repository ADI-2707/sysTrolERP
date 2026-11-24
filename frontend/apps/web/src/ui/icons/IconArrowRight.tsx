import { Icon, type IconProps } from "./Icon";

export function IconArrowRight(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
  <polyline points="12 5 19 12 12 19" />
    </Icon>
  );
}
