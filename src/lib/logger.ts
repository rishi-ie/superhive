const SCOPE = {
  db: '[db]',
  picker: '[picker]',
  hooks: '[hooks]',
  query: '[query]',
  view: '[view]',
} as const;

type Scope = keyof typeof SCOPE;

export function log(scope: Scope, msg: string, data?: unknown) {
  // eslint-disable-next-line no-console
  console.log(`${SCOPE[scope]} ${msg}`, data ?? '');
}

export function logError(scope: Scope, msg: string, err: unknown) {
  // eslint-disable-next-line no-console
  console.error(`${SCOPE[scope]} ${msg}`, err);
}

export function describePgError(
  err: unknown
): {
  message: string;
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  query?: string;
} {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    return {
      message: String(e.message ?? err),
      code: typeof e.code === 'string' ? e.code : undefined,
      detail: typeof e.detail === 'string' ? e.detail : undefined,
      hint: typeof e.hint === 'string' ? e.hint : undefined,
      position: typeof e.position === 'string' ? e.position : undefined,
      query: typeof e.query === 'string' ? e.query : undefined,
    };
  }
  return { message: String(err) };
}
