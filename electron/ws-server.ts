/**
 * WebSocket host server — runs inside Electron main process.
 * Listens on ws://127.0.0.1:7711 and forwards agent messages to handlers.
 */
import { WebSocketServer, type WebSocket } from 'ws';
import log from 'electron-log/main';
import { handleAgentMessage, type AgentMessage } from './agent-handler';

const WS_PORT = 7711;
const HEARTBEAT_TIMEOUT_MS = 60_000;

type Client = {
  ws: WebSocket;
  ulid?: string;
  lastSeen: number;
};

let wss: WebSocketServer | null = null;
const clients = new Map<WebSocket, Client>();

function heartbeat() {
  const now = Date.now();
  for (const [ws, client] of clients.entries()) {
    if (now - client.lastSeen > HEARTBEAT_TIMEOUT_MS) {
      log.info(`WS: dropping silent client (ulid=${client.ulid ?? '?'})`);
      try { ws.terminate(); } catch { /* ignore */ }
      clients.delete(ws);
    }
  }
}

export function startWsServer(): void {
  if (wss) return;
  wss = new WebSocketServer({ port: WS_PORT, host: '127.0.0.1' });
  log.info(`WS server listening on ws://127.0.0.1:${WS_PORT}`);

  wss.on('connection', (ws) => {
    const client: Client = { ws, lastSeen: Date.now() };
    clients.set(ws, client);
    log.info('WS: client connected');

    ws.on('message', async (raw) => {
      client.lastSeen = Date.now();
      let msg: { type?: string; ulid?: string; [k: string]: unknown };
      try {
        msg = JSON.parse(raw.toString());
      } catch (err) {
        log.warn(`WS: invalid JSON: ${err}`);
        return;
      }
      if (!msg.type) {
        log.warn('WS: message missing type');
        return;
      }
      if (msg.ulid) client.ulid = msg.ulid;
      try {
        await handleAgentMessage(msg as AgentMessage, { ulid: client.ulid, send: (m) => ws.send(JSON.stringify(m)) });
      } catch (err) {
        log.error(`WS: handler error: ${err}`);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      log.info(`WS: client disconnected (ulid=${client.ulid ?? '?'})`);
    });

    ws.on('error', (err) => {
      log.error(`WS: socket error: ${err.message}`);
    });
  });

  setInterval(heartbeat, 10_000).unref();
}

export function stopWsServer(): void {
  if (!wss) return;
  for (const ws of clients.keys()) {
    try { ws.close(); } catch { /* ignore */ }
  }
  clients.clear();
  wss.close();
  wss = null;
}
