# Deleting Mock Data for Production

This guide explains how to cleanly remove all mock data from the Superhive app
when preparing for a production build. Follow each step in order.

---

## Overview

Mock data is isolated to a single directory: `src/data/mock/`

All UI components (LeftNav, CenterWorkspace, RightAuxiliary, ChatThread, etc.)
remain in place after cleanup — they just receive empty data instead of mock data.

The `VITE_USE_MOCK_DATA` env var controls whether mock data is used at runtime.

---

## Step 1 — Set the environment flag to false

Open `.env.local` (or your production env file) and change:

```
VITE_USE_MOCK_DATA=true
```

to:

```
VITE_USE_MOCK_DATA=false
```

If deploying to a hosting platform (Vercel, Netlify, etc.), set this as an
environment variable there instead: `VITE_USE_MOCK_DATA=false`

---

## Step 2 — Delete the mock data directory

Delete the entire `src/data/mock/` directory. It contains:

```
src/data/mock/
├── workspaces.ts
├── favorites.tsx
├── employees.ts
├── tasks.ts
├── notifications.ts
├── chat.ts
└── right-panel.ts
```

You can do this from the terminal:

```bash
rm -rf src/data/mock/
```

---

## Step 3 — Update Dashboard.tsx

Open `src/screens/Dashboard.tsx` and follow these sub-steps carefully:

### 3a. Remove the mock data import lines

Delete these 5 import statements:

```ts
// REMOVE THESE:
import { workspaces, currentWorkspace } from '@/data/mock/workspaces';
import { favorites } from '@/data/mock/favorites';
import { activeEmployees } from '@/data/mock/employees';
import { activeTasks } from '@/data/mock/tasks';
import { notifications } from '@/data/mock/notifications';
```

### 3b. Remove the USE_MOCK_DATA guard and conditional assignments

Delete everything between the `USE_MOCK_DATA` const and the `LeftNav` render:

```ts
// REMOVE THIS BLOCK:
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const workspaces_data = USE_MOCK_DATA ? workspaces : [];
const favorites_data = USE_MOCK_DATA ? favorites : [];
const employees_data = USE_MOCK_DATA ? activeEmployees : [];
const tasks_data = USE_MOCK_DATA ? activeTasks : [];
const notifications_data = USE_MOCK_DATA ? notifications : [];

const [notificationCount] = USE_MOCK_DATA
  ? [notifications.filter((n) => !n.read).length]
  : [0];
```

### 3c. Replace prop values in LeftNav

Change the LeftNav props from this:

```tsx
<LeftNav
  workspaces={USE_MOCK_DATA ? workspaces : []}
  currentWorkspace={USE_MOCK_DATA ? currentWorkspace : undefined}
  favorites={USE_MOCK_DATA ? favorites : []}
  activeEmployees={USE_MOCK_DATA ? activeEmployees : []}
  activeTasks={USE_MOCK_DATA ? activeTasks : []}
  notificationCount={notificationCount}
/>
```

to this (empty arrays / defaults only):

```tsx
<LeftNav
  workspaces={[]}
  favorites={[]}
  activeEmployees={[]}
  activeTasks={[]}
  notificationCount={0}
/>
```

### 3d. Replace prop values in RightAuxiliary

Change:

```tsx
<RightAuxiliary
  width={rightWidth}
  onWidthChange={onRightWidthChange}
  notifications={USE_MOCK_DATA ? notifications : []}
/>
```

to:

```tsx
<RightAuxiliary
  width={rightWidth}
  onWidthChange={onRightWidthChange}
/>
```

### 3e. Remove the useState import if unused

If `useState` is no longer used after removing `notificationCount`, also remove:

```ts
import { useState } from 'react';
```

### Final Dashboard.tsx should look like:

