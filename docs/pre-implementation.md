# Pre-Implementation Plan: Project-Agent MVP (L1)

> **Source of truth for execution.** Do tasks in order. Each task is self-contained — no prior context needed beyond the file paths.
>
> **Total: 35 tasks, ~5 hours** (5–10 min each)

---

## Overview

**What we're building:** When a user creates a Project, a project-agent (Agent record) and a Channel are auto-created. The user can open ProjectChatView, chat with the project-agent, and messages persist to a JSONL file per channel.

**What's NOT in scope (L3+):** Automatic task routing, agent runtime kickoff, LLM-powered responses.

**Architectural principle:** Project-agent uses the same Agent engine as regular agents. Channel is a first-class entity. All side effects live in `src/flows/`. UI components never import from `@/api/*`.

---

## Architecture

```
User creates Project
  └─ create-project flow (M4)
       ├─ projects.create()        → Project record
       ├─ createProjectAgent()      → Agent (agentKind: 'project-coordinator')
       └─ createChannel()          → Channel (type: 'project') + initial JSONL file

User opens /projects/:projectId
  └─ ProjectChatView (M6)
       ├─ ProjectChatHeader         (project name + member count)
       ├─ ProjectChatConversation  (messages from JSONL file)
       ├─ ProjectChatInput         (send → appendMessage → JSONL)
       └─ RightSidebar → ProjectRosterPanel (assigned agents, passive)

Channel messages:
  Renderer → flow → window.api.channels.* → IPC → electron/ipc/channels.ts → fs
```

---

## Locked Decisions

| # | Decision |
|---|---|
| 1 | Project-agent is an `Agent` record with `agentKind: 'project-coordinator'` |
| 2 | Project-agent folder lives at `<project.localPath>/.agent/` |
| 3 | Channel file lives at `~/.superhive/channels/<channelId>.jsonl` |
| 4 | Message shape: `{ id, senderType: 'user'|'agent'|'system', senderId, content, timestamp }` |
| 5 | Chat file format: JSON Lines (one JSON object per line, append-only) |
| 6 | Initial system message: `"Welcome to {project.name}. I'm the project coordinator."` |
| 7 | Project-agent is NOT started on create — runtime stays idle until user clicks Start |
| 8 | Assigned-agent roster is passive (read-only display, no action) in L1 |

---

## Module Map

| Module | Tasks | Purpose |
|--------|-------|---------|
| **M1** | T1.1–T1.4 | Storage model: add `agentKind` to Agent type + repo |
| **M2** | T2.1–T2.2 | `createProjectAgent` reusable flow |
| **M3** | T3.1–T3.10 | Channel IPC (main process) + preload + types + API wrapper + flows |
| **M4** | T4.1–T4.3 | Update `create-project` to orchestrate project-agent + channel creation |
| **M5** | T5.1–T5.4 | Update `CreateProjectDialog` UI with agent folder name field |
| **M6** | T6.1–T6.8 | `ProjectChatView` + 4 components + right sidebar wiring |
| **M7** | T7.1–T7.2 | Roster + project-agent lookup helpers |
| **M8** | T8.1–T8.2 | End-to-end manual test + final checks |

---

## M1: Storage Model

### T1.1 — Add `AgentKind` type + field to `Agent` interface
**Time:** 10 min
**Goal:** Tag agents as `'standard'` or `'project-coordinator'` via a type-safe union.

**Files:**
- `src/storage/types.ts`

**Steps:**
1. Open `src/storage/types.ts`
2. After line 1 (`export type AgentStatus = ...`), add:
   ```ts
   export type AgentKind = 'standard' | 'project-coordinator'
   ```
3. In the `Agent` interface (around line 25), after `sessionIds: string[]`, add:
   ```ts
   agentKind?: AgentKind
   ```

**Verification:**
```bash
bun run typecheck
```
Expect: clean exit, zero errors.

**Done when:** `rg "AgentKind" src/storage/types.ts` shows the new type + field.

---

### T1.2 — Update `AgentRepository.create()` to accept `agentKind`
**Time:** 10 min
**Goal:** Allow creating agents with an explicit `agentKind`.

**Files:**
- `src/storage/repositories/AgentRepository.ts`

**Steps:**
1. Open `src/storage/repositories/AgentRepository.ts`
2. Find the `create` method. It should accept `Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>`
3. Add `agentKind` to the accepted fields. If the create signature already spreads the input directly (common LowDB pattern), just ensure `agentKind` is part of the object being written. Since `Agent` interface now has `agentKind?: AgentKind`, it will serialize automatically.
4. No structural changes needed if using `Object.assign` or spread — the type change from T1.1 handles it.

**Verification:**
```bash
bun run typecheck
bun run build
```
Expect: both clean.

**Done when:** AgentRepository.create() works with `agentKind` in the input object.

---

### T1.3 — Update `seed.ts` to handle existing agents lacking `agentKind`
**Time:** 5 min
**Goal:** Ensure legacy agents (created before this schema) default to `agentKind: 'standard'` on load.

**Files:**
- `src/storage/seed.ts`

**Steps:**
1. Open `src/storage/seed.ts`
2. After loading agents from the database (or creating default), add a normalization step:
   ```ts
   // Normalize agentKind for any agents created before this field existed
   const agents = db.get('agents').value()
   let modified = false
   for (const agent of agents) {
     if (agent.agentKind === undefined) {
       agent.agentKind = 'standard'
       modified = true
     }
   }
   if (modified) {
     db.write()
   }
   ```
