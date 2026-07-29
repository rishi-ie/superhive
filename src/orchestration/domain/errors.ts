export class OrchestrationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'OrchestrationError'
  }
}

export function invariant(
  condition: unknown,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): asserts condition {
  if (!condition) throw new OrchestrationError(code, message, details)
}

