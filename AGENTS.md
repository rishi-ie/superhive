# Superhive — Electron + React Desktop App

## Dev commands

```sh
bun run dev          # Start Vite dev server + Electron (hot reload)
bun run electron:dev # Alias for dev
bun run build        # TypeScript compile + Vite production build
bun run electron:build # build + electron-builder (produces dmg/zip in release/)
bun run electron:preview # vite build + launch electron with production build
```

## Architecture

- **Electron main process**: `electron/main.ts` → compiled to `dist-electron/main.js`
- **Preload**: `electron/preload.ts` → compiled to `dist-electron/preload.js`
- **Renderer**: React app in `src/`, entry `src/main.tsx`, served from `dist/`
- `vite-plugin-electron` handles compiling + watching electron main/preload separately from the renderer
- `VITE_DEV_SERVER_URL` env var tells electron where to load the dev server

## Key configs

- `vite.config.ts`: Vite + React + electron plugins; `@` alias maps to `src/`
- `tsconfig.json`: ESNext, bun types, bundler module resolution
- `tailwind.config.js`: v4 (uses `@tailwindcss/postcss` plugin, not the legacy setup)
- `postcss.config.js`: `@tailwindcss/postcss` + autoprefixer
- `electron-builder.yml`: builds for mac (dmg/zip), win (nsis/portable), linux (AppImage/deb)

## Common mistakes

- Do NOT use `bun run index.ts` — this is an Electron app, not a Bun HTTP server. Use `bun run dev`.
- The `vite-plugin-electron` dev server is NOT `Bun.serve`. Do NOT apply CLAUDE.md's `Bun.serve()` patterns here.
- Do NOT use `better-sqlite3`, `ioredis`, `express`, or `ws` — Bun-native libs don't work in standard Electron main process without native rebuilds.
- electron-log is used for logging in the main process, not `console.log`.

## Dependencies

- `electron-log` for main process logging (initialized in `electron/main.ts`)
- `vite-plugin-electron` + `vite-plugin-electron-renderer` for build
- `@tailwindcss/postcss` (Tailwind v4) for CSS