3. Place this after the agents are loaded but before returning.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "agentKind" src/storage/seed.ts` shows the normalization logic.

---

### T1.4 — Verify storage layer end-to-end
**Time:** 5 min
**Goal:** Confirm the full LowDB read/write cycle works with the new field.

**Files:** (no file changes — run existing reset script)

**Steps:**
1. Run the existing reset script to verify the database layer boots cleanly:
   ```bash
   bun run scripts/reset-superhive.ts
   ```
   (If no reset script exists, skip to typecheck verification below.)
2. Run typecheck to confirm no regressions:
   ```bash
   bun run typecheck
   ```

**Verification:**
```bash
bun run typecheck
bun run build
```
Expect: both clean.

**Done when:** typecheck and build both pass with zero errors.

---

## M2: `createProjectAgent` Flow

### T2.1 — Create `createProjectAgent` flow
**Time:** 10 min
**Goal:** Reusable flow that creates an Agent with `agentKind: 'project-coordinator'`. Mirrors `create-agent` pattern but flags the agent as a project coordinator.

**Files:**
- `src/flows/agents/crud/create-project-agent.ts` **(new)**

**Steps:**
1. Create `src/flows/agents/crud/create-project-agent.ts`
2. Write:
   ```ts
   import { agents } from '@/api/agents';
   import { toast } from 'sonner';
   import type { Agent } from '@/types/electron';

   export interface CreateProjectAgentInput {
     name: string;
     folderName: string;
     parentDir: string;
   }

   export interface CreateProjectAgentResult {
     ok: boolean;
     agent?: Agent;
     error?: string;
   }

   export async function createProjectAgent(
     input: CreateProjectAgentInput,
   ): Promise<CreateProjectAgentResult> {
     const name = input.name?.trim();
     const folderName = input.folderName?.trim();
     const parentDir = input.parentDir?.trim();

     if (!name) {
       toast.error('Project agent name is required');
       return { ok: false, error: 'Project agent name is required' };
     }
     if (!folderName) {
       toast.error('Project agent folder name is required');
       return { ok: false, error: 'Project agent folder name is required' };
     }
     if (!parentDir) {
       toast.error('Parent directory is required');
       return { ok: false, error: 'Parent directory is required' };
     }

     try {
       const agent = await agents.create({
         name,
         folderName,
         parentDir,
         // agentKind is set inside agents.create() — see T3.2 (API wrapper)
       });
       return { ok: true, agent };
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to create project agent';
       toast.error(message);
       return { ok: false, error: message };
     }
   }
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/flows/agents/crud/create-project-agent.ts` exists and typecheck passes.

---

### T2.2 — Export `createProjectAgent` from agents CRUD barrel
**Time:** 5 min
**Goal:** Make `createProjectAgent` importable from `@/flows/agents/crud`.

**Files:**
- `src/flows/agents/crud/index.ts`

**Steps:**
1. Open `src/flows/agents/crud/index.ts`
2. Add a new export line:
   ```ts
   export { createProjectAgent } from './create-project-agent';
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "createProjectAgent" src/flows/agents/crud/index.ts` shows the export.

---

## M3: Channel IPC + Flows

### T3.1 — Add `ChannelsAPI` interface to `electron.d.ts`
**Time:** 10 min
**Goal:** Declare the IPC contract for channel operations so the renderer can call them type-safely.

**Files:**
- `src/types/electron.d.ts`

**Steps:**
1. Open `src/types/electron.d.ts`
2. Find where `AppAPI` is defined (around the bottom of the file). Add this interface **before** `AppAPI`:
   ```ts
   export interface ChannelMessage {
     id: string;
     senderType: 'user' | 'agent' | 'system';
     senderId: string;
     content: string;
     timestamp: number;
   }

   export interface Channel {
     id: string;
     name: string;
     type: 'project' | 'agent' | 'system';
     projectId?: string;
     participantAgentIds: string[];
     startedAt?: number;
     endedAt?: number;
     chatFile: string;
     createdAt: number;
     updatedAt: number;
   }

   export interface CreateChannelInput {
     name: string;
     type: Channel['type'];
     projectId?: string;
     participantAgentIds: string[];
   }

   export interface ChannelsAPI {
     create(input: CreateChannelInput): Promise<Channel>;
     get(id: string): Promise<Channel | null>;
     list(): Promise<Channel[]>;
     appendMessage(channelId: string, message: Omit<ChannelMessage, 'id' | 'timestamp'>): Promise<ChannelMessage>;
     readMessages(channelId: string): Promise<ChannelMessage[]>;
   }
   ```
3. In `ElectronAPI`, add `channels: ChannelsAPI` to the interface.

**Verification:**
```bash
bun run typecheck
```
Expect: clean. The types are declared but not yet wired — that's fine.

**Done when:** `rg "ChannelsAPI" src/types/electron.d.ts` shows the interface definition.

---

### T3.2 — Add `channels.create()` to `src/api/agents.ts` → create `src/api/channels.ts`
**Time:** 10 min
**Goal:** Create the API wrapper for channel operations. Must also update `agents.create()` to accept `agentKind`.

**Files:**
- `src/api/agents.ts` **(update — add agentKind to create input)**
- `src/api/channels.ts` **(new)**

**Steps — Update `src/api/agents.ts`:**
1. Open `src/api/agents.ts`
2. Find the `create` call/input interface. Add `agentKind?: string` to the input. The LowDB repository will persist whatever is passed, so this flows through automatically.
3. Confirm the create function passes all input fields through.

**Steps — Create `src/api/channels.ts`:**
1. Create `src/api/channels.ts`
2. Write:
   ```ts
   import type { Channel, ChannelMessage, ChannelsAPI, CreateChannelInput } from '@/types/electron';

   async function create(input: CreateChannelInput): Promise<Channel> {
     return window.api.channels.create(input);
   }

   async function get(id: string): Promise<Channel | null> {
     return window.api.channels.get(id);
   }

   async function list(): Promise<Channel[]> {
     return window.api.channels.list();
   }

   async function appendMessage(
     channelId: string,
     message: Omit<ChannelMessage, 'id' | 'timestamp'>,
   ): Promise<ChannelMessage> {
     return window.api.channels.appendMessage(channelId, message);
   }

   async function readMessages(channelId: string): Promise<ChannelMessage[]> {
     return window.api.channels.readMessages(channelId);
   }

   export const channels: ChannelsAPI = {
     create,
     get,
     list,
     appendMessage,
     readMessages,
   };
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/api/channels.ts` exists and typecheck passes.

---

### T3.3 — Add barrel for `src/api/index.ts`
**Time:** 5 min
**Goal:** Export `channels` from the API barrel so flows can import from `@/api`.

**Files:**
- `src/api/index.ts`

**Steps:**
1. Open `src/api/index.ts`
2. Add: `export { channels } from './channels';`
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "channels" src/api/index.ts` shows the export.

