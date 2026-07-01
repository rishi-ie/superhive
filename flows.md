# Superhive — Flow Inventory

## Overview

This document enumerates **every interactive flow** in the Superhive app — every user action, every system action, every read surface — with enough detail to implement or modify them one at a time. Flows are grouped by **trigger category** (who starts them) then by **entity**, and tagged with **current state**.

Use this as the working backlog. When we tackle a flow, the spec sections, files, and current state are all here.

---

## How to use this document

- **Find a flow:** Ctrl/Cmd-F for the flow ID (e.g. `F042`) or the name.
- **Decide priority:** pick a category and look for [MISSING] or [NEW-SPEC] flows first.
- **Track state:** update the `Current state` tag as flows are implemented.
- **Cross-reference:** spec sections are linked where applicable; see `spec.md`.

---

## Trigger categories

| ID | Category | Examples |
|---|---|---|
| **C1** | User-initiated new state | Create workspace, create project, create agent |
| **C2** | User-initiated edit | Rename, archive, edit settings, change permissions |
| **C3** | User-initiated link/unlink | Add agent to project, assign ticket, connect integration |
| **C4** | User-initiated approve (queues) | Approve audit, answer pending question |
| **C5** | System-initiated ask | Agent permission request, ticket proposal |
| **C6** | System-initiated write | OKF entry, status transition, AGENT_STATE |
| **C7** | Read-only (views, navigation) | Browse, filter, search, click-through |
| **C8** | Lifecycle / session | Refresh panel, dismiss wizard, sign out, export |

---

## Current state legend

| Tag | Meaning |
|---|---|
| `[WORKS]` | Fully wired; persists state correctly |
| `[STUB]` | UI exists; action shows toast only, never persists |
| `[LOCAL]` | UI updates local component state but never writes through |
| `[DEAD]` | Callback or surface exists but no consumer wires it up |
| `[MISSING]` | No UI today; needs to be built |
| `[NEW-SPEC]` | Comes from `spec.md`; doesn't exist in code yet |
| `[DISABLED]` | UI rendered but all controls disabled (`comingSoon` flag) |

---

## Flows

---

### C1: User-initiated new state

These are the **creation wizards** and dialogs. Most map to multi-step flows.

---

#### F001 — Create workspace (settings page)

- **Category:** C1
- **Trigger:** Click "New workspace" button in WorkspacesSettings header
- **Surface:** Settings → Workspaces
- **Steps:**
  1. Open WorkspacesSettings page
  2. Click "New workspace" → centered dialog opens
  3. Enter `name`, choose `color`, set `dataRetentionDays`
  4. Submit → `update('workspaces', { workspaces: [...existing, new] })`
  5. If first workspace, set as default
  6. Close dialog, toast "Workspace created"
- **Effect:** Adds a `Workspace` to settings.json; not a `Workspace` in app DB (separate seam)
- **Current state:** [WORKS]
- **Spec:** §3 Workspaces
- **Ref:** `src/components/settings/WorkspacesSettings.tsx:234-252, 293-327`

---

#### F002 — Create workspace (setup wizard)

- **Category:** C1
- **Trigger:** "Create your workspace" row in setup wizard on first launch
- **Surface:** Center workspace (first launch, no workspaces yet)
- **Steps:**
  1. Setup wizard auto-renders when no workspaces exist
  2. Click "Create your workspace"
  3. `window.prompt('Name your workspace')` opens
  4. Enter name → calls `createWorkspace({ name })`
  5. Workspace set as active
  6. Wizard dismissed (`wizard:setup:dismissed=1` in sessionStorage)
- **Effect:** Creates a `Workspace` in app DB, marks wizard as dismissed
- **Current state:** [WORKS] but minimal — no color, retention, or OKF root init
- **Spec:** §3, §6.2 OKF bundle location
- **Ref:** `src/components/center-workspace/setup/WorkspaceSetupView.tsx:25-34`

---

#### F003 — Create project

- **Category:** C1
- **Trigger:** "New Project" button (HomeView, UniversalProjectsView, CenterTabStrip `+` menu, command palette `new-project`, shortcut `Mod+Shift+N`)
- **Surface:** Center workspace dialog overlay
- **Steps:**
  1. Click any "New Project" trigger → `CreateProjectDialog` opens
  2. Enter `title`, `description`, `successCriteria`
  3. Pick `color` (6 swatches: Blue/Green/Amber/Violet/Rose/Slate)
  4. Pick `workspaceId` (defaults to active workspace)
  5. Pick team — checkboxes for global agents (filtered to workspace)
  6. Submit → `createProject({ title, workspaceId, description, successCriteria, color, agentIds })`
  7. New project tab opens with detail view
- **Effect:**
  - Creates a `Project` in app DB
  - Adds selected agents as `ProjectAgent` rows with `currentStatus: IDLE`
  - **NEW-SPEC:** should create `~/.superhive/okf/<project_id>/` bundle with `index.md`, `objectives.md`, `status.md`
  - **NEW-SPEC:** should create the Project Agent (`general-v1` instance scoped to this project)
- **Current state:** [WORKS] for core; [NEW-SPEC] for OKF + Project Agent creation
- **Spec:** §4 Projects, §6 OKF, §8 Project Agent
- **Ref:** dialog: `src/components/center-workspace/CreateProjectDialog.tsx:101-120`; store: `src/data/projects/store.ts:63-90`; shortcut: `src/lib/shortcuts/actions.ts:66`

---

#### F004 — Create agent (NEW-SPEC, general-v1 wizard)

- **Category:** C1
- **Trigger:** "New agent" button (workspace → agents tab, or workspace-level menu)
- **Surface:** Center workspace dialog (multi-step wizard)
- **Steps:**
  1. Click "New agent" → wizard step 1: Identity
     - `name`, `role` (job title), `principles`, `boundaries`
  2. Step 2: LLM provider
     - Pick provider from configured list (Anthropic / OpenAI / Google / MiniMax / etc.)
     - Or add new provider inline (links to ModelsSettings)
     - API key validation
  3. Step 3: Skills
     - Pick from skill catalog (browser, planning, lancedb memory, mission-control, permission, sub-agent, etc.)
     - Pick initial skills profile
  4. Step 4: Sub-agent profile
     - Choose from 8 built-ins (scout, researcher, planner, worker, reviewer, oracle, delegate, context-builder)
     - Or define custom sub-agents
  5. Step 5: Generation
     - App runs `general-v1` `./setup.sh` non-interactively with env vars pre-set
     - ULID pre-generated by app, passed in
     - Working directory = `~/.superhive/agents/<ulid>/`
  6. Step 6: Launch
     - App starts agent subprocess
     - Agent connects to `ws://127.0.0.1:7711` with `AGENT_HELLO`
     - Host registers agent
     - Agent receives initial state from app (current workspace, OKF bundle path, etc.)
  7. Wizard complete → toast "Agent <name> created and running"
- **Effect:**
  - Creates a folder at `~/.superhive/agents/<ulid>/` with `.general-v1/` state
  - Launches agent subprocess
  - Registers agent in app's `agents` table
  - Adds agent to workspace's available roster
- **Current state:** [MISSING] — no UI; agent list is from seed only
- **Spec:** §5.1, §5.2
- **Ref:** None yet (to be created)

---

#### F005 — Add agent to project

- **Category:** C3 (link flow — see also)
- **Category (also):** C1 (from project side)
- **Trigger:** "Add agents" button in project header or ProjectManageTab
- **Surface:** Center workspace dialog or inline picker
- **Steps:**
  1. Open project
  2. Click "Add agents" → picker dialog with workspace's agent roster
  3. Multi-select agents (with role/status display)
  4. Submit → for each picked agent, add to `ProjectAgent[]`
- **Effect:**
  - Adds `ProjectAgent` rows for the project
  - **NEW-SPEC:** Project Agent writes project-context snapshot to each picked agent's SAC for this project
  - **NEW-SPEC:** each agent can now work tickets in this project
- **Current state:** [MISSING] — only path today is via Create Project dialog
- **Spec:** §5.4 Cross-project identity
- **Ref:** None yet

---

#### F006 — Create ticket

- **Category:** C1
- **Trigger:** "New Ticket" button (TicketsView header, command palette `new-ticket`, shortcut `Mod+Shift+T`)
- **Surface:** Center workspace dialog
- **Steps:**
  1. Click "New Ticket" → `CreateTicketDialog` opens
  2. Enter `title`, `description`, `successCriteria`, `priority`, `type`
  3. Pick `assignee` (auto-suggest from Project Agent based on workload + role)
  4. Optionally link to `channelId`
  5. Submit → `createTicket({ projectId, title, description, assignee, status: TODO, ... })`
