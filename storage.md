# Storage Layer

Local, offline-first persistence using LowDB. Each entity type lives in its own JSON file under the Electron user-data directory. Repository operations are async, cascading relationships are kept in sync across files.

---

## Architecture

```
src/storage/
├── database.ts          # loadDb<T>() factory
├── types.ts             # All interfaces
├── seed.ts              # seedWorkspace()
└── repositories/        # One repo per entity, all async
    ├── WorkspaceRepository.ts
    ├── AgentRepository.ts
    ├── ProjectRepository.ts
    ├── TaskRepository.ts
    ├── ChannelRepository.ts
    ├── SessionRepository.ts
    ├── SettingsRepository.ts
    └── TagRepository.ts

src/data/                # JSON storage (created on first load)
├── db.workspaces.json
├── db.agents.json
├── db.projects.json
├── db.tasks.json
├── db.channels.json
├── db.sessions.json
├── db.settings.json
└── db.tags.json
```

---

## Bootstrap

```ts
// electron/main.ts
import { setUserDataPath } from '../src/storage/database'
import { seedWorkspace } from '../src/storage/seed'

app.whenReady().then(async () => {
  setUserDataPath(app.getPath('userData'))
  await seedWorkspace()         // creates "My Workspace" if missing
  createWindow()
})
```

`setUserDataPath()` must be called once before any repo loads. Repos auto-load their JSON files on first access via `loadDb<T>(filename, defaults)`.

---

## Entity Types

### Status & Priority Enums

```ts
type AgentStatus   = 'idle' | 'running' | 'thinking' | 'stopped' | 'error'
type TaskStatus    = 'todo' | 'running' | 'blocked' | 'completed' | 'cancelled'
type TaskPriority  = 'low' | 'medium' | 'high' | 'critical'
type ChannelType   = 'project' | 'agent' | 'system'
type OwnerType     = 'workspace' | 'project' | 'agent' | 'task' | 'channel'
type SettingType   = 'text' | 'textarea' | 'number' | 'boolean' | 'select'
                   | 'multiselect' | 'json' | 'color' | 'slider' | 'file' | 'directory'
```

### BaseEntity

```ts
interface BaseEntity {
  id: string
  createdAt: number   // unix epoch ms
  updatedAt: number
}
```

All entities (except Tag) extend BaseEntity.

---

### Workspace

Top-level container. Multiple workspaces supported.

```ts
interface Workspace extends BaseEntity {
  name: string
}
```

Stored in: `db.workspaces.json`

---

### Agent

```ts
interface Agent extends BaseEntity {
  name: string
  role?: string
  description?: string
  localPath?: string
  avatar?: string
  status: AgentStatus
  projectIds: string[]      // FK → Project.id
  taskIds: string[]         // FK → Task.id
  sessionIds: string[]      // FK → Session.id
}
```

Stored in: `db.agents.json`

---

### Project

```ts
interface Project extends BaseEntity {
  name: string
  description?: string
  localPath?: string
  okfFolderPath?: string
  color?: string
  icon?: string
  archived: boolean
  agentIds: string[]
  taskIds: string[]
  channelIds: string[]
  parentProjectId?: string
  childProjectIds: string[]
}
```

Stored in: `db.projects.json`

---

### Task

```ts
interface Task extends BaseEntity {
  title: string
  description?: string
  projectId: string          // FK → Project.id (required)
  assignedAgentId?: string   // FK → Agent.id
  status: TaskStatus
  priority: TaskPriority
  context?: string
  tagIds: string[]           // FK → Tag.id
}
```

Stored in: `db.tasks.json`

---

### Channel

```ts
interface Channel extends BaseEntity {
  name: string
  type: ChannelType
  projectId?: string                 // FK → Project.id (optional for system channels)
  participantAgentIds: string[]      // FK → Agent.id
  startedAt?: number
  endedAt?: number
  chatFile?: string                  // path only — actual messages live in filesystem
}
```

Stored in: `db.channels.json`

---

### Session

```ts
interface Session extends BaseEntity {
  name: string
  agentId: string    // FK → Agent.id (required)
}
```

Stored in: `db.sessions.json`

---

### Tag

Note: does NOT extend BaseEntity (no `updatedAt`).

```ts
interface Tag {
  id: string
  name: string
  color?: string
  createdAt: number
}
```

