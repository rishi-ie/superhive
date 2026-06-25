/**
 * Derives a two-character initials string from a full name.
 * @param name - Full name (e.g. "Elena Rodriguez")
 * @returns Two-character uppercase initials (e.g. "ER")
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
