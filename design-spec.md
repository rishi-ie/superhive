# Design Token Specification & Component Layout Blueprint

> **Codebase:** super-hive (Superset Desktop)
> **Stack:** Electron + React 19 + Tailwind CSS v4 + Radix UI + shadcn/ui
> **Scope:** Pixel-perfect extraction of design tokens, theming, geometry, typography, micro-interactions, and layout hierarchy from the actual production source.

---

## 1. Global Canvas & Theme Config

### 1.1 Configuration Layer

The project uses **Tailwind CSS v4** with the new `@theme inline` directive — there are **no `tailwind.config.*` or `postcss.config.*` files** anywhere in the repository. All theme configuration lives directly inside CSS files.

```css
/* apps/desktop/src/renderer/globals.css (line 1-7) */
@import "tailwindcss";
@import "tw-animate-css";
@import "streamdown/styles.css";

@source "./**/*.{ts,tsx}";
@source "../../../../packages/ui/src/**/*.{ts,tsx}";
@source "../../../../packages/ui/node_modules/streamdown/dist/*.js";
```

The same applies to `packages/ui/src/globals.css` (line 1-4):

```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
```

### 1.2 Theme Entry Points

| File                                                            | Role                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/desktop/src/renderer/globals.css`                         | Dark fallback + `:root.light` override + `@theme inline` aliases |
| `packages/ui/src/globals.css`                                   | shadcn/ui default tokens (`:root` + `.dark`)                     |
| `apps/desktop/src/renderer/stores/theme/store.ts`               | Zustand store: active theme, custom themes, system pref          |
| `apps/desktop/src/renderer/stores/theme/utils/css-variables.ts` | Applies theme colors → CSS variables on `:root`                  |
| `apps/desktop/src/shared/themes/built-in/ember.ts`              | Built-in Dark theme                                              |
| `apps/desktop/src/shared/themes/built-in/light.ts`              | Built-in Light theme                                             |
| `apps/desktop/src/shared/themes/built-in/monokai.ts`            | Built-in Monokai theme                                           |
| `apps/desktop/src/shared/themes/types.ts`                       | `UIColors`, `TerminalColors`, `Theme` type defs                  |

### 1.3 Root Layout Reset

```css
/* apps/desktop/src/renderer/globals.css (line 145-180) */
@layer base {
  * {
    @apply border-border antialiased;
  }
  button,
  [role="button"] {
    cursor: pointer;
  }
  body {
    @apply bg-background text-foreground;
  }
  html,
  body {
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
    margin: 0;
    overflow: hidden;
    user-select: none;
    scroll-behavior: smooth;
    -webkit-app-region: no-drag;
    -webkit-font-smoothing: antialiased;
  }
  app {
    display: block;
    position: relative;
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
  }
}
```

### 1.4 Theme Store Architecture

`apps/desktop/src/renderer/stores/theme/store.ts` (line 153-419) — Zustand store with `persist` middleware. The `applyUIColors` function (`css-variables.ts:50-59`) iterates the `UI_COLOR_TO_CSS_VAR` map (44 tokens) and writes each value to `document.documentElement.style.setProperty(...)`. `updateThemeClass` toggles `.dark`/`.light` class on `<html>`.

`DEFAULT_THEME_ID = "dark"` (built-in index.ts:13). Special `SYSTEM_THEME_ID = "system"` resolves to dark or light via `window.matchMedia("(prefers-color-scheme: dark)")`.

### 1.5 Bundle Dependencies (theme + UI primitives)

`packages/ui/package.json` (line 26-86) — `@superset/ui` exposes shadcn/ui-style components through `"./*": "./src/components/ui/*.tsx"`:

- `@radix-ui/react-dropdown-menu` 2.1.16
- `@radix-ui/react-dialog` 1.1.15
- `@radix-ui/react-popover` 1.1.15
- `@radix-ui/react-hover-card` 1.1.15
- `@radix-ui/react-tabs` 1.1.13
- `@radix-ui/react-tooltip` 1.2.8
- `@radix-ui/react-scroll-area` 1.2.10
- `@radix-ui/react-separator` 1.1.8
- `@radix-ui/react-avatar` 1.1.11
- `class-variance-authority` 0.7.1
- `clsx` 2.1.1
- `tailwind-merge` 3.5.0
- `tailwindcss` 4.2.2
- `tw-animate-css` 1.4.0
- `lucide-react` 0.563.0
- `react-icons` 5.6.0

---

## 2. Color System Variables (HSL/oklch mappings preferred)

### 2.1 Dark Theme "Ember" (Default) — `:root` in `apps/desktop/src/renderer/globals.css:17-58`

Source-of-truth values are also in `shared/themes/built-in/ember.ts:14-76`. The `.dark` class variant in `packages/ui/src/globals.css:79-111` defines an alternative dark scale using oklch.

| Token                          | Dark (Ember) Hex          | Light oklch                                       |
| ------------------------------ | ------------------------- | ------------------------------------------------- |
| `--background`                 | `#151110`                 | `oklch(1 0 0)`                                    |
| `--foreground`                 | `#eae8e6`                 | `oklch(0.145 0 0)`                                |
| `--card`                       | `#201e1c`                 | `oklch(1 0 0)` (dark) / `oklch(0.97 0 0)` (light) |
| `--card-foreground`            | `#eae8e6`                 | `oklch(0.145 0 0)`                                |
| `--popover`                    | `#201e1c`                 | `oklch(1 0 0)` / `oklch(0.97 0 0)`                |
| `--popover-foreground`         | `#eae8e6`                 | `oklch(0.145 0 0)`                                |
| `--primary`                    | `#eae8e6`                 | `oklch(0.205 0 0)`                                |
| `--primary-foreground`         | `#151110`                 | `oklch(0.985 0 0)`                                |
| `--secondary`                  | `#2a2827`                 | `oklch(0.97 0 0)`                                 |
| `--secondary-foreground`       | `#eae8e6`                 | `oklch(0.205 0 0)`                                |
| `--muted`                      | `#2a2827`                 | `oklch(0.97 0 0)`                                 |
| `--muted-foreground`           | `#a8a5a3`                 | `oklch(0.556 0 0)`                                |
| `--accent`                     | `#2a2827`                 | `oklch(0.97 0 0)`                                 |
| `--accent-foreground`          | `#eae8e6`                 | `oklch(0.205 0 0)`                                |
| `--tertiary`                   | `#1a1716`                 | `oklch(0.95 0.003 40)`                            |
| `--tertiary-active`            | `#252220`                 | `oklch(0.9 0.003 40)`                             |
| `--destructive`                | `#cc4444`                 | `oklch(0.577 0.245 27.325)`                       |
| `--destructive-foreground`     | `#ffcccc`                 | `oklch(0.985 0 0)`                                |
| `--border`                     | `#2a2827`                 | `oklch(0.922 0 0)`                                |
| `--input`                      | `#2a2827`                 | `oklch(0.922 0 0)`                                |
| `--ring`                       | `#3a3837`                 | `oklch(0.708 0 0)`                                |
| `--chart-1`                    | `#e07850`                 | `oklch(0.646 0.222 41.116)`                       |
| `--chart-2`                    | `#50a878`                 | `oklch(0.6 0.118 184.704)`                        |
| `--chart-3`                    | `#d4a84b`                 | `oklch(0.398 0.07 227.392)`                       |
| `--chart-4`                    | `#7b68ee`                 | `oklch(0.828 0.189 84.429)`                       |
| `--chart-5`                    | `#dc6b6b`                 | `oklch(0.769 0.188 70.08)`                        |
| `--sidebar`                    | `#1a1716`                 | `oklch(0.985 0 0)`                                |
| `--sidebar-foreground`         | `#eae8e6`                 | `oklch(0.145 0 0)`                                |
| `--sidebar-primary`            | `#e07850`                 | `oklch(0.205 0 0)`                                |
| `--sidebar-primary-foreground` | `#151110`                 | `oklch(0.985 0 0)`                                |
| `--sidebar-accent`             | `#252220`                 | `oklch(0.97 0 0)`                                 |
| `--sidebar-accent-foreground`  | `#eae8e6`                 | `oklch(0.205 0 0)`                                |
| `--sidebar-border`             | `#2a2827`                 | `oklch(0.922 0 0)`                                |
| `--sidebar-ring`               | `#3a3837`                 | `oklch(0.708 0 0)`                                |
| `--highlight-match`            | `rgba(224, 120, 80, 0.2)` | `rgba(255, 211, 61, 0.35)`                        |
| `--highlight-active`           | `rgba(224, 120, 80, 0.5)` | `rgba(255, 150, 50, 0.55)`                        |
| `--highlight`                  | `#e07850`                 | `oklch(0.646 0.222 41.116)`                       |
| `--highlight-foreground`       | `#151110`                 | `oklch(0.985 0 0)`                                |
| `--radius`                     | `0.625rem` (10px)         | `0.625rem`                                        |