---

### T3.4 — Create `electron/ipc/channels.ts` IPC handlers
**Time:** 15 min
**Goal:** Main-process handlers for channel CRUD + JSONL file I/O. Auto-creates `~/.superhive/channels/` if missing.

**Files:**
- `electron/ipc/channels.ts` **(new)**

**Steps:**
1. Create `electron/ipc/channels.ts`
2. Write:
   ```ts
   import { ipcMain } from 'electron';
   import { promises as fs } from 'node:fs';
   import path from 'node:path';
   import os from 'node:os';
   import { randomUUID } from 'node:crypto';
   import type { Channel, ChannelMessage, CreateChannelInput } from '../../src/types/electron';

   const CHANNELS_DIR = path.join(os.homedir(), '.superhive', 'channels');

   async function ensureChannelsDir(): Promise<void> {
     await fs.mkdir(CHANNELS_DIR, { recursive: true });
   }

   function getChannelPath(channelId: string): string {
     return path.join(CHANNELS_DIR, `${channelId}.json`);
   }

   function getChatFilePath(channelId: string): string {
     return path.join(CHANNELS_DIR, `${channelId}.jsonl`);
   }

   export function registerChannelsIpc(): void {
     // channels:create
     ipcMain.handle('channels:create', async (_, raw: CreateChannelInput) => {
       await ensureChannelsDir();
       const now = Date.now();
       const channel: Channel = {
         id: randomUUID(),
         name: raw.name,
         type: raw.type,
         projectId: raw.projectId,
         participantAgentIds: raw.participantAgentIds,
         startedAt: now,
         chatFile: getChatFilePath('').replace('_.jsonl', `${randomUUID()}.jsonl`).replace(CHANNELS_DIR, CHANNELS_DIR),
         createdAt: now,
         updatedAt: now,
       };
       // Store chatFile as the final path
       channel.chatFile = path.join(CHANNELS_DIR, `${channel.id}.jsonl`);
       const channelPath = getChannelPath(channel.id);
       await fs.writeFile(channelPath, JSON.stringify(channel, null, 2), 'utf-8');
       return channel;
     });

     // channels:get
     ipcMain.handle('channels:get', async (_, id: string) => {
       const channelPath = getChannelPath(id);
       try {
         const raw = await fs.readFile(channelPath, 'utf-8');
         return JSON.parse(raw) as Channel;
       } catch {
         return null;
       }
     });

     // channels:list
     ipcMain.handle('channels:list', async () => {
       await ensureChannelsDir();
       const files = await fs.readdir(CHANNELS_DIR);
       const channels: Channel[] = [];
       for (const file of files) {
         if (!file.endsWith('.json')) continue;
         try {
           const raw = await fs.readFile(path.join(CHANNELS_DIR, file), 'utf-8');
           channels.push(JSON.parse(raw) as Channel);
         } catch {
           // skip malformed files
         }
       }
       return channels;
     });

     // channels:append-message
     ipcMain.handle(
       'channels:append-message',
       async (_, channelId: string, raw: Omit<ChannelMessage, 'id' | 'timestamp'>) => {
         const chatPath = path.join(CHANNELS_DIR, `${channelId}.jsonl`);
         const message: ChannelMessage = {
           id: randomUUID(),
           timestamp: Date.now(),
           ...raw,
         };
         const line = JSON.stringify(message) + '\n';
         await fs.appendFile(chatPath, line, 'utf-8');
         return message;
       },
     );

     // channels:read-messages
     ipcMain.handle('channels:read-messages', async (_, channelId: string) => {
       const chatPath = path.join(CHANNELS_DIR, `${channelId}.jsonl`);
       try {
         const raw = await fs.readFile(chatPath, 'utf-8');
         const lines = raw.split('\n').filter(Boolean);
         return lines.map((line) => JSON.parse(line) as ChannelMessage);
       } catch {
         return [];
       }
     });
   }
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
bun run build
```
Expect: both clean.

**Done when:** `ls electron/ipc/channels.ts` exists and typecheck + build pass.

---

### T3.5 — Register `registerChannelsIpc()` in `electron/ipc/index.ts`
**Time:** 5 min
**Goal:** Wire the channel handlers into the IPC registry so they respond to renderer calls.

**Files:**
- `electron/ipc/index.ts`

