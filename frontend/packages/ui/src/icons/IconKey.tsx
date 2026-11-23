import { Icon, type IconProps } from "./Icon";

export function IconKey(props: Omit<IconProps, "children">) {
  return (
    <Icon {...props}>
      <path d="M21 2l-2 2m-1.5 1.5L14 9l2 2-2 2-2-2-4 4a5 5 0 1 1-7.07-7.07 5 5 0 0 1 7.07 0l4-4 2 2 2-2 1.5 1.5z" />
    </Icon>
  );
}
