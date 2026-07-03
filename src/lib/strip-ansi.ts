/**
 * Strip common ANSI escape sequences from a string.
 *
 * Used by ChatMessage as defense-in-depth so an accidental raw escape leaking
 * from a buffered PTY chunk doesn't render as control characters. The agent
 * process manager also strips ANSI at source.
 *
 * Handles CSI color/mode escapes (ESC [ ... letter), OSC (ESC ]), and basic
 * 7-bit escape forms.
 */
const ANSI_REGEX = /\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-_]/g;

export function stripAnsi(input: string): string {
  return input.replace(ANSI_REGEX, '');
}