**Steps:**
1. Open `electron/ipc/index.ts`
2. Add import: `import { registerChannelsIpc } from './channels';`
3. Call `registerChannelsIpc()` inside the `registerIpc()` function (after other registrations).
4. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "registerChannelsIpc" electron/ipc/index.ts` shows the import and call.

---

### T3.6 — Expose `channels` API in `electron/preload.ts`
**Time:** 10 min
**Goal:** Make `window.api.channels.*` available in the renderer via contextBridge.

**Files:**
- `electron/preload.ts`

**Steps:**
1. Open `electron/preload.ts`
2. Find where `agents` and `projects` are exposed on the `api` object. Add `channels` similarly:
   ```ts
   channels: {
     create: (input: unknown) => ipcRenderer.invoke('channels:create', input),
     get: (id: string) => ipcRenderer.invoke('channels:get', id),
     list: () => ipcRenderer.invoke('channels:list'),
     appendMessage: (channelId: string, message: unknown) =>
       ipcRenderer.invoke('channels:append-message', channelId, message),
     readMessages: (channelId: string) => ipcRenderer.invoke('channels:read-messages', channelId),
   },
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
bun run build
```
Expect: both clean.

**Done when:** `rg "channels" electron/preload.ts` shows all 5 channel methods.

---

### T3.7 — Create `createChannel` flow
**Time:** 10 min
**Goal:** Reusable flow that creates a Channel entity and its JSONL chat file.

**Files:**
- `src/flows/channels/crud/create-channel.ts` **(new)**

**Steps:**
1. Create `src/flows/channels/crud/create-channel.ts`
2. Write:
   ```ts
   import { channels } from '@/api/channels';
   import type { Channel, CreateChannelInput } from '@/types/electron';
   import { toast } from 'sonner';

   export interface CreateChannelResult {
     ok: boolean;
     channel?: Channel;
     error?: string;
   }

   export async function createChannel(
     input: CreateChannelInput,
   ): Promise<CreateChannelResult> {
     try {
       const channel = await channels.create(input);
       return { ok: true, channel };
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to create channel';
       toast.error(message);
       return { ok: false, error: message };
     }
   }
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/flows/channels/crud/create-channel.ts` exists and typecheck passes.

---

### T3.8 — Create `appendMessage` and `loadMessages` flows
**Time:** 10 min
**Goal:** Flows for writing and reading channel messages.

**Files:**
- `src/flows/channels/ui/append-message.ts` **(new)**
- `src/flows/channels/ui/load-messages.ts` **(new)**

**Steps — `append-message.ts`:**
1. Create `src/flows/channels/ui/append-message.ts`:
   ```ts
   import { channels } from '@/api/channels';
   import type { ChannelMessage } from '@/types/electron';

   export async function appendMessage(
     channelId: string,
     senderType: ChannelMessage['senderType'],
     senderId: string,
     content: string,
   ): Promise<ChannelMessage> {
     return channels.appendMessage(channelId, { senderType, senderId, content });
   }
   ```

**Steps — `load-messages.ts`:**
1. Create `src/flows/channels/ui/load-messages.ts`:
   ```ts
   import { channels } from '@/api/channels';
   import type { ChannelMessage } from '@/types/electron';

   export async function loadMessages(channelId: string): Promise<ChannelMessage[]> {
     return channels.readMessages(channelId);
   }
   ```

**Verification:**
```bash
bun run typecheck
```
Expect: clean for both files.

**Done when:** Both files exist and typecheck passes.

---

### T3.9 — Create all channel barrel files
**Time:** 5 min
**Goal:** Establish the channels module structure with barrels at every level.

**Files:**
- `src/flows/channels/crud/index.ts` **(new)**
- `src/flows/channels/ui/index.ts` **(new)**
- `src/flows/channels/index.ts` **(new)**

**Steps:**
1. Create `src/flows/channels/crud/index.ts`:
   ```ts
   export { createChannel } from './create-channel';
   ```
2. Create `src/flows/channels/ui/index.ts`:
   ```ts
   export { appendMessage } from './append-message';
   export { loadMessages } from './load-messages';
   ```
3. Create `src/flows/channels/index.ts`:
   ```ts
   export * from './crud';
   export * from './ui';
   ```

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/flows/channels/` shows `crud/`, `ui/`, and `index.ts`.

---

## M4: Update `create-project` Orchestration

### T4.1 — Update `create-project.ts` to import sub-flows
**Time:** 5 min
**Goal:** Import `createProjectAgent` and `createChannel` into the create-project flow.

**Files:**
- `src/flows/projects/crud/create-project.ts`

**Steps:**
1. Open `src/flows/projects/crud/create-project.ts`
2. Add imports at the top:
   ```ts
   import { createProjectAgent } from '@/flows/agents/crud/create-project-agent';
   import { createChannel } from '@/flows/channels/crud/create-channel';
   import { appendMessage } from '@/flows/channels/ui/append-message';
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean (imports added but unused — that's fine for now).

**Done when:** `rg "createProjectAgent" src/flows/projects/crud/create-project.ts` shows the import.

---

### T4.2 — Add project-agent + channel creation steps
**Time:** 15 min
**Goal:** Orchestrate multi-step creation: Project → project-agent → Channel → initial message. All errors roll back partial state.

**Files:**
- `src/flows/projects/crud/create-project.ts`

**Steps:**
1. Open `src/flows/projects/crud/create-project.ts`
2. Replace the `createProject` function body with:
   ```ts
   export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
     const name = input.name?.trim();
     const description = input.description?.trim();
     const localPath = input.localPath?.trim();

     if (!name) {
       toast.error('Project name is required');
       return { ok: false, error: 'Project name is required' };
     }

     // Step 1: Create the project
     let project: Project;
     try {
       project = await projects.create({ name, description: description || undefined, localPath: localPath || undefined });
     } catch (err) {
       const message = err instanceof Error ? err.message : 'Failed to create project';
       toast.error(message);
       return { ok: false, error: message };
     }

     // Step 2: Create the project-agent (inside project folder at .agent/)
     const agentResult = await createProjectAgent({
       name: `${name} (Coordinator)`,
       folderName: '.agent',
       parentDir: localPath || `~/.superhive/projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
     });
     if (!agentResult.ok || !agentResult.agent) {
       // Rollback project
       await projects.delete(project.id).catch(() => {});
       return { ok: false, error: agentResult.error ?? 'Failed to create project agent', project };
     }
     const projectAgent = agentResult.agent;

     // Step 3: Create the channel
     const channelResult = await createChannel({
       name: `${name} coordination`,
       type: 'project',
       projectId: project.id,
       participantAgentIds: [projectAgent.id],
     });
     if (!channelResult.ok || !channelResult.channel) {
       // Rollback project + agent
       await projects.delete(project.id).catch(() => {});
       await agents.delete(projectAgent.id).catch(() => {});
       return { ok: false, error: channelResult.error ?? 'Failed to create channel', project };
     }
     const channel = channelResult.channel;

     // Step 4: Write initial system message
     try {
       await appendMessage(channel.id, 'system', projectAgent.id, `Welcome to ${name}. I'm the project coordinator.`);
     } catch {
       // Non-fatal: channel exists, message file will start empty
     }

     toast.success(`Project "${project.name}" created`);
     return { ok: true, project };
   }
   ```
3. Also update the `CreateProjectInput` interface to include `agentFolderName` and `agentParentDir` fields:
   ```ts
   export interface CreateProjectInput {
     name: string;
     description?: string;
     localPath?: string;
     agentFolderName?: string;  // defaults to '.agent'
     agentParentDir?: string;  // defaults to localPath
   }
   ```
4. Use `input.agentFolderName ?? '.agent'` and `input.agentParentDir ?? localPath` in the `createProjectAgent` call.
5. Save the file.

**Verification:**
```bash
bun run typecheck
bun run build
```
Expect: both clean.

**Done when:** `rg "Step 1" src/flows/projects/crud/create-project.ts` shows the 4-step orchestration.

---

### T4.3 — Update `projects.create()` to accept `agentFolderName` + `agentParentDir`
**Time:** 5 min
**Goal:** The `projects.create()` API must forward the new fields through to `createProject`.

**Files:**
- `src/api/projects.ts`

**Steps:**
1. Open `src/api/projects.ts`
2. Find the `CreateProjectInput` interface and the `create()` function.
3. Add `agentFolderName?: string` and `agentParentDir?: string` to the input interface.
4. Ensure `create()` passes all fields through to the IPC call.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "agentFolderName" src/api/projects.ts` shows the new fields.

