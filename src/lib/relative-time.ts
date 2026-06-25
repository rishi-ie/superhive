/**
 * Format a timestamp as a human-readable relative time string.
 *
 * @param input - Date object or time-only string like "11:42 AM"
 * @returns e.g. "just now", "3m ago", "2h ago", "1d ago"
 */
export function formatRelativeTime(input: Date | string): string {
  let date: Date;
  if (typeof input === 'string') {
    // Handle time-only strings like "11:42 AM" by prefixing with today's date
    const today = new Date().toDateString();
    date = new Date(`${today} ${input}`);
    if (isNaN(date.getTime())) {
      // Fallback: treat as already formatted string
      return input;
    }
  } else {
    date = input;
  }

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
