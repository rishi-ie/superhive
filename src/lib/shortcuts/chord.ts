/**
 * Chord normalization and platform-aware chord formatting.
 *
 * A chord is a string like "Mod+k", "Mod+Shift+[", "Escape", "Enter".
 * Mod is the cross-platform "primary modifier": Cmd on Mac, Ctrl elsewhere.
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
