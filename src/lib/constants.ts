/**
 * Cross-bundle constants — values that must match between the renderer
 * and the main process. Lives in `src/lib/` (not `electron/`) so both
 * the renderer (`src/`) and the main process (`electron/`) can import
 * it. Vite resolves `../src/lib/constants` from the electron tree.
 *
 * Constants that are renderer-only or main-only should live in
 * `src/hooks/` or `electron/config.ts` respectively.
 */

/**
 * Maximum number of messages kept in the in-memory agent chat queue.
 * Also the cap used by the main process when trimming the on-disk chat
 * log (`general-kai-runtime.ts`). Both sides must agree — the queue
 * keeps at most this many in-flight messages, the disk keeps at most
 * this many historical messages. The shared value lets the comment
 * "Cap matches disk trim" stay true.
 */
export const AGENT_CHAT_MESSAGE_CAP = 5000

/**
 * How long `waitForAgentReady` polls before declaring the runtime
 * stuck. The default applies when the caller passes no `timeoutMs`.
 */
export const AGENT_READY_TIMEOUT_MS = 15_000

/**
 * How long `waitForAgentReady` sleeps between polls. 300ms is the
 * sweet spot between liveness (sub-second ack of ready) and IPC
 * pressure (don't pound the main process).
 */
export const AGENT_READY_POLL_MS = 300