### 2.2 Monokai Theme (`shared/themes/built-in/monokai.ts:14-57`)

| Token                          | Value                       |
| ------------------------------ | --------------------------- |
| `--background`                 | `#272822`                   |
| `--foreground`                 | `#f8f8f2`                   |
| `--card`                       | `#3e3d32`                   |
| `--popover`                    | `#3e3d32`                   |
| `--primary`                    | `#a6e22e` (signature green) |
| `--primary-foreground`         | `#272822`                   |
| `--secondary`                  | `#3e3d32`                   |
| `--muted`                      | `#3e3d32`                   |
| `--muted-foreground`           | `#b8b3a4`                   |
| `--accent`                     | `#49483e`                   |
| `--tertiary`                   | `#1e1f1c`                   |
| `--tertiary-active`            | `#3e3d32`                   |
| `--destructive`                | `#f92672` (signature pink)  |
| `--border`                     | `#49483e`                   |
| `--input`                      | `#49483e`                   |
| `--ring`                       | `#a6e22e`                   |
| `--sidebar`                    | `#1e1f1c`                   |
| `--sidebar-primary`            | `#a6e22e`                   |
| `--sidebar-primary-foreground` | `#272822`                   |
| `--chart-1`                    | `#f92672`                   |
| `--chart-2`                    | `#a6e22e`                   |
| `--chart-3`                    | `#66d9ef`                   |
| `--chart-4`                    | `#f4bf75`                   |
| `--chart-5`                    | `#ae81ff`                   |
| `--highlight`                  | `#a6e22e`                   |
| `--highlight-match`            | `rgba(244, 191, 117, 0.25)` |
| `--highlight-active`           | `rgba(244, 191, 117, 0.55)` |

### 2.3 @theme Inline Aliases (`globals.css:102-143`)

