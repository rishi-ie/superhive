/**
 * Barrel for the runtime subfolder.
 *
 * Each module is a single-concern split out of the 882-line
 * `general-kai-runtime.ts` god class. The orchestrator class still owns
 * state (Maps) and shared broadcast/state-machine/readiness helpers;
 * the high-level lifecycle methods delegate to these functions.
 *
 * No logic lives here. Add a new module? Re-export it below.
 */
export * from './spawn'
export * from './event-router'
export * from './telemetry-wiring'
export * from './settings-watcher'
export * from './chat-persistence'