- **Effect:**
  - Adds `Ticket` row
  - **NEW-SPEC:** Project Agent writes `type: Ticket` `.md` to `~/.superhive/okf/<project_id>/tickets/<ticket-id>.md`
  - Ticket appears in project kanban board
- **Current state:** [STUB] — button opens tab only, no form
- **Spec:** §4.2 Tickets, §6.3 OKF sync, §7.2 Project Agent authority
- **Ref:** `src/components/center-workspace/TicketsView.tsx:106`; `src/screens/Dashboard.tsx:291-293`; command palette: `src/components/shortcuts/CommandPalette.tsx:139`

---

#### F007 — Create channel

- **Category:** C1
- **Trigger:** "New Channel" button (UniversalChannelsView, CommunicationsView, CenterTabStrip `+` menu)
- **Surface:** Center workspace dialog
- **Steps:**
  1. Click "New Channel" → `CreateChannelDialog` opens
  2. Enter `topic`
  3. Pick initial `participants[]` from project agents (with permissions check)
  4. Optionally link to `relatedTicketId`
  5. Submit → `createChannel({ workspaceId, topic, participants, relatedTicketId })`
- **Effect:**
  - Adds `CommunicationChannel` row
  - Channel appears in workspace's channels list
  - **NEW-SPEC:** Project Agent writes `type: Channel` `.md` to `~/.superhive/okf/<project_id>/channels/<channel-id>.md`
- **Current state:** [STUB] — button only opens tab
- **Spec:** §4.3 Communications, §6.3
- **Ref:** `src/components/center-workspace/UniversalChannelsView.tsx:140`; `src/components/center-workspace/CommunicationsView.tsx:131`; `src/screens/Dashboard.tsx:295-297`

---

#### F008 — Start chat thread (auto)

- **Category:** C1 (system-triggered on first message)
- **Trigger:** First message sent in chat when no thread exists for that agent
- **Surface:** Center workspace → agent chat tab
- **Steps:**
  1. Open agent chat tab
  2. Type message, send (Enter)
  3. ChatView detects no active thread → `createThreadForAgent(agentId, 'Chat with <name>')`
  4. Message added to new thread
- **Effect:** New `ChatThread` row created, message persisted
- **Current state:** [WORKS]
- **Spec:** §5.2 Lifecycle, §7 Project Agent
- **Ref:** `src/components/center-workspace/ChatView.tsx:57-71, 73-86`; store: `src/data/chat/store.ts:42-44`

---

#### F009 — New chat thread (manual)

- **Category:** C1
- **Trigger:** `+ New thread` row in chat thread list
- **Surface:** Center workspace → agent chat tab → thread list
- **Steps:**
  1. Open chat thread list (click header to expand)
  2. Click `+ New thread` → `createThreadForAgent(agentId, 'New thread')`
  3. New thread becomes active, empty input
- **Effect:** Creates new `ChatThread` row for that agent
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChatThreadList.tsx:72-80`; `src/components/center-workspace/ChatView.tsx:50-55`

---

#### F010 — Workspace Agent session start (NEW-SPEC)

- **Category:** C1 (auto on first message)
- **Trigger:** First message sent in Workspace Agent chat tab
- **Surface:** Center workspace → Workspace Agent tab (one per workspace)
- **Steps:**
  1. User opens Workspace Agent tab (clickable from workspace header)
  2. Tab shows existing persistent thread (per §8.2) — empty if first time
  3. User types message, sends
  4. App sends message to the Workspace Agent process over WS
  5. Agent streams response back over WS
  6. Both written to `chat_threads` table
- **Effect:**
  - Persists message in workspace-scoped chat thread
  - Streams response from agent live
- **Current state:** [MISSING]
- **Spec:** §8 Workspace Agent, §8.2 Chat history
- **Ref:** None yet

---

#### F011 — Project Agent session start (NEW-SPEC)

- **Category:** C1 (auto on first message)
- **Trigger:** First message sent in Project Agent chat tab
- **Surface:** Center workspace → Project Agent tab (one per project)
- **Steps:**
  1. User opens project detail
  2. Project Agent tab is default
  3. Tab shows existing persistent thread (per §8.2) — empty if first time
  4. User types message, sends
  5. App sends to the Project Agent process over WS
  6. Agent streams response; Project Agent may propose tickets (§C5)
- **Effect:**
  - Persists message in project-scoped chat thread
  - Streams response
  - May auto-create ticket drafts (C5)
- **Current state:** [MISSING]
- **Spec:** §8 Project Agent
- **Ref:** None yet

---

#### F012 — Add verified model provider

- **Category:** C1
- **Trigger:** Click verified provider card (OpenAI / Anthropic / Google AI) on ModelsSettings
- **Surface:** Settings → Models
- **Steps:**
  1. Click provider card (e.g. OpenAI) → `ProviderSheet` opens in connect mode
  2. Enter `apiKey`
  3. Enter `baseUrl` (optional, defaults to provider's default)
  4. Add `models[]` (chips + Enter adds; X removes; suggested-model chips when empty)
  5. Save → `update('models', { providers: [...existing, new] })` (push) or update existing
  6. Toast "X connected"
- **Effect:**
  - Adds `ModelProviderConfig` to settings
  - **NEW-SPEC:** at agent creation, this key is passed as env var (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.) to `general-v1` process
- **Current state:** [WORKS]
- **Spec:** §5.1 LLM providers
- **Ref:** `src/components/settings/ModelsSettings.tsx:330-369, 605-615, 112-125, 623-634`

---

#### F013 — Add custom model provider

- **Category:** C1
- **Trigger:** Click "Add custom provider" button on ModelsSettings
- **Surface:** Settings → Models
- **Steps:**
  1. Click "Add custom provider" → `AddCustomDialog` opens
  2. Enter `id`, `label`, `apiKey`, `baseUrl`
  3. Add `models[]`
  4. Save → `update('models', { providers: [...existing, custom] })`
  5. Toast
- **Effect:** Same as F012
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/ModelsSettings.tsx:434-583, 711-720, 649-652`

---

#### F014 — Add integration (NEW-SPEC wiring)

- **Category:** C1
- **Trigger:** Click `Connect` on integration card (GitHub / Slack / Linear / Notion / Jira / Webhook) in Integrations settings
- **Surface:** Settings → Integrations (page does not exist yet — see §11)
- **Steps:**
  1. Open integration card
  2. OAuth flow for provider OR enter webhook URL (for Webhook type)
  3. Pick channels/events to subscribe to
  4. Save → write to `settings.integrations`
  5. **NEW-SPEC:** Configure `general-v1` communication module to forward events
- **Effect:**
  - Adds `Integration` to settings
  - **NEW-SPEC:** `general-v1` communication module is configured to receive events
- **Current state:** [MISSING] — settings.json has integrations seed data but no settings page
- **Spec:** §5.1 communication module
- **Ref:** seed: `src/data/settings/settings.json:106-152`

---

#### F015 — OKF browse / open concept doc (NEW-SPEC)

- **Category:** C1 / C7 (view)
- **Trigger:** Click an OKF node in project sidebar tree
- **Surface:** Center workspace → project detail → OKF sidebar
- **Steps:**
  1. Open project
  2. Right sidebar (or new panel) shows OKF tree: `index.md`, `objectives.md`, `status.md`, `tickets/`, `decisions/`, `channels/`, `agents/`, `events/`
  3. Click any `.md` file → opens in inline editor/viewer
  4. Frontmatter parsed, displayed as metadata header; body rendered as markdown
- **Effect:**
  - Reads `~/.superhive/okf/<project_id>/<path>.md`
  - Renders concept with metadata + body
  - **NEW-SPEC:** in-page search across bundle
- **Current state:** [MISSING]
- **Spec:** §6 OKF
- **Ref:** None yet

---

### C2: User-initiated edit

These are inline edits, modal edits, and settings-domain edits. Many are today only `[LOCAL]` or `[STUB]`.

---

#### F016 — Rename workspace

- **Category:** C2
- **Trigger:** Pencil icon next to workspace name in WorkspacesSettings
- **Surface:** Settings → Workspaces
- **Steps:**
  1. Click pencil → text input
  2. Edit name → Save
  3. Submit → `update('workspaces', { workspaces: ...patches name })`
  4. Toast
- **Effect:** Workspace name updated in settings
- **Current state:** [WORKS]
- **Spec:** §3 Workspaces
- **Ref:** `src/components/settings/WorkspacesSettings.tsx:223-228`

---

#### F017 — Set workspace data retention

