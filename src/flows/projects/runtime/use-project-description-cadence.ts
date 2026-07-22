/**
 * Cadence policy for the coordinator's project description.
 *
 * The right sidebar's project overview tab reads its description from the
 * coordinator's truth settings (`project.description`). The coordinator is
 * the only writer — it calls the `update_project_description` truth tool
 * whenever it has a clear-enough read on what the project is. This flow
 * decides WHEN to nudge it.
 *
 * Rule (one line): every `INTERACTIONS_BEFORE_DESCRIPTION_REFRESH`
 * user turns with the coordinator, the flow sends a one-shot reminder
 * asking the coordinator to refresh its project description. The reminder
 * is throttled by `REMINDER_COOLDOWN_MS` so we don't spam if the agent
 * takes a long time to respond (or ignores the nudge).
 *
 * The reminder rides on the existing `agents.send` IPC channel as a
 * synthetic user message. No new IPC, no new contract — the user will see
 * a clearly framed "system reminder" line in the chat, which is
 * intentional transparency.
 *
 * Mount this hook once per project-coordinator session from
 * `ProjectChatView` (after the agent is `ready`). The hook is a no-op for
 * non-coordinator agents; the `agentKind` check is the caller's job.
 */

import * as React from 'react';
import type { AgentStatus, ChatRow } from '@/types/electron';
import { agents } from '@/api/agents';
import { buildProjectDescriptionReminder } from './prompt-project-description-update';

/**
 * One reminder fires every N user messages with the coordinator. Bumping
 * this number makes the description refresh less often; lowering it makes
 * it refresh sooner. Keep it above the typical "first impression" window
 * so the agent has enough context to write a real description (vs. an
 * empty guess after the first turn).
 */
export const INTERACTIONS_BEFORE_DESCRIPTION_REFRESH = 5;

/**
 * Minimum gap between two reminders on the same coordinator, regardless
 * of how fast user turns arrive. Prevents a chatty session from queuing
 * five reminders before the coordinator finishes its first response.
 */
const REMINDER_COOLDOWN_MS = 10 * 60 * 1000;

interface UseProjectDescriptionCadenceInput {
  agentId: string | null;
  /** Live status from `useAgentRuntime`. We only fire while idle/active,
   *  never while busy — sending into a busy agent queues another turn
   *  and confuses the cadence math. */
  status: AgentStatus | undefined;
  /** Live message list from `useAgentRuntime`. We count user rows only. */
  messages: ChatRow[];
  /**
   * True iff the agent already has a non-empty project description in
   * its truth settings. When true, we still nudge on cadence but the
   * reminder phrasing shifts to "refresh" instead of "set".
   */
  hasDescription: boolean;
}

export function useProjectDescriptionCadence({
  agentId,
  status,
  messages,
  hasDescription,
}: UseProjectDescriptionCadenceInput): void {
  const lastFiredAtRef = React.useRef<number>(0);
  const lastFiredCountRef = React.useRef<number>(0);

  const userMessageCount = React.useMemo(
    () => messages.reduce((n, m) => (m.role === 'user' ? n + 1 : n), 0),
    [messages],
  );

  React.useEffect(() => {
    if (!agentId) return;
    if (status !== 'idle' && status !== 'active') return;
    if (userMessageCount < INTERACTIONS_BEFORE_DESCRIPTION_REFRESH) return;

    // Skip until the user has sent at least one more message since the
    // last reminder we dispatched — otherwise the effect re-fires every
    // render and we'd queue reminders back-to-back.
    if (userMessageCount <= lastFiredCountRef.current) return;

    const now = Date.now();
    if (now - lastFiredAtRef.current < REMINDER_COOLDOWN_MS) return;

    lastFiredAtRef.current = now;
    lastFiredCountRef.current = userMessageCount;

    const text = buildProjectDescriptionReminder({
      hasExistingDescription: hasDescription,
      interactions: userMessageCount,
      threshold: INTERACTIONS_BEFORE_DESCRIPTION_REFRESH,
    });

    agents.send(agentId, text).catch(() => {
      // Best-effort. The cadence will re-fire on the next eligible turn.
      lastFiredCountRef.current = userMessageCount - 1;
    });
  }, [agentId, status, userMessageCount, hasDescription]);
}
