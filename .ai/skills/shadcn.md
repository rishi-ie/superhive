# shadcn/ui — Official Skill

> **Primary Source of Truth** for all UI development in this repository.

## Quick Start

```bash
# Get project context
npx shadcn@latest info

# Search for components
npx shadcn@latest search

# Add components
npx shadcn@latest add button card dialog

# Get component docs
npx shadcn@latest docs button dialog
```

## Core Principles

1. **Use existing components first.** Search the registry before writing custom UI.
2. **Compose, don't reinvent.** Dashboard = Sidebar + Card + Chart + Table.
3. **Use built-in variants** (`variant="outline"`, `size="sm"`) before custom styles.
4. **Use semantic colors** (`bg-primary`, `text-muted-foreground`) — never raw values like `bg-blue-500`.
5. **Use `cn()` for conditional classes.** Don't write manual template literal ternaries.

## Critical Rules

### Styling
- `className` for layout only — never override component colors or typography.
- No `space-x-*` or `space-y-*` — use `flex` with `gap-*`.
- Use `size-*` when width and height are equal — `size-10` not `w-10 h-10`.
- Use `truncate` shorthand — not overflow hacks.
- No manual `dark:` color overrides — use semantic tokens.
- No manual `z-index` on overlay components — Dialog, Sheet, Popover handle their own stacking.

### Forms
- Forms use `FieldGroup` + `Field` — never raw `div` with `space-y-*`.
- InputGroup uses `InputGroupInput`/`InputGroupTextarea` — never raw `Input` inside `InputGroup`.
- Buttons inside inputs use `InputGroup` + `InputGroupAddon`.
- Option sets (2–7 choices) use `ToggleGroup` — don't loop `Button` with manual active state.
- FieldSet + FieldLegend for grouping related checkboxes/radios.
- Field validation: `data-invalid` on `Field`, `aria-invalid` on the control.

### Composition
- Items always inside their Group — `SelectItem` → `SelectGroup`, `DropdownMenuItem` → `DropdownMenuGroup`.
- Use `asChild` (radix) or `render` (base) for custom triggers.
- Dialog, Sheet, Drawer always need Title — `DialogTitle`, `SheetTitle`, `DrawerTitle`.
- Use full Card composition — `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`.
- Button has no `isPending`/`isLoading` — compose with `Spinner` + `data-icon` + `disabled`.
- TabsTrigger must be inside TabsList.
- Avatar always needs AvatarFallback.
- Use `Separator` instead of `<hr>` or `<div className="border-t">`.
- Use `Skeleton` for loading placeholders — no custom `animate-pulse` divs.
- Use `Badge` instead of custom styled spans.
- Toast via `sonner` — `toast()` from `sonner`.

### Icons
- Icons in Button use `data-icon` — `data-icon="inline-start"` or `data-icon="inline-end"`.
- No sizing classes on icons inside components — components handle icon sizing via CSS.
- Pass icons as objects — `icon={CheckIcon}`, not a string key.

## Component Selection

| Need | Use |
|------|-----|
| Button/action | `Button` with appropriate variant |
| Form inputs | `Input`, `Select`, `Combobox`, `Switch`, `Checkbox`, `RadioGroup`, `Textarea`, `InputOTP`, `Slider` |
| Toggle 2–5 options | `ToggleGroup` + `ToggleGroupItem` |
| Data display | `Table`, `Card`, `Badge`, `Avatar` |
| Navigation | `Sidebar`, `NavigationMenu`, `Breadcrumb`, `Tabs`, `Pagination` |
| Overlays | `Dialog`, `Sheet`, `Drawer`, `AlertDialog` |
| Feedback | `sonner` (toast), `Alert`, `Progress`, `Skeleton`, `Spinner` |
| Command palette | `Command` inside `Dialog` |
| Layout | `Card`, `Separator`, `Resizable`, `ScrollArea`, `Accordion`, `Collapsible` |
| Empty states | `Empty` |
| Menus | `DropdownMenu`, `ContextMenu`, `Menubar` |
| Tooltips | `Tooltip`, `HoverCard`, `Popover` |

## Workflow

1. **Get project context** — Run `npx shadcn@latest info` to understand framework, aliases, Tailwind version.
2. **Check installed components** — List `resolvedPaths.ui` directory before adding.
3. **Find components** — `npx shadcn@latest search`.
4. **Get docs and examples** — `npx shadcn@latest docs <component>`.
5. **Install** — `npx shadcn@latest add <component>`.
6. **Review** — Read added files and verify correctness.

## MCP Tools

This project has shadcn MCP configured. Available tools:
- `shadcn:search_items_in_registries` — Fuzzy search across registries
- `shadcn:list_items_in_registries` — List all items from registries
- `shadcn:view_items_in_registries` — View item details and contents
- `shadcn:get_item_examples_from_registries` — Find usage examples
- `shadcn:get_add_command_for_items` — Get CLI install command
- `shadcn:get_project_registries` — Get configured registries
- `shadcn:get_audit_checklist` — Verify components

## Detailed References

- [styling rules](./rules/styling.md) — Semantic colors, variants, className, spacing
- [forms rules](./rules/forms.md) — FieldGroup, Field, InputGroup, ToggleGroup
- [composition rules](./rules/composition.md) — Groups, overlays, Card, Tabs, Avatar
- [icons rules](./rules/icons.md) — data-icon, icon sizing, passing icons
- [chat rules](./rules/chat.md) — MessageScroller, Message, Bubble, Attachment
- [base-vs-radix](./rules/base-vs-radix.md) — asChild vs render, API differences
- [cli.md](./cli.md) — Full CLI reference
- [registry.md](./registry.md) — Registry authoring
- [customization.md](./customization.md) — Theming, CSS variables

## Package Manager

This project uses **Bun**. Run CLI commands with:
```bash
bunx shadcn@latest <command>
```

Or use the shadcn MCP tools for registry operations.
