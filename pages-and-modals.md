# Superhive — Pages & Modals Inventory

## Overview

This document enumerates **every page, modal, dialog, and panel surface** in the Superhive app — the UI scaffolding that exists or needs to exist. This is the **build list for the "scaffolding first" phase**: build every surface (even as a stub), then come back and wire the behaviors.

Each surface has a unique ID so we can tackle them one at a time without losing context.

## Companion documents

- `spec.md` — the product spec (vision, hierarchy, OKF, agents)
- `flows.md` — every flow (user/system actions) with current state and file refs

When in doubt about what a surface should *do*, check `spec.md`. When wiring behavior, check `flows.md`.

---

## Status legend

| Tag | Meaning |
|---|---|
| `[WORKS]` | Fully functional |
| `[PARTIAL]` | Surface exists but some controls/saves are stubbed or local-only |
| `[MISSING]` | Surface does not exist; needs to be built |
| `[DORMANT]` | Compiled but not rendered (dead path) |
| `[DEAD]` | Code path that can never be reached |
| `[STUB]` | Toast-only; no real persistence |
| `[NEW-SPEC]` | Comes from spec.md; doesn't exist in code yet |

---

## ID conventions

- `P###` — full-page surface (center tab, settings page, top-level screen)
- `M###` — modal/dialog/sheet
- `C###` — confirmation modal (subsidiary to a flow)
- `PL###` — panel/chrome (left nav, right aux, etc.)
- `PR###` — popover, toast, overlay

---

# Pages

---

## Top-level screens

### P001 — Dashboard (3-panel shell)

- **Status:** [WORKS]
- **Spec section:** §2 Hierarchy (whole-app shell)
- **Purpose:** The cockpit. Renders LeftNav + CenterWorkspace + RightAuxiliary.
- **Entry points:** Default on launch
- **State:** active workspace, all tabs, all entities
- **File:** `src/screens/Dashboard.tsx`
- **Implementation notes:** Already wired. Owns tab state, active workspace, error boundaries.

### P002 — Settings (settings shell)

- **Status:** [WORKS]
- **Spec section:** §11.3 Settings
- **Purpose:** Categorized settings nav (Personal/Workflow/Organization) + active settings page
- **Entry points:** `Mod+,`, TeamSelector "Settings" row, left-nav Utilities → Settings
- **State:** settings only (localStorage-backed)
- **File:** `src/screens/Settings.tsx`
- **Implementation notes:** Already wired.

---

## Center workspace tabs (TabBody dispatch)

`TabBody.tsx:81` is the central switch. Tab kinds come from `src/data/tabs/interface.ts:1-13`.

### P010 — Home (workspace dashboard)

- **Status:** [WORKS]
- **Spec section:** §3 Workspaces (workspace overview)
- **Purpose:** Workspace dashboard — stats, projects, agents, channels, tickets overview
- **Entry points:** First tab on launch; `+` new-tab menu; `tab.new` shortcut fallback
- **State:** Reads `listProjects`, `listProjectAgents`, `listChannels`, `listUniversalTickets`, `listAgents` for active workspace
- **File:** `src/components/center-workspace/HomeView.tsx`
- **Related flows:** F078 (browse feed), F100 (see-more deep-links)

### P011 — Setup wizard (no workspaces)

- **Status:** [WORKS] (initial wizard); [DORMANT] (per-workspace ready view)
- **Spec section:** §3 (first launch)
- **Purpose:** "Welcome to Superhive" hero with setup actions on first launch
- **Entry points:** Auto-shown on Home tab when 0 workspaces + setup not dismissed
- **State:** sessionStorage `wizard:setup:dismissed`
- **Files:**
  - `src/components/center-workspace/setup/SetupWizardView.tsx` (facade)
  - `src/components/center-workspace/setup/WorkspaceSetupView.tsx` (initial)
  - `src/components/center-workspace/setup/WorkspaceReadyView.tsx` (dormant — wire or delete)
- **Implementation notes:** WorkspaceSetupView writes real workspace; WorkspaceReadyView is dormant (activation instructions in inline comments).
- **Related flows:** F002 (create workspace wizard)

### P012 — Projects (workspace list)

- **Status:** [PARTIAL] — only renders the FIRST project for the workspace
- **Spec section:** §4 Projects
- **Purpose:** Workspace projects kanban: ExecutionStream + SwarmRoster + Communications
- **Entry points:** Left-nav "Projects" header (currently maps to `universal-projects`); breadcrumb
- **State:** Reads `listTickets`, `listProjectAgents`, `listChannels`
- **File:** `src/components/center-workspace/ProjectsView.tsx`
- **Implementation notes:** `getProjectTitle(workspaceId)` returns only the first project. **Fix: render all projects for the workspace, or remove this tab and rely on `universal-projects`.**
- **Related flows:** F094 (search/sort/filter)

### P013 — Project (detail)

- **Status:** [WORKS]
- **Spec section:** §4 Projects
- **Purpose:** Per-project deep view — 4 stat cards + ExecutionStream + SwarmRoster + Communications
- **Entry points:** Click project card anywhere; left-nav accordion
- **State:** Reads single `Project` from `getProject`
- **File:** `src/components/center-workspace/ProjectDetailView.tsx`
- **Related flows:** F081 (open from anywhere)