All 44 semantic color tokens are aliased as `--color-{name}` so Tailwind utility classes like `bg-background`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-sidebar-accent` resolve at build time.

### 2.4 Scrollbar Tokens (`globals.css:218-261`)

```
scrollbar-width: thin;
scrollbar-color: rgb(63 63 70 / 0.5) transparent;
*::-webkit-scrollbar         { width: 12px; height: 12px; }
*::-webkit-scrollbar-track   { background: transparent; }
*::-webkit-scrollbar-thumb   {
  background-color: rgb(63 63 70 / 0.5);
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
*::-webkit-scrollbar-thumb:hover  { background-color: rgb(82 82 91 / 0.7); }
*::-webkit-scrollbar-thumb:active { background-color: rgb(113 113 122 / 0.8); }
.scrollbar-thin::-webkit-scrollbar        { width: 8px; height: 8px; }
.scrollbar-thin::-webkit-scrollbar-thumb  { border-radius: 4px; border: 2px solid transparent; }
.hide-scrollbar  { scrollbar-width: none; -ms-overflow-style: none; }
.hide-scrollbar::-webkit-scrollbar { display: none; }
```

### 2.5 Terminal ANSI (Ember dark)

`shared/themes/built-in/ember.ts:78-104`:

```
black: #151110, red: #dc6b6b, green: #7ec699, yellow: #e5c07b,
blue: #61afef, magenta: #c678dd, cyan: #56b6c2, white: #eae8e6
brightBlack: #5c5856, brightRed: #e88888, brightGreen: #98d1a8,
brightYellow: #ecd08f, brightBlue: #7ec0f5, brightMagenta: #d494e6,
brightCyan: #73c7d3, brightWhite: #ffffff
cursor: #e07850, cursorAccent: #151110
selectionBackground: rgba(224, 120, 80, 0.25)
```

xterm link decoration: `.xterm-underline-5 { text-decoration-color: #3b8eea; }`, hover `#5ca8ff`.

### 2.6 CSS Custom Highlight API (`globals.css:272-288`)

```
::highlight(markdown-search-matches) { background-color: var(--highlight-match); }
::highlight(markdown-search-active)  { background-color: var(--highlight-active); }
::highlight(chat-search-matches)     { background-color: var(--highlight-match); }
::highlight(chat-search-active)      { background-color: var(--highlight-active); }
```

### 2.7 Electron Drag Regions (`globals.css:263-270`)

```
.drag    { -webkit-app-region: drag; }
.no-drag { -webkit-app-region: no-drag; }
```

---

## 3. Typography & Hierarchy Matrix

### 3.1 Font Stacks

| Role                 | Stack                                                                          | Source                                      |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| UI default           | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` | Inherited from Electron                     |
| Monospace UI         | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`             | Tailwind `font-mono`                        |
| Terminal (xterm)     | `var(--superset-terminal-font-family, ui-monospace, monospace)`                | `globals.css:191-193`                       |
| Bundled macOS        | `"SF Mono"` 400/700/400i/700i via `@font-face`                                 | `bundled-fonts.css:10-37`                   |
| Markdown code        | `var(--font-mono, ui-monospace, monospace)`                                    | `comment-pane.css:153`                      |
| Tufte markdown       | `Georgia, "Times New Roman", serif`                                            | `tufte.css:3`                               |
| Markdown code alt    | `Consolas, "Liberation Mono", Menlo, Courier, monospace`                       | `tufte.css:171`                             |
| OAuth loopback email | `-apple-system, system-ui, sans-serif`                                         | `chat-service/openai-oauth-loopback.ts:121` |

### 3.2 Type Scale (literal Tailwind classes used throughout)

| Class         | Computed size | Example file:line                                                       |
| ------------- | ------------- | ----------------------------------------------------------------------- |
| `text-[10px]` | **10px**      | Sidebar hotkey shortcut: `DashboardSidebar.tsx:283`                     |
| `text-[11px]` | **11px**      | Creation status text: `DashboardSidebarExpandedWorkspaceRow.tsx:256`    |
| `text-[13px]` | **13px**      | Workspace row title: `DashboardSidebarExpandedWorkspaceRow.tsx:240,246` |
| `text-xs`     | 12px          | Badges, dropdown shortcut, secondary text                               |
| `text-sm`     | 14px          | Default body, buttons, table cells, sidebar items                       |
| `text-base`   | 16px          | Input default (`input.tsx:7`)                                           |
| `text-lg`     | 18px          | DialogTitle (`dialog.tsx:114`)                                          |

### 3.3 Font Weights

| Class           | Weight    | Use                                                   |
| --------------- | --------- | ----------------------------------------------------- |
| `font-normal`   | 400       | Input base, TabPane trigger                           |
| `font-medium`   | 500       | **Default** button text, sidebar nav links, TableHead |
| `font-semibold` | 600       | DialogTitle, SheetTitle, markdown headers             |
| `font-mono`     | monospace | Code, hotkeys, diff stats, terminal                   |

### 3.4 Line Heights

| Context            | Class / Value                          | Source                                             |
| ------------------ | -------------------------------------- | -------------------------------------------------- |
| DialogTitle        | `leading-none`                         | `dialog.tsx:114`                                   |
| Sidebar header nav | `text-sm font-medium flex-1 text-left` | `WorkspaceSidebarHeader.tsx:122,141`               |
| Workspace row name | `text-[13px] leading-tight`            | `DashboardSidebarExpandedWorkspaceRow.tsx:240,246` |
| Markdown code      | `text-sm`                              | `createMarkdownExtensions.ts:122,130`              |
| Table header       | (default — inherit)                    | `table.tsx:73`                                     |

### 3.5 Letter Spacing

| Class             | Value  | Use                                                            |
| ----------------- | ------ | -------------------------------------------------------------- |
| `tracking-widest` | 0.1em  | DropdownMenuShortcut (`dropdown-menu.tsx:194`)                 |
| `tracking-wider`  | 0.05em | Badge `box` variant (`badge.tsx:20`) — uppercase metadata tags |

### 3.6 Numeric Formatting

- `tabular-nums` is applied to: shortcut labels (`DashboardSidebar.tsx:283`, `DashboardSidebarExpandedWorkspaceRow.tsx:272`), sidebar menu badges (`sidebar.tsx:590`), resource consumption metric badges.

### 3.7 Iconography

| Library           | Used in                                                            | Stroke                                                                         |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `lucide-react`    | Most UI (`LuLayers`, `LuClock`, `LuPlus`, etc.)                    | Default 2                                                                      |
| `react-icons/lu`  | Dashboard sidebar (`LuLayers`, `LuPlus`, `LuFolderPlus`)           | `strokeWidth={STROKE_WIDTH}` = 1.5 (sidebar) / `STROKE_WIDTH_THICK` = 2 (plus) |
| `react-icons/hi2` | `HiOutlineWifi`, `HiMiniPlus`, `HiMiniXMark`, `HiMiniMinus`        | default                                                                        |
| `react-icons/vsc` | Code/file actions (`VscAdd`, `VscRemove`, `VscTrash`, `VscClippy`) | default                                                                        |

Constants in `apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/constants.ts`:

```ts
export const STROKE_WIDTH = 1.5; // default sidebar icons
export const STROKE_WIDTH_THICK = 2; // plus icons (emphasis)
export const STROKE_WIDTH_THIN = 1; // subtle/toggle icons
```

---

## 4. Geometry, Padding, & Sizing Scale

### 4.1 Border Radius Tokens (`globals.css:129-132`)

```css
--radius: 0.625rem; /* 10px — base */
--radius-sm: calc(var(--radius) - 4px) = 6px;
--radius-md: calc(var(--radius) - 2px) = 8px;
--radius-lg: var(--radius) = 10px;
--radius-xl: calc(var(--radius) + 4px) = 14px;
```

Component-relative radius usage:

| Component                        | Class              | Computed |
| -------------------------------- | ------------------ | -------- |
| Button                           | `rounded-md`       | 8px      |
| Input                            | `rounded-md`       | 8px      |
| Badge default                    | `rounded-full`     | 9999px   |
| Badge `box`                      | `rounded-none`     | 0        |
| Dropdown menu content            | `rounded-md`       | 8px      |
| Popover content                  | `rounded-md`       | 8px      |
| Hover card content               | `rounded-md`       | 8px      |
| Tooltip content                  | `rounded-md`       | 8px      |
| Dialog content                   | `rounded-lg`       | 10px     |
| Sheet content                    | (none — flat edge) | 0        |
| Sidebar inner (floating variant) | `rounded-lg`       | 10px     |
| Avatar                           | `rounded-full`     | 9999px   |
| Tooltip arrow                    | `rounded-[2px]`    | 2px      |
| Dialog close button              | `rounded-xs`       | ~2px     |

### 4.2 Sidebar Dimensions

**Workspace Sidebar (`stores/workspace-sidebar-state.ts:4-10`):**

```ts
DEFAULT_WORKSPACE_SIDEBAR_WIDTH = 280; // px
COLLAPSED_WORKSPACE_SIDEBAR_WIDTH = 52; // px (icon-only)
MIN_WORKSPACE_SIDEBAR_WIDTH = 220; // px (internal)
MAX_WORKSPACE_SIDEBAR_WIDTH = 400; // px
COLLAPSE_THRESHOLD = 120; // px — snap to collapsed
```

**Right (Content) Sidebar (`stores/sidebar-state.ts:14-16`):**

```ts
DEFAULT_SIDEBAR_WIDTH = 250; // px
MIN_SIDEBAR_WIDTH = 200;
MAX_SIDEBAR_WIDTH = 500;
```

**shadcn Sidebar (`packages/ui/src/components/ui/sidebar.tsx:30-33`):**

```ts
SIDEBAR_WIDTH = "16rem"; // 256px
SIDEBAR_WIDTH_MOBILE = "18rem"; // 288px
SIDEBAR_WIDTH_ICON = "3rem"; // 48px
SIDEBAR_COOKIE_NAME = "sidebar_state";
SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
SIDEBAR_KEYBOARD_SHORTCUT = "b"; // ⌘B / Ctrl+B
```

Transition: `transition-[left,right,width] duration-200 ease-linear` (`sidebar.tsx:222,233`).

### 4.3 Icon Size Tokens (Tailwind `size-*` literals used)

| Class      | px  | Common use                                                                  |
| ---------- | --- | --------------------------------------------------------------------------- |
| `size-3`   | 12  | File row action icons (`FileItem.tsx:181-197`)                              |
| `size-3.5` | 14  | Workspace row hover actions, offline indicator                              |
| `size-4`   | 16  | **Default icon** for nav buttons, dropdown items, sidebar headers           |
| `size-5`   | 20  | Pull request icon wrapper                                                   |
| `size-7`   | 28  | Button `icon-xs`; SidebarToggle (`SidebarToggle.tsx:31`)                    |
| `size-8`   | 32  | Button `icon-sm`; SidebarToggle (`SidebarToggle.tsx:31`); SidebarMenuAction |
| `size-9`   | 36  | Button `icon` default; File item icon wrapper                               |
| `size-10`  | 40  | Button `icon-lg`                                                            |
| `size-12`  | 48  | Offline icon (`HiOutlineWifi` in `_authenticated/layout.tsx:174`)           |

Inside buttons, SVGs inherit via `[&_svg:not([class*='size-'])]:size-4` (`button.tsx:8`, `dropdown-menu.tsx:84`, `tabs.tsx:45`).

### 4.4 Button (`packages/ui/src/components/ui/button.tsx:7-39`)

Base: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50`

| Size      | Class                                                                                          | Height | Padding     | Radius           |
| --------- | ---------------------------------------------------------------------------------------------- | ------ | ----------- | ---------------- |
| `xs`      | `h-7 rounded-md gap-1.5 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3.5` | 28     | `px-2.5`    | `rounded-md` (8) |
| `sm`      | `h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5`                                                | 32     | `px-3`      | `rounded-md` (8) |
| `default` | `h-9 px-4 py-2 has-[>svg]:px-3`                                                                | 36     | `px-4 py-2` | `rounded-md` (8) |
| `lg`      | `h-10 rounded-md px-6 has-[>svg]:px-4`                                                         | 40     | `px-6`      | `rounded-md` (8) |
| `icon`    | `size-9`                                                                                       | 36     | —           | `rounded-md`     |
| `icon-sm` | `size-8`                                                                                       | 32     | —           | `rounded-md`     |
| `icon-xs` | `size-7`                                                                                       | 28     | —           | `rounded-md`     |
| `icon-lg` | `size-10`                                                                                      | 40     | —           | `rounded-md`     |

Variants (`button.tsx:11-22`):

- **default**: `bg-primary text-primary-foreground hover:bg-primary/90`
- **destructive**: `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60`
- **outline**: `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50`
- **secondary**: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- **ghost**: `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50`
- **link**: `text-primary underline-offset-4 hover:underline`

### 4.5 Input (`packages/ui/src/components/ui/input.tsx:5-12`)

```css
default:
  file:text-foreground placeholder:text-muted-foreground
  selection:bg-primary selection:text-primary-foreground
  dark:bg-input/30
  border-input
  h-9 w-full min-w-0 rounded-md border
  bg-transparent px-3 py-1
  text-base shadow-xs transition-[color,box-shadow] outline-none
  md:text-sm
  focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
  aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
ghost:
  bg-transparent outline-none text-sm
```

`SidebarInput` override (`sidebar.tsx:330`): `bg-background h-8 w-full shadow-none`.

### 4.6 Badge (`packages/ui/src/components/ui/badge.tsx:7-27`)

Base: `inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1`

| Variant     | Classes                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| default     | `border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90`                                             |
| secondary   | `border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90`                                       |
| destructive | `border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 ...`                                              |
| outline     | `text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground`                                                     |
| **box**     | `rounded-none border-accent-foreground/20 bg-accent text-accent-foreground text-[10px] uppercase tracking-wider px-1.5 py-0` |

### 4.7 Dialog (`packages/ui/src/components/ui/dialog.tsx`)

```
DialogOverlay:    fixed inset-0 z-50 bg-black/50
DialogContent:    bg-background fixed top-[50%] left-[50%] z-50
                  grid w-full max-w-[calc(100%-2rem)]
                  translate-x-[-50%] translate-y-[-50%]
                  gap-4 rounded-lg border p-6 shadow-lg duration-200
                  sm:max-w-lg
DialogHeader:     flex flex-col gap-2 text-center sm:text-left
DialogFooter:     flex flex-col-reverse gap-2 sm:flex-row sm:justify-end
DialogTitle:      text-lg leading-none font-semibold
DialogDescription: text-muted-foreground text-sm
DialogClose:      absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100
```

### 4.8 Dropdown Menu (`packages/ui/src/components/ui/dropdown-menu.tsx:41-90`)

```
DropdownMenuContent:
  bg-popover text-popover-foreground
  data-[state=open]:animate-in / data-[state=closed]:animate-out
  data-[state=closed]:fade-out-0 / data-[state=open]:fade-in-0
  data-[state=closed]:zoom-out-95 / data-[state=open]:zoom-in-95
  data-[side=bottom]:slide-in-from-top-2
  data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2
  data-[side=top]:slide-in-from-bottom-2
  z-50 max-h-(--radix-dropdown-menu-content-available-height)
  min-w-[8rem]
  origin-(--radix-dropdown-menu-content-transform-origin)
  overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md
sideOffset = 4
```

```
DropdownMenuItem:
  focus:bg-accent focus:text-accent-foreground
  data-[variant=destructive]:text-destructive
  data-[variant=destructive]:focus:bg-destructive/10
  dark:data-[variant=destructive]:focus:bg-destructive/20
  relative flex cursor-default items-center gap-2 rounded-sm
  px-2 py-1.5 text-sm outline-hidden select-none
  data-[disabled]:pointer-events-none data-[disabled]:opacity-50
  data-[inset]:pl-8
DropdownMenuSeparator: bg-border -mx-1 my-1 h-px
DropdownMenuShortcut:  text-muted-foreground ml-auto text-xs tracking-widest
```

### 4.9 Tooltip (`packages/ui/src/components/ui/tooltip.tsx:45-78`)

```
TooltipContent:
  bg-foreground text-background
  animate-in fade-in-0 zoom-in-95
  data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
  data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
  data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
  z-50 w-fit origin-(--radix-tooltip-content-transform-origin)
  rounded-md px-3 py-1.5 text-xs text-balance
TooltipArrow: bg-foreground fill-foreground z-50 size-2.5
              translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]
sideOffset = 0 (default)
```

### 4.10 Popover (`packages/ui/src/components/ui/popover.tsx:20-40`)

```
PopoverContent:
  bg-popover text-popover-foreground
  animate-in / animate-out / fade / zoom / slide per data-side
  z-50 w-72 origin-(--radix-popover-content-transform-origin)
  rounded-md border p-4 shadow-md outline-hidden
sideOffset = 4, align = "center"
```

### 4.11 Hover Card (`packages/ui/src/components/ui/hover-card.tsx:22-42`)

```
HoverCardContent:
  bg-popover text-popover-foreground
  animate-in / animate-out / fade / zoom / slide per data-side
  z-50 w-64 origin-(--radix-hover-card-content-transform-origin)
  rounded-md border p-4 shadow-md outline-hidden
sideOffset = 4, align = "center"
```

### 4.12 Tabs (`packages/ui/src/components/ui/tabs.tsx`)

```
TabsList:     bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]
TabsTrigger:  data-[state=active]:bg-background dark:data-[state=active]:text-foreground
              data-[state=active]:shadow-sm
              inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5
              rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap
              transition-[color,box-shadow]
