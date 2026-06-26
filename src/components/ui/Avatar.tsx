/**
 * User avatar with image fallback to initials.
 */
import type { HTMLAttributes } from 'react';
import { getInitials } from '@/lib/initials';

type AvatarSize = 'xs' | 'xs2' | 'xs3' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  fallback?: string;
  name?: string;
  color?: string;
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
 * @param color - Additional CSS classes for background color (e.g. "bg-chart-2")
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
  ...rest
}: AvatarProps) {
  const initials = fallback ?? (name ? getInitials(name) : '?');

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-sidebar-accent border border-sidebar-border font-bold text-sidebar-accent-foreground overflow-hidden ${sizeMap[size]} ${color ?? ''} ${className}`}
      {...rest}
    >
      {src ? (
        <img src={src} alt={alt ?? fallback ?? 'Avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
