# Superhive

Desktop app for running AI agents and projects locally. Built on Electron + React + Vite + Tailwind v4.

> **Beta status (v0.1.8).** Expect rough edges.
>
> **Do not install v0.1.0 or v0.1.1** — those artifacts trigger an unrecoverable Gatekeeper "damaged and cannot be opened" error on macOS. v0.1.2 fixes this. Always use the [latest release](../../releases).

---

## Install (macOS)

### Option 1 — One-liner (recommended)

The ZIP is the same format auto-updater uses. Run this once:

```bash
curl -fsSL https://raw.githubusercontent.com/rishi-ie/superhive/main/install.sh | bash
```

This downloads the latest ZIP, extracts it, and moves `Superhive.app` into `/Applications`.

### Option 2 — Manual ZIP install

1. Download the latest ZIP from the [Releases](../../releases) page (`Superhive-X.Y.Z-arm64-mac.zip`).
2. Double-click the ZIP to extract it (Archive Utility).
3. Drag `Superhive.app` from the extracted folder into `/Applications`.
4. Launch Superhive from `/Applications`.

### First launch

Most installs launch with no prompt — the `install.sh` one-liner extracts via Terminal, so macOS skips the quarantine check and our ad-hoc signature satisfies Gatekeeper's signature verification.

If you downloaded the ZIP directly via browser and see **"Apple could not verify Superhive is free of malware"**:

1. Click **OK** on the popup.
2. Open **System Settings → Privacy & Security**.
3. Click **"Open Anyway"** (under *Superhive was blocked to protect your Mac*).
4. Click **"Open"** to confirm.

One-time, ~30 seconds. Subsequent launches are instant.

---

## Auto-update

Inside the app, a blue **"Update ready — vX.Y.Z"** banner appears in the left sidebar when a new version ships. Click it to install + restart. Update downloads are silent for patch releases; major version bumps may trigger the one-time "Open Anyway" flow above.

---

## For developers

### Prerequisites

- [Bun](https://bun.sh)
- Node 20 (only required by `electron-builder`; Bun handles everything else)

### Run locally

```bash
bun install
bun run electron:dev
```

### Build a local ZIP (unsigned)

```bash
bun run electron:build
```

Outputs to `release/`. The ZIP and DMG are both produced; the ZIP is what auto-updater ships and what `install.sh` downloads.

### Release flow

Push to `main` branch → CI builds the unsigned ZIP + DMG → uploads to GitHub Releases as `v{version}`. Daily work happens on `dev`. Bump version in [`package.json`](./package.json) (e.g. `0.1.6` → `0.1.7`) before merging `dev` → `main`.

---

## Code signing (deferred)

Superhive is currently **unsigned**. The "Open Anyway" prompt is Gatekeeper's standard check for apps without an Apple Developer ID signature. Eventually this may be replaced with proper signing + notarization, which removes the prompt entirely.

V0.x users will need to manually re-download when V1.0 (signed) ships — unsigned → signed updates are blocked by macOS Gatekeeper.