### P014 — Tickets (workspace kanban)

- **Status:** [WORKS] (read); [MISSING] (create flow)
- **Spec section:** §4.2 Tickets
- **Purpose:** Workspace-wide kanban: 4 columns (BACKLOG/EXECUTING/REVIEW/MERGED) with search/sort
- **Entry points:** Left-nav "Tickets" header; command palette "All tickets"
- **State:** Reads `listUniversalTickets(workspaceId)`
- **File:** `src/components/center-workspace/TicketsView.tsx`
- **Implementation notes:** `New Ticket` button needs M002 (Create Ticket dialog).
- **Related flows:** F006 (create), F094 (filter/sort), F048 (drag/drop — NEW-SPEC)

### P015 — Channels (workspace list)

- **Status:** [WORKS] (read); [MISSING] (create flow)
- **Spec section:** §4.3 Communications
- **Purpose:** Searchable, status-filterable channel list for the workspace
- **Entry points:** Left-nav "Communications" header
- **State:** Reads `listChannels(workspaceId)`
- **File:** `src/components/center-workspace/CommunicationsView.tsx`
- **Implementation notes:** `New Channel` button needs M003 (Create Channel dialog).
- **Related flows:** F007 (create), F094 (filter)

### P016 — Channel (detail)

- **Status:** [WORKS]
- **Spec section:** §4.3 Communications
- **Purpose:** Channel header + full message thread + compose input
- **Entry points:** Click channel anywhere
- **State:** Reads + writes via `addChannelMessage`
- **File:** `src/components/center-workspace/ChannelDetailView.tsx`
- **Related flows:** F031 (send message), F098 (open participant), F099 (open related ticket), F120 (attach file — STUB)

### P017 — Agents (workspace list)

- **Status:** [WORKS]
- **Spec section:** §5 Agents
- **Purpose:** Vertical list of workspace agents with status + role + uptime
- **Entry points:** `+` new-tab menu only (left-nav "Agents" maps to universal-agents)
- **State:** Reads `listAgents` + `listProjectAgents`
- **File:** `src/components/center-workspace/AgentsView.tsx`
- **Implementation notes:** No "Create Agent" button. Needs M001 (Agent creation wizard).
- **Related flows:** F081, F094

### P018 — Agent (chat)

- **Status:** [WORKS] (persistence); [NEW-SPEC] (real agent streaming)
- **Spec section:** §5.2 Lifecycle
- **Purpose:** Agent chat — header, thread list, message thread, composer, quick-starts
- **Entry points:** Click agent anywhere
- **State:** Reads + writes `listThreads`, `addMessageToActiveThread`, `createThreadForAgent`
- **File:** `src/components/center-workspace/ChatView.tsx`
- **Implementation notes:** User messages persist; assistant responses are stubbed. Needs `general-v1` WS streaming (per spec §5.2).
- **Related flows:** F008/F009 (thread create), F032 (send), F034/F035/F036 (regenerate/feedback/copy), F037 (model pick)

### P019 — Universal Projects (cross-workspace)

- **Status:** [WORKS]
- **Spec section:** §3 (cross-workspace aggregates)
- **Purpose:** All projects across all workspaces with workspace filter, sort, search
- **Entry points:** Left-nav "Projects" header; command palette "All projects"; Home see-more
- **State:** Reads `listProjects` + `listWorkspaces`
- **File:** `src/components/center-workspace/UniversalProjectsView.tsx`
- **Related flows:** F094

### P020 — Universal Agents (cross-workspace)

- **Status:** [WORKS]
- **Spec section:** §5 (cross-workspace aggregate)
- **Purpose:** Cross-workspace agent roster with status filter, sort, search. Per-agent context saturation, pending audits, last action.
- **Entry points:** Left-nav "Agents" header; command palette "All agents"
- **State:** Reads `listAgents` + per-agent helpers
- **File:** `src/components/center-workspace/UniversalAgentsView.tsx`
- **Related flows:** F094

### P021 — Universal Channels (cross-workspace)

- **Status:** [WORKS]
- **Spec section:** §4.3 (cross-workspace aggregate)
- **Purpose:** All channels across workspaces with status filter, sort, search
- **Entry points:** Left-nav accordion "Channels"; command palette "All channels"
- **State:** Reads `listChannels()` (all) + `listWorkspaces`
- **File:** `src/components/center-workspace/UniversalChannelsView.tsx`
- **Related flows:** F094

### P022 — Project Agent chat (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §7 Project Agent
- **Purpose:** User-facing chat inside a project. Persistent thread per project. Project Agent may propose tickets inline (per §7.2 authority).
- **Entry points:** Open project → Project Agent tab (default tab for project detail)
- **State:** project-scoped chat thread; persistent across sessions
- **File (to create):** `src/components/center-workspace/ProjectAgentView.tsx`
- **Implementation notes:**
  - New tab kind `project-agent` with `selectedProjectId`
  - Add to `CenterTabType` and `TabBody.tsx` switch
  - Stream from the Project Agent (`general-v1` instance scoped to this project)
  - Render ticket-proposal cards inline (F070 / M005)
