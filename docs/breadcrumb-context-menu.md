# Breadcrumb Context Menu

## Objective

The three-dot button in an agent or project chat breadcrumb opens actions for
the entity currently being viewed. The menu stays limited to relationship and
utility actions.

## Agent chat

- Add to project, disabled when every active project is already assigned.
- Remove from project after confirmation. Multiple memberships use a project
  submenu.
- Project coordinators show Open project instead of membership controls.
- Copy agent ID.
- Reveal in Finder, disabled when the agent has no local path.

## Project chat

- Pin or unpin the project. The breadcrumb and sidebar share the same persisted
  pin state.
- Copy project ID.
- Reveal in Finder, disabled when the project has no local path.

## Boundaries

- The menu is shown only on exact agent and project chat routes.
- Existing assignment, removal, clipboard, reveal, navigation, and notification
  flows remain authoritative.
- Runtime, destructive, editing, archive, and conversation-management actions
  are intentionally deferred.

## Verification

Run:

```sh
bun test src/components/layout/common/breadcrumb-actions.test.ts src/flows/projects/ui/use-pinned-projects.test.ts
bun run typecheck
```

Manually verify mouse and keyboard menu opening, focus return, multi-project
submenus, confirmation cancellation, disabled items, and sidebar pin updates.
