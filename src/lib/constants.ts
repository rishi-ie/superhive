/**
 * Lucide icon stroke width used across all icon components.
 */
export const STROKE_WIDTH = 1.5;

// ─── Panel sizing ────────────────────────────────────────────────────────────

/** Default width of the left navigation panel in pixels. */
export const DEFAULT_LEFT_WIDTH = 280;

/** Default width of the right auxiliary panel in pixels. */
export const DEFAULT_RIGHT_WIDTH = 340;

/** Minimum allowed width of the left navigation panel. */
export const MIN_LEFT_WIDTH = 180;

/** Maximum allowed width of the left navigation panel. */
export const MAX_LEFT_WIDTH = 400;

/** Minimum allowed width of the right auxiliary panel. */
export const MIN_RIGHT_WIDTH = 200;

/** Maximum allowed width of the right auxiliary panel. */
export const MAX_RIGHT_WIDTH = 500;

// ─── Token / cost math ───────────────────────────────────────────────────────

/** Cost per token (in dollars) for assistant messages, used in ChatView session cost calculation. */
export const COST_PER_TOKEN = 0.00001;

/** Estimated cost per task (in dollars) per token, used in ControlMatrix. */
export const COST_PER_TASK = 0.00003;
