/**
 * Chord normalization, parsing, and event matching.
 *
 * A chord is a string like "Mod+k", "Mod+Shift+[", "Escape", "Enter".
 * Mod is the cross-platform "primary modifier": Cmd on Mac, Ctrl elsewhere.
 * Meta means Cmd on any OS. Used directly only when cross-platform Cmd is needed.
 */

export type Modifier = 'Mod' | 'Shift' | 'Alt' | 'Meta';

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

/** A chord with platform variants. Most shortcuts use the same binding across OSes. */
export type Chord = {
  mac: string;
  default: string;
};

const MODIFIER_ORDER: Modifier[] = ['Mod', 'Meta', 'Alt', 'Shift'];

/**
 * Parse a chord string into its canonical ordered form: "Mod+Shift+k".
 * Throws on invalid input (in dev) to surface typos in the registry.
 */
export function normalizeChord(chord: string): string {
  const parts = chord.split('+').map(p => p.trim()).filter(Boolean);
  const modifiers: Modifier[] = [];
  let main: string | null = null;
  for (const part of parts) {
    if (part === 'Mod' || part === 'Shift' || part === 'Alt' || part === 'Meta') {
      if (!modifiers.includes(part as Modifier)) modifiers.push(part as Modifier);
    } else {
      main = part;
    }
  }
  if (!main) throw new Error(`Invalid chord (no main key): "${chord}"`);
  modifiers.sort((a, b) => MODIFIER_ORDER.indexOf(a) - MODIFIER_ORDER.indexOf(b));
  return [...modifiers, main].join('+');
}

/** Return the chord string for the current platform. */
export function chordForPlatform(chord: Chord, platform: Platform): string {
  return platform === 'mac' ? chord.mac : chord.default;
}

/** Re-export so callers only need to import from this module. */
export function matchesEvent(event: KeyboardEvent, chord: string, platform: Platform): boolean {
  const expected = normalizeChord(chord);
  const actual = eventToChord(event, platform);
  return expected === actual;
}

/**
 * Convert a KeyboardEvent into a canonical chord string in the same format as
 * `normalizeChord`. This is the inverse of `normalizeChord` and the canonical
 * way to compare against registered chords.
 */
export function eventToChord(event: KeyboardEvent, platform: Platform): string {
  const main = mainKeyFromEvent(event);
  if (!main) return '';

  const modifiers: Modifier[] = [];
  // Mod = Cmd on Mac, Ctrl elsewhere. We don't add both — a chord with `Mod`
  // matches when the right key for the platform is pressed.
  if (platform === 'mac' ? event.metaKey : event.ctrlKey) modifiers.push('Mod');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');

  if (modifiers.length === 0) return main;
  return [...modifiers, main].join('+');
}

/**
 * Extract the "main" key name from a KeyboardEvent.
 * - Letter keys → 'k', 'K' (we lowercase for canonical form)
 * - Digits      → '1', '2'
 * - Punctuation → '[' ']' ',' '.' '/' '?' '\\' ';' '\' etc.
 * - Named       → 'Enter', 'Escape', 'Tab', 'Space'
 * - Arrow       → 'ArrowUp' etc.
 * Returns '' if the event has no meaningful main key (e.g. modifier-only press).
 */
function mainKeyFromEvent(event: KeyboardEvent): string {
  const { key, code } = event;

  // Ignored keys (no shortcut binding)
  if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta') return '';
  if (key === 'CapsLock' || key === 'NumLock') return '';
  if (key === 'Dead' || key === 'Process' || key === 'Unidentified') return '';

  // Named keys
  if (key === 'Enter' || key === 'Escape' || key === 'Tab' || key === ' ') {
    return key === ' ' ? 'Space' : key;
  }

  if (key.startsWith('Arrow')) return key; // 'ArrowUp', 'ArrowDown', etc.

  // Single character keys — lowercase for canonical comparison
  if (key.length === 1) return key.toLowerCase();

  // Function keys
  if (/^F\d{1,2}$/.test(key)) return key;

  // Fallback: use `code` for keys where `key` is unreliable (e.g. NumpadEnter)
  if (code) return code;
  return '';
}

/**
 * Is the active element a text input / textarea / contenteditable?
 * Shortcuts with `scope === 'global'` (default) should not fire while the user
 * is typing.
 */
export function isInputTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Is a Radix Dialog currently open? Radix marks the dialog content with
 * `data-state="open"` and the modal portal mounts onto the body.
 */
export function isDialogOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return !!document.querySelector('[role="dialog"][data-state="open"], dialog[open]');
}
