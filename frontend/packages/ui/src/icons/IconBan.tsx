import { Icon, type IconProps } from "./Icon";

export function IconBan(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="10" />
  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </Icon>
  );
}