- **Category:** C2
- **Trigger:** Retention `<Select>` per workspace in WorkspacesSettings
- **Surface:** Settings → Workspaces
- **Steps:**
  1. Click `<Select>` per row → pick from 30 / 90 / 180 / 365 / -1
  2. Auto-saves on change → `update('workspaces', { workspaces: ...patches dataRetentionDays })`
- **Effect:** `dataRetentionDays` updated per workspace
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/WorkspacesSettings.tsx:217-221, 130-138`

---

#### F018 — Mark workspace as default

- **Category:** C2
- **Trigger:** Default badge picker in DefaultsSettings
- **Surface:** Settings → Defaults
- **Steps:**
  1. Pick workspace from "Default workspace" cards
  2. Submit → `update('defaults', { defaultWorkspaceId: ws.id })`
  3. Also writes `update('account', { defaultWorkspaceId: ws.id })` for account-level default
- **Effect:** Sets default workspace
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/DefaultsSettings.tsx:118, 189-216`

---

#### F019 — Edit project title

- **Category:** C2
- **Trigger:** TextInput in `ProjectManageTab`
- **Surface:** Right auxiliary → project → Manage tab
- **Steps:**
  1. Open project right-aux
  2. Click "Manage" tab
  3. Edit title in text input
  4. Click Save → toast, resets `isDirty`
- **Effect:** Currently **does not persist**; only local state
- **Current state:** [LOCAL]
- **Spec:** §4.1 Project structure
- **Ref:** `src/components/right-auxiliary/ProjectManageTab.tsx:28-49`

---

#### F020 — Archive project

- **Category:** C2 (lifecycle)
- **Trigger:** "Archive Project" button in `ProjectManageTab`
- **Surface:** Right auxiliary → project → Manage tab
- **Steps:**
  1. Click "Archive Project" → confirmation modal
  2. Confirm "Archive" → `archiveProject(id)` → repo updates `projects.update(id, { status: 'ARCHIVED' })`
  3. Toast, `onProjectsChanged()`
- **Effect:**
  - Project status → ARCHIVED
  - Agents stop working tickets in this project (UI hides)
  - OKF becomes read-only
- **Current state:** [WORKS]
- **Spec:** §4.4 Project lifecycle
- **Ref:** `src/components/right-auxiliary/ProjectManageTab.tsx:53-60, 165-175, 186-197`; repo: `src/data/projects/repository.ts:67-70`

---

#### F021 — Unarchive project

- **Category:** C2 (lifecycle)
- **Trigger:** "Unarchive Project" button in `ProjectManageTab`
- **Surface:** Right auxiliary → project → Manage tab
- **Steps:**
  1. Click "Unarchive Project" → confirmation modal
  2. Confirm → `unarchiveProject(id)` → status ACTIVE
- **Effect:** Project returns to active state
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/ProjectManageTab.tsx:62-69, 155-164, 199-209`; repo: `src/data/projects/repository.ts:72-75`

---

#### F022 — Edit agent permissions (write access, write messages, install deps, commit authority, max tokens)

- **Category:** C2
- **Trigger:** Per-row Switch / SegmentedControl / Slider in `ControlMatrix`
- **Surface:** Right auxiliary → agent → Manage tab
- **Steps:**
  1. Open agent right-aux, click "Manage" tab
  2. Toggle `writeAccess`, `writeMessages`, `installDeps` Switches
  3. Change `commitAuthority` (Review Only / Auto-Merge / Direct Main)
  4. Adjust `maxTokens` slider
  5. Auto-saves → `setPermissions(agent.id, next)` + toast per field
- **Effect:**
  - Permissions written to `permissions` table
  - **NEW-SPEC:** permissions synced to `general-v1` permission module
- **Current state:** [WORKS] for app DB; [NEW-SPEC] for sync to general-v1
- **Spec:** §5.1 permission module
- **Ref:** `src/components/right-auxiliary/ControlMatrix.tsx:354-358, 318-329, 363-381, 386-399, 402-427`

---

#### F023 — Change agent model / engine

- **Category:** C2
- **Trigger:** `<ModelDropdown>` in `ControlMatrix`
- **Surface:** Right auxiliary → agent → Manage tab
- **Steps:**
  1. Click ModelDropdown → pick from 6 models across 4 providers
  2. Submit → `set('modelEngine', id)` → `setPermissions(agent.id, next)` + toast
- **Effect:** Agent's `modelEngine` updated
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/ControlMatrix.tsx:354-358`

---

#### F024 — Edit agent name / role / skills (NEW-SPEC)

- **Category:** C2
- **Trigger:** Click agent name/role in agent overview or Manage tab
- **Surface:** Right auxiliary → agent → Manage tab
- **Steps:**
  1. Click pencil next to name → text input
  2. Edit name, role, principles, boundaries
  3. Edit skills (toggle from catalog)
  4. Submit → write to app DB + send update to `general-v1` process over WS
  5. Agent picks up new config on next interaction
- **Effect:**
  - Agent identity updated
  - **NEW-SPEC:** if running, hot-reload config in `general-v1` process
- **Current state:** [MISSING]
- **Spec:** §5.2, §5.3
- **Ref:** None yet

---

#### F025 — Terminate agent execution

- **Category:** C2 (lifecycle)
- **Trigger:** "Terminate agent execution" button in `ControlMatrix` Danger zone
- **Surface:** Right auxiliary → agent → Manage tab
- **Steps:**
  1. Click "Terminate agent execution"
  2. **NEW-SPEC:** confirmation modal: "Terminate this agent's process? Existing work will be lost."
  3. Confirm → send `TERMINATE` over WS → agent subprocess kills gracefully
  4. Host removes agent from registry
  5. Toast "Agent terminated"
- **Effect:**
  - Agent subprocess exits
  - Agent moved to "offline" status
  - Can be relaunched from agent list
- **Current state:** [STUB] — no confirmation; toast only
- **Spec:** §5.2 Lifecycle
- **Ref:** stub: `src/components/right-auxiliary/ControlMatrix.tsx:445-453`; `src/screens/Dashboard.tsx:308-310`

---

#### F026 — Edit ticket status / priority / type / assignee

- **Category:** C2
- **Trigger:** Segmented controls in `TicketManageTab`
- **Surface:** Right auxiliary → ticket → Manage tab
- **Steps:**
  1. Open ticket, click "Manage" tab
  2. Edit status / priority / type via segmented controls
  3. Change assignee via agent picker
  4. Click Save → toast, resets `isDirty`
- **Effect:** Should write to `tickets` table
- **Current state:** [LOCAL] — local state only, never writes
- **Spec:** §4.2
- **Ref:** `src/components/right-auxiliary/TicketManageTab.tsx:57-82, 99-167`

---

#### F027 — Close ticket

- **Category:** C2 (lifecycle)
- **Trigger:** "Close Ticket" button in `TicketManageTab`
- **Surface:** Right auxiliary → ticket → Manage tab
- **Steps:**
  1. Click "Close Ticket" → confirmation modal
  2. Confirm → status MERGED + toast
- **Effect:** Status → MERGED; should persist
- **Current state:** [LOCAL] — local setStatus only
- **Ref:** `src/components/right-auxiliary/TicketManageTab.tsx:84-89, 170-177, 197-206`

---

#### F028 — Archive ticket

- **Category:** C2 (lifecycle)
- **Trigger:** "Archive Ticket" button in `TicketManageTab`
- **Surface:** Right auxiliary → ticket → Manage tab
- **Steps:**
  1. Click "Archive Ticket" → type-to-confirm "ARCHIVE" modal
  2. Confirm → toast
- **Effect:** Should set status to ARCHIVED
- **Current state:** [STUB]
- **Ref:** `src/components/right-auxiliary/TicketManageTab.tsx:91-94, 178-186, 208-219`

---

#### F029 — Snooze / mark ticket done (project inbox)

- **Category:** C2
- **Trigger:** "Snooze" / "Done" button per row in `ProjectInbox`
- **Surface:** Right auxiliary → project → Inbox tab
- **Steps:**
  1. Click Snooze → row removed from local items, toast
  2. Click Done → row marked done, toast
- **Effect:** Local state only; not persisted
- **Current state:** [LOCAL]
- **Ref:** `src/components/right-auxiliary/inbox/ProjectInbox.tsx:51-55, 107-122`

---

#### F030 — Edit channel topic / status / participants

- **Category:** C2
- **Trigger:** Status segmented / Topic text input / Add/Remove participant X in `ChannelManageTab`
- **Surface:** Right auxiliary → channel → Manage tab
- **Steps:**
  1. Open channel right-aux, click "Manage"
  2. Edit topic, status
  3. Add/remove participants via X icons and picker
  4. Click Save → toast, resets `isDirty`
