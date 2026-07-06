export type EnsureTemplateResult =
  | { ok: true; path: string; cloned: boolean }
  | { ok: false; path: string; error: string }
