/**
 * Agent message handlers — invoked by the WS server for each incoming message.
 * Handles AGENT_HELLO, AGENT_STATE, HEARTBEAT, PERMISSION_REQUEST, INTER_AGENT_MESSAGE,
 * TICKET_PROPOSAL, SUBAGENT_SPAWN_REQUEST.
 */
import log from 'electron-log/main';
import { BrowserWindow } from 'electron';

type SenderContext = {
  ulid?: string;
  send: (msg: Record<string, unknown>) => void;
};

type AgentMessage = {
  type: string;
  ulid?: string;
  [k: string]: unknown;
};

export type { AgentMessage };

export async function handleAgentMessage(msg: AgentMessage, ctx: SenderContext): Promise<void> {
  const { type } = msg;

  switch (type) {
    case 'AGENT_HELLO':
      ctx.ulid = (msg.ulid as string) ?? ctx.ulid;
      log.info(`AGENT_HELLO from ulid=${ctx.ulid} name=${msg.name}`);
      ctx.send({ type: 'AGENT_HELLO_ACK', ulid: ctx.ulid, ts: Date.now() });
      broadcastToRenderer({ type: 'agent:hello', ulid: ctx.ulid, payload: msg });
      return;

    case 'HEARTBEAT':
      broadcastToRenderer({ type: 'agent:heartbeat', ulid: ctx.ulid, ts: Date.now() });
      return;

    case 'AGENT_STATE':
      broadcastToRenderer({ type: 'agent:state', ulid: ctx.ulid, payload: msg });
      return;

    case 'PERMISSION_REQUEST': {
      log.info(`PERMISSION_REQUEST from ulid=${ctx.ulid} action=${msg.action}`);
      const id = `pr-${Date.now().toString(36)}`;
      ctx.send({ type: 'PERMISSION_REQUEST_ACK', id });
      broadcastToRenderer({
        type: 'permission:request',
        id,
        ulid: ctx.ulid,
        action: msg.action,
        toolName: msg.toolName ?? null,
        args: msg.args ?? null,
        ts: Date.now(),
      });
      return;
    }

    case 'INTER_AGENT_MESSAGE':
      log.info(`INTER_AGENT_MESSAGE from ulid=${ctx.ulid} to=${msg.to}`);
      broadcastToRenderer({
        type: 'agent:message',
        from: ctx.ulid,
        to: msg.to,
        body: msg.body,
        ts: Date.now(),
      });
      return;

    case 'TICKET_PROPOSAL':
      log.info(`TICKET_PROPOSAL from ulid=${ctx.ulid}`);
      broadcastToRenderer({
        type: 'ticket:proposal',
        ulid: ctx.ulid,
        proposal: msg.proposal,
        ts: Date.now(),
      });
      return;

    case 'SUBAGENT_SPAWN_REQUEST':
      log.info(`SUBAGENT_SPAWN_REQUEST from ulid=${ctx.ulid} kind=${msg.kind}`);
      broadcastToRenderer({
        type: 'subagent:spawn-request',
        ulid: ctx.ulid,
        name: msg.name,
        kind: msg.kind,
        description: msg.description,
        ts: Date.now(),
      });
      return;

    default:
      log.warn(`WS: unknown message type: ${type}`);
  }
}

function broadcastToRenderer(payload: Record<string, unknown>): void {
  const wins = BrowserWindow.getAllWindows();
  for (const win of wins) {
    if (win.isDestroyed()) continue;
    try {
      win.webContents.send('ws:event', payload);
    } catch (err) {
      log.warn(`WS: failed to send to renderer: ${err}`);
    }
  }
}
