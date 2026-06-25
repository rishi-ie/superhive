/**
 * User avatar with image fallback to initials.
 */
import type { HTMLAttributes } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  fallback?: string;
};

const sizeMap: Record<AvatarSize, string> = {
  xs: 'size-6 text-[9px]',
  sm: 'size-8 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-sm',
  xl: 'size-20 text-xl',
};

/**
 * User avatar with image fallback to initials.
 * @param size - Avatar size: xs, sm, md, lg, or xl
 * @param src - Image URL
 * @param alt - Image alt text
 * @param fallback - Name used to generate initials
 */
export function Avatar({ size = 'md', src, alt, fallback, className = '', ...rest }: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-sidebar-accent border border-sidebar-border font-bold text-sidebar-accent-foreground overflow-hidden ${sizeMap[size]} ${className}`}
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
