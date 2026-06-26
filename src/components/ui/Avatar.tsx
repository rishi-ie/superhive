/**
 * Avatar — user avatar with image fallback to initials.
 * Uses @radix-ui/react-avatar for accessible rendering.
 */
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { getInitials } from '@/lib/initials';

export type AvatarSize = 'xs' | 'xs2' | 'xs3' | 'sm' | 'md' | 'lg' | 'xl';

export type AvatarProps = {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
  color?: string;
  className?: string;
};

const sizeMap: Record<AvatarSize, string> = {
  xs:  'size-6 text-[9px]',
  xs2: 'size-4 text-[8px]',
  xs3: 'size-5 text-[8px]',
  sm:  'size-8 text-[10px]',
  md:  'size-10 text-xs',
  lg:  'size-14 text-sm',
  xl:  'size-20 text-xl',
};

/**
 * User avatar with image fallback to initials.
 * @param size - Avatar size: xs, xs2, xs3, sm, md, lg, or xl
 * @param src - Image URL
 * @param alt - Image alt text
 * @param fallback - Explicit initials string (overrides name)
 * @param name - Full name used to derive initials via getInitials()
 * @param color - Additional CSS classes for background color
 * @param className - Additional CSS classes
 */
export function Avatar({
  size = 'md',
  src,
  alt,
  fallback,
  name,
  color,
  className = '',
}: AvatarProps) {
  const initials = fallback ?? (name ? getInitials(name) : '?');

  return (
    <AvatarPrimitive.Root
      className={`relative flex shrink-0 items-center justify-center rounded-full overflow-hidden bg-sidebar-accent border border-sidebar-border font-bold text-sidebar-accent-foreground ${sizeMap[size]} ${color ?? ''} ${className}`}
    >
      <AvatarPrimitive.Image
        src={src}
        alt={alt ?? fallback ?? 'Avatar'}
        className="h-full w-full object-cover"
      />
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center"
        delayMs={600}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