- **Related flows:** F011 (session start), F070 (propose ticket), F032 (send)

### P023 — Workspace Agent chat (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §8 Workspace Agent
- **Purpose:** User-facing chat at the workspace level. Persistent thread per workspace. Strategic view across all projects.
- **Entry points:** Workspace Agent tab (one per workspace, reachable from workspace header)
- **State:** workspace-scoped chat thread; persistent across sessions
- **File (to create):** `src/components/center-workspace/WorkspaceAgentView.tsx`
- **Implementation notes:**
  - New tab kind `workspace-agent` with `workspaceId`
  - Add to `CenterTabType` and `TabBody.tsx` switch
  - Stream from the Workspace Agent
  - Read-only OKF views from each project (delegate writes to Project Agents)
- **Related flows:** F010 (session start), F032 (send)

### P024 — Ticket detail (center tab) (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §4.2 Tickets
- **Purpose:** Full ticket detail view as a center tab (today tickets only have right-aux overview)
- **Entry points:** Click ticket card in any list
- **State:** ticket + assignee + channel + activity
- **File (to create):** `src/components/center-workspace/TicketDetailView.tsx`
- **Implementation notes:**
  - Add `ticket` (detail) tab kind to `CenterTabType`
  - Add case in `TabBody.tsx`
  - Render: ticket header, status, assignee, related channel, full activity, manage controls (status/priority/type/assignee)
- **Related flows:** F026, F027, F028, F051

### P025 — Agent creation wizard (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.1 Runtime architecture; §5.2 Lifecycle; §5.3 Sub-agents; §5.4 Skills
- **Purpose:** Multi-step wizard that creates a `general-v1` agent folder, launches the subprocess, registers with host.
- **Entry points:** Workspace → Agents tab → "New Agent" button; command palette (future)
- **State:** New agent in app DB + folder on disk + running subprocess
- **File (to create):** `src/components/center-workspace/AgentCreationWizard.tsx`
- **Implementation notes:**
  - Steps: Identity (name/role/principles/boundaries) → LLM provider (link to Models settings) → Skills (catalog toggle) → Sub-agent profile (8 builtins + custom) → Generation (run `general-v1` setup.sh non-interactively, ULID pre-generated) → Launch (start subprocess, await AGENT_HELLO)
  - Drives `general-v1` via Node `child_process` from Electron main; agent folder at `~/.superhive/agents/<ulid>/`
  - Reaches M001 (this wizard IS M001)
- **Related flows:** F004

### P026 — Agent edit dialog (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.2 Lifecycle
- **Purpose:** Edit agent name/role/principles/boundaries/skills after creation
- **Entry points:** Agent right-aux → Manage tab → "Edit agent" button; agent detail header
- **State:** Agent record + sync to running `general-v1` process
- **File (to create):** `src/components/center-workspace/AgentEditDialog.tsx`
- **Implementation notes:**
  - If running, hot-reload config in `general-v1` process via WS message
  - Confirm restart vs hot-reload (TBD — see flows.md open questions)
- **Related flows:** F024

### P027 — Ticket creation dialog (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §4.2 Tickets; F006
- **Purpose:** Full create-ticket form
- **Entry points:** TicketsView "New Ticket" button; command palette `new-ticket`; Project Agent proposal card (F070)
- **State:** New `Ticket` row + OKF entry
- **File (to create):** `src/components/center-workspace/CreateTicketDialog.tsx`
- **Implementation notes:**
  - Fields: title, description, successCriteria, priority, type, assignee picker, relatedChannelId picker
  - On submit: write ticket, write OKF `tickets/<id>.md`
- **Related flows:** F006

### P028 — Channel creation dialog (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §4.3 Communications; F007
- **Purpose:** Full create-channel form
- **Entry points:** CommunicationsView "New Channel" button; `+` new-tab menu
- **State:** New `CommunicationChannel` row + OKF entry
- **File (to create):** `src/components/center-workspace/CreateChannelDialog.tsx`
- **Implementation notes:**
  - Fields: topic, status, initial participants (multi-select from project agents), relatedTicketId picker
  - On submit: write channel, write OKF `channels/<id>.md`
- **Related flows:** F007

### P029 — Integrations settings page (NEW-SPEC)

- **Status:** [MISSING] (sidebar item is decorative)
- **Spec section:** §5.1 communication module; F014
- **Purpose:** Real Integrations settings page (GitHub/Slack/Linear/Notion/Jira/Webhook)
- **Entry points:** Settings sidebar (replace "Coming soon" item)
- **State:** `settings.integrations[]`
- **File (to create):** `src/components/settings/IntegrationsSettings.tsx`
- **Implementation notes:**
  - Add `integrations` entry to settings-registry
  - Cards per integration: connect/disconnect, OAuth flow, channel/event picker
  - Wire to `general-v1` communication module for event forwarding
- **Related flows:** F014, F058

### P030 — Project OKF sidebar/tree (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §6 OKF
- **Purpose:** Tree view of `~/.superhive/okf/<project_id>/` inside project detail
- **Entry points:** Open project → OKF sidebar (right of project detail, or new tab)
- **State:** Reads `~/.superhive/okf/<project_id>/` directory
- **File (to create):** `src/components/center-workspace/OkfSidebar.tsx`
- **Implementation notes:**
  - Folder structure: `index.md`, `objectives.md`, `status.md`, `tickets/`, `decisions/`, `channels/`, `agents/`, `events/`
  - Click file → open in OKF concept viewer (P031)
