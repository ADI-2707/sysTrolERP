import { Icon, type IconProps } from "./Icon";

export function IconShield(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Icon>
  );
}
