# Superhive

Desktop app for running AI agents and projects locally. Built on Electron + React + Vite + Tailwind v4.

> **Beta status (v0.1.2).** Expect rough edges.
>
> **Do not install v0.1.0 or v0.1.1** — those DMGs trigger an unrecoverable Gatekeeper "damaged and cannot be opened" error on macOS. v0.1.2 fixes this by re-signing the bundle ad-hoc during the build. Always use the [latest release](../../releases).

---

## Install (macOS)

1. Download the latest **DMG** from the [Releases](../../releases) page.
2. Open the `.dmg` and drag **Superhive** into **/Applications**.
3. Launch Superhive from `/Applications`.

> **First launch:** macOS will show *"Superhive is from an unidentified developer."*
> This is expected — Superhive is currently unsigned.
>
> **To allow it:** go to **System Settings → Privacy & Security**, scroll down, and click **"Open Anyway"**.
>
> **Power-user shortcut:** instead of the click-through, run this once from the project root:
> ```bash
> ./install-macos.sh
> ```
> It strips the quarantine attribute from `/Applications/Superhive.app` so Superhive launches with no prompt.

You only need to do this **once per major version**.

---

## Auto-update

Superhive auto-checks for updates every hour while running. When an update is ready, a blue **"Update ready — vX.Y.Z"** banner appears in the left sidebar, directly above Settings. Click it to install + restart.

Updates are silent for **patch releases** (e.g. `0.1.1` → `0.1.2`). Major version bumps may require the one-time "Open Anyway" click described above.

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

Outputs to `release/`. The DMG and ZIP are unsigned — install locally with the **`install-macos.sh`** bypass described above.

### Release flow

Push to `main` → CI builds the unsigned DMG/ZIP → uploads to GitHub Releases as `v{version}`.

Bump version in [`package.json`](./package.json) (e.g. `0.1.1` → `0.1.2`) before pushing.

---

## Code signing (deferred)

Superhive is currently **unsigned**. Future versions may add Apple Developer ID signing + notarization to remove the first-launch prompt. Until then, the install instructions above apply.

V0.x users will need to manually re-download when V1.0 (signed) ships — unsigned → signed updates are blocked by macOS Gatekeeper.
