# Styling

## The Single Source of Truth

**All visual style of the Superhive app lives in `src/styles/presets/radix-mira.css`.**

That file owns:

- **Colors** — every `--background`, `--primary`, `--surface-*`, `--success` / `--warning` / `--info` token
- **Radius** — `--radius`, `--radius-button`, `--radius-input`, `--radius-card`, `--radius-popover`
- **Spacing** — 10+ semantic spacing tokens (`--spacing-card`, `--spacing-row`, `--spacing-stack`, etc.)
- **Heights** — 3 control heights (`--height-control-sm/md/lg`)
- **Fonts** — `--font-geist`, `--font-sans`
- **Animations** — `@keyframes animate-in` and the utility classes that drive it
- **Dark mode** — `:root` (light) and `.dark` blocks

Everything else in the codebase references these tokens. When you change a token value here and rerun `bun dev`, the change propagates throughout the app.

## How Tokens Become Tailwind Utilities

Inside the preset, tokens are mapped to Tailwind utilities via `@theme inline`:

```css
@theme inline {
  --color-success: var(--success);
  --spacing-stack: var(--spacing-stack);
  --radius-card: var(--radius-card);
  --height-control-md: var(--height-control-md);
}
```

This produces Tailwind classes like:

| Token | Example Tailwind utility |
|---|---|
| `--color-success` | `bg-success`, `text-success-foreground` |
| `--spacing-stack` | `gap-stack`, `p-stack`, `px-stack` |
| `--radius-card` | `rounded-card`, `rounded-tl-card` |
| `--height-control-md` | `h-control-md` |

`tailwind-merge`'s `cn()` (see `src/lib/utils.ts`) handles deduping.

## What Lives Where

```
src/styles/
├── globals.css                 # Imports only — never edit
├── base.css                    # App-only concerns (#root, scrollbars, drag, font scale)
└── presets/
    └── radix-mira.css          # The actual preset — edit this
```

### `globals.css` — never edit directly

```css
@import "./presets/radix-mira.css";
@import "./base.css";
```

To re-skin the app: edit the preset path here *and* the preset file itself. To swap to a different preset, drop in a new file at `src/styles/presets/<name>.css` and update the import.

### `base.css` — app-only concerns

This file holds structural rules that aren't visual style:

- `#root { width: 100vw; height: 100vh }`
- App-level scrollbar styling
- `.drag` / `.no-drag` (Electron drag regions)
- `:root[data-font-scale]` font scale selector
- `[data-reduce-motion]` accessibility toggle
- `.no-scrollbar` utility

These reference preset variables where colors are needed (e.g., scrollbar uses `var(--border)` indirectly via `--border`).

### `presets/radix-mira.css` — edit this

This is where all visual decisions live. Two blocks own everything:

1. `:root` (light) and `.dark` (dark mode) blocks define token values.
2. `@theme inline` registers those tokens as Tailwind utilities.

## Token Reference

### Color tokens

| Token | Used by | Typical role |
|---|---|---|
| `--background`, `--foreground` | Page bg + text | App-wide |
| `--card`, `--card-foreground` | Card surfaces | Panels, dialogs |
| `--popover`, `--popover-foreground` | Floating surfaces | Tooltips, dropdowns |
| `--primary`, `--primary-foreground` | Primary actions | Buttons, links |
| `--secondary`, `--secondary-foreground` | Secondary actions | |
| `--muted`, `--muted-foreground` | Disabled / non-emphasized | |
| `--accent`, `--accent-foreground` | Hover/active states | |
| `--destructive`, `--destructive-foreground` | Danger actions | Delete buttons |
| `--border`, `--input`, `--ring` | Form structure | |
| `--sidebar-*` | Sidebar surfaces | |
| `--success`, `--success-foreground` | Status — running | Dots, badges |
| `--warning`, `--warning-foreground` | Status — initializing | |
| `--info`, `--info-foreground` | Status — busy | |
| `--surface-composer`, `--surface-composer-foreground`, `--surface-composer-muted`, `--surface-composer-placeholder` | Always-dark composer surface (chat composers) | |
| `--surface-control`, `--surface-control-hover`, `--surface-control-disabled` | Buttons on composer surface | |
| `--border-inverse` | Always-dark divider (used by PanelHeader) | |

