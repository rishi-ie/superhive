import type { HugeiconsIconProps } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";

type HugeIconProps = Omit<HugeiconsIconProps, "icon"> & {
  icon: HugeiconsIconProps["icon"];
};

export function HugeIcon({ size = 16, className, ...props }: HugeIconProps) {
  return (
    <HugeiconsIcon
      size={size}
      className={className}
      {...props}
    />
  );
}
