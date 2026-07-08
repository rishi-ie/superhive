# Superhive

Desktop app for running AI agents and projects locally. Built on Electron + React + Vite + Tailwind v4.

> **Beta status (v0.1.2).** Expect rough edges.
>
> **Do not install v0.1.0 or v0.1.1** — those DMGs trigger an unrecoverable Gatekeeper "damaged and cannot be opened" error on macOS. v0.1.2 fixes this. Always use the [latest release](../../releases).

---

## Install (macOS)

1. Download the latest **DMG** from the [Releases](../../releases) page (`Superhive-X.Y.Z-arm64.dmg`).
2. Open the `.dmg` → drag **Superhive** into **/Applications**.
3. Launch Superhive from `/Applications**.

### First launch — "Apple could not verify Superhive is free of malware"

This is **Gatekeeper** blocking the unsigned app. It's recoverable — it's not actually broken or dangerous. One-time setup, ~30 seconds:

1. Click **OK** on the popup.
2. Open **System Settings → Privacy & Security**.
3. Scroll to the **Security** section at the bottom.
4. You'll see: *"Superhive was blocked to protect your Mac."*
5. Click **"Open Anyway"**.
6. Click **"Open"** in the next dialog.
7. Superhive launches.

You only do this **once per major version**. Subsequent launches are instant.

---

## Auto-update

Superhive auto-checks for updates every hour while running. When an update is ready, a blue **"Update ready — vX.Y.Z"** banner appears in the left sidebar, directly above Settings. Click it to install + restart.

Updates are silent for **patch releases** (e.g. `0.1.2` → `0.1.3`). Major version bumps may require the one-time "Open Anyway" click described above.

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

### Build a local DMG (unsigned)

```bash
bun run electron:build
```

Outputs to `release/`. The DMG and ZIP are unsigned — install locally with the System Settings → "Open Anyway" flow above.

### Release flow

Push to `main` → CI builds the unsigned DMG/ZIP → uploads to GitHub Releases as `v{version}`.

Bump version in [`package.json`](./package.json) (e.g. `0.1.2` → `0.1.3`) before pushing.

---

## Code signing (deferred)

Superhive is currently **unsigned**. The "Open Anyway" prompt is Gatekeeper's standard check for apps without an Apple Developer ID signature. Eventually this may be replaced with proper signing + notarization, which removes the prompt entirely.

V0.x users will need to manually re-download when V1.0 (signed) ships — unsigned → signed updates are blocked by macOS Gatekeeper.