TabsContent:  flex-1 outline-none
```

### 4.13 Table (`packages/ui/src/components/ui/table.tsx`)

```
TableContainer: relative w-full overflow-x-auto
Table:         w-full caption-bottom text-sm
TableHeader:   [&_tr]:border-b
TableBody:     [&_tr:last-child]:border-0
TableRow:      hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors
TableHead:     text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap
TableCell:     p-2 align-middle whitespace-nowrap
TableFooter:   bg-muted/50 border-t font-medium [&>tr]:last:border-b-0
TableCaption:  text-muted-foreground mt-4 text-sm
```

### 4.14 Sheet / Drawer (`packages/ui/src/components/ui/sheet.tsx:47-82`)

```
SheetOverlay:   fixed inset-0 z-50 bg-black/50
SheetContent:   bg-background data-[state=open]:animate-in data-[state=closed]:animate-out
                fixed z-50 flex flex-col gap-4 shadow-lg
                transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500
  side="right": slide-out-to-right / slide-in-from-right, inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm
  side="left":  slide-out-to-left  / slide-in-from-left,  inset-y-0 left-0  h-full w-3/4 border-r sm:max-w-sm
  side="top":   slide-out-to-top   / slide-in-from-top,   inset-x-0 top-0 h-auto border-b
  side="bottom":slide-out-to-bottom/slide-in-from-bottom,inset-x-0 bottom-0 h-auto border-t
SheetHeader:    flex flex-col gap-1.5 p-4
SheetFooter:    mt-auto flex flex-col gap-2 p-4
SheetTitle:     text-foreground font-semibold
SheetDescription: text-muted-foreground text-sm
```

### 4.15 Separator / ScrollArea / Avatar / Sidebar internals

```
Separator:      bg-border shrink-0
                data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full
                data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px
                (`separator.tsx:18-22`)

ScrollArea:     ScrollBar orientation="vertical": h-full w-2.5 border-l border-l-transparent
                ScrollBar orientation="horizontal": h-2.5 flex-col border-t border-t-transparent
                ScrollBarThumb: bg-border relative flex-1 rounded-full

Avatar:         relative flex size-8 shrink-0 overflow-hidden rounded-full
AvatarFallback: bg-muted flex size-full items-center justify-center rounded-full

SidebarProvider: --sidebar-width: 16rem; --sidebar-width-icon: 3rem;
Sidebar gap:     w-(--sidebar-width), offcanvas w-0, icon w-(--sidebar-width-icon)
Sidebar container: fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width)
SidebarHeader:   flex flex-col gap-2 p-2
SidebarFooter:   flex flex-col gap-2 p-2
SidebarContent:  flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden
SidebarGroup:    relative flex w-full min-w-0 flex-col p-2
SidebarGroupLabel: text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium
SidebarMenu:     flex w-full min-w-0 flex-col gap-1
SidebarMenuButton:
  base: peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm
         ring-sidebar-ring transition-[width,height,padding]
         hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2
         active:bg-sidebar-accent active:text-sidebar-accent-foreground
         data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium
         data-[active=true]:text-sidebar-accent-foreground
         data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground
  size default: h-8 text-sm
  size sm:      h-7 text-xs
  size lg:      h-12 text-sm group-data-[collapsible=icon]:p-0!
  variant outline: bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))]
                   hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]
SidebarMenuSub:  border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5
SidebarMenuSubButton: flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2
                     data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground
```

### 4.16 TopBar (`routes/_authenticated/_dashboard/components/TopBar/TopBar.tsx:45-90`)

```html
<div class="drag gap-2 h-12 w-full flex items-center justify-between
            bg-muted/45 border-b border-border relative dark:bg-muted/35">
  <!-- LeftSection  -->
  <div class="flex items-center gap-1.5 h-full"
       style="paddingLeft: isMac && !sidebarHostsChrome ? '80px' : '16px'">
    <SidebarToggle />
    <NavigationControls />
  </div>
  <!-- CenterSection (flex min-w-0 flex-1 items-center justify-start) -->
  <div class="flex min-w-0 flex-1 items-center justify-start">
    {v2 ? <V2WorkspaceTitle /> : null}
  </div>
  <!-- RightSection (flex items-center gap-3 h-full pr-4 shrink-0) -->
  <div class="flex items-center gap-3 h-full pr-4 shrink-0">
    <ResourceConsumption surface="v2" />
    {offline ? <div ... bg-muted px-2 py-1 rounded">Offline</div> : null}
    <OpenInMenuButton />
    <OrganizationDropdown />
    {v2 ? <RightSidebarToggle /> : null}
    {!isMac ? <WindowControls /> : null}
  </div>
</div>
```

| Element           | Class                                                         | Pixel   |
| ----------------- | ------------------------------------------------------------- | ------- |
| TopBar height     | `h-12`                                                        | 48      |
| TopBar gap        | `gap-2`                                                       | 8       |
| Left section gap  | `gap-1.5`                                                     | 6       |
| Right section gap | `gap-3`                                                       | 12      |
| Right padding     | `pr-4`                                                        | 16      |
| Left padding      | style `paddingLeft: 80px` (mac with traffic lights) or `16px` | 80 / 16 |
| Border            | `border-b border-border`                                      | 1       |
| Background        | `bg-muted/45` (light) / `dark:bg-muted/35`                    | —       |

Offline badge: `no-drag flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded` (`TopBar.tsx:72`).

### 4.17 SidebarHeader (`DashboardSidebarHeader.tsx`)

```html
<!-- Collapsed -->
<div class="flex flex-col items-center gap-2 border-b border-border py-2">
  <!-- Expanded -->
  <div class="flex flex-col gap-1 border-b border-border px-2 pt-2 pb-2">
    <!-- drag row for traffic-light alignment -->
    <div
      class="drag -mx-2 flex h-8 items-center gap-1.5 pr-2"
      style="paddingLeft: isMac ? '80px' : '8px'"
    >
      <SidebarToggle />
      <NavigationControls />
      <ResourceConsumption surface="v2" class="ml-auto" />
    </div>
    <OrganizationDropdown variant="expanded" />
    <button
      class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ..."
    >
      <icon class="size-4 shrink-0" />
      <span class="flex-1 text-left">{label}</span>
    </button>
  </div>
</div>
```

| Element                          | Class                                                                                         | Pixel          |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Header container (expanded)      | `flex flex-col gap-1 border-b border-border px-2 pt-2 pb-2`                                   | gap 4; p 8/8/8 |
| Header container (collapsed)     | `flex flex-col items-center gap-2 border-b border-border py-2`                                | gap 8; py 8    |
| Inner drag row                   | `drag -mx-2 flex h-8 items-center gap-1.5 pr-2`                                               | h 32, gap 6    |
| Inner row left padding (mac)     | inline `paddingLeft: '80px'`                                                                  | 80             |
| Inner row left padding (non-mac) | inline `paddingLeft: '8px'`                                                                   | 8              |
| Nav button                       | `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors` | px 8, py 6     |
| Icon button (collapsed)          | `flex size-8 items-center justify-center rounded-md transition-colors`                        | 32 × 32        |
| "New Workspace" label            | `flex-1 truncate text-left whitespace-nowrap`                                                 | —              |

### 4.18 NavigationControls (`NavigationControls.tsx:33-69`)

```html
<div class="flex items-center">
  <button
    class="no-drag flex items-center justify-center size-7 rounded-md
                 text-muted-foreground hover:text-foreground hover:bg-accent/50
                 transition-colors disabled:opacity-30 disabled:pointer-events-none"
  >
    <LuArrowLeft class="size-4" strokeWidth="{1.5}" />
  </button>
  <button class="no-drag ... size-7 ..."><LuArrowRight ... /></button>
  <HistoryDropdown />
</div>
```

| Element     | Pixel              |
| ----------- | ------------------ |
| Button      | 28 × 28 (`size-7`) |
| Icon        | 16 × 16 (`size-4`) |
| Icon stroke | 1.5                |

### 4.19 SidebarToggle (`SidebarToggle.tsx:25-42`)

```html
<Tooltip delayDuration="{300}">
  <TooltipTrigger asChild>
    <button
      class="no-drag group flex items-center justify-center size-8 rounded-md
                   text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
    >
      <span class="group-hover:hidden">{iconCollapsed}</span>
      <span class="hidden group-hover:block">{iconExpanded}</span>
    </button>
  </TooltipTrigger>
  <TooltipContent side="right">...</TooltipContent>
</Tooltip>
```

Size: 32 × 32. Icons: `LuPanelLeft`, `LuPanelLeftClose`, `LuPanelLeftOpen` with `strokeWidth={1.5}`.

### 4.20 WorkspaceSidebarLayout (`DashboardSidebar.tsx:175-299`)

```html
<div class="flex h-full flex-col border-r border-border bg-muted/45 dark:bg-muted/35">
  <DashboardSidebarHeader isCollapsed={isCollapsed} />
  <div class="flex-1 overflow-y-auto hide-scrollbar">
    <!-- DndContext with SortableContext (projects) -->
  </div>
  {!isCollapsed && <DashboardSidebarPortsList />}
  {!isCollapsed && activeV2Project && activeHostUrl && <V2SetupScriptCard />}
  <div class={cn("border-t border-border",
            isCollapsed ? "flex flex-col items-center gap-1 py-1" : "flex items-center gap-1 px-2 py-1")}>
    <!-- settings + help -->
  </div>
</div>
```

### 4.21 Workspace Row (`DashboardSidebarExpandedWorkspaceRow.tsx:110-142`)

```html
<div
  class="relative flex w-full items-center pr-2 text-left text-sm
            isInSection ? 'pl-7' : 'pl-5'
            hover:bg-muted (active) | hover:bg-muted/50 (inactive)
            group py-2
            isActive && 'bg-muted'"
>
  {isActive && showsStandaloneActiveStripe && (
  <div
    class="absolute top-0 bottom-0 left-0 w-0.5 rounded-r"
    style="backgroundColor: var(--color-foreground)"
  />
  )}
  <Tooltip delayDuration="{500}">
    <TooltipTrigger asChild>
      <button
        class="relative mr-2.5 flex size-5 shrink-0 items-center justify-center rounded hover:bg-foreground/10"
      >
        <WorkspaceIcon variant="expanded" ... />
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset="{8}">...</TooltipContent>
  </Tooltip>
  <div
    class="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1.5"
  >
    <span
      class="truncate text-[13px] leading-tight text-foreground/80 (active: text-foreground)"
    >
      {name || branch}
    </span>
    <div
      class="col-start-2 row-start-1 grid h-5 shrink-0 items-center justify-items-end ..."
    >
      <DiffStats additions deletions />
      <!-- text-[10px] font-mono -->
      <div class="hidden items-center justify-end gap-1.5 group-hover:flex">
        {shortcutLabel &&
        <span
          class="font-mono text-[10px] tabular-nums text-muted-foreground"
        />}
        <button class="text-muted-foreground hover:text-foreground">
          <HiMiniXMark class="size-3.5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

| Dimension                | Pixel                                                         |
| ------------------------ | ------------------------------------------------------------- |
| Row padding-x            | `pr-2` (8) right; `pl-5` (20) at root, `pl-7` (28) in section |
| Row padding-y            | `py-2` (8)                                                    |
| Active indicator         | `w-0.5` (2px) wide, full height, `rounded-r`                  |
| Icon button              | `size-5` (20 × 20), `mr-2.5` (10)                             |
| Name text                | `text-[13px]` (13), `leading-tight`, truncate                 |
| Diff stats               | `text-[10px]` (10), `font-mono`, `tabular-nums`, `opacity-60` |
| Shortcut hint            | `text-[10px]` (10), `font-mono`, `tabular-nums`               |
| Hover action button icon | `size-3.5` (14)                                               |
| Hover action gap         | `gap-1.5` (6)                                                 |
| Tooltip side             | `right`, `sideOffset={8}` (8)                                 |
| Tooltip delay            | `delayDuration={500}` (500ms)                                 |

### 4.22 File Row (`FileItem.tsx:215-267`)

```html
<div
  class="group w-full flex items-stretch gap-1 px-1.5 text-left rounded-sm
            hover:bg-accent/50 cursor-pointer transition-colors
            isHighlighted && 'bg-accent'"
>
  {hasIndent && <LevelIndicators level="{level}" />}
  <!-- w-3 self-stretch border-r border-border -->
  <button
    class="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden
                 hasIndent ? 'py-0.5' : 'py-1'"
  >
    <span class="shrink-0 flex items-center text-xs"> {statusIndicator} </span>
    <span class="flex-1 min-w-0 flex items-center gap-1">
      <span class="text-xs text-start truncate overflow-hidden text-ellipsis"
        >{fileName}</span
      >
      {showStatsDisplay && (
      <span
        class="flex items-center gap-0.5 text-[10px] font-mono shrink-0 whitespace-nowrap opacity-60"
      >
        <span class="text-green-600 dark:text-green-500">+{additions}</span>
        <span class="text-red-600 dark:text-red-400">-{deletions}</span>
      </span>
      )}
    </span>
  </button>
  <RowHoverActions />
</div>
```

### 4.23 WorkspaceLayout (`WorkspaceLayout.tsx:36-65`)

```html
<ScrollProvider>
  <div class="flex-1 min-w-0 overflow-hidden">
    {isExpanded ? <ChangesContent /> : <ContentView ... />}
  </div>
  {isSidebarOpen && (
  <ResizablePanel
    width="250"
    min="200"
    max="500"
    handleSide="left"
    onDoubleClickHandle="{()"
    =""
  >
    setWidth(250)}>
    <RightSidebar />
  </ResizablePanel>
  )}
</ScrollProvider>
```

### 4.24 DashboardLayout (`routes/_authenticated/_dashboard/layout.tsx:188-231`)

```html
<div class="flex h-full w-full overflow-hidden">
  <CommandPaletteHost />
  {sidebarOutsideColumn && sidebarPanel}
  <div class="flex flex-1 flex-col min-w-0 min-h-0">
    <TopBar />
    <div class="flex flex-1 min-h-0 min-w-0 overflow-hidden">
      {!sidebarOutsideColumn && sidebarPanel}
      <div class="flex flex-1 min-h-0 min-w-0">
        {versionMismatch ? <CrossVersionMismatchState /> : <Outlet />}
      </div>
    </div>
  </div>
  <div id="workspace-right-sidebar-slot" class="flex h-full shrink-0" />
  <AddRepositoryModals />
  {delete dialogs}
</div>
```

---

## 5. Micro-Interactions & State Transition Spec

### 5.1 Transition Tokens

| Property                            | Value         | Source                                                                          |
| ----------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `transition-all`                    | default       | `button.tsx:8`                                                                  |
| `transition-colors`                 | color         | `dropdown-menu.tsx`, `tabs.tsx:45`, `NavigationControls.tsx:41`, `table.tsx:60` |
| `transition-[color,box-shadow]`     | dual          | `input.tsx:7`, `tabs.tsx:45`, `badge.tsx:8`                                     |
| `transition-[width,height,padding]` | size          | `sidebar.tsx:478`                                                               |
| `transition-[left,right,width]`     | slide         | `sidebar.tsx:222,233`                                                           |
| `transition-[margin,opacity]`       | group label   | `sidebar.tsx:409`                                                               |
| `transition-opacity`                | simple fade   | `dropdown-menu.tsx:194`, dialog close                                           |
| `transition-transform`              | subtle motion | `sidebar.tsx:430,565`                                                           |
| `duration-200`                      | 200ms         | `dialog.tsx:64`, `sidebar.tsx:222,233`                                          |
| `duration-300`                      | 300ms         | sheet close (`sheet.tsx:61`)                                                    |
| `duration-500`                      | 500ms         | sheet open (`sheet.tsx:61`)                                                     |
| `ease-linear`                       | linear        | `sidebar.tsx:222,233`                                                           |
| `ease-in-out`                       | default       | `sheet.tsx:61`                                                                  |

### 5.2 Hover State Patterns

| Element                        | Classes                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Sidebar row icon (TopBar)      | `text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors`                           |
| Sidebar nav button (expanded)  | `text-muted-foreground hover:bg-accent/50 hover:text-foreground`                                             |
| Sidebar collapsed icon         | `text-muted-foreground hover:bg-accent/50 hover:text-foreground`                                             |
| Settings button (active)       | `bg-accent text-foreground`                                                                                  |
| Settings button (idle)         | `text-muted-foreground hover:bg-accent/50 hover:text-foreground`                                             |
| Button default                 | `hover:bg-primary/90`                                                                                        |
| Button destructive             | `hover:bg-destructive/90`                                                                                    |
| Button outline                 | `hover:bg-accent hover:text-accent-foreground`                                                               |
| Button ghost                   | `hover:bg-accent hover:text-accent-foreground`                                                               |
| DropdownMenuItem               | `focus:bg-accent focus:text-accent-foreground`                                                               |
| DropdownMenuItem (destructive) | `data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20` |
| TabsTrigger (hover)            | (color shift via transition)                                                                                 |
| TableRow                       | `hover:bg-muted/50`                                                                                          |
| TableRow (selected)            | `data-[state=selected]:bg-muted`                                                                             |
| File row                       | `hover:bg-accent/50 cursor-pointer transition-colors`                                                        |
| Workspace sidebar row (active) | `hover:bg-muted`                                                                                             |
| Workspace sidebar row (idle)   | `hover:bg-muted/50`                                                                                          |
| Scrollbar thumb                | base `rgb(63 63 70 / 0.5)` → hover `rgb(82 82 91 / 0.7)` → active `rgb(113 113 122 / 0.8)`                   |
| SidebarMenuButton              | `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`                                               |

### 5.3 Active / Selected State Patterns

| Element                        | Attribute                                                                                                                                                                             | Visual                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| SidebarMenuButton              | `data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground`                                                               | Filled + medium weight |
| TabsTrigger                    | `data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30` | Background + shadow    |
| SidebarMenuSubButton           | `data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground`                                                                                              | Filled                 |
| TableRow                       | `data-[state=selected]:bg-muted`                                                                                                                                                      | Muted bg               |
| DialogOverlay                  | `data-[state=open]:animate-in ... data-[state=closed]:animate-out ...`                                                                                                                | Fade                   |
| DialogContent                  | `data-[state=open]:animate-in ... data-[state=closed]:animate-out ... duration-200`                                                                                                   | Scale + fade           |
| SheetContent                   | `data-[state=closed]:duration-300 data-[state=open]:duration-500` + slide per side                                                                                                    | Slide                  |
| DropdownMenuContent            | Same Radix pattern as Popover; `sideOffset = 4`                                                                                                                                       | Fade + zoom + slide    |
| PopoverContent                 | Same Radix pattern; `sideOffset = 4`, `w-72`                                                                                                                                          | Fade + zoom + slide    |
| HoverCardContent               | Same Radix pattern; `sideOffset = 4`, `w-64`                                                                                                                                          | Fade + zoom + slide    |
| TooltipContent                 | `animate-in fade-in-0 zoom-in-95`                                                                                                                                                     | Fade + zoom            |
| Workspace row active stripe    | Inline `backgroundColor: var(--color-foreground)` on `w-0.5 absolute`                                                                                                                 | 2px left bar           |
| Workspace row active bg        | `isActive && 'bg-muted'`                                                                                                                                                              | Muted bg fill          |
| Settings button (active route) | `isSettingsOpen ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'`                                                                     | Filled                 |

### 5.4 Focus / Disabled Patterns

```
focus-visible:border-ring
focus-visible:ring-ring/50
focus-visible:ring-[3px]
aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40
aria-invalid:border-destructive
disabled:pointer-events-none
disabled:opacity-50
disabled:cursor-not-allowed
```

Applied in: `button.tsx:8`, `input.tsx:8-9`, `badge.tsx:8`, `tabs.tsx:45`, `dialog.tsx:73`, `sidebar.tsx:478`.

### 5.5 Tooltip Behavior

- Global `TooltipProvider delayDuration = 0` (`tooltip.tsx:9-13`).
- Per-tooltip `delayDuration` overrides:
  - TopBar / NavigationControls / Settings button / sidebar header collapsed buttons: `300` (`NavigationControls.tsx:35,51`, `DashboardSidebar.tsx:249`, `DashboardSidebarHeader.tsx:118,136,154,172,188,304`)
  - Workspace sidebar collapsed buttons: `300` (`WorkspaceSidebarHeader.tsx:63,81`)
  - Workspace row icon tooltip: `500` (`DashboardSidebarExpandedWorkspaceRow.tsx:150`)
  - Workspace row hover-action buttons: `300` (`DashboardSidebarExpandedWorkspaceRow.tsx:277,305`)

### 5.6 Drag-and-Drop Micro-Interactions

`DashboardSidebar.tsx:109-117`:

```
MouseSensor: activationConstraint { distance: 8 }
TouchSensor: activationConstraint { delay: 200, tolerance: 5 }
KeyboardSensor: sortableKeyboardCoordinates
collisionDetection: closestCenter
MeasuringStrategy: Always (droppable)
```

Drag overlay (`DashboardSidebar.tsx:213-228`):

```html
<DragOverlay dropAnimation="{null}">
  <div class="bg-background shadow-lg border-b border-border">
    <DashboardSidebarProjectSection ... />
  </div>
</DragOverlay>
```

While dragging the row: `opacity: isDragging ? 0.5 : undefined` (`DashboardSidebar.tsx:78`).

### 5.7 Animation Definitions (`tw-animate-css` import)

Used everywhere `data-[state=open|closed]:animate-in`, `animate-out`, `fade-in-0`, `fade-out-0`, `zoom-in-95`, `zoom-out-95`, `slide-in-from-{top|right|bottom|left}-2`. The `slide-*-2` value shifts by **8px** (Tailwind `2` = 0.5rem).

### 5.8 Selection / Highlight Tokens (xterm)

`globals.css:195-206`:

```css
.xterm .xterm-rows a {
  color: inherit;
  cursor: pointer;
}
.xterm .xterm-rows a.xterm-underline-5 {
  text-decoration-color: #3b8eea;
}
.xterm .xterm-rows a:hover.xterm-underline-5 {
  text-decoration-color: #5ca8ff;
}
```

`selection:bg-primary selection:text-primary-foreground` in Input (`input.tsx:7`).

### 5.9 Electron Platform Quirks

```
- size-7, size-8 nav buttons → strokeWidth={1.5}
- size-8 size-4 general icons → default
- 80px macOS traffic-light padding (TopBar & SidebarHeader inner row)
- 16px default left padding (non-Mac / when sidebar collapsed)
- 8px padding inside the inner row when sidebar hosts chrome
```

---

## 6. Layout Shell Nesting Architecture (Pseudo-code hierarchy)

```text
<html>  [lang="en", class="dark"|"light", width/height 100vw/100vh, overflow:hidden,
          user-select:none, -webkit-font-smoothing:antialiased, scroll-behavior:smooth,
          scrollbar-color:rgb(63 63 70 / 0.5) transparent]
  <body class="bg-background text-foreground">
    <app>  [position:relative; width/height 100vw/100vh]
      <Routes>                              [tanstack/react-router]
        AuthenticatedLayout                 [_authenticated/layout.tsx]
        ├─ DndProvider
        ├─ CollectionsProvider
        ├─ GlobalBrowserLifecycle
        ├─ LocalHostServiceProvider
        ├─ DeletingWorkspacesProvider
        ├─ WorkerPoolContextProvider       [@pierre/diffs/react, poolSize:8, shiki-wasm]
        │   ├─ AgentHooks
        │   ├─ FileMenuListener
        │   ├─ V2NotificationController
        │   ├─ DaemonAutoUpdateFailureDialog
        │   ├─ <Outlet />
        │   ├─ V1ImportModal | DashboardNewWorkspaceModal | NewWorkspaceModal
        │   ├─ InitGitDialog
        │   ├─ TeardownLogsDialog
        │   ├─ WorkspaceInitEffects
        │   └─ UpdateListener (useUpdateListener)
        │
        └─ DashboardLayout                 [_authenticated/_dashboard/layout.tsx]
            [flex h-full w-full overflow-hidden]
            ├─ CommandPaletteHost           [portal]
            ├─ {sidebarOutsideColumn} && ResizablePanel
            │   [width=workspaceSidebarWidth (default 280), min=52 collapsed, max=400,
            │   handleSide="right", clampWidth=false,
            │   onDoubleClickHandle → setWidth(280)]
            │   └─ {isV2CloudEnabled
            │       ? DashboardSidebar
            │       : WorkspaceSidebar
            │      }
            │
            ├─ MainColumn [flex flex-1 flex-col min-w-0 min-h-0]
            │   │
            │   ├─ TopBar [TopBar.tsx]
            │   │   [drag, h-12, gap-2, bg-muted/45, border-b border-border]
            │   │   ├─ LeftSection [flex items-center gap-1.5 h-full,
            │   │   │  paddingLeft: mac&&!hostsChrome ? "80px" : "16px"]
            │   │   │  ├─ SidebarToggle    [size-8, hover:bg-accent/50]
            │   │   │  ├─ NavigationControls [size-7 × 2, hover:bg-accent/50]
            │   │   │  └─ {if !v2CloudEnabled} ResourceConsumption v1
            │   │   ├─ CenterSection [flex min-w-0 flex-1 items-center justify-start]
            │   │   │  └─ {v2Workspace} V2WorkspaceTitle
            │   │   └─ RightSection [flex items-center gap-3 h-full pr-4 shrink-0]
            │   │      ├─ {v2CloudEnabled && !hostsChrome} ResourceConsumption v2
            │   │      ├─ OfflineBadge   [text-xs, bg-muted, px-2 py-1 rounded]
            │   │      ├─ OpenInMenuButton | V2OpenInMenuButton
            │   │      ├─ {if !v2CloudEnabled} OrganizationDropdown
            │   │      ├─ {v2Workspace} RightSidebarToggle
            │   │      └─ {!isMac} WindowControls
            │   │
            │   └─ ContentArea [flex flex-1 min-h-0 min-w-0 overflow-hidden]
            │       ├─ {!sidebarOutsideColumn} sidebarPanel   [same ResizablePanel as above]
            │       └─ InnerRoute [flex flex-1 min-h-0 min-w-0]
            │           └─ {versionMismatch
            │               ? <CrossVersionMismatchState />
            │               : <Outlet /> }
            │
            ├─ #workspace-right-sidebar-slot [flex h-full shrink-0]
            ├─ AddRepositoryModals
            └─ {deleteTarget} DeleteWorkspaceDialog | DashboardSidebarDeleteDialog

      ─────────────────────────────────────────────────────────────

      WorkspaceLayout [WorkspaceLayout.tsx]
      [ScrollProvider]
      ├─ MainColumn [flex-1 min-w-0 overflow-hidden]
      │   ├─ {currentMode === Changes
      │   │   ? <ChangesContent />
      │   │   : <ContentView defaultExternalApp onOpenInApp onOpenQuickOpen />}
      │   │
      │   └─ <ResizablePanel width=sidebarWidth min=200 max=500 handleSide="left"
      │                       onDoubleClick → setWidth(250)>
      │       └─ <RightSidebar />
      │
      └─ RightSidebar internals:
          ├─ Header (Changes/Files tabs toggle)
          ├─ FileList / CommitList (virtualized or grouped)
          │   └─ FileItem / FolderRow / CommitItem / CategorySection
          │       └─ ContextMenu (right-click)
          │       └─ Tooltip (path tooltip)
          └─ Resize handle

      ─────────────────────────────────────────────────────────────

      DashboardSidebar [DashboardSidebar.tsx]
      [flex h-full flex-col border-r border-border bg-muted/45 dark:bg-muted/35]
      ├─ DashboardSidebarHeader [expanded | collapsed]
      │   ├─ Expanded: [flex flex-col gap-1 border-b border-border px-2 pt-2 pb-2]
      │   │   ├─ Drag row [drag -mx-2 flex h-8 items-center gap-1.5 pr-2,
      │   │   │           paddingLeft: isMac?'80px':'8px']
      │   │   │  ├─ SidebarToggle
      │   │   │  ├─ NavigationControls
      │   │   │  └─ ResourceConsumption v2 [ml-auto]
      │   │   ├─ OrganizationDropdown (variant="expanded")
      │   │   ├─ NavButton "Workspaces"  [flex w-full items-center gap-2 rounded-md
      │   │   │                            px-2 py-1.5 text-sm font-medium
      │   │   │                            transition-colors
      │   │   │                            active:bg-accent text-foreground
      │   │   │                            idle:text-muted-foreground
      │   │   │                                hover:bg-accent/50 hover:text-foreground]
      │   │   ├─ NavButton "Automations" [same shape]
      │   │   ├─ NavButton "Tasks & PRs" [same shape]
      │   │   └─ NewWorkspace + AddRepositoryDropdown [flex items-center gap-0]
      │   └─ Collapsed: [flex flex-col items-center gap-2 border-b border-border py-2]
      │       ├─ OrganizationDropdown (variant="collapsed")
      │       ├─ IconButton Workspaces   [size-8, hover:bg-accent/50]
      │       ├─ IconButton Automations  [size-8]
      │       ├─ IconButton Tasks        [size-8]
      │       ├─ IconButton NewWorkspace [size-8, strokeWidth=2]
      │       └─ DropdownMenu AddRepository [size-8 trigger]
      │
      ├─ Body [flex-1 overflow-y-auto hide-scrollbar]
      │   └─ DndContext (MouseSensor 8px / TouchSensor delay 200 tolerance 5 / Keyboard)
      │       └─ SortableContext [verticalListSortingStrategy]
      │           └─ ProjectSection × N
      │               ├─ CollapsedContent | ExpandedContent
      │               │   └─ ProjectRow × N
      │               │       └─ WorkspaceItem
      │               │           ├─ CollapsedWorkspaceButton
      │               │           └─ ExpandedWorkspaceRow
      │               │               [flex w-full items-center pr-2 text-sm
      │               │                py-2, pl-5 root / pl-7 in-section,
      │               │                active:bg-muted, idle:hover:bg-muted/50,
      │               │                active-stripe: w-0.5 bg-foreground]
      │               │               ├─ WorkspaceIcon [size-5 mr-2.5]
      │               │               ├─ Name span [text-[13px] leading-tight
      │               │               │                 text-foreground/80 active:text-foreground]
      │               │               └─ Trailing cluster [grid h-5 gap-x-1.5]
      │               │                   ├─ DiffStats [text-[10px] font-mono]
      │               │                   └─ Group-hover actions [gap-1.5]
      │               │                       ├─ ShortcutLabel [text-[10px] font-mono]
      │               │                       ├─ Close | Remove button [size-3.5]
      │               │
      │       └─ DragOverlay portal
      │           └─ [bg-background shadow-lg border-b border-border]
      │               └─ ActiveProject clone
      │
      ├─ {!isCollapsed && <DashboardSidebarPortsList />}   [flex-1, overflow-y]
      ├─ {!isCollapsed && activeV2Project && <V2SetupScriptCard />}
      └─ Footer [border-t border-border]
          ├─ Collapsed: [flex flex-col items-center gap-1 py-1]
          │   ├─ Settings IconButton (size-8)
          │   └─ HelpMenu (size-8)
          └─ Expanded:   [flex items-center gap-1 px-2 py-1]
              ├─ Settings button
              │   [group flex flex-1 min-w-0 items-center gap-2 rounded-md
              │    px-2 py-1.5 text-sm font-medium transition-colors,
              │    active:bg-accent text-foreground,
              │    idle:text-muted-foreground hover:bg-accent/50 hover:text-foreground]
              │   ├─ HiOutlineCog6Tooth [size-4]
              │   ├─ "Settings" span [flex-1 text-left]
              │   └─ HotkeyLabel [text-[10px] font-mono tabular-nums
              │                   text-muted-foreground/60, opacity-0
              │                   group-hover:opacity-100
              │                   group-focus-visible:opacity-100]
              └─ DashboardSidebarHelpMenu

      ─────────────────────────────────────────────────────────────

      WorkspaceSidebar [WorkspaceSidebar.tsx]     [v1 — fallback when !isV2CloudEnabled]
      [SidebarDropZone class="flex flex-col h-full bg-muted/45 dark:bg-muted/35"]
      ├─ WorkspaceSidebarHeader [expanded | collapsed]
      │   ├─ Expanded: [flex flex-col gap-1 border-b border-border px-2 pt-2 pb-2]
      │   │   ├─ NavButton "Workspaces"   [flex items-center gap-2 px-2 py-1.5
      │   │   │                             w-full rounded-md transition-colors]
      │   │   ├─ NavButton "Tasks & PRs"  [same shape]
      │   │   └─ NewWorkspaceButton
      │   └─ Collapsed: [flex flex-col items-center border-b border-border py-2 gap-2]
      │       ├─ IconButton Workspaces
      │       ├─ IconButton Tasks
      │       └─ NewWorkspaceButton (collapsed)
      │
      ├─ Body [flex-1 overflow-y-auto hide-scrollbar, onMouseDown clears selection]
      │   └─ ProjectSection × N
      │       └─ WorkspaceListItem × N (with ShortcutLabel)
      │
      ├─ {!isCollapsed && <PortsList />}
      ├─ SetupScriptCard
      ├─ WorkspaceSidebarFooter
      └─ <MultiDragPreview />
```

### 6.1 Data Attributes Driving Styling

| Attribute                                                                                                          | Used by                                                     |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `data-slot="button" \| "input" \| "badge" \| "tabs" \| "dropdown-menu" \| "dialog" \| "sheet" \| "sidebar" \| ...` | shadcn primitives — every component                         |
| `data-state="open\|closed"`                                                                                        | dialog, sheet, dropdown, popover, hover-card, tooltip, tabs |
| `data-side="top\|right\|bottom\|left"`                                                                             | dropdown, popover, hover-card, tooltip, sheet               |
| `data-variant="floating\|inset"`                                                                                   | sidebar                                                     |
| `data-collapsible="offcanvas\|icon"`                                                                               | sidebar                                                     |
| `data-state="expanded\|collapsed"`                                                                                 | sidebar                                                     |
| `data-active="true"`                                                                                               | SidebarMenuButton, SidebarMenuSubButton                     |
| `data-size="sm\|md\|lg\|default"`                                                                                  | sidebar menu buttons, tabs                                  |
| `data-variant="default\|destructive"`                                                                              | DropdownMenuItem, Badge                                     |
| `data-inset="true"`                                                                                                | DropdownMenuItem inset variant                              |
| `data-orientation="horizontal\|vertical"`                                                                          | Separator, ScrollBar                                        |
| `data-mobile="true"`                                                                                               | Sheet (mobile sidebar)                                      |
| `data-sidebar="sidebar" \| "trigger" \| "menu" \| "menu-button" \| "menu-item" \| "input" \| ...`                  | sidebar complex                                             |
| `data-sonner-toast`                                                                                                | toast                                                       |
| `data-radix-*`                                                                                                     | implicit Radix root data                                    |

### 6.2 Spacing Rhythm Summary

| Pixel | Tailwind class                               | Common occurrences                   |
| ----- | -------------------------------------------- | ------------------------------------ |
| 1     | `gap-0.5`, `gap-px`                          | (rare)                               |
| 2     | `gap-1`, `p-1`, `px-2 py-0.5`                | badge, dropdown padding-y            |
| 4     | `gap-2`, `p-2`, `px-2 py-1`, `m-1`           | sidebar padding, dropdown items      |
| 6     | `gap-1.5`, `py-1.5`                          | nav buttons, sidebar rows            |
| 8     | `gap-2`, `px-3 py-1`, `gap-3`, `h-8`, `py-2` | button default padding, body padding |
| 10    | `gap-2.5`, `mr-2.5`                          | workspace icon margin                |
| 12    | `gap-3`, `px-3`                              | nav gaps                             |
| 16    | `gap-4`, `px-4`, `p-4`, `pl-5`, `h-9`        | dialog, buttons, sidebar padding     |
| 20    | `pl-5`                                       | workspace row indent (root)          |
| 24    | `gap-6`, `p-6`                               | dialog padding                       |
| 28    | `pl-7`                                       | workspace row indent (in section)    |
| 32    | `h-8` rows; `size-8` icons                   | headers, buttons                     |
| 36    | `h-9` default button, `size-9`               | most buttons                         |
| 40    | `h-10`                                       | large buttons, table header          |
| 48    | `h-12`                                       | TopBar                               |

### 6.3 Layered z-index Map

| z-index | Where used                                                                                                                                   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `z-10`  | sidebar container (`sidebar.tsx:233`)                                                                                                        |
| `z-50`  | dialog overlay/content, sheet overlay/content, dropdown content, popover content, hover-card content, tooltip content, scroll-area scrollbar |
| (no z)  | inline elements                                                                                                                              |

### 6.4 Drag-Region Pattern

```html
<!-- TopBar / SidebarHeader inner row are draggable -->
<div class="drag -mx-2 flex h-8 items-center gap-1.5 pr-2" ...>
  <!-- All interactive children must opt-out -->
  <button class="no-drag ...">...</button>
</div>
```

---

## Appendix A — Theme Utility Mapping (`apps/desktop/src/renderer/stores/theme/utils/css-variables.ts:6-45`)

```ts
const UI_COLOR_TO_CSS_VAR = {
  background              → "--background",
  foreground              → "--foreground",
  card                    → "--card",
  cardForeground          → "--card-foreground",
  popover                 → "--popover",
  popoverForeground       → "--popover-foreground",
  primary                 → "--primary",
  primaryForeground       → "--primary-foreground",
  secondary               → "--secondary",
  secondaryForeground     → "--secondary-foreground",
  muted                   → "--muted",
  mutedForeground         → "--muted-foreground",
  accent                  → "--accent",
  accentForeground        → "--accent-foreground",
  tertiary                → "--tertiary",
  tertiaryActive          → "--tertiary-active",
  destructive             → "--destructive",
  destructiveForeground   → "--destructive-foreground",
  border                  → "--border",
  input                   → "--input",
  ring                    → "--ring",
  sidebar                 → "--sidebar",
  sidebarForeground       → "--sidebar-foreground",
  sidebarPrimary          → "--sidebar-primary",
  sidebarPrimaryForeground→ "--sidebar-primary-foreground",
  sidebarAccent           → "--sidebar-accent",
  sidebarAccentForeground → "--sidebar-accent-foreground",
  sidebarBorder           → "--sidebar-border",
  sidebarRing             → "--sidebar-ring",
  chart1..chart5          → "--chart-1".."--chart-5",
  highlightMatch          → "--highlight-match",
  highlightActive         → "--highlight-active",
  highlight               → "--highlight",
  highlightForeground     → "--highlight-foreground",
}
```

`applyUIColors(colors)` writes each to `document.documentElement.style.setProperty(cssVar, value)`. `updateThemeClass("dark"|"light")` adds `.dark`/`.light` to `<html>`.

## Appendix B — Key Files Index

```
CONFIG + TOKENS
  apps/desktop/src/renderer/globals.css              (line 17-58 dark fallback, 61-100 light, 102-143 @theme inline, 218-261 scrollbar, 263-270 drag, 272-288 highlights)
  packages/ui/src/globals.css                        (line 44-77 :root, 79-111 .dark, 113-119 base)
  apps/desktop/src/renderer/styles/bundled-fonts.css (line 10-37 SF Mono @font-face)
  apps/desktop/src/shared/themes/built-in/ember.ts    (line 14-76 dark UIColors, 78-104 terminal, 106-110 editor)
  apps/desktop/src/shared/themes/built-in/light.ts    (line 13-56 light UIColors, 58-84 terminal)
  apps/desktop/src/shared/themes/built-in/monokai.ts  (line 14-57 monokai UIColors, 59-85 terminal)
  apps/desktop/src/renderer/stores/theme/store.ts    (line 153-419)
  apps/desktop/src/renderer/stores/theme/utils/css-variables.ts

GEOMETRY
  packages/ui/src/components/ui/button.tsx
  packages/ui/src/components/ui/input.tsx
  packages/ui/src/components/ui/badge.tsx
  packages/ui/src/components/ui/table.tsx
  packages/ui/src/components/ui/dialog.tsx
  packages/ui/src/components/ui/dropdown-menu.tsx
  packages/ui/src/components/ui/sidebar.tsx
  packages/ui/src/components/ui/sheet.tsx
  packages/ui/src/components/ui/popover.tsx
  packages/ui/src/components/ui/hover-card.tsx
  packages/ui/src/components/ui/tooltip.tsx
  packages/ui/src/components/ui/tabs.tsx
  packages/ui/src/components/ui/separator.tsx
  packages/ui/src/components/ui/scroll-area.tsx
  packages/ui/src/components/ui/avatar.tsx

LAYOUT
  apps/desktop/src/renderer/routes/_authenticated/layout.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/layout.tsx
  apps/desktop/src/renderer/screens/main/components/WorkspaceView/WorkspaceLayout/WorkspaceLayout.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/TopBar/TopBar.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/NavigationControls/NavigationControls.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/SidebarToggle/SidebarToggle.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/DashboardSidebar.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarHeader/DashboardSidebarHeader.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarWorkspaceItem/DashboardSidebarWorkspaceItem.tsx
  apps/desktop/src/renderer/routes/_authenticated/_dashboard/components/DashboardSidebar/components/DashboardSidebarWorkspaceItem/components/DashboardSidebarExpandedWorkspaceRow/DashboardSidebarExpandedWorkspaceRow.tsx
  apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/WorkspaceSidebar.tsx
  apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/WorkspaceSidebarHeader/WorkspaceSidebarHeader.tsx
  apps/desktop/src/renderer/screens/main/components/WorkspaceView/RightSidebar/ChangesView/components/FileItem/FileItem.tsx

STATE
  apps/desktop/src/renderer/stores/sidebar-state.ts          (right sidebar 250/200/500)
  apps/desktop/src/renderer/stores/workspace-sidebar-state.ts (workspace sidebar 280/52/220/400, collapse threshold 120)
  apps/desktop/src/renderer/screens/main/components/WorkspaceSidebar/constants.ts (STROKE_WIDTH 1.5 / 2 / 1)
```