---

## M5: Update CreateProjectDialog UI

### T5.1 — Add `agentFolderName` state + field to CreateProjectDialog
**Time:** 10 min
**Goal:** Add an input field for the project agent folder name, auto-slugified from the project name.

**Files:**
- `src/pages/project-chat/dialogs/CreateProjectDialog.tsx`

**Steps:**
1. Open `src/pages/project-chat/dialogs/CreateProjectDialog.tsx`
2. Add state for `agentFolderName` after the existing state declarations:
   ```ts
   const [agentFolderName, setAgentFolderName] = React.useState('.agent');
   ```
3. Add a `useEffect` that auto-sets `agentFolderName` from the project name:
   ```ts
   React.useEffect(() => {
     if (name && !agentFolderNameTouched) {
       setAgentFolderName('.agent');
     }
   }, [name, agentFolderNameTouched]);
   ```
   (You'll need to add `agentFolderNameTouched` state too.)
4. Add an input field for "Project Agent Folder" after the Description textarea:
   ```tsx
   <div className="flex flex-col gap-1.5">
     <Label htmlFor="project-agent-folder">
       Project Agent Folder
     </Label>
     <Input
       id="project-agent-folder"
       placeholder=".agent"
       value={agentFolderName}
       onChange={(e) => {
         setAgentFolderNameTouched(true);
         setAgentFolderName(e.target.value);
       }}
       required
     />
     <span className="text-[11px] text-muted-foreground">
       Folder inside the project where the agent lives. Defaults to .agent
     </span>
   </div>
   ```
5. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "agentFolderName" src/pages/project-chat/dialogs/CreateProjectDialog.tsx` shows the state, effect, and input.

---

### T5.2 — Update submit to pass `agentFolderName` to `createProject`
**Time:** 5 min
**Goal:** Wire the new field into the submit handler so it reaches the flow.

**Files:**
- `src/pages/project-chat/dialogs/CreateProjectDialog.tsx`

**Steps:**
1. Open the file.
2. In the `onSubmit` handler, add `agentFolderName` to the `createProject` call:
   ```ts
   const result = await createProject({
     name: name.trim(),
     description: description.trim() || undefined,
     localPath: localPath.trim() || undefined,
     agentFolderName: agentFolderName.trim() || '.agent',
     agentParentDir: localPath.trim() || undefined,
   });
   ```
3. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "agentFolderName" src/pages/project-chat/dialogs/CreateProjectDialog.tsx` shows the field passed to `createProject`.

---

## M6: ProjectChatView + Components

### T6.1 — Stub `ProjectChatView` with state + loading
**Time:** 10 min
**Goal:** Replace the 12-line stub with a real chat view that loads project, project-agent, channel, and messages on mount.

**Files:**
- `src/pages/project-chat/ProjectChatView.tsx`

**Steps:**
1. Open `src/pages/project-chat/ProjectChatView.tsx`
2. Replace the entire file content:
   ```tsx
   import { useParams } from 'react-router-dom';
   import * as React from 'react';
   import { loadProject } from '@/flows/projects/crud/load-project';
   import { loadMessages } from '@/flows/channels/ui/load-messages';
   import type { Project } from '@/storage/types';
   import type { ChannelMessage } from '@/types/electron';

   export function ProjectChatView() {
     const { projectId } = useParams<{ projectId: string }>();
     const [project, setProject] = React.useState<Project | null>(null);
     const [messages, setMessages] = React.useState<ChannelMessage[]>([]);
     const [loading, setLoading] = React.useState(true);

     React.useEffect(() => {
       if (!projectId) return;
       let cancelled = false;
       setLoading(true);
       loadProject(projectId)
         .then((p) => {
           if (cancelled) return;
           setProject(p ?? null);
           if (p?.channelId) {
             return loadMessages(p.channelId);
           }
           return [];
         })
         .then((msgs) => {
           if (cancelled) return;
           setMessages(msgs ?? []);
           setLoading(false);
         })
         .catch(() => {
           if (!cancelled) setLoading(false);
         });
       return () => {
         cancelled = true;
       };
     }, [projectId]);

     if (loading) {
       return (
         <div className="flex h-full items-center justify-center bg-background">
           <span className="text-sm text-muted-foreground">Loading project...</span>
         </div>
       );
     }

     if (!project) {
       return (
         <div className="flex h-full items-center justify-center bg-background">
           <span className="text-sm text-destructive">Project not found</span>
         </div>
       );
     }

     return (
       <div className="flex h-full flex-col bg-background">
         {/* Components added in T6.7 */}
         <div className="flex-1 overflow-y-auto">
           <span className="text-sm text-muted-foreground">Project: {project.name}</span>
         </div>
       </div>
     );
   }
   ```
3. Save the file.

**Note:** `loadProject` currently returns `Project | null` — it needs a `channelId` field. Since the Channel is created at project-creation time, we need to store the channelId on the Project. **Check T4.2** — the `create-project` flow creates the channel but does NOT link it to the project. You may need to update `ProjectRepository` to support `update(projectId, { channelId })` and call it in T4.2. This task (T6.1) assumes `project.channelId` exists.

**Verification:**
```bash
bun run typecheck
```
Expect: clean or type errors about `project.channelId` (fix in T4.2 if needed).

**Done when:** `ProjectChatView` renders with loading state and displays project name.

---

### T6.2 — Create `ProjectChatHeader`
**Time:** 10 min
**Goal:** Header showing project name, type badge, and member count.

**Files:**
- `src/pages/project-chat/components/ProjectChatHeader.tsx` **(new)**

**Steps:**
1. Create the file with:
   ```tsx
   import type { Project } from '@/storage/types';
   import type { Agent } from '@/types/electron';

   interface ProjectChatHeaderProps {
     project: Project;
     members: Agent[];
   }

   export function ProjectChatHeader({ project, members }: ProjectChatHeaderProps) {
     return (
       <div className="flex items-center gap-3 border-b border-border px-4 py-3">
         <div className="flex flex-col gap-0.5">
           <h2 className="text-sm font-semibold text-foreground">{project.name}</h2>
           <div className="flex items-center gap-2">
             <span className="rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-medium text-sidebar-primary">
               Project Agent
             </span>
             <span className="text-[11px] text-muted-foreground">
               {members.length} member{members.length !== 1 ? 's' : ''}
             </span>
           </div>
         </div>
       </div>
     );
   }
   ```
2. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/pages/project-chat/components/ProjectChatHeader.tsx` exists.

---

### T6.3 — Create `ProjectChatConversation`
**Time:** 10 min
**Goal:** Display messages from the channel. Reuses the existing `ConversationArea` from agent-chat.

**Files:**
- `src/pages/project-chat/components/ProjectChatConversation.tsx` **(new)**
- `src/pages/project-chat/components/index.ts` **(new — placeholder, filled in T6.6)**

**Steps:**
1. Create `src/pages/project-chat/components/ProjectChatConversation.tsx`:
   ```tsx
   import { ConversationArea } from '@/pages/agent-chat/components/ConversationArea';
   import type { ChannelMessage } from '@/types/electron';
   import type { Agent } from '@/types/electron';

   interface ProjectChatConversationProps {
     messages: ChannelMessage[];
     projectAgentName: string;
   }

   export function ProjectChatConversation({ messages, projectAgentName }: ProjectChatConversationProps) {
     return (
       <ConversationArea
         messages={messages.map((m) => ({
           id: m.id,
           role: m.senderType === 'user' ? 'user' : m.senderType === 'system' ? 'system' : 'assistant',
           content: m.content,
           agentName: m.senderType === 'agent' ? projectAgentName : undefined,
         }))}
       />
     );
   }
   ```
   Note: `ConversationArea` may have a specific message shape — check `src/pages/agent-chat/components/ConversationArea.tsx` for the exact `Message` shape and adjust accordingly.
2. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean (may need type adapter if `ConversationArea` message shape differs).

**Done when:** `ls src/pages/project-chat/components/ProjectChatConversation.tsx` exists and typecheck passes.

---

### T6.4 — Create `ProjectChatInput`
**Time:** 10 min
**Goal:** Text input with send button that appends a message to the channel.

**Files:**
- `src/pages/project-chat/components/ProjectChatInput.tsx` **(new)**

**Steps:**
1. Create `src/pages/project-chat/components/ProjectChatInput.tsx`:
   ```tsx
   import * as React from 'react';
   import { Button } from '@/components/ui/button';
   import { Textarea } from '@/components/ui/textarea';
   import { appendMessage } from '@/flows/channels/ui/append-message';

   interface ProjectChatInputProps {
     channelId: string;
     senderId: string;
     onMessageSent: (message: unknown) => void;
   }

   export function ProjectChatInput({ channelId, senderId, onMessageSent }: ProjectChatInputProps) {
     const [text, setText] = React.useState('');
     const [sending, setSending] = React.useState(false);

     const send = async () => {
       if (!text.trim() || sending) return;
       setSending(true);
       try {
         const msg = await appendMessage(channelId, 'user', senderId, text.trim());
         onMessageSent(msg);
         setText('');
       } finally {
         setSending(false);
       }
     };

     return (
       <div className="flex items-end gap-2 border-t border-border p-3">
         <Textarea
           className="min-h-[60px] resize-none"
           placeholder="Message the project agent..."
           value={text}
           onChange={(e) => setText(e.target.value)}
           onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               void send();
             }
           }}
         />
         <Button onClick={() => void send()} disabled={!text.trim() || sending} size="sm">
           Send
         </Button>
       </div>
     );
   }
   ```
2. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/pages/project-chat/components/ProjectChatInput.tsx` exists and typecheck passes.

