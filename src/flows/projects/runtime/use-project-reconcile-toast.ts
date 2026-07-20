/**
 * Surfaces a Sonner toast for every project that the main process
 * hard-deleted because its folder vanished from disk.
 *
 * Mount this once at the app shell. The hook owns its own listener
 * lifecycle: a single subscription per app session, deduped across
 * projects that get reported more than once (the watcher can re-fire
 * `projects:folder-missing` on rapid bursts of fs events).
 */

import * as React from 'react';
import { toast } from 'sonner';
import { projects } from '@/api/projects';

const SEEN_KEY = 'superhive:project-folder-missing:seen';

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) return new Set(arr.filter((v): v is string => typeof v === 'string'));
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveSeen(seen: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore */
  }
}

export function useProjectReconcileToast(): void {
  React.useEffect(() => {
    const seen = loadSeen();
    const off = projects.onFolderMissing((removed) => {
      if (!Array.isArray(removed)) return;
      for (const r of removed) {
        if (!r || typeof r.id !== 'string') continue;
        // Dedup across rapid watcher re-fires within a single session.
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        toast.warning(`Project "${r.name}" removed`, {
          description: 'Folder is no longer on disk.',
        });
      }
      saveSeen(seen);
    });
    return () => {
      off();
    };
  }, []);
}