- **Effect:** Should write to `channels` table
- **Current state:** [LOCAL]
- **Spec:** §4.3
- **Ref:** `src/components/right-auxiliary/ChannelManageTab.tsx:38-59, 67-97`

---

#### F031 — Send channel message

- **Category:** C2
- **Trigger:** `<Textarea>` + send button or `Enter` (Shift+Enter = newline)
- **Surface:** Channel detail view OR ChannelOverviewTab
- **Steps:**
  1. Type message in textarea
  2. Press Enter → `addChannelMessage(channelId, 'User', content, false)` then refetch
- **Effect:** Adds `ChannelMessage` row
- **Current state:** [WORKS]
- **Spec:** §4.3
- **Ref:** `src/components/center-workspace/ChannelDetailView.tsx:93-105`; `src/data/projects/store.ts:102-104`

---

#### F032 — Send chat message

- **Category:** C2
- **Trigger:** Send button or `Enter` in ChatInput
- **Surface:** Center workspace → agent chat tab
- **Steps:**
  1. Type message in ChatInput
  2. Press Enter → `addMessageToActiveThread(text, agentId?)` (defaults to 'user' role)
  3. **NEW-SPEC:** App sends message to `general-v1` process over WS
  4. **NEW-SPEC:** Agent streams response; messages appear as they arrive
- **Effect:**
  - Adds user message to `ChatThread`
  - **NEW-SPEC:** triggers agent response stream
- **Current state:** [WORKS] for persistence; [NEW-SPEC] for agent streaming
- **Spec:** §5.2
- **Ref:** `src/components/center-workspace/ChatInput.tsx:58-72, 106-114`

---

#### F033 — Pin chat tab (NEW-SPEC / stub)

- **Category:** C2
- **Trigger:** Pin button on tab
- **Surface:** Center workspace tab strip
- **Steps:**
  1. Click pin on tab → tab becomes non-closable
- **Current state:** [DEAD] — `handleTogglePin` exists in Dashboard but no UI button
- **Ref:** `src/screens/Dashboard.tsx:354-361, 483`

---

#### F034 — Regenerate message

- **Category:** C2
- **Trigger:** "regenerate" hover button on assistant message
- **Surface:** Chat message bubble
- **Steps:**
  1. Click regenerate → appends the prior user msg again to active thread
  2. **NEW-SPEC:** sends to agent again over WS
- **Effect:** Triggers another response
- **Current state:** [WORKS] (local); [NEW-SPEC] for agent re-stream
- **Ref:** `src/components/center-workspace/ChatMessage.tsx:165-175`; `src/components/center-workspace/ChatView.tsx:88-100`

---

#### F035 — Set chat feedback (thumbs up / down)

- **Category:** C2
- **Trigger:** Hover thumbs-up / thumbs-down on message
- **Surface:** Chat message bubble
- **Steps:**
  1. Hover message → icon buttons appear
  2. Click thumbs-up → `setMessageFeedback(message.id, 'up')`; click again → 'null' (toggle)
  3. Click thumbs-down → `setMessageFeedback(message.id, 'down')`
- **Effect:** Feedback persisted on `Message`
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChatMessage.tsx:78-81, 141-164`

---

#### F036 — Copy message / copy code

- **Category:** C2
- **Trigger:** Copy icon hover / CodeBlock copy button
- **Surface:** Chat message bubble
- **Steps:**
  1. Click copy → `navigator.clipboard.writeText(message.content)` → 2s "Copied" feedback
- **Effect:** Copies to clipboard (no DB write)
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChatMessage.tsx:72-76, 132-140`; `src/components/ui/CodeBlock.tsx:44`

---

#### F037 — Switch chat model (Auto / specific)

- **Category:** C2
- **Trigger:** `<Pill>` "Auto" toggle / specific model dropdown in ChatInput
- **Surface:** Chat input area
- **Steps:**
  1. Click "Auto" pill → `setAutoMode(v => !v)` (Auto = let agent decide)
  2. Click model picker → choose specific model → close dropdown
- **Effect:** Sets `model` in submit payload
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChatInput.tsx:120-156`

---

#### F038 — Account: edit name, username, avatar, highlight color

- **Category:** C2
- **Trigger:** Inputs in AccountSettings
- **Surface:** Settings → Account
- **Steps:**
  1. Edit display name → `account.name` + toast
  2. Edit username → `account.username` + toast
  3. Edit avatar (group hover) → [STUB] no onClick to file picker
  4. Pick highlight color → `appearance.highlightColor`
- **Effect:** Various settings updated
- **Current state:** [WORKS] for name/username/color; [STUB] for avatar
- **Ref:** `src/components/settings/AccountSettings.tsx:51-114`

---

#### F039 — Appearance: theme, code syntax theme

- **Category:** C2
- **Trigger:** Theme grid cards / code syntax dropdown
- **Surface:** Settings → Appearance
- **Steps:**
  1. Pick theme card (12 incl. midnight custom) → `appearance.theme` + toast
  2. Pick code syntax theme (6 options) → `appearance.codeSyntaxTheme`
- **Effect:** Theme applied via `data-theme` attribute on `<html>`
- **Current state:** [WORKS]
- **Spec:** §11 (theme applies via settings-context.tsx)
- **Ref:** `src/components/settings/AppearanceSettings.tsx:119-129, 170-178`

---

#### F040 — Privacy: conversation retention, export settings, reset, delete

- **Category:** C2 (and C8 for lifecycle)
- **Trigger:** Various controls in PrivacySettings
- **Surface:** Settings → Privacy
- **Steps:**
  1. Pick conversation retention (30/90/180/365/-1) → `privacy.conversationRetentionDays`
  2. Click "Export settings" → `exportJson()` → download blob + set `exportDataLastRun`
  3. Click "Reset all settings" → `resetAll()` clears every domain
  4. Click "Delete workspace data" (per workspace) → type workspace id → [STUB]
  5. Click "Delete account" → type "delete" → [STUB]
- **Effect:** Various
- **Current state:** [WORKS] for retention/export/reset; [STUB] for delete workspace data / delete account
- **Ref:** `src/components/settings/PrivacySettings.tsx:36-165`

---

#### F041 — Defaults: startup view, default workspace, view mode, time format, right-panel tab, kanban columns

- **Category:** C2
- **Trigger:** Various cards / selects / toggles in DefaultsSettings
- **Surface:** Settings → Defaults
- **Steps:**
  1. Pick startup view (6 cards) → `defaults.startupView`
  2. Pick default workspace → `defaults.defaultWorkspaceId`
  3. Toggle view mode (Comfortable/Compact) → `defaults.viewMode`
  4. Toggle time format → `defaults.timeFormat`
  5. Pick right-panel default tab (Overview/Manage/Inbox/Sessions) → `defaults.rightPanelDefaultTab`
  6. Toggle kanban columns in/out → `defaults.defaultKanbanColumns[]`
  7. Reorder kanban columns → moves within active list
- **Effect:** All `defaults` settings updated
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/DefaultsSettings.tsx:117-139, 158-341`

---

#### F042 — Models: edit provider, show/hide API key, add/remove model IDs, disconnect, delete custom

- **Category:** C2
- **Trigger:** Edit / delete / disconnect buttons in ModelsSettings
- **Surface:** Settings → Models
- **Steps:**
  1. Click Edit on connected provider → `ProviderSheet` opens
  2. Show/hide API key → toggle visibility in input
  3. Add model IDs (chips + Enter) / remove (X)
  4. Disconnect (trash icon on verified provider) → `apiKey=''`, `models=[]`
  5. Delete custom provider (in sheet) → filter out