---

### T6.5 — Create `ProjectRosterPanel`
**Time:** 10 min
**Goal:** Passive display of agents assigned to the project. Read-only in L1.

**Files:**
- `src/pages/project-chat/components/ProjectRosterPanel.tsx` **(new)**

**Steps:**
1. Create `src/pages/project-chat/components/ProjectRosterPanel.tsx`:
   ```tsx
   import { HugeiconsIcon } from '@/components/ui/icon';
   import { UserIcon } from '@hugeicons/core-free-icons';
   import type { Agent } from '@/types/electron';

   interface ProjectRosterPanelProps {
     agents: Agent[];
   }

   export function ProjectRosterPanel({ agents }: ProjectRosterPanelProps) {
     return (
       <div className="flex flex-col gap-3 p-4">
         <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
           Project Members
         </h3>
         {agents.length === 0 ? (
           <p className="text-xs text-muted-foreground">No agents assigned yet.</p>
         ) : (
           <div className="flex flex-col gap-2">
             {agents.map((agent) => (
               <div key={agent.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent">
                 <HugeiconsIcon icon={UserIcon} className="size-4 flex-shrink-0 text-muted-foreground" />
                 <div className="flex flex-col">
                   <span className="text-xs font-medium text-foreground">{agent.name}</span>
                   {agent.role && (
                     <span className="text-[10px] text-muted-foreground">{agent.role}</span>
                   )}
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
     );
   }
   ```
2. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/pages/project-chat/components/ProjectRosterPanel.tsx` exists and typecheck passes.

---

### T6.6 — Create components barrel
**Time:** 5 min
**Goal:** Export all 4 new components from a single barrel.

**Files:**
- `src/pages/project-chat/components/index.ts` **(new)**

**Steps:**
1. Create `src/pages/project-chat/components/index.ts`:
   ```ts
   export { ProjectChatHeader } from './ProjectChatHeader';
   export { ProjectChatConversation } from './ProjectChatConversation';
   export { ProjectChatInput } from './ProjectChatInput';
   export { ProjectRosterPanel } from './ProjectRosterPanel';
   ```
2. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/pages/project-chat/components/index.ts` exists.

---

### T6.7 — Wire all components into `ProjectChatView`
**Time:** 15 min
**Goal:** Replace the stub in `ProjectChatView` with the full layout: Header + Conversation + Input + load everything.

**Files:**
- `src/pages/project-chat/ProjectChatView.tsx`

**Steps:**
1. Open `src/pages/project-chat/ProjectChatView.tsx`
2. Update imports to include all components + agents list helper:
   ```tsx
   import { ProjectChatHeader } from './components/ProjectChatHeader';
   import { ProjectChatConversation } from './components/ProjectChatConversation';
   import { ProjectChatInput } from './components/ProjectChatInput';
   import { ProjectRosterPanel } from './components/ProjectRosterPanel';
   import { loadMessages } from '@/flows/channels/ui/load-messages';
   import { listAgents } from '@/flows/agents/crud/list-agents';
   import type { ChannelMessage } from '@/types/electron';
   ```
3. Add `agents` and `channelId` state:
   ```tsx
   const [agents, setAgents] = React.useState<Agent[]>([]);
   const [channelId, setChannelId] = React.useState<string | null>(null);
   ```
4. In the `useEffect`, after setting `project`, find the project-agent (agent with `agentKind === 'project-coordinator'`) and the channel. Load messages and agents.
   ```tsx
   // After project loads, find project-agent and channel
   const projectAgent = agents.find((a) => a.agentKind === 'project-coordinator');
   // Channel ID — store on project or look up via projectId
   // For now, assume project.channelId is set (requires T4.2 update to create-project)
   if (project && project.channelId) {
     setChannelId(project.channelId);
     loadMessages(project.channelId).then(setMessages);
   }
   ```
   Note: `Project` type needs a `channelId` field. Add it to `src/storage/types.ts` in T1.1 or separately.
5. Replace the stub return with:
   ```tsx
   return (
     <div className="flex h-full flex-col bg-background">
       <ProjectChatHeader project={project} members={agents} />
       <div className="flex flex-1 overflow-hidden">
         <div className="flex flex-1 flex-col">
           <div className="flex-1 overflow-y-auto">
             <ProjectChatConversation
               messages={messages}
               projectAgentName={projectAgent?.name ?? 'Project Agent'}
             />
           </div>
           {channelId && projectAgent && (
             <ProjectChatInput
               channelId={channelId}
               senderId="user"
               onMessageSent={(msg) => setMessages((prev) => [...prev, msg as ChannelMessage])}
             />
           )}
         </div>
         <div className="w-64 border-l border-border">
           <ProjectRosterPanel agents={agents} />
         </div>
       </div>
     </div>
   );
   ```
6. Save the file.

**Verification:**
```bash
bun run typecheck
```
Expect: clean or errors about `project.channelId` — fix by adding `channelId?: string` to `Project` type in `src/storage/types.ts`.

**Done when:** `ProjectChatView` renders the full layout with header, conversation, input, and roster panel.

---

### T6.8 — Wire `ProjectRosterPanel` into right sidebar for project routes
**Time:** 10 min
**Goal:** Show the roster panel in the right sidebar when viewing a project.

**Files:**
- `src/components/layout/right-sidebar/RightSidebar.tsx`

**Steps:**
1. Open `src/components/layout/right-sidebar/RightSidebar.tsx`
2. Update the `useParams` to also get `projectId`:
   ```tsx
   const { agentId, projectId } = useParams();
   ```
