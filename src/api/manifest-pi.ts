import type { EnsureTemplateResult } from '@/types/electron';

export const manifestPi = {
  ensureTemplate: (): Promise<EnsureTemplateResult> =>
    window.api.manifestPi.ensureTemplate(),
  checkTemplate: (): Promise<{ ok: boolean; path: string }> =>
    window.api.manifestPi.checkTemplate(),
};