- **Related flows:** F015, F101

### P031 — OKF concept viewer (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §6
- **Purpose:** Open a single `.md` concept doc — parse frontmatter, render body
- **Entry points:** Click file in OKF sidebar (P030); deep-link from activity feed
- **State:** Reads `.md` from disk; parses frontmatter
- **File (to create):** `src/components/center-workspace/OkfConceptView.tsx`
- **Implementation notes:**
  - Frontmatter displayed as metadata header (type/title/description/tags/timestamp)
  - Body rendered as markdown
  - Optional inline edit (P032)
- **Related flows:** F015

### P032 — OKF editor (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §6
- **Purpose:** Edit a concept `.md` file in the OKF bundle
- **Entry points:** OKF concept viewer → "Edit" button
- **State:** Writes `.md` to disk
- **File (to create):** `src/components/center-workspace/OkfConceptEditor.tsx`
- **Implementation notes:**
  - Frontmatter editor (key/value pairs) + markdown body editor
  - Save writes to disk via Electron IPC
  - Auto-append log.md entry
- **Related flows:** F074 (system write), F075 (manual edit)

### P033 — OKF search (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §6
- **Purpose:** Full-text search across OKF bundle
- **Entry points:** OKF sidebar search input
- **State:** Indexes `.md` files on disk
- **File (to create):** `src/components/center-workspace/OkfSearch.tsx`
- **Implementation notes:**
  - Could use simple ripgrep or build a small FTS index
  - Returns list of matching concepts with snippets
- **Related flows:** F101

### P034 — Permission request view (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.2 Lifecycle (PERMISSION_REQUEST); §5.1 permission module
- **Purpose:** Persistent view of all permission requests from agents
- **Entry points:** Agent right-aux → Sessions tab; toast → "View history"
- **State:** Permission request log
- **File (to create):** `src/components/right-auxiliary/agent/PermissionHistory.tsx`
- **Implementation notes:**
  - List of past requests with approve/deny state
  - Live toast (PR003) for incoming requests
- **Related flows:** F069

### P035 — Sub-agent nested view (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.3 Sub-agents
- **Purpose:** Show sub-agents spawned by a parent agent as nested rows
- **Entry points:** Agent right-aux → Overview or new "Sub-agents" tab
- **State:** Reads `general-v1` sub-agent registry
- **File (to create):** `src/components/right-auxiliary/agent/SubAgentList.tsx`
- **Implementation notes:**
  - Each parent agent shows its 8 builtins or spawned custom sub-agents
  - Status streamed over WS via `comm-subagent` integration
- **Related flows:** F071

### P036 — Cross-project agent view (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.4 Cross-project identity
- **Purpose:** Show all projects an agent works on, with per-project context switcher
- **Entry points:** Agent detail header → "Projects" link
- **State:** Reads `ProjectAgent[]` joins
- **File (to create):** `src/components/center-workspace/AgentProjectsView.tsx`
- **Implementation notes:**
  - List of projects the agent is assigned to
  - Per-project status, current task, context saturation
  - Switch between projects updates the right-aux context
- **Related flows:** F005, F050

---

## Right-auxiliary tabs (5 types across 11 contexts)

### PA010 — Overview (per context)

- **Status:** [WORKS] for all contexts
- **Files:** `TelemetryDeck` (agent), `TicketOverviewTab`, `ProjectOverviewTab`, `ChannelOverviewTab`, `ChannelStats`/`AgentStats`/`UniversalProjectStats`/`UniversalAgentStats` (global-stats)
- **Spec section:** All entity overviews
- **Purpose:** Identity strip, stats, links to related entities

### PA011 — Manage (per context)

- **Status:** [PARTIAL] — some controls don't persist
- **Files:** `ControlMatrix` (agent), `TicketManageTab`, `ProjectManageTab`, `ChannelManageTab`
- **Spec section:** §4.1, §4.2, §4.3, §5.4
- **Implementation notes:**
  - `ControlMatrix` model dropdown: [STUB] (toast only) — fix to write `modelEngine`
  - `TicketManageTab` save: [LOCAL] — wire to persist
  - `ProjectManageTab` title/brief: [LOCAL] — wire to persist
  - `ChannelManageTab` topic/status/participants: [LOCAL] — wire to persist
- **Related flows:** F019, F022, F023, F026, F030

### PA012 — Inbox (per context)

