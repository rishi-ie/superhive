/**
 * Returns the singular or plural form of a word based on count.
 * @param count - The number to base plurality on
 * @param singular - Singular form (e.g. "ticket")
 * @param plural - Optional plural form (defaults to singular + "s")
 * @returns The appropriate form of the word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}