### Spacing tokens

| Token | Value | Used for |
|---|---|---|
| `--spacing-card` | `1.5rem` | CardHeader, CardContent padding |
| `--spacing-row` | `0.5rem` | Horizontal rows, button padding |
| `--spacing-panel` | `0.75rem` | Panel/section padding |
| `--spacing-composer` | `1rem` | Chat composers, large inputs |
| `--spacing-button-x` | `1rem` | Button horizontal |
| `--spacing-button-y` | `0.5rem` | Button vertical |
| `--spacing-control-x` | `0.5rem` | Inputs/selects horizontal |
| `--spacing-control-y` | `0.375rem` | Inputs/selects vertical |
| `--spacing-list-item` | `0.375rem` | Sidebar/menu items |
| `--spacing-stack` | `0.5rem` | Default gap between siblings |
| `--spacing-gap-tight` | `0.25rem` | Tight gap |
| `--spacing-gap-loose` | `0.75rem` | Loose gap |

Tailwind utilities: `p-card`, `gap-stack`, `px-button-x`, etc.

### Radius tokens

| Token | Tailwind equivalent |
|---|---|
| `--radius-button` | `rounded-button` |
| `--radius-input` | `rounded-input` |
| `--radius-card` | `rounded-card` |
| `--radius-popover` | `rounded-popover` |

The existing `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` (from `--radius`) remain for primitives that the shadcn CLI regenerates wholesale.

### Control heights

| Token | Tailwind equivalent |
|---|---|
| `--height-control-sm` | `h-control-sm` (1.5rem) |
| `--height-control-md` | `h-control-md` (2.25rem) |
| `--height-control-lg` | `h-control-lg` (2.5rem) |

## Hardcoded Values That Stay Hardcoded

These are **layout mechanics**, not style. They are NOT swapped on preset change.

| Pattern | Why it's hardcoded |
|---|---|
| `flex`, `grid`, `flex-col`, `flex-row` | Layout orientation |
| `absolute`, `relative` | Positioning |
| `w-full`, `w-1/2`, `w-screen`, `h-screen` | Responsive proportions |
| `flex-1`, `shrink-0`, `grow` | Flex behavior |
| `overflow-hidden`, `pointer-events-none` | Mechanics |
| `min-h-0`, `max-w-*` (most) | Responsive bounds |
| `pt-3 pb-2` etc. asymmetric paddings inside composers | Artisan composer spacing |
| `-space-x-2` in `AvatarGroup` | Negative spacing for overlapping avatars (shadcn primitive) |

If you find yourself wanting to swap a hardcoded value across the whole app on preset change, **add a token to the preset**, don't hardcode the value in component code.

## Adding a New Token

1. Add the value to `:root` (and `.dark` if it should differ):

   ```css
   :root {
     --my-token: oklch(0.5 0 0);
   }
   ```

2. Register it in `@theme inline`:

   ```css
   @theme inline {
     --color-my-token: var(--my-token);
   }
   ```

3. Use it as the appropriate Tailwind utility: `bg-my-token`, `text-my-token`, `p-my-token`, etc.

## Swapping the Preset

```bash
# 1. Create a new preset file
$EDITOR src/styles/presets/my-new-preset.css

# 2. Update the import in globals.css
#    (old: @import "./presets/radix-mira.css";)
#    (new: @import "./presets/my-new-preset.css";)

# 3. Restart dev server
bun dev
```

For wholesale replacement using the shadcn CLI:

```bash
bunx shadcn@latest apply --preset <name>
```

This regenerates `src/components/ui/*` (the shadcn primitives) from the named preset recipe. The app-layer code (`src/components/layout/**`, `src/pages/**`) is untouched — it uses semantic tokens that re-skin automatically.
