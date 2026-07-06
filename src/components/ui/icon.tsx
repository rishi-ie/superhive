import { HugeiconsIcon as _HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

type IconProps = {
  className?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  altIcon?: IconSvgElement;
  showAlt?: boolean;
  "data-icon"?: string;
};

export function HugeiconsIcon({
  icon,
  className,
  size = 16,
  strokeWidth = 1.5,
  color = "currentColor",
  ...props
}: IconProps & { icon: IconSvgElement }) {
  return (
    <_HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
      {...props}
    />
  );
}