3. Import `ProjectRosterPanel` (you'll create a lightweight version inline for now — the full component will be wired in M7):
   ```tsx
   import { ProjectRosterPanel } from '@/pages/project-chat/components/ProjectRosterPanel';
   ```
4. Update the conditional render:
   ```tsx
   {agentId ? (
     <AgentSettingsPanel agentId={agentId} />
   ) : projectId ? (
     <div className="h-full overflow-y-auto">
       <ProjectRosterPanel agents={[]} />
     </div>
   ) : (
     <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
       ...
     </div>
   )}
   ```
5. Save the file.

**Note:** For the full roster data, you'll wire `loadProject` + agent lookup in M7. For now, pass an empty array.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `rg "projectId" src/components/layout/right-sidebar/RightSidebar.tsx` shows the projectId check.

---

## M7: Roster Helpers

### T7.1 — Create `getProjectRoster` flow
**Time:** 10 min
**Goal:** Given a projectId, return all agents assigned to that project.

**Files:**
- `src/flows/projects/ui/get-project-roster.ts` **(new)**
- `src/flows/projects/ui/index.ts` **(new)**

**Steps:**
1. Create `src/flows/projects/ui/get-project-roster.ts`:
   ```ts
   import { loadProject } from '@/flows/projects/crud/load-project';
   import { listAgents } from '@/flows/agents/crud/list-agents';

   export async function getProjectRoster(projectId: string) {
     const project = await loadProject(projectId);
     if (!project) return [];
     const allAgents = await listAgents();
     return allAgents.filter((a) => project.agentIds.includes(a.id));
   }
   ```
2. Create `src/flows/projects/ui/index.ts`:
   ```ts
   export { getProjectRoster } from './get-project-roster';
   ```
3. Save both files.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/flows/projects/ui/get-project-roster.ts` exists and typecheck passes.

---

### T7.2 — Create `getProjectAgent` flow
**Time:** 10 min
**Goal:** Given a project, return the project-coordinator agent (or null).

**Files:**
- `src/flows/agents/ui/get-project-agent.ts` **(new)**
- `src/flows/agents/ui/index.ts` **(update)**

**Steps:**
1. Create `src/flows/agents/ui/get-project-agent.ts`:
   ```ts
   import { listAgents } from '@/flows/agents/crud/list-agents';
   import type { Project } from '@/storage/types';
   import type { Agent } from '@/types/electron';

   export async function getProjectAgent(project: Project): Promise<Agent | null> {
     const allAgents = await listAgents();
     // Find the agent in this project's agentIds that is a project-coordinator
     const candidateIds = project.agentIds;
     return allAgents.find(
       (a) => candidateIds.includes(a.id) && a.agentKind === 'project-coordinator',
     ) ?? null;
   }
   ```
2. Open `src/flows/agents/ui/index.ts`
3. Add: `export { getProjectAgent } from './get-project-agent';`
4. Save both files.

**Verification:**
```bash
bun run typecheck
```
Expect: clean.

**Done when:** `ls src/flows/agents/ui/get-project-agent.ts` exists and typecheck passes.

---

## M8: End-to-End Verification

### T8.1 — Manual end-to-end test
**Time:** 15 min
**Goal:** Verify the full path works: create project → navigate to project chat → send message.

**Steps:**
1. Run the dev server: `bun run electron:dev`
2. Click `+` next to "Projects" in the left sidebar
3. Fill in: name="Test Project", description="QA run", localPath="~/test-projects/test-project", agentFolderName=".agent"
4. Click Create
5. **Verify in `~/.superhive/`**: `db.projects.json`, `db.agents.json`, `db.channels.json` all have new records
6. **Verify `~/.superhive/channels/<id>.jsonl`** exists with the initial system message
7. Navigate to `/projects/<projectId>` in the app
8. Verify: chat header shows project name, conversation shows system message, roster panel shows agents
9. Type a message and press Enter/Send
10. Verify: message appears in conversation AND is appended to the JSONL file

**Verification commands (post-manual):**
```bash
# Check records exist
cat ~/.superhive/db.projects.json
cat ~/.superhive/db.agents.json | grep agentKind  # should show project-coordinator
cat ~/.superhive/db.channels.json
# Check chat file
cat ~/.superhive/channels/*.jsonl
```

**Done when:** All 4 records created, chat file exists, message appears in UI.

---

### T8.2 — Final checks + commit
**Time:** 10 min
**Goal:** Confirm typecheck + build clean, flow isolation verified, commit.

**Steps:**
1. Run checks:
   ```bash
   bun run typecheck && bun run build
   ```
2. Verify flow isolation:
   ```bash
   rg "@/api" src/components src/pages
   ```
   Expect: zero results.
3. If all pass, commit:
   ```bash
   git add -A && git commit -m "feat: project-agent MVP — auto-create project-agent + channel on project creation, ProjectChatView with message persistence"
   ```

**Done when:** Commit created. `git log --oneline -1` shows the message.

---

## Final Checklist

- [ ] `bun run typecheck` clean
- [ ] `bun run build` clean
- [ ] `rg "@/api" src/components src/pages` returns zero
- [ ] All new files exist (verify with `ls`):
  - [ ] `src/storage/types.ts` — `AgentKind` type + `agentKind` field added
  - [ ] `src/flows/agents/crud/create-project-agent.ts`
  - [ ] `src/api/channels.ts`
  - [ ] `electron/ipc/channels.ts`
  - [ ] `src/flows/channels/crud/create-channel.ts`
  - [ ] `src/flows/channels/ui/append-message.ts`
  - [ ] `src/flows/channels/ui/load-messages.ts`
  - [ ] `src/flows/channels/crud/index.ts`
  - [ ] `src/flows/channels/ui/index.ts`
  - [ ] `src/flows/channels/index.ts`
  - [ ] `src/pages/project-chat/components/ProjectChatHeader.tsx`
  - [ ] `src/pages/project-chat/components/ProjectChatConversation.tsx`
  - [ ] `src/pages/project-chat/components/ProjectChatInput.tsx`
  - [ ] `src/pages/project-chat/components/ProjectRosterPanel.tsx`
  - [ ] `src/pages/project-chat/components/index.ts`
  - [ ] `src/flows/projects/ui/get-project-roster.ts`
  - [ ] `src/flows/projects/ui/index.ts`
  - [ ] `src/flows/agents/ui/get-project-agent.ts`
- [ ] Manual E2E test passes (T8.1)
- [ ] Commit created (T8.2)
