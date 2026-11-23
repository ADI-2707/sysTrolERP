import { Icon, type IconProps } from "./Icon";

export function IconPanelCollapse(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
  <line x1="9" y1="3" x2="9" y2="21" />
  <path d="m14 15-3-3 3-3" />
    </Icon>
  );
}