Stored in: `db.tags.json`

---

### Setting

Generic, polymorphic settings record — `key/value/type` per owner. No schema changes needed to add new settings.

```ts
interface Setting extends BaseEntity {
  ownerType: OwnerType        // 'workspace' | 'project' | 'agent' | 'task' | 'channel'
  ownerId: string             // FK → owning entity.id
  key: string                 // unique per (ownerType, ownerId)
  label?: string
  description?: string
  type: SettingType
  value?: unknown             // JSON-serializable
  group?: string              // for UI grouping
  order: number               // for UI ordering
}
```

Stored in: `db.settings.json`

---

## Relationships

References via string IDs. Cascading logic lives in repository methods, never in storage.

```
Workspace ─── standalone
              │
Project ◀── parentProjectId / childProjectIds
   │  ├─ agentIds    ──▶  Agent.projectIds    (bidirectional)
   │  ├─ taskIds     ──▶  Task.projectId      (+ Agent.taskIds if assigned)
   └─ channelIds    ──▶  Channel.projectId    (bidirectional)

Task  ── assignedAgentId  ──▶  Agent.taskIds   (bidirectional)
      ── tagIds[ ]          ──▶  Tag

Agent ── sessionIds[ ]     ──▶  Session.agentId (bidirectional)

Channel ── participantAgentIds[ ]  ──▶  Agent.sessionIds
```

All relationship arrays are kept in sync by repository helpers — direct mutation is not required.

---

## Repository API

All methods are `async` and return Promises.

### Common methods (every repo)

```ts
create(data)              // returns created entity
getById(id)               // returns entity | undefined
getAll()                  // returns entity[]
update(id, partial)       // returns updated entity | undefined
delete(id)                // returns boolean (true if removed)
```

### WorkspaceRepository

```ts
WorkspaceRepository.create({ name })
WorkspaceRepository.getById(id)
WorkspaceRepository.getAll()
WorkspaceRepository.update(id, { name? })
WorkspaceRepository.delete(id)
```

---

### AgentRepository

```ts
AgentRepository.create({ name, status, ... })
AgentRepository.getById(id)
AgentRepository.getAll()
AgentRepository.getByProject(projectId)
AgentRepository.update(id, partial)
AgentRepository.delete(id)               // cascades: removes from Project.agentIds,
                                       // unassigns from Tasks, deletes Sessions

// Helpers
AgentRepository.getProjects(agentId)
AgentRepository.getTasks(agentId)
AgentRepository.getSessions(agentId)

// Bidirectional link helpers (keep both sides in sync)
AgentRepository.assignToProject(agentId, projectId)
AgentRepository.removeFromProject(agentId, projectId)
AgentRepository.addTask(agentId, taskId)        // also called by Task.assignAgent
AgentRepository.removeTask(agentId, taskId)
AgentRepository.addSession(agentId, sessionId)   // also called by Session.create
AgentRepository.removeSession(agentId, sessionId)
```

---

### ProjectRepository

```ts
ProjectRepository.create({ name, ... })
ProjectRepository.getById(id)
ProjectRepository.getAll()
ProjectRepository.getChildProjects(parentId)
ProjectRepository.getRootProjects()
ProjectRepository.update(id, partial)
ProjectRepository.delete(id)              // cascades: removes from Agent.projectIds,
                                          // deletes Channels & Tasks in this project

// Helpers
ProjectRepository.getAgents(projectId)
ProjectRepository.getTasks(projectId)
ProjectRepository.getChannels(projectId)

// Bidirectional link helpers
ProjectRepository.addAgent(projectId, agentId)
ProjectRepository.removeAgent(projectId, agentId)
ProjectRepository.addTask(projectId, taskId)
ProjectRepository.removeTask(projectId, taskId)
ProjectRepository.addChannel(projectId, channelId)
ProjectRepository.removeChannel(projectId, channelId)
ProjectRepository.addChildProject(parentId, childId)
ProjectRepository.removeChildProject(parentId, childId)
```

---

### TaskRepository