- **Effect:** `models.providers[]` updated
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/ModelsSettings.tsx:127-137, 192-197, 228-244, 273-286, 292-305, 636-647`

---

#### F043 — Workflows: edit workflow

- **Category:** C2
- **Trigger:** Pencil/Configure button in WorkflowsSettings
- **Surface:** Settings → Workflows
- **Steps:**
  1. Click Configure → text inputs for `name` + `cronExpression`
  2. Save → `update('workflows', { workflows: ...patches })` + toast
- **Effect:** Workflow updated
- **Current state:** [WORKS] for edit only; [MISSING] for create/delete
- **Ref:** `src/components/settings/WorkflowsSettings.tsx:30-51, 114-116`

---

#### F044 — Cost-Usage: export CSV, edit budgets

- **Category:** C2
- **Trigger:** Export button / budget inputs in CostUsageSettings
- **Surface:** Settings → Cost-Usage
- **Steps:**
  1. Click Export usage CSV → download blob + toast
  2. Set monthly budget cap / per-agent limit / reset day / spend alerts → all [DISABLED]
- **Effect:** CSV downloaded; budget settings not persisted (disabled)
- **Current state:** [WORKS] for export; [DISABLED] for budgets (comingSoon flag)
- **Ref:** `src/components/settings/CostUsageSettings.tsx:62-200`

---

#### F045 — Billing: switch period, pick tier, adjust meta-hive agents, payment method

- **Category:** C2
- **Trigger:** Segmented control / plan cards / stepper / card buttons
- **Surface:** Settings → Billing
- **Steps:**
  1. Switch monthly/yearly → local `billingPeriod` (display only)
  2. Click plan card → `update('billing', { plan: { tier, name, priceMonthly, metaHiveAgents? } })` + toast
  3. Stepper +/- → metaHiveAgents (silent write, no toast)
  4. Contact sales / Update card / Add card → [STUB]
- **Effect:** Plan updated; payment method not persisted
- **Current state:** [WORKS] for plan changes; [STUB] for payment
- **Ref:** `src/components/settings/BillingSettings.tsx:339, 368-380, 382-385, 433-518`

---

#### F046 — Reset single section

- **Category:** C2
- **Trigger:** "Reset section" button bottom of each settings page
- **Surface:** All settings pages (when domain is dirty)
- **Steps:**
  1. Edit a setting in a section
  2. Section becomes dirty → "Reset section" button appears
  3. Click → `update(domain, DEFAULT_SETTINGS[domain])`
- **Effect:** Domain reset to defaults
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/shared/ResetSection.tsx:18-35`

---

#### F047 — Switch workspace

- **Category:** C2
- **Trigger:** Click workspace row in TeamSelector dropdown
- **Surface:** Left nav → TeamSelector
- **Steps:**
  1. Click TeamSelector trigger → dropdown opens
  2. Click workspace row → `setActiveWorkspaceId(workspace.id)`
- **Effect:** LeftNav, CenterWorkspace, RightAuxiliary re-render for new workspace
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/TeamSelector.tsx:71-90`

---

#### F048 — Drag/drop ticket between Kanban columns (NEW-SPEC)

- **Category:** C2
- **Trigger:** Drag ticket card to different column
- **Surface:** Center workspace → tickets tab → KanbanBoard
- **Steps:**
  1. Drag ticket card → drop on target column
  2. App updates `ticket.status` → writes to DB
  3. Toast
- **Effect:** Status transition persisted
- **Current state:** [MISSING] — KanbanBoard is static
- **Spec:** §4.2
- **Ref:** `src/components/center-workspace/KanbanBoard.tsx:13-19`

---

### C3: User-initiated link / unlink

Cross-entity assignment flows.

---

#### F049 — Add agent to project

See F005 — same flow, categorized here as a link operation.

---

#### F050 — Remove agent from project

- **Category:** C3
- **Trigger:** X icon next to agent in ProjectManageTab member list
- **Surface:** Right auxiliary → project → Manage tab
- **Steps:**
  1. Click X → confirmation modal: "Remove <agent> from project? Their context for this project will be archived."
  2. Confirm → `patchAgents(projectId, ...)` removes that agent
  3. **NEW-SPEC:** Project Agent writes "Agent removal" event to OKF
- **Effect:** Agent removed from project; agent can still be on other projects
- **Current state:** [MISSING]
- **Spec:** §5.4
- **Ref:** None yet

---

#### F051 — Assign ticket (or reassign)

- **Category:** C3
- **Trigger:** Assignee segmented control in `TicketManageTab`
- **Surface:** Right auxiliary → ticket → Manage tab
- **Steps:**
  1. Open ticket, click "Manage"
  2. Pick new assignee from agent picker
  3. Save → `update ticket.assignedAgentId`
- **Effect:** Reassigns ticket
- **Current state:** [LOCAL] — local state only
- **Spec:** §4.2, §7.2 (Project Agent authority)
- **Ref:** `src/components/right-auxiliary/TicketManageTab.tsx:99-167`

---

#### F052 — Link ticket to channel

- **Category:** C3
- **Trigger:** Channel picker in `TicketManageTab` OR Ticket picker in `ChannelManageTab`
- **Surface:** Right auxiliary → ticket OR channel → Manage tab
- **Steps:**
  1. From ticket Manage: pick channel from list
  2. From channel Manage: pick ticket from list
  3. Save → write to `ticket.relatedChannelId` or `channel.relatedTicketId`
- **Effect:** Cross-link
- **Current state:** [MISSING] — field exists in data, no UI to set
- **Spec:** §4.3
- **Ref:** None yet

---

#### F053 — Add participant to channel

- **Category:** C3
- **Trigger:** `<Select>` with available agents in `ChannelManageTab`
- **Surface:** Right auxiliary → channel → Manage tab
- **Steps:**
  1. Open channel, click "Manage"
  2. Pick from `<Select>` of available agents
  3. Click Add → adds to local participants list
- **Effect:** Local state only
- **Current state:** [LOCAL]
- **Spec:** §4.3, §9.1 Permissions
- **Ref:** `src/components/right-auxiliary/ChannelManageTab.tsx:62, 129-135`

---

#### F054 — Remove participant from channel

- **Category:** C3
- **Trigger:** X icon on participant row in `ChannelManageTab`
- **Surface:** Right auxiliary → channel → Manage tab
- **Steps:**
  1. Click X → updates local participants list
- **Effect:** Local state only
- **Current state:** [LOCAL]
- **Ref:** `src/components/right-auxiliary/ChannelManageTab.tsx:61, 117-124`

---

#### F055 — Add favorite

- **Category:** C3
- **Trigger:** Star icon on entity (project card / agent card / ticket)
- **Surface:** Wherever entities are listed
- **Steps:**
  1. Click star icon → `FavoritesRepository.add(ref)`
  2. Item appears in LeftNav → FavoritesSection
- **Effect:** Adds to favorites
- **Current state:** [MISSING] — repository has `add()` but no UI
- **Ref:** `src/data/favorites/repository.ts:28-31`

---

#### F056 — Remove favorite

- **Category:** C3
- **Trigger:** Unstar icon on favorited entity
- **Surface:** Wherever entities are listed (or in FavoritesSection)
- **Steps:**
  1. Click unstar → `FavoritesRepository.remove(ref)` (does not exist yet)
- **Effect:** Removes from favorites
- **Current state:** [MISSING] — no `remove` method, no UI

---

#### F057 — Connect integration

See F014 — same flow.

---

#### F058 — Disconnect integration

- **Category:** C3
- **Trigger:** Disconnect button on integration card
- **Surface:** Settings → Integrations (not yet built)
- **Steps:**
  1. Click Disconnect → confirmation modal
  2. Confirm → `update('integrations', { integrations: ...patches connected: false })`
  3. **NEW-SPEC:** signal `general-v1` communication module to drop the connection
- **Effect:** Integration disconnected
- **Current state:** [MISSING]

---

#### F059 — Toggle engine enabled

- **Category:** C3
- **Trigger:** Switch in ModelsSettings engine list
- **Surface:** Settings → Models
- **Steps:**
  1. Click Switch next to engine → `update('models', { engines: ...patches enabled })`
- **Effect:** Engine toggled
- **Current state:** [MISSING] — engines defined but no switch UI rendered
- **Spec:** §5.1
- **Ref:** `src/data/settings/settings.json:22-27`

---

### C4: User-initiated approve (queue actions)

Audit / permission / question queues.

---

#### F060 — Approve audit (auth-intercept)

- **Category:** C4
- **Trigger:** "Grant One-Time Access" button in AuditQueue or AgentInbox
- **Surface:** Right auxiliary → agent → Manage tab (audit section) OR Inbox tab
- **Steps:**
  1. Open agent right-aux
  2. Audit row appears with action pending
  3. Click "Grant One-Time Access" → `approveAudit(id)` → `ds.auditItems.delete(id)`
  4. Toast "Access granted"
  5. **NEW-SPEC:** send `PERMISSION_GRANTED` to `general-v1` over WS
- **Effect:** Audit resolved, agent can proceed
- **Current state:** [WORKS] for app DB; [NEW-SPEC] for WS ack
- **Ref:** `src/components/right-auxiliary/AuditQueue.tsx:63-70`; `src/data/agents/store.ts:51-53`

---

#### F061 — Deny audit

- **Category:** C4
- **Trigger:** "Deny" button in AuditQueue or AgentInbox
- **Steps:**
  1. Click Deny → `denyAudit(id)` → `ds.auditItems.delete(id)`
  2. **NEW-SPEC:** send `PERMISSION_DENIED` to `general-v1` over WS
  3. Toast
- **Current state:** [WORKS] for app DB; [NEW-SPEC] for WS ack
- **Ref:** `src/components/right-auxiliary/AuditQueue.tsx:71-78`

---

#### F062 — Approve diff & merge

- **Category:** C4
- **Trigger:** "Approve & Merge" button on DIFF_REVIEW audit item
- **Steps:**
  1. Click Approve & Merge → `approveAudit(id)`
- **Effect:** Audit resolved; **NEW-SPEC:** trigger `git push` via `general-v1`
- **Current state:** [WORKS] for resolution; [NEW-SPEC] for actual merge
- **Ref:** `src/components/right-auxiliary/AuditQueue.tsx:90-97`

---

#### F063 — View code diff

- **Category:** C4 / C7
- **Trigger:** "View Code Diff" button on DIFF_REVIEW audit
- **Steps:**
  1. Click → should open diff viewer modal
- **Current state:** [DEAD] — callback exists but no consumer wires it
- **Ref:** `src/components/right-auxiliary/AuditQueue.tsx:83-88`

---

#### F064 — Bulk approve audits

- **Category:** C4
- **Trigger:** Select checkboxes + "Approve all (n)" in BulkActionBar
- **Steps:**
  1. Tick checkboxes on each audit row
  2. Click "Approve all (N)" in BulkActionBar → `approveAudit(id)` for each
  3. Toast
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:289-293, 359-382`