```tsx
import { LeftNav } from '@/components/LeftNav';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightAuxiliary } from '@/components/RightAuxiliary';
import type { Page } from '@/App';

type DashboardProps = {
  leftWidth: number;
  rightWidth: number;
  onLeftWidthChange: (width: number) => void;
  onRightWidthChange: (width: number) => void;
  onNavigate: (page: Page) => void;
};

export function Dashboard({
  leftWidth,
  rightWidth,
  onLeftWidthChange,
  onRightWidthChange,
  onNavigate,
}: DashboardProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <LeftNav
        width={leftWidth}
        onWidthChange={onLeftWidthChange}
        onSettingsClick={() => onNavigate('settings')}
        workspaces={[]}
        favorites={[]}
        activeEmployees={[]}
        activeTasks={[]}
        notificationCount={0}
      />
      <CenterWorkspace />
      <RightAuxiliary
        width={rightWidth}
        onWidthChange={onRightWidthChange}
      />
    </div>
  );
}
```

---

## Step 4 — Update CenterWorkspace.tsx

Open `src/components/CenterWorkspace.tsx` and follow these sub-steps:

### 4a. Remove the mock data import

Delete this import line:

```ts
// REMOVE THIS:
import { currentThread } from '@/data/mock/chat';
```

### 4b. Remove the ChatThread import if unused

Check if any other code references `ChatThread`. If not, also remove:

```ts
import { ChatThread } from './center-workspace/ChatThread';
```

### 4c. Remove the USE_MOCK_DATA guard

Delete the const:

```ts
// REMOVE THIS:
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
```

### 4d. Replace the conditional render

Change:

```tsx
<div className="flex-1 overflow-y-auto flex flex-col">
  {USE_MOCK_DATA ? <ChatThread thread={currentThread} /> : <ChatEmptyState />}
</div>
```

to:

```tsx
<div className="flex-1 overflow-y-auto flex flex-col">
  <ChatEmptyState />
</div>
```

### 4e. Remove the useState import if unused

If `useState` is no longer used (it was only for `activeTab` which is still used),
check — `useState` is still needed for `activeTab`, so keep it.

### Final CenterWorkspace.tsx should look like:

```tsx
import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ChatEmptyState } from './center-workspace/ChatEmptyState';
import { ChatInput } from './center-workspace/ChatInput';
import { workspaceTabs } from '@/data/workspace-tabs';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <Breadcrumb segments={['Superhive', 'Workspace']} branchName="main" />
      <TabStrip
        tabs={workspaceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 overflow-y-auto flex flex-col">
        <ChatEmptyState />
      </div>
      <ChatInput />
    </div>
  );
}
```

---

## Step 5 — Verify the build

Run:

```bash
bun run build
```

There should be NO TypeScript errors. If you see errors about missing modules
like `@/data/mock/workspaces` or `@/data/mock/chat`, return to Step 3 or 4 —
a mock import was likely missed.

---

## Step 6 — Clean up .env.local (optional)

If `.env.local` only contains `VITE_USE_MOCK_DATA=true` and nothing else,
you can delete the file. Otherwise, just remove the `VITE_USE_MOCK_DATA` line.

---

## What the app looks like after cleanup

| Area | Before | After |
|------|--------|-------|
| LeftNav workspace dropdown | Shows 4 workspaces | Empty dropdown |
| LeftNav favorites | Shows 5 items | Empty section (hidden) |
| LeftNav active employees | Shows 5 employees with status | Empty section (hidden) |
| LeftNav active tasks | Shows 3 tasks | Empty section (hidden) |
| LeftNav notifications | Badge shows "2" | No badge |
| Center workspace | Shows chat thread with messages | Shows ChatEmptyState with suggestions |
| Right panel Overview | Shows stat cards | Empty / placeholder |
| Right panel Manage | Shows team members | Empty / placeholder |
| Right panel Inbox | Shows notifications | Empty / placeholder |

All UI components, button clicks, panel resizing, and navigation remain fully
functional — they just have no data to display until a real backend is connected.

---

## Re-enabling mock data for development

To turn mock data back on:

1. Set `VITE_USE_MOCK_DATA=true` in `.env.local`
2. Restore the `src/data/mock/` directory from git:

```bash
git checkout HEAD -- src/data/mock/
```

Or restore individual files:

```bash
git checkout HEAD -- \
  src/data/mock/workspaces.ts \
  src/data/mock/employees.ts \
  src/data/mock/chat.ts
```
