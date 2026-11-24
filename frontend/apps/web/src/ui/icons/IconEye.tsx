import { Icon, type IconProps } from "./Icon";

export function IconEye(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}
