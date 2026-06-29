/**
 * Platform detection — determines if the user is on Mac, Windows, Linux, or unknown.
 * Used to render OS-native modifier symbols (⌘ on Mac, Ctrl elsewhere) and apply
 * Mac-vs-other behavior (e.g. `Mod` = Cmd on Mac, Ctrl elsewhere).
 */
import { useState, useEffect } from 'react';

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown';

/**
 * Detect the current platform once. Cached at module load.
 * Browser-only — uses `navigator` which is unavailable during SSR.
 */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'unknown';
  // Use userAgentData if available (Chromium), fall back to UA string parsing
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platformHint = uaData?.platform ?? navigator.userAgent ?? '';
  if (/Mac|iPhone|iPad/i.test(platformHint)) return 'mac';
  if (/Win/i.test(platformHint)) return 'windows';
  if (/Linux|X11/i.test(platformHint)) return 'linux';
  return 'unknown';
}

/**
 * React hook variant — returns the detected platform. Stable across renders.
 * Re-resolves on the client only (SSR-safe).
 */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>('unknown');
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);
  return platform;
}

export const isMac = (p: Platform) => p === 'mac';
export const isWindows = (p: Platform) => p === 'windows';
export const isLinux = (p: Platform) => p === 'linux';