```ts
TaskRepository.create({ title, projectId, ... })   // auto-initializes status='todo', priority='medium'
TaskRepository.getById(id)
TaskRepository.getAll()
TaskRepository.getByProject(projectId)
TaskRepository.getByAgent(agentId)
TaskRepository.update(id, partial)
TaskRepository.delete(id)                          // cascades: removes from Project.taskIds,
                                                   // Agent.taskIds if assigned

// Status / priority shortcuts
TaskRepository.changeStatus(taskId, status)
TaskRepository.changePriority(taskId, priority)
TaskRepository.assignAgent(taskId, agentId)        // keeps Agent.taskIds in sync
TaskRepository.unassignAgent(taskId)

// Tag helpers
TaskRepository.addTag(taskId, tagId)
TaskRepository.removeTag(taskId, tagId)
```

---

### ChannelRepository

```ts
ChannelRepository.create({ name, type, ... })        // auto-attaches to project if projectId set
ChannelRepository.getById(id)
ChannelRepository.getAll()
ChannelRepository.getByProject(projectId)
ChannelRepository.getByType(type)
ChannelRepository.update(id, partial)
ChannelRepository.delete(id)                         // cascades: removes from Project.channelIds,
                                                    // cleans Agent.sessionIds

// Participants
ChannelRepository.addParticipant(channelId, agentId)
ChannelRepository.removeParticipant(channelId, agentId)
ChannelRepository.getParticipants(channelId)

// Lifecycle
ChannelRepository.start(channelId)                  // sets startedAt
ChannelRepository.end(channelId)                    // sets endedAt
```

---

### SessionRepository

```ts
SessionRepository.create({ name, agentId })         // auto-adds to Agent.sessionIds
SessionRepository.getById(id)
SessionRepository.getAll()
SessionRepository.getByAgent(agentId)
SessionRepository.update(id, partial)
SessionRepository.delete(id)                        // cascades: removes from Agent.sessionIds
```

---

### SettingsRepository

Generic, polymorphic settings — single collection for all entity types.

```ts
SettingsRepository.create({ ownerType, ownerId, key, type, ... })
SettingsRepository.getById(id)
SettingsRepository.getAll()

// Query by owner
SettingsRepository.getByOwner(ownerType, ownerId)              // all settings for entity
SettingsRepository.getByOwnerAndGroup(ownerType, ownerId, group)
SettingsRepository.getSetting(ownerType, ownerId, key)

// Mutation
SettingsRepository.setSetting(
  ownerType, ownerId, key, value,
  type?, label?, description?, group?, order?
)                                                              // creates or updates if key exists
SettingsRepository.update(id, partial)
SettingsRepository.removeSetting(ownerType, ownerId, key)
SettingsRepository.delete(id)
SettingsRepository.deleteByOwner(ownerType, ownerId)           // cascade-clean
```

Settings are independent — UI is responsible for rendering each `type` correctly and for deleting settings when an owner entity is deleted.

---

### TagRepository

```ts
TagRepository.create({ name, color? })
TagRepository.getById(id)
TagRepository.getAll()
TagRepository.getByName(name)                          // case-insensitive
TagRepository.update(id, partial)
TagRepository.delete(id)                               // cascades: removes from Task.tagIds
TagRepository.getTasks(tagId)
```

---

## Conventions

- **IDs**: `crypto.randomUUID()` for all entities.
- **Timestamps**: `Date.now()` (epoch ms).
- **No nested objects**: relationships stored as `string[]` of IDs.
- **Cascading**: handled in repository `delete()` methods; never assume presence via direct JSON edits.
- **No transactions**: each write is atomic per file. Cross-file updates await sequentially.
- **Async everywhere**: every repository call returns a Promise.
- **UI isolation**: the renderer never imports lowdb directly — it must call repositories through an IPC bridge (to be wired next).

---

## File Map

| Entity     | Repo file                              | JSON file            |
|------------|---------------------------------------|----------------------|
| Workspace  | `repositories/WorkspaceRepository.ts` | `db.workspaces.json` |
| Agent      | `repositories/AgentRepository.ts`     | `db.agents.json`     |
| Project    | `repositories/ProjectRepository.ts`   | `db.projects.json`   |
| Task       | `repositories/TaskRepository.ts`      | `db.tasks.json`      |
| Channel    | `repositories/ChannelRepository.ts`   | `db.channels.json`   |
| Session    | `repositories/SessionRepository.ts`  | `db.sessions.json`   |
| Tag        | `repositories/TagRepository.ts`       | `db.tags.json`       |
| Setting    | `repositories/SettingsRepository.ts` | `db.settings.json`   |