---

#### F065 — Bulk deny audits

- **Category:** C4
- **Trigger:** BulkActionBar "Deny all (n)"
- **Steps:**
  1. Tick → click Deny all → `denyAudit(id)` for each
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:295-299`

---

#### F066 — Select / clear audit selection

- **Category:** C4
- **Trigger:** Click checkbox / X icon in BulkActionBar
- **Steps:**
  1. Tick checkbox → `toggleAudit(id)` adds/removes from set
  2. Click X in BulkActionBar → `setSelectedAuditIds(new Set())`
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:269-275, 308`

---

#### F067 — Answer pending question (option chip)

- **Category:** C4
- **Trigger:** Click option chip in `AgentInbox`
- **Surface:** Right auxiliary → agent → Inbox tab
- **Steps:**
  1. Pending question appears with options
  2. Click option chip → `answerQuestion(questionId, opt, agentId)` + `addMessageToActiveThread(opt, agentId)` + remove from list
  3. Toast "Answer sent to chat"
- **Effect:** Question answered, response sent to chat thread, removed from inbox
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:159-162, 301-306`

---

#### F068 — Answer pending question (free text)

- **Category:** C4
- **Trigger:** Type answer + Enter or Send
- **Steps:**
  1. Type in text input → Enter or click Send → same as F067 but with typed text
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:148-237, 219-235`

---

### C5: System-initiated ask

The agent asks the user for confirmation. NEW-SPEC, comes from `general-v1` WS protocol.

---

#### F069 — Agent permission request

- **Category:** C5
- **Trigger:** `general-v1` process sends `PERMISSION_REQUEST` over WS
- **Surface:** Top-right toast with "Approve / Deny" + persistent entry in agent Inbox tab
- **Steps:**
  1. Agent attempts sensitive tool call (e.g. `git push`, `rm -rf`, write to /etc)
  2. Agent sends `PERMISSION_REQUEST` to host
  3. Host surfaces toast: "<Agent> wants to <action>. Approve / Deny"
  4. User clicks Approve → host sends `PERMISSION_GRANTED` over WS → agent proceeds
  5. Or Deny → `PERMISSION_DENIED` over WS → agent aborts
  6. Request persists in agent's Inbox tab as audit entry
- **Effect:** Sensitive action gated by user
- **Current state:** [NEW-SPEC]
- **Spec:** §5.2 Lifecycle, §5.1 permission module

---

#### F070 — Project Agent proposes ticket

- **Category:** C5
- **Trigger:** Project Agent decides (during chat) that a ticket should be created
- **Surface:** Project Agent chat thread inline
- **Steps:**
  1. User types intent → Project Agent streams response
  2. Project Agent sends `PROPOSE_TICKET` with `{ title, description, successCriteria, suggestedAssignee }`
  3. Host renders ticket draft card inline in chat
  4. Card has "Approve & Create" / "Edit" / "Cancel" buttons
  5. User clicks Approve → host creates ticket via F006; Project Agent writes OKF entry
  6. Or Edit → opens F006 dialog pre-filled
  7. Or Cancel → dismisses draft
- **Effect:** Project Agent creates tickets only with user approval
- **Current state:** [NEW-SPEC]
- **Spec:** §7.2 Project Agent authority

---

#### F071 — Custom sub-agent spawn proposal

- **Category:** C5
- **Trigger:** Agent attempts to spawn a custom (non-builtin) sub-agent
- **Surface:** Top-right toast
- **Steps:**
  1. Agent sends `SUBAGENT_SPAWN_REQUEST` over WS
  2. Host surfaces toast: "<Agent> wants to spawn sub-agent <name>. Approve / Deny"
  3. User clicks Approve → host allows spawn, displays nested under parent
  4. Or Deny → `SUBAGENT_DENIED` over WS
- **Effect:** Custom sub-agents gated by user
- **Current state:** [NEW-SPEC]
- **Spec:** §5.3 Sub-agents

---

### C6: System-initiated write

No user action. Driven by `general-v1` WS messages.

---

#### F072 — Agent state update (AGENT_STATE every 30s)

- **Category:** C6
- **Trigger:** `general-v1` process sends `AGENT_STATE` over WS every 30s
- **Surface:** Backend
- **Steps:**
  1. Agent process sends `{ ulid, status, activeTask, contextSaturation, tokensPerSecond, currentCost }`
  2. Host updates `agents` table and telemetry
  3. UI surfaces via re-render
- **Effect:** Agent status, telemetry refreshed
- **Current state:** [NEW-SPEC]
- **Spec:** §5.2 Lifecycle

---

#### F073 — Heartbeat (every 15s)

- **Category:** C6
- **Trigger:** `general-v1` process sends `HEARTBEAT` over WS every 15s
- **Surface:** Backend
- **Steps:**
  1. Agent sends heartbeat
  2. Host updates `lastSeenAt` for that agent
- **Effect:** Liveness tracking
- **Current state:** [NEW-SPEC]
- **Spec:** §5.2

---

#### F074 — OKF entry written

- **Category:** C6
- **Trigger:** Agent or Project Agent decides to write to OKF
- **Surface:** `~/.superhive/okf/<project_id>/...`
- **Steps:**
  1. Agent sends `OKF_WRITE` over WS with `{ projectId, type, path, frontmatter, body }`
  2. Host writes `.md` file to `~/.superhive/okf/<project_id>/<path>.md`
  3. Host appends `log.md` entry
- **Effect:** OKF grows
- **Current state:** [NEW-SPEC]
- **Spec:** §6.4 Sync semantics

---

#### F075 — Routine log entry (auto)

- **Category:** C6
- **Trigger:** Any state change in the project (ticket moved, agent spawned, channel message added)
- **Steps:**
  1. App auto-appends to `~/.superhive/okf/<project_id>/log.md`
- **Current state:** [NEW-SPEC]
- **Spec:** §6.4

---

#### F076 — Status transition within approved workflow

- **Category:** C6
- **Trigger:** Agent working on an approved ticket advances its status
- **Steps:**
  1. Agent sends `TICKET_STATUS_CHANGE` over WS
  2. Host updates ticket status
  3. Logs entry
- **Current state:** [NEW-SPEC]
- **Spec:** §4.2, §7.2 (Project Agent acts autonomously on this)

---

#### F077 — Inter-agent message

- **Category:** C6
- **Trigger:** Agent sends `INTER_AGENT_MESSAGE` to another agent via host broker
- **Steps:**
  1. Agent A sends `INTER_AGENT_MESSAGE` to host with `{ fromAgentId, toAgentId, content }`
  2. Host routes to Agent B
  3. Agent B processes and may respond
- **Current state:** [NEW-SPEC]
- **Spec:** §5.1 superhive host module

---

### C7: Read-only flows

Views, navigation, click-through.

---

#### F078 — Browse workspace activity feed

- **Category:** C7
- **Trigger:** Home tab or dashboard right-aux
- **Surface:** Right auxiliary → home → activity
- **Steps:**
  1. App calls `listActivity({ workspaceId, filter, limit })`
  2. Renders `HomeActivityFeed`