- **Status:** [PARTIAL] / [STUB]
- **Files:**
  - `AgentInbox` — [WORKS] (real approve/deny/answer)
  - `TicketInbox` — [STUB] (always empty state)
  - `ChannelInbox` — [STUB] (always empty state)
  - `ProjectInbox` — [LOCAL] (snooze/done don't persist)
  - `DashboardInbox` — [STUB] + unreachable (dead `dashboard` context)
- **Spec section:** §9 Communication Model
- **Implementation notes:**
  - Either wire `TicketInbox` / `ChannelInbox` to show real data OR delete them
  - Wire `ProjectInbox` / `DashboardInbox` snooze/done to persist
  - Decide: `dashboard` context dead OR wire `DashboardOverview` somewhere

### PA013 — Sessions (agent context only)

- **Status:** [WORKS] (read); [STUB] (row click)
- **File:** `src/components/right-auxiliary/sessions/SessionsView.tsx`
- **Spec section:** §5.2 Lifecycle
- **Implementation notes:** Row click → "Reopen thread" toast. Wire to actually open thread in chat tab.

### PA014 — Activity (home context only)

- **Status:** [WORKS]
- **File:** `src/components/right-auxiliary/home/HomeActivityFeed.tsx`
- **Spec section:** §3 Workspaces
- **Implementation notes:** Reads `listActivity({workspaceId, filter})`. Click-through navigation works.

### PA015 — dashboard context (dead)

- **Status:** [DEAD] — unreachable
- **Files:** `DashboardOverview.tsx`, `DashboardInbox.tsx`
- **Implementation notes:** Right-aux type allows `kind: 'dashboard'` but no caller ever sets it. Delete or wire.

---

## Settings pages (10 + 1)

### P040 — Account

- **Status:** [PARTIAL] (avatar is STUB)
- **File:** `src/components/settings/AccountSettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** Name, username, default workspace, highlight color work. Avatar group hover has no onClick.
- **Related flows:** F038

### P041 — Appearance

- **Status:** [PARTIAL] (custom-theme buttons are STUB)
- **File:** `src/components/settings/AppearanceSettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** Theme picker + code-syntax theme work. "Download starter" / "Import theme" buttons are opacity-70 and toast-stubbed.
- **Related flows:** F039, F113, F114

### P042 — Privacy & Data

- **Status:** [PARTIAL] (deletes are STUB)
- **File:** `src/components/settings/PrivacySettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** Export/retention/reset work. Delete workspace data + Delete account are toast-only.
- **Related flows:** F040, F108, F109, F110

### P043 — Defaults

- **Status:** [WORKS]
- **File:** `src/components/settings/DefaultsSettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** All startup/view/time-format/kanban/right-panel-tab settings work.
- **Related flows:** F018, F041

### P044 — Keyboard

- **Status:** [WORKS] (read-only by design)
- **File:** `src/components/settings/KeyboardSettings.tsx`
- **Spec section:** Keyboard shortcuts
- **Implementation notes:** Search + category filter; documentation only.

### P045 — Models

- **Status:** [WORKS]
- **File:** `src/components/settings/ModelsSettings.tsx`
- **Spec section:** §5.1 (LLM providers)
- **Implementation notes:** Verified providers, custom providers, save/show-hide/add-remove model IDs, disconnect, delete all work.
- **Related flows:** F012, F013, F042, F059

### P046 — Workflows

- **Status:** [PARTIAL] (comingSoon; no create/delete)
- **File:** `src/components/settings/WorkflowsSettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** Edit name/cron works; no actual cron scheduling. No "Add workflow" or "Delete workflow" buttons.
- **Related flows:** F043

### P047 — Cost & Usage

- **Status:** [PARTIAL] (comingSoon; budgets disabled)
- **File:** `src/components/settings/CostUsageSettings.tsx`
- **Spec section:** §11.3
- **Implementation notes:** 30-day chart + CSV export work. Budget Limits + Spend Alerts sections are disabled (`opacity-50 pointer-events-none`).
- **Related flows:** F044

### P048 — Workspaces

- **Status:** [PARTIAL] (archive is STUB; data integrity issue)
- **File:** `src/components/settings/WorkspacesSettings.tsx`
- **Spec section:** §3
- **Implementation notes:** Create, rename, retention work. Archive is toast-stubbed.
- **Critical issue:** This page writes to `settings.workspaces.workspaces`, but the TeamSelector reads from `data/workspaces/store`. **Two stores; not synced.** Consolidation needed.
- **Related flows:** F001, F016, F017

### P049 — Billing & Plans

- **Status:** [PARTIAL] (payment is STUB)
- **File:** `src/components/settings/BillingSettings.tsx`
- **Spec section:** §10 Tiering (cosmetic only; spec says tiering built last)
- **Implementation notes:** Tier/period changes work. Payment method add/update is stubbed. Per spec §10, tiering is built last — but UI scaffold is in place.
- **Related flows:** F045, F111, F112

### P050 — Integrations (NEW-SPEC)

- **Status:** [MISSING] (sidebar item is decorative)
- **File (to create):** `src/components/settings/IntegrationsSettings.tsx`
- **Spec section:** §5.1 communication module
- **Implementation notes:** See P029 (same page) — register in `settings-registry.ts`, replace sidebar decorative item.
- **Related flows:** F014, F058

---

## Setup wizards

### P060 — WorkspaceSetupView (initial)

- **Status:** [WORKS]
- **File:** `src/components/center-workspace/setup/WorkspaceSetupView.tsx`
- **Spec section:** §3
- **Implementation notes:** Creates real workspace via `data/workspaces/store::createWorkspace`. Other rows are stubbed.

### P061 — WorkspaceReadyView (per-workspace)

- **Status:** [DORMANT]
- **File:** `src/components/center-workspace/setup/WorkspaceReadyView.tsx`
- **Implementation notes:** Render path commented out in `SetupWizardView.tsx`. Activate per inline instructions OR delete.
- **Related flows:** None yet

---

# Modals / Dialogs / Sheets

---

## Creation modals

### M001 — Agent creation wizard (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.1; §5.2; §5.3
- **Purpose:** Multi-step wizard (Identity → LLM → Skills → Sub-agents → Generation → Launch)
- **File (to create):** `src/components/center-workspace/AgentCreationWizard.tsx`
- **Implementation notes:** Same as P025 (this modal IS the wizard).
- **Related flows:** F004

### M002 — Create Ticket dialog

- **Status:** [MISSING]
- **Spec section:** §4.2; F006
- **File (to create):** `src/components/center-workspace/CreateTicketDialog.tsx`
- **Same as:** P027
- **Implementation notes:** Modal centered; fields per spec.

### M003 — Create Channel dialog

- **Status:** [MISSING]
- **Spec section:** §4.3; F007
- **File (to create):** `src/components/center-workspace/CreateChannelDialog.tsx`
- **Same as:** P028
- **Implementation notes:** Modal centered; fields per spec.

### M004 — Create Workspace dialog (inline in settings)

- **Status:** [WORKS]
- **File:** inline in `src/components/settings/WorkspacesSettings.tsx:294-327`
- **Spec section:** §3
- **Implementation notes:** Writes to `settings.workspaces.workspaces`. **NOT synced with `data/workspaces/store`.**
- **Related flows:** F001

### M005 — Project Agent ticket-proposal card (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §7.2; F070
- **Purpose:** Inline card in Project Agent chat when agent proposes creating a ticket
- **File (to create):** `src/components/chat/ProposalCard.tsx`
- **Implementation notes:** Card shows draft ticket (title/description/assignee); "Approve & Create" / "Edit" / "Cancel" buttons.
- **Related flows:** F070

### M006 — Create Project dialog

- **Status:** [WORKS]
- **File:** `src/components/center-workspace/CreateProjectDialog.tsx`
- **Spec section:** §4
- **Implementation notes:** Creates project + ProjectAgent rows. Should also init OKF bundle + Project Agent (NEW-SPEC).
- **Related flows:** F003

---

## Edit modals (mostly inline today; modalization TBD)

### M010 — Edit Agent dialog (NEW-SPEC)

- **Status:** [MISSING]
- **File (to create):** `src/components/center-workspace/AgentEditDialog.tsx`
- **Same as:** P026
- **Related flows:** F024

### M011 — Edit Project (inline)

- **Status:** [PARTIAL] — title/brief edits don't persist
- **File:** `src/components/right-auxiliary/ProjectManageTab.tsx`
- **Spec section:** §4.1
- **Implementation notes:** Could keep inline OR extract to modal. Recommend keeping inline.
- **Related flows:** F019, F020, F021

### M012 — Edit Ticket (inline)

- **Status:** [PARTIAL] — save bar toasts
- **File:** `src/components/right-auxiliary/TicketManageTab.tsx`
- **Spec section:** §4.2
- **Implementation notes:** Inline. Wire save to persist.
- **Related flows:** F026, F027, F028, F051

### M013 — Edit Channel (inline)

- **Status:** [PARTIAL] — save bar toasts
- **File:** `src/components/right-auxiliary/ChannelManageTab.tsx`
- **Spec section:** §4.3
- **Implementation notes:** Inline. Wire save to persist.
- **Related flows:** F030, F053, F054

### M014 — Provider Edit sheet

- **Status:** [WORKS]
- **File:** inline in `src/components/settings/ModelsSettings.tsx:95-319`
- **Spec section:** §5.1 LLM providers
- **Related flows:** F012, F042

### M015 — Add Custom Provider dialog

- **Status:** [WORKS]
- **File:** inline in `src/components/settings/ModelsSettings.tsx:434-583`
- **Spec section:** §5.1
- **Related flows:** F013

---

## System-driven modals (NEW-SPEC)

### M020 — Permission Request toast + approve/deny (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.2 (PERMISSION_REQUEST WS message); F069
- **File (to create):** `src/components/ui/PermissionRequestToast.tsx` (transient)
- **Implementation notes:**
  - Top-right toast with agent name + action description + Approve / Deny buttons
  - Sends `PERMISSION_GRANTED` / `PERMISSION_DENIED` over WS
  - Persists entry in permission history (P034)
- **Related flows:** F069

### M021 — Sub-agent spawn proposal toast (NEW-SPEC)

- **Status:** [MISSING]
- **Spec section:** §5.3; F071
- **File (to create):** `src/components/ui/SubAgentSpawnToast.tsx`
- **Implementation notes:** Toast for custom sub-agent spawn requests.
- **Related flows:** F071

---

## Confirmation modals

### C001 — Archive Project

- **Status:** [WORKS]
- **File:** `src/components/right-auxiliary/ProjectManageTab.tsx:186-197`
- **Spec section:** §4.4
- **Implementation notes:** Uses generic `ConfirmationModal` with "ARCHIVE" type-to-confirm.

### C002 — Unarchive Project

- **Status:** [WORKS]
- **File:** `ProjectManageTab.tsx:199-209`
- **Implementation notes:** "UNARCHIVE" type-to-confirm.

### C003 — Close Ticket

- **Status:** [PARTIAL] — confirm toasts only
- **File:** `TicketManageTab.tsx:197-206`
- **Implementation notes:** Confirmation modal exists but action toasts only. Wire to set status MERGED.

### C004 — Archive Ticket

- **Status:** [STUB] — confirm toasts only
- **File:** `TicketManageTab.tsx:208-219`
- **Implementation notes:** Wire to persist archive.

### C005 — Archive Workspace

- **Status:** [STUB] — confirm toasts only
- **File:** `WorkspacesSettings.tsx:167-179`
- **Implementation notes:** Wire to archive workspace in `data/workspaces/store`.

### C006 — Delete Workspace Data

- **Status:** [STUB] — confirm toasts only
- **File:** `PrivacySettings.tsx:139-151`
- **Spec section:** §3, §11
- **Implementation notes:** Should delete OKF bundle too: `rm -rf ~/.superhive/okf/<project_id>/`

### C007 — Delete Account

- **Status:** [STUB] — confirm toasts only
- **File:** `PrivacySettings.tsx:153-165`
- **Implementation notes:** Wire to clear all app state.

### C008 — Disconnect Integration (NEW-SPEC)

- **Status:** [MISSING]
- **File (to create):** inline in P029 / M029 (Integrations settings page)
- **Implementation notes:** Confirmation before disconnecting integration.

### C009 — Remove Agent from Project (NEW-SPEC)

- **Status:** [MISSING]
- **File (to create):** inline in `ProjectManageTab` or new dialog
- **Implementation notes:** "Remove <agent> from project? Their context for this project will be archived."

---

# Panels + chrome

---

### PL001 — Left Nav (header + TeamSelector + Active + Favorites + Accordion + Utilities + Archived)

- **Status:** [WORKS] (Meta Hive / Remote accordion headers are stubs)
- **Files:** `src/components/left-nav/LeftNav.tsx`, `LeftNavHeader.tsx`, `TeamSelector.tsx`, `ActiveSection.tsx`, `FavoritesSection.tsx`, `AccordionCore.tsx`, `ArchivedProjectsSection.tsx`, `Utilities.tsx`
- **Spec section:** §3
- **Implementation notes:**
  - Back/forward nav buttons in header are STUB (disabled) — wire or remove
  - Sign Out in TeamSelector is STUB — wire or remove
  - "Meta Hive" / "Remote" accordion headers are STUB (no spec backing)
- **Related flows:** F047, F092, F093, F104

### PL002 — Center Workspace (tab strip + breadcrumb + tabs)

- **Status:** [WORKS]
- **Files:** `src/components/center-workspace/CenterWorkspace.tsx`, `CenterTabStrip.tsx`, `CenterBreadcrumb.tsx`, `MaximizeOnDoubleClick.tsx`
- **Implementation notes:** Tab strip close/cycle works. Pin tab is STUB.
- **Related flows:** F083, F084

### PL003 — Right Auxiliary (resize + tabs + per-context chrome)

- **Status:** [WORKS]
- **Files:** `src/components/right-auxiliary/RightAuxiliary.tsx`, `RightPanelTabs.tsx`
- **Implementation notes:** Refresh button is STUB.
- **Related flows:** F087, F088, F103

### PL004 — Command Palette

- **Status:** [WORKS]
- **File:** `src/components/shortcuts/CommandPalette.tsx`
- **Implementation notes:** 12 items in 3 groups.
- **Related flows:** F085, F086

---

# Popovers / Overlays

---

### PR001 — Help Popover

- **Status:** [PARTIAL] (Documentation/Changelog rows are STUB)
- **File:** `src/components/left-nav/HelpPopover.tsx`
- **Implementation notes:** Shortcuts row works. Docs/Changelog dispatch `app:open-help` with no listener.
- **Related flows:** F090

### PR002 — Toast Container

- **Status:** [WORKS]
- **File:** `src/components/ui/Toast.tsx` + `src/lib/toast-context.tsx`
- **Implementation notes:** All `useToast()` calls work.

### PR003 — Permission Request Toast (NEW-SPEC)

- **Status:** [MISSING]
- **Same as:** M020
- **Related flows:** F069

### PR004 — Sub-agent Spawn Toast (NEW-SPEC)

- **Status:** [MISSING]
- **Same as:** M021
- **Related flows:** F071

---

# Build order (recommended)

When we start building, this is the suggested order. Each "Wave" is a self-contained set of work.

## Wave 1 — Finish what's wired (low risk, high impact)

Fix existing partials and remove dead surfaces.

| ID | Surface | What to do |
|---|---|---|
| P012 | Projects (workspace) | Fix to show all projects (not just first); or delete and rely on P019 |
| PA011 / M011 | Project Manage Tab | Wire title/brief/members to persist |
| PA011 / M012 | Ticket Manage Tab | Wire save bar to persist (status/priority/type/assignee) |
| PA011 / M013 | Channel Manage Tab | Wire save bar to persist (topic/status/participants) |
| PA011 / ControlMatrix | Agent model dropdown | Wire to actually write `modelEngine` |
| PA012 | Ticket Inbox / Channel Inbox | Wire to real data OR delete the components |
| PA012 | Project Inbox / Dashboard Inbox | Wire snooze/done to persist |
| PA012 / PA015 | dashboard context | Delete OR wire |
| PA013 | SessionsView row click | Wire to open thread in chat tab |
| PA014 | AuditQueue component | Delete orphan |
| PA012 / M005 | WorkspaceReadyView | Activate OR delete |
| P002 | `tab.kind === 'settings'` | Delete dead path |
| PL001 | Back/forward nav buttons | Wire OR remove |
| PL001 | Sign Out in TeamSelector | Wire OR remove |
| PL001 | "Meta Hive" / "Remote" accordion headers | Delete (no spec backing) |
| PL002 | `handleTogglePin` | Wire OR remove |
| PR001 | Help Popover Docs/Changelog | Wire OR remove |
| C003-C007 | Confirmation modals | Wire persistence for: Close Ticket, Archive Ticket, Archive Workspace, Delete Workspace Data, Delete Account |
| P048 | Workspaces settings | Consolidate with `data/workspaces/store` (data integrity fix) |

## Wave 2 — Creation dialogs (CRITICAL)

Build the missing creation flows.

| ID | Surface | What to build |
|---|---|---|
| P025 / M001 | Agent creation wizard | Multi-step flow driving `general-v1` setup |
| P027 / M002 | Create Ticket dialog | Full form, writes ticket + OKF entry |
| P028 / M003 | Create Channel dialog | Full form, writes channel + OKF entry |
| P026 / M010 | Edit Agent dialog | Edit name/role/principles/boundaries/skills |
| P029 / P050 | Integrations settings page | Real page replacing sidebar stub |
| M008 (new) | Disconnect Integration confirmation | Confirmation + persists |
| M009 (new) | Remove Agent from Project confirmation | Confirmation + persists |

## Wave 3 — Agent surfaces (NEW-SPEC heroes)

The biggest spec-required additions.

| ID | Surface | What to build |
|---|---|---|
| P022 | Project Agent chat view | Tab + persistent thread + WS streaming |
| P023 | Workspace Agent chat view | Tab + persistent thread + WS streaming |
| P034 | Permission request toast + history | Toast + persistent view |
| M020 / PR003 | Permission request toast | Transient toast for incoming WS requests |
| P035 | Sub-agent nested view | List of spawned sub-agents per parent |
| M021 / PR004 | Sub-agent spawn toast | For custom sub-agent proposals |
| P036 | Cross-project agent view | All projects an agent works on |

## Wave 4 — OKF layer

| ID | Surface | What to build |
|---|---|---|
| P030 | Project OKF sidebar/tree | Tree view of `~/.superhive/okf/<project_id>/` |
| P031 | OKF concept viewer | Open single `.md` with frontmatter |
| P032 | OKF editor | Edit concept `.md` |
| P033 | OKF search | Full-text search across bundle |

## Wave 5 — Ticket + final polish

| ID | Surface | What to build |
|---|---|---|
| P024 | Ticket detail center tab | Full ticket view in center |
| M005 / P022 | Ticket proposal card | Inline in Project Agent chat |
| (cleanup) | Consolidate ProjectsView vs ProjectDetailView | Decide + merge or remove |
| (cleanup) | Consolidate duplicate channel/agent stats | Already share ChannelStats; verify |

## Wave 6 — Tiering (last, per spec §10)

After everything else is built and working, remove/scope features per tier to introduce the 4-tier pricing model.

---

# Counts summary

| Category | Total | Works | Partial | Missing | Stub | Dead/Dormant |
|---|---|---|---|---|---|---|
| Top-level screens | 2 | 2 | 0 | 0 | 0 | 0 |
| Center tabs (incl. NEW-SPEC) | 16 | 11 | 1 | 4 | 0 | 0 |
| Right-aux tabs | 5 | 4 | 0 | 0 | 0 | 0 |
| Right-aux contexts | 11 | 5 | 3 | 0 | 2 | 1 |
| Settings pages (incl. NEW-SPEC) | 11 | 6 | 3 | 1 | 0 | 0 |
| Setup wizards | 2 | 1 | 0 | 0 | 0 | 1 |
| Modals (creation + edit) | 12 | 4 | 3 | 4 | 0 | 0 |
| System modals | 3 | 0 | 0 | 3 | 0 | 0 |
| Confirmation modals | 9 | 2 | 1 | 2 | 4 | 0 |
| Panels | 4 | 4 | 0 | 0 | 0 | 0 |
| Popovers/overlays | 4 | 1 | 1 | 2 | 0 | 0 |
| **Total** | **79** | **40** | **12** | **16** | **6** | **2** |

---

# When to start

Tell me which wave to start with. My recommendation is **Wave 1** — fix the partials, wire the stubs, clean up the dead. ~30-60 min of focused work, biggest usability win per minute spent.

After Wave 1, the app will be in a fully-functional state with no toast-stubs (except the spec-required NEW-SPEC ones), and we'll be ready to build Wave 2 (creation dialogs including the agent wizard).