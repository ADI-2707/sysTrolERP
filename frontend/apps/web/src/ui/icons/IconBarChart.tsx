import { Icon, type IconProps } from "./Icon";

export function IconBarChart(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </Icon>
  );
}