- **Current state:** [WORKS]
- **Ref:** `src/data/activity/store.ts:131`; `src/components/right-auxiliary/home/HomeActivityFeed.tsx:39-77`

---

#### F079 — Filter activity feed

- **Category:** C7
- **Trigger:** FilterChips in HomeActivityFeed
- **Steps:** Local `filter` state → `listActivity({ filter })`
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/home/HomeActivityFeed.tsx:39-77`

---

#### F080 — Click activity row

- **Category:** C7
- **Trigger:** Click any activity row
- **Steps:** For `ref.type`, call matching nav callback
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/home/HomeActivityRow.tsx:112-127`

---

#### F081 — Open agent / project / channel / ticket from anywhere

- **Category:** C7
- **Trigger:** Click entity card / row / chip anywhere
- **Surface:** Anywhere
- **Steps:** Click → `openTab(...)` of appropriate kind with `selectedXxxId` set
- **Current state:** [WORKS]
- **Ref:** `src/screens/Dashboard.tsx:192-235`

---

#### F082 — Click breadcrumb segment

- **Category:** C7
- **Trigger:** Click workspace / section segment in breadcrumb
- **Surface:** CenterBreadcrumb in CenterWorkspace
- **Steps:** `onJump?.(workspaceId, section?)` → opens corresponding tab
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/CenterBreadcrumb.tsx:88-115`

---

#### F083 — Click tab / close tab / cycle tabs

- **Category:** C7
- **Trigger:** Click tab / X on tab / keyboard 1-9 / Cmd+W / Cmd+Shift+W
- **Surface:** CenterTabStrip
- **Steps:** `onTabClick(id)` / `onTabClose()` / `handleTabClickByIndex(n)` / `closeOtherTabs()`
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/CenterTab.tsx:57-97`; `src/lib/shortcuts/actions.ts:42-55`

---

#### F084 — Open new-tab `+` menu

- **Category:** C7
- **Trigger:** `+` IconButton in CenterTabStrip
- **Steps:** `setShowMenu(v => !v)` → renders 6 entries → each triggers `onNewTab(type, wsId)`
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/CenterTabStrip.tsx:89-122`

---

#### F085 — Open command palette

- **Category:** C7
- **Trigger:** `Mod+k` or Help popover "Shortcuts" row
- **Steps:** `setPaletteOpen(true)`
- **Current state:** [WORKS]
- **Ref:** `src/screens/Dashboard.tsx:445`; `src/lib/shortcuts/actions.ts:26`

---

#### F086 — Run command palette command

- **Category:** C7 (see also: each command is its own flow)
- **Trigger:** Click palette item
- **Steps:** Various `perform()` callbacks (12 commands)
- **Current state:** [WORKS]
- **Ref:** `src/components/shortcuts/CommandPalette.tsx:131-145`; wired at `src/screens/Dashboard.tsx:594-606`

---

#### F087 — Resize left / right panel

- **Category:** C7
- **Trigger:** Drag 1px gutter at panel edge
- **Steps:** Sets width (left: 180-400px, right: 200-500px)
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/LeftNav.tsx:78-108`; `src/components/right-auxiliary/RightAuxiliary.tsx:162-192`

---

#### F088 — Toggle left / right panel collapsed

- **Category:** C7
- **Trigger:** Panel-toggle IconButton or `Mod+Alt+S` / `Mod+Alt+B`
- **Steps:** Sets width to 0 or back to default
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/LeftNavHeader.tsx:22-34`; `src/screens/Dashboard.tsx:341-347`

---

#### F089 — Double-click maximize window

- **Category:** C7
- **Trigger:** Double-click in MaximizeOnDoubleClick wrapper
- **Steps:** `window.electron.toggleMaximize?.()`
- **Current state:** [WORKS]
- **Ref:** `src/components/ui/MaximizeOnDoubleClick.tsx:19-36`

---

#### F090 — Open help popover / click row

- **Category:** C7
- **Trigger:** HelpCircle button → click row (Documentation / Changelog / Shortcuts)
- **Steps:** Documentation/Changelog → dead (no consumer); Shortcuts → dispatches `app:open-command-palette`
- **Current state:** [WORKS] for Shortcuts row; [DEAD] for Documentation / Changelog
- **Ref:** `src/components/left-nav/HelpPopover.tsx:23-29`

---

#### F091 — Open settings / click nav item / search settings

- **Category:** C7
- **Trigger:** Utilities → Settings / click settings sidebar item / search input
- **Steps:** `onNavigate('settings')` / `onSectionChange(sectionId)` / filter list
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/Utilities.tsx:24-31`; `src/components/settings/SettingsSidebar.tsx:26-99`

---

#### F092 — Toggle accordion / favorite / active section expand

- **Category:** C7
- **Trigger:** Click header
- **Steps:** Local expand state
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/AccordionCore.tsx:43-94`; `FavoritesSection.tsx:36-48`; `ActiveSection.tsx:43-57`

---

#### F093 — Click favorite / archived project / active agent

- **Category:** C7
- **Trigger:** Click row
- **Steps:** Open agent or project tab
- **Current state:** [WORKS]
- **Ref:** `src/components/left-nav/FavoritesSection.tsx:51-66`; `ArchivedProjectsSection.tsx:60-78`; `ActiveSection.tsx:60-83`

---

#### F094 — Search / sort / filter entities (universal views)

- **Category:** C7
- **Trigger:** SearchBar / `<Select>` / StatusFilter in UniversalProjectsView, UniversalAgentsView, UniversalChannelsView, TicketsView
- **Steps:** Local UI state filters the rendered list
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/UniversalProjectsView.tsx:34-90`; `src/components/center-workspace/UniversalAgentsView.tsx:78-97`; `src/components/center-workspace/UniversalChannelsView.tsx:76-102`; `src/components/center-workspace/TicketsView.tsx:44-68`

---

#### F095 — Filter inbox (all / approvals / questions)

- **Category:** C7
- **Trigger:** FilterChips in AgentInbox
- **Steps:** Local filter
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/inbox/AgentInbox.tsx:316-322`

---

#### F096 — Filter sessions (time bucket)

- **Category:** C7
- **Trigger:** FilterChips in SessionsView (All / Today / Week / Older)
- **Steps:** Local filter on title + message bodies
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/sessions/SessionsView.tsx:64-69`

---

#### F097 — Search sessions

- **Category:** C7
- **Trigger:** SearchBar in SessionsView
- **Steps:** Local filter
- **Current state:** [WORKS]
- **Ref:** `src/components/right-auxiliary/sessions/SessionsView.tsx:22-50`

---

#### F098 — Open participant from channel / ticket / channel detail

- **Category:** C7
- **Trigger:** Click avatar / name in channel, ticket, project overview
- **Steps:** `onParticipantClick?.(name)` → `nameToAgentId(name)` → `handleAgentSelect`
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChannelDetailView.tsx:34-50`; `src/components/right-auxiliary/ChannelOverviewTab.tsx:88-90`

---

#### F099 — Open related ticket from channel

- **Category:** C7
- **Trigger:** Click ticket chip in channel header
- **Steps:** `onTicketClick?.(id)` → `handleTicketSelect`
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/ChannelDetailView.tsx:138-144`

---

#### F100 — See-more deep-links on Home

- **Category:** C7
- **Trigger:** Click "→" card on Project / Agents / Channels / Ticket sections of HomeView
- **Steps:** `onNavItemClick?.(id)` → opens universal-* view
- **Current state:** [WORKS]
- **Ref:** `src/components/center-workspace/HomeView.tsx:51-66, 209-211, 265-270, 308-313, 358-363`

---

#### F101 — OKF browse / search / open concept (NEW-SPEC)

- **Category:** C7
- **Trigger:** Click node in project OKF tree
- **Steps:** Reads `~/.superhive/okf/<project_id>/<path>.md`, parses frontmatter, renders body
- **Current state:** [NEW-SPEC]
- **Spec:** §6 OKF

---

### C8: Lifecycle / session flows

---

#### F102 — Dismiss setup wizard

- **Category:** C8
- **Trigger:** Click "Skip for now" or after creating workspace
- **Steps:** `dismissSetup()` writes `wizard:setup:dismissed=1` to sessionStorage
- **Current state:** [WORKS]
- **Ref:** `src/screens/Dashboard.tsx:503-506`; `src/components/center-workspace/setup/WorkspaceSetupView.tsx:28-37`

---

#### F103 — Refresh right panel

