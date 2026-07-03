# Superhive — Local UI Skill

> **Companion to the official shadcn Skill.** This documents Superhive-specific conventions that complement, not replace, the official shadcn guidelines.

## Project Theme

Superhive uses a **dark theme** with a **blue accent** (`#81ACEC`). The theme is already configured in `src/index.css`.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#121212` | Page background |
| `--foreground` | `#E0E0E0` | Default text |
| `--accent` | `#81ACEC` | Accent/primary actions |
| `--accent-foreground` | `#121212` | Text on accent |
| `--destructive` | `#dc4444` | Destructive actions |
| `--border` | `#2D2D2D` | Borders and dividers |

### Typography

- **Font Family**: Fustat (Google Fonts) — configured in CSS
- **Fallback**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

---

## Layout Philosophy

### Window Model

This is an **Electron desktop application**. The main window uses the full viewport:

```
┌─────────────────────────────────────────┐
│ [Custom Titlebar with drag regions]     │
├─────────────────────────────────────────┤
│                                         │
│           Main Content Area             │
│         (Full viewport height)          │
│                                         │
└─────────────────────────────────────────┘
```

- **No browser-style scrollbars** — content scrolls within designated areas
- **ScrollArea** component from shadcn for custom scrollbars
- **`no-scrollbar`** utility class to hide scrollbars when needed

### App Structure

```
<App>
  ├── <Titlebar> (Electron - not React)
  └── <Content Area>
        └── <Dashboard /> or other screens
```

---

## Component Conventions

### Cards

Use shadcn `Card` components. Cards typically contain:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Dashboard Layouts

For dashboard screens, compose:

```tsx
<div className="flex flex-col gap-6 p-6">
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-semibold">Dashboard</h1>
  </div>

  {/* Stats/Overview Cards */}
  <div className="grid gap-4 md:grid-cols-3">
    <Card>...</Card>
    <Card>...</Card>
    <Card>...</Card>
  </div>

  {/* Main Content */}
  <Card>...</Card>
</div>
```

### Settings Pages

Settings pages use `Tabs` for organization:

```tsx
<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="appearance">Appearance</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="general">
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Configure basic settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel>Theme</FieldLabel>
            <ToggleGroup>...</ToggleGroup>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>
```

---

## Form Conventions

### FieldGroup + Field Pattern

Always use shadcn form components:

```tsx
<FieldGroup>
  <Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" />
    <FieldDescription>Your display name.</FieldDescription>
  </Field>
</FieldGroup>
```

### Horizontal Fields for Settings

For settings pages with toggles/switches:

```tsx
<Field orientation="horizontal">
  <div className="flex flex-col gap-1">
    <FieldLabel>Dark Mode</FieldLabel>
    <FieldDescription>Enable dark theme.</FieldDescription>
  </div>
  <Switch />
</Field>
```

---

## Navigation Patterns

### Sidebar (if needed)

For applications with sidebar navigation:

```tsx
<Sidebar>
  <SidebarHeader>
    <SidebarTitle>Superhive</SidebarTitle>
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenuButton>Dashboard</SidebarMenuButton>
      <SidebarMenuButton>Settings</SidebarMenuButton>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

### Tabs for In-Page Navigation

Use `Tabs` for switching between related views:

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
  <TabsContent value="details">...</TabsContent>
</Tabs>
```

---

## Overlay Components

### Dialogs

Use for focused tasks requiring user input:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogDescription>Make changes to your item.</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Sheets (Side Panels)

Use for detail panels, filters, or secondary content:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>
    {/* Filter content */}
  </SheetContent>
</Sheet>
```

---

## Icons

**Lucide React** is the configured icon library. Use icons consistently:

```tsx
import { SettingsIcon, SearchIcon, PlusIcon } from "lucide-react"

// In Button
<Button>
  <SettingsIcon data-icon="inline-start" />
  Settings
</Button>

// Standalone
<SearchIcon className="size-4" />
```

---

## Spacing System

Use Tailwind's spacing scale:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Default small |
| `gap-4` | 16px | Default medium |
| `gap-6` | 24px | Section spacing |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Page padding |

---

## Animation

Animations are handled by `tw-animate-css`. Use shadcn animation utilities:

```tsx
// Standard fade-in
<div className="animate-in fade-in-0 zoom-in-95">

// Slide-in from top
<div className="animate-in slide-in-from-top fade-in-0">

// For loading states
<Skeleton className="h-4 w-3/4" />
```

---

## Common Patterns

### Empty States

```tsx
<div className="flex flex-col items-center justify-center gap-4 py-12">
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon"><FolderIcon /></EmptyMedia>
      <EmptyTitle>No items</EmptyTitle>
      <EmptyDescription>Create your first item to get started.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button>Create Item</Button>
    </EmptyContent>
  </Empty>
</div>
```

### Loading States

```tsx
<div className="flex flex-col gap-4">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Confirmation Dialogs

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Drag Regions (Electron)

For custom titlebar areas that should be draggable:

```tsx
<div className="drag">Draggable area</div>
<div className="no-drag">Non-draggable area</div>
```

---

## Utilities

### Scrollbar Suppression

```tsx
<div className="no-scrollbar">Content without visible scrollbar</div>
```

### Font

The project uses Fustat. It's loaded via Google Fonts in the CSS. No additional configuration needed.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.css` | Global styles, CSS variables, theme |
| `src/lib/utils.ts` | `cn()` utility for class composition |
| `src/components/ui/` | shadcn UI components |
| `src/screens/` | Screen/page components |
| `components.json` | shadcn configuration |

---

## Quick Reference

```bash
# Add a component
bunx shadcn@latest add <component>

# Get project info
bunx shadcn@latest info

# Search for components
bunx shadcn@latest search

# Get component docs
bunx shadcn@latest docs <component>
```
