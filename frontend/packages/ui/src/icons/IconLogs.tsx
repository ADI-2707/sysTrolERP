import { Icon, type IconProps } from "./Icon";

export function IconLogs(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
  <line x1="7" y1="9" x2="11" y2="9" />
  <line x1="7" y1="13" x2="17" y2="13" />
  <line x1="7" y1="17" x2="14" y2="17" />
    </Icon>
  );
}