- **Category:** C8
- **Trigger:** Refresh IconButton in `RightPanelTabs`
- **Steps:** `onRefresh?.()` → `handleRefresh` → [STUB] toast
- **Current state:** [STUB]
- **Ref:** `src/components/right-auxiliary/RightPanelTabs.tsx:79-82`; `src/screens/Dashboard.tsx:312-314`

---

#### F104 — Sign out

- **Category:** C8
- **Trigger:** Sign Out row in TeamSelector or AccountSettings
- **Steps:** [STUB] toast
- **Current state:** [STUB]
- **Ref:** `src/components/left-nav/TeamSelector.tsx:102-108`; `src/components/settings/AccountSettings.tsx:124-128`

---

#### F105 — Toggle theme (palette)

- **Category:** C8
- **Trigger:** `Mod+Alt+t` or `go-toggle-theme` palette item
- **Steps:** `handleToggleTheme` → flip `appearance.theme` dark ↔ light
- **Current state:** [WORKS]
- **Ref:** `src/lib/shortcuts/actions.ts`; wired at `src/screens/Dashboard.tsx`

---

#### F106 — Export settings JSON

- **Category:** C8
- **Trigger:** Export button in PrivacySettings
- **Steps:** `exportJson()` → triggers download blob `superhive-settings.json`, sets `exportDataLastRun`
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/PrivacySettings.tsx:36-47`

---

#### F107 — Export usage CSV

- **Category:** C8
- **Trigger:** Export button in CostUsageSettings
- **Steps:** Downloads `superhive-usage.csv` blob + toast
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/CostUsageSettings.tsx:62-73`

---

#### F108 — Reset all settings

- **Category:** C8
- **Trigger:** Reset button in PrivacySettings
- **Steps:** `resetAll()` clears every domain to `DEFAULT_SETTINGS`
- **Current state:** [WORKS]
- **Ref:** `src/components/settings/PrivacySettings.tsx:49-52`; `src/lib/settings-context.tsx:123-128`

---

#### F109 — Delete workspace data

- **Category:** C8
- **Trigger:** Delete button per workspace row in PrivacySettings
- **Steps:** Type workspace id → [STUB]
- **Current state:** [STUB]
- **Spec:** §3, §11 — needs to delete OKF bundle too (`rm -rf ~/.superhive/okf/<project_id>/`)
- **Ref:** `src/components/settings/PrivacySettings.tsx:99-107, 139-151`

---

#### F110 — Delete account

- **Category:** C8
- **Trigger:** Delete button in PrivacySettings
- **Steps:** Type "delete" → [STUB]
- **Current state:** [STUB]
- **Ref:** `src/components/settings/PrivacySettings.tsx:124-136, 153-165`

---

#### F111 — Contact sales (Enterprise)

- **Category:** C8
- **Trigger:** Contact sales button on Enterprise card
- **Steps:** [STUB] toast
- **Current state:** [STUB]
- **Ref:** `src/components/settings/BillingSettings.tsx:476`

---

#### F112 — Update / Add payment method

- **Category:** C8
- **Trigger:** Update or Add card button in BillingSettings
- **Steps:** [STUB] toast
- **Current state:** [STUB]
- **Spec:** §10
- **Ref:** `src/components/settings/BillingSettings.tsx:498-518`

---

#### F113 — Download starter theme

- **Category:** C8
- **Trigger:** Download starter button in AppearanceSettings
- **Steps:** [STUB] toast
- **Current state:** [STUB]
- **Ref:** `src/components/settings/AppearanceSettings.tsx:215-221`

---

#### F114 — Import theme file

- **Category:** C8
- **Trigger:** Import button in AppearanceSettings
- **Steps:** [STUB] toast
- **Current state:** [STUB]
- **Ref:** `src/components/settings/AppearanceSettings.tsx:223-232`

---

#### F115 — Change avatar (account)

- **Category:** C8
- **Trigger:** Avatar group hover
- **Steps:** [STUB] no onClick
- **Current state:** [STUB]
- **Ref:** `src/components/settings/AccountSettings.tsx:51-56`

---

#### F116 — Edit chat model from header (NEW-SPEC)

- **Category:** C2 / C8
- **Trigger:** Chevron button next to model in ChatHeader
- **Steps:** Should open model picker; currently no onClick
- **Current state:** [STUB]
- **Ref:** `src/components/center-workspace/ChatHeader.tsx:73-79`

---

#### F117 — Reopen thread (NEW-SPEC)

- **Category:** C7 / C8
- **Trigger:** Click ThreadRow in right Sessions panel
- **Steps:** Should reopen thread in center; currently toast only
- **Current state:** [STUB]
- **Ref:** `src/screens/Dashboard.tsx:333-335`

---

#### F118 — Thread options menu (NEW-SPEC)

- **Category:** C8
- **Trigger:** MoreHorizontal IconButton in ChatHeader
- **Steps:** Should open rename/delete/export menu
- **Current state:** [STUB]
- **Ref:** `src/components/center-workspace/ChatHeader.tsx:81-87`

---

#### F119 — Attach file in chat (NEW-SPEC)

- **Category:** C2
- **Trigger:** Paperclip IconButton in ChatInput
- **Steps:** Should open file picker
- **Current state:** [STUB]
- **Ref:** `src/components/center-workspace/ChatInput.tsx:87-94`

---

#### F120 — Attach file in channel (NEW-SPEC)

- **Category:** C2
- **Trigger:** Paperclip IconButton in ChannelDetailView
- **Steps:** Should open file picker
- **Current state:** [STUB]
- **Ref:** `src/components/center-workspace/ChannelDetailView.tsx:181-187`

---

## Summary by state

| State | Count | Flows |
|---|---|---|
| `[WORKS]` | ~50 | Core navigation, settings persistence, chat persistence, channel messages, agent permissions, audits, billing plan, kanban filters |
| `[STUB]` | ~14 | F025 terminate, F028 archive ticket, F040 delete workspace/account, F045 payment, F103 refresh, F104 sign out, F109-115 various stubs, F116-120 various stubs |
| `[LOCAL]` | ~8 | F019 project title edit, F026 ticket edit, F027 close ticket, F029 snooze/done, F030 channel edit, F053-054 participants, F051 assign ticket |
| `[DEAD]` | ~3 | F033 pin chat tab, F063 view diff, F090 Documentation/Changelog rows |
| `[MISSING]` | ~15 | F005 add agent to project, F024 edit agent name/role/skills, F048 kanban drag/drop, F050 remove agent from project, F052 link ticket to channel, F055-056 favorites add/remove, F058 disconnect integration, F059 engine toggle, F006/F007 form dialogs |
| `[NEW-SPEC]` | ~25 | F004 create agent, F010-011 Workspace/Project Agent sessions, F014/F058 integrations wiring, F015/F101 OKF, F022 permissions sync, F025 terminate (real), F032 agent streaming, F069-071 permission/ticket/sub-agent requests, F072-077 system writes, F116-120 chat polish |

---

## Suggested tackle order

When we start implementing, recommended waves:

1. **Wave A — Settings persistence (C2):** fix all [LOCAL] and [STUB] settings flows (F019, F026-028, F030, F040 delete) — small, isolated, easy wins
2. **Wave B — Lifecycle flows (C8):** wire F025 terminate, F109-110 delete workspace/account, F045 payment — important for trust
3. **Wave C — Link flows (C3):** F005/F050 agent-project link, F052 ticket-channel link, F055-056 favorites — high-value cross-entity UX
4. **Wave D — Agent creation (C1):** F004 the big new wizard
5. **Wave E — Workspace/Project Agent sessions (C1):** F010, F011 chat surfaces for new agents
6. **Wave F — OKF (C6 + C7):** F015/F101 browse, F074-076 writes — the foundation for everything else
7. **Wave G — System asks (C5):** F069-071 permission, ticket, sub-agent requests
8. **Wave H — System writes (C6):** F072-077 agent state, heartbeat, inter-agent messages
9. **Wave I — Tiering layer:** introduce tier gates by removing features per tier (per spec §10)

---

## Open questions for spec/flow alignment

These flows have gaps that need spec answers before implementation:

1. **F024 — Edit agent name/role/skills**: when user edits a running agent, does `general-v1` hot-reload config or require restart?
2. **F025 — Terminate agent**: what happens to in-flight work? Resume on relaunch?
3. **F048 — Kanban drag/drop**: should reordering change `position` field, or stay auto-ordered by timestamp?
4. **F069 — Permission request UX**: full modal vs. toast? Where does the request history live?
5. **F070 — Ticket proposal card**: inline in chat or modal? Can user edit before approving?
6. **F074 — OKF writes**: should the host validate frontmatter schema or pass through?
7. **F112 — Payment method**: real Stripe integration or continued stub?