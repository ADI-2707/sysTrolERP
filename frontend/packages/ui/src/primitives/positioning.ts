export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export interface Position {
  top: number;
  left: number;
}

export function computePosition(
  triggerRect: DOMRect,
  contentRect: DOMRect,
  placement: Placement = "bottom-start",
  offset = 8
): Position {
  let top = 0;
  let left = 0;

  const [side, align] = placement.split("-") as [string, string | undefined];

  switch (side) {
    case "top":
      top = triggerRect.top - contentRect.height - offset;
      break;
    case "bottom":
      top = triggerRect.bottom + offset;
      break;
    case "left":
      left = triggerRect.left - contentRect.width - offset;
      break;
    case "right":
      left = triggerRect.right + offset;
      break;
  }

  if (side === "top" || side === "bottom") {
    if (align === "start") {
      left = triggerRect.left;
    } else if (align === "end") {
      left = triggerRect.right - contentRect.width;
    } else {
      left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
    }
  } else {
    if (align === "start") {
      top = triggerRect.top;
    } else if (align === "end") {
      top = triggerRect.bottom - contentRect.height;
    } else {
      top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
    }
  }

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;

  if (left < 4) left = 4;
  if (left + contentRect.width > viewportWidth - 4) {
    left = viewportWidth - contentRect.width - 4;
  }
  if (top < 4) top = 4;
  if (top + contentRect.height > viewportHeight - 4) {
    top = viewportHeight - contentRect.height - 4;
  }

  return { top, left };
}
