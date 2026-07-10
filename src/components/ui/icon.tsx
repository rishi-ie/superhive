import type { Icon as PhosphorIcon, IconWeight } from "@phosphor-icons/react";

type IconProps = {
  className?: string;
  size?: number | string;
  weight?: IconWeight;
  color?: string;
};

export function Icon({
  icon: IconComponent,
  className,
  size = 16,
  weight = "regular",
  color = "currentColor",
  ...props
}: IconProps & { icon: PhosphorIcon }) {
  return (
    <IconComponent
      size={size}
      weight={weight}
      color={color}
      className={className}
      {...props}
    />
  );
}