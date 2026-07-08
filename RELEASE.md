# Superhive — Release & Distribution

Canonical reference for developing, versioning, publishing, and distributing Superhive.

---

## 1. TL;DR — Workflow Cheat Sheet

```bash
# 1. Bump 3 files (package.json + app-meta.ts + README.md) on dev
git switch dev
# edit files
git add -A && git commit -m "v0.1.X: <summary>" && git push origin dev
# → silent. No CI.

# 2. Merge dev → main to trigger release
git switch main
git merge dev --ff-only
git push origin main
# → CI runs (~5–7 min first build, ~2 min cached)

# 3. Watch CI
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

# 4. Verify artifacts
gh release view v0.1.X --json assets --jq '.[].assets[].name'
# expect: ZIP, DMG, latest-mac.yml, blockmaps
```

**Files to bump on every version change:**

| File | Field | Appears in |
|---|---|---|
| `package.json` | `"version"` | `Info.plist`, ZIP filename, `latest-mac.yml`, GitHub tag |
| `src/lib/app-meta.ts` | `APP_META.version` | Sidebar pill (`AppLayout.tsx:124`) |
| `README.md` | `> **Beta status (vX.Y.Z).**` | Top-of-file status banner (line 5) |

---

## 2. Local Development

```bash
bun install                    # install all deps (Bun only — NOT npm ci)
bun run dev                    # Vite HMR, renderer only
bun run electron:dev           # Full Electron app + Vite HMR
bun run typecheck              # TypeScript check only
bun run build                  # Typecheck + Vite production build
bun run electron:build         # Full package → release/
bun run electron:preview       # Build + launch against dist/
```

Dev-only utilities: `bun run reset` | `wipe:agents` | `migrate:keys` | `install:pi`

**Artifact output (`release/`):**

```
Superhive-X.Y.Z-arm64-mac.zip      ← primary; auto-updater path
Superhive-X.Y.Z-arm64.dmg
latest-mac.yml                     ← electron-updater feed
*.blockmap                          ← delta update metadata
```

---

## 3. Version Management

**Schema:** semver. Stay in `0.x.y` until data layer + IPC API are stable.

| Increment | When |
|---|---|
| `MAJOR` | Breaking storage schema, IPC contract, or flow API |
| `MINOR` | New features, flows, UI sections |
| `PATCH` | Bug fixes, docs, wording |

**Bump order:** edit all three files → commit → push. CI auto-publishes
`v{version}` from `package.json`. Do not create tags manually.

**Marketing vs. build version:** currently coupled (`'0.1.4'` in both
`package.json` and `app-meta.ts`). Decoupling deferred until a future 1.x
marketing push.

---

## 4. CI/CD Pipeline

**File:** `.github/workflows/release.yml`
**Triggers:**
- **Push to `main` branch** — main release pipeline; publishes `v{version}` from `package.json`
- **Manual (`workflow_dispatch`)** — emergency or test release from GitHub Actions UI; optionally override version

**Runner:** `macos-latest` (macOS 14, Apple Silicon)

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g. 0.1.4). Defaults to package.json if empty.'
        required: false
        type: string
        default: ''

steps:
  - actions/checkout@v4
  - actions/setup-node@v4 (node-version: '20')
  - curl -fsSL https://bun.sh/install | bash
  - bun install
  - bun run build
  - bun x electron-builder --mac dmg zip --x64=false --publish never
  - Read version (uses workflow_dispatch input if provided, else package.json):
      if [[ -n "${{ inputs.version }}" ]]; then
        echo "VERSION=${{ inputs.version }}"
      else
        echo "VERSION=$(bun -e "require('./package.json').version")"
      fi
  - softprops/action-gh-release@v2
      tag_name: v${{ steps.version.outputs.VERSION }}
      files: release/*       # ZIP + DMG + latest-mac.yml + blockmaps
      generate_release_notes: false
```

**Run-time:** ~5–7 min cold, ~2 min with cache.

**Watch CI:**
```bash
gh run watch <id>              # live status
gh run view <id> --log-failed  # failed-step logs
```

### Two release types

**Merge to `main` (standard)**
Daily work happens on `dev`. When ready to ship, merge `dev` → `main` and push:

```bash
git switch dev && git pull
# edit package.json + app-meta.ts + README.md to bump version
git add -A && git commit -m "v0.1.X" && git push origin dev
git switch main
git merge dev --ff-only
git push origin main
# → release.yml runs → v0.1.X published → users see update pill
```

**Manual (`workflow_dispatch`)**
Emergency releases or testing without merging to `main`:

1. https://github.com/rishi-ie/superhive/actions/workflows/release.yml → **Run workflow**
2. Leave `version` empty (uses `package.json`) or enter a specific version
3. Click **Run workflow**

**Known CI annotations (ignore):**
- Node 20 deprecation on actions — runner ships Node 24; still works.
- macOS 26 runner migration notice — no action needed.

**electron-updater requirement:** `package.json` must have `repository` field:
```json
"repository": { "type": "git", "url": "https://github.com/rishi-ie/superhive" }
```
Without this, `autoUpdater` cannot resolve the `latest-mac.yml` feed.

---

## 5. Release Notes & Changelog Policy

**No CHANGELOG.md.** GitHub Release body is the source of truth.

```bash
# Attach notes to a release
gh release edit v0.1.X --notes-file /tmp/notes.md

# Verify
gh release view v0.1.X --json body

# Other useful commands
gh release view v0.1.X              # print current body
gh release delete v0.1.X -y         # delete if needed
gh release upload v0.1.X path        # upload missing artifact
```

**Recommended body sections:** Install (one-liner + manual ZIP) / First launch
(Gatekeeper conditional) / Auto-update / What's new / Source code (5 links).
Empty body is acceptable for text-only patches — GitHub auto-shows
"Source code (zip/tar.gz)" in the right sidebar from the tag.

**Backfilling:** `gh release edit v0.1.2 --notes-file notes-v0.1.2.md`

---

## 6. Install Pipeline (`install.sh`)

**File:** `/install.sh` at repo root
**URL:** `https://raw.githubusercontent.com/rishi-ie/superhive/main/install.sh`

```bash
curl -fsSL https://raw.githubusercontent.com/rishi-ie/superhive/main/install.sh | bash
```

**What it does:**
1. Resolve latest tag via GitHub's `/releases/latest` 302-redirect.
2. Download `Superhive-{version}-arm64-mac.zip`.
3. `unzip` to temp dir.
4. `mv Superhive.app → /Applications` (replacing any existing).
5. Print launch instructions.

**Why ZIP is primary:**
- `electron-updater` downloads ZIP (matches `latest-mac.yml#path:`).
- Terminal `unzip` does **not** set `com.apple.quarantine` xattr.
- No quarantine → Gatekeeper skips notarization check → only signature
  verification → ad-hoc signature passes → **no prompt**.
- Browser downloads **do** set quarantine → Gatekeeper prompts → "Open Anyway"
  recovery steps apply (see §8).

---

## 7. Auto-Update Pipeline

**Library:** `electron-updater@^6.6.2`

### electron/main.ts wiring

```typescript
if (app.isPackaged) {
  autoUpdater.autoDownload = true;
  autoUpdater.checkForUpdates().catch(log.error);
  setInterval(() => autoUpdater.checkForUpdates().catch(log.error), 3600000);
  autoUpdater.on('update-available', (info) => mainWindow.webContents.send('update-available', info));
  autoUpdater.on('update-downloaded', (info) => mainWindow.webContents.send('update-downloaded', info));
  autoUpdater.on('error', (err) => log.error('[auto-updater]', err));
}
```

### IPC contract

```typescript
// window.api.app
getVersion(): string
installUpdate(): void                   // → autoUpdater.quitAndInstall()
onUpdateAvailable(cb): Unsubscribe       // renderer listener
onUpdateDownloaded(cb): Unsubscribe
```

### Renderer side (flow-isolated)

```
src/flows/ui/install-update.ts        ← wraps window.api.app.installUpdate()
src/components/layout/left-sidebar/UpdateBanner.tsx
src/components/layout/left-sidebar/AppSidebar.tsx  ← mounts in SidebarFooter
```

**Banner:** `h-8 rounded-lg bg-sidebar-primary` (blue) + RefreshIcon +
`"Update ready — v{version}"` + `"Restart"` label. Persistent, no dismiss.
Click → `install-update.ts` → `quitAndInstall()`.

### Update feed (`latest-mac.yml`)

electron-builder generates this at the root of the artifact set:

```yaml
provider: github
owner: rishi-ie
repo: superhive
path: Superhive-0.1.4-arm64-mac.zip   # exact match to ZIP asset name
```

**Cross-signing caveat:** unsigned `0.x` → signed `1.0` updates are blocked
by Gatekeeper. v0.x users must manually re-download once when V1.0 ships.
One-time event, documented in V1.0 release notes.

---

## 8. Code Signing & Gatekeeper

### electron-builder.yml mac config

```yaml
mac:
  identity: null           # no Developer ID
  hardenedRuntime: false   # no hardened runtime enforcement
  gatekeeperAssess: false  # no notarization gate
```

### after-pack.cjs — ad-hoc re-sign during build

`build/after-pack.cjs` (CJS) runs after packaging. It re-signs the bundle
with ad-hoc signature so on-disk signature matches sealed resources:

```javascript
module.exports = async function afterPack(context) {
  if (context.platform !== 'darwin') return;
  if (process.env.CSC_LINK || process.env.CSC_KEY_PASSWORD) return; // future-proof
  require('child_process').execSync(
    `codesign --force --deep --sign - "${context.appPath}"`,
    { stdio: 'ignore' }
  );
};
```

### Gatekeeper's three check layers

| Check | Fires when | Blocks without |
|---|---|---|
| Notarization | `gatekeeperAssess: true` | Apple Developer ID + notarization ticket |
| Quarantine | `com.apple.quarantine` xattr present | None — but triggers notarization check |
| Signature verification | Always | Ad-hoc `sign -` satisfies this |

### Why Terminal installs skip the prompt

`install.sh` extracts via Terminal (`unzip`) → no `com.apple.quarantine` →
Gatekeeper runs only signature verification → `afterPack` ad-hoc signature
passes → app launches.

Browser-downloaded installs: quarantine xattr present → Gatekeeper runs
notarization check → unsigned → "Apple could not verify..." dialog.

### "Open Anyway" recovery (for browser-download installs)

1. Click **OK**.
2. **System Settings → Privacy & Security**.
3. Click **"Open Anyway"** (under *"Superhive was blocked..."*).
4. Click **"Open"**.

One-time per installed version.

### macOS 26 + provenance xattr

`com.apple.provenance` (empty value, visible in `xattr -l`) is set by the
software-update subsystem. It is **harmless** and does **not** trigger
Gatekeeper. Distinct from quarantine.

### Future: real signing ($99/yr Developer ID)

Unlocks: hardened runtime, notarization → no prompt from browser downloads,
seamless unsigned→signed update migration, `CSC_LINK`/`CSC_KEY_PASSWORD` env
vars in CI activate real signing automatically.

---

## 9. Pre-Release Verification

```bash
# Flow isolation — UI must NEVER import from @/api/*
rg "@/api" src/components src/pages
# must return ZERO results

# TypeScript
bun run typecheck        # silent pass

# Production build
bun run build            # dist/ + dist-electron/ populated

# After CI
gh release view v0.1.X --json assets --jq '.[].assets[].name'
# expect: ZIP, DMG, latest-mac.yml, blockmaps, builder-debug.yml

# Signature verification
codesign --verify --deep --strict /Applications/Superhive.app
# expect: "valid on disk" + "satisfies its Designated Requirement"
```

---

## 10. Recovery — Common Failures

| Symptom | Cause | Fix |
|---|---|---|
| "damaged and can't be opened" | Placeholder signature in bundle (pre-v0.1.2) | Ship v0.1.2+; locally: `codesign --force --deep --sign - /Applications/Superhive.app` |
| "404 Not Found" splash | `createBrowserRouter` in renderer (dev/Electron file:// URL) | Confirmed fixed: `createHashRouter` in `src/pages/routes.tsx` |
| CI green but no ZIP | Workflow used `release/*.dmg` glob | Use `release/*` glob; ZIP + DMG + `latest-mac.yml` all separate |
| `latest-mac.yml` missing | electron-builder didn't run packaging step | Confirm `bun x electron-builder` step ran; `--publish never` does NOT suppress sidecar |
| Sidebar pill wrong version | `src/lib/app-meta.ts` not bumped with `package.json` | Always bump both files in lockstep |
| Auto-update silently dead | `app.isPackaged` gate blocks in dev; missing `repository` field in `package.json`; `latest-mac.yml#path:` typo | Check `latest-mac.yml` path matches ZIP filename exactly (case-sensitive) |
| After-pack doesn't re-sign | `CSC_LINK`/`CSC_KEY_PASSWORD` env vars set (even empty) → skip fires | Use `CSC_IDENTITY_AUTO_DISCOVERY=false` (doesn't trigger skip); unset the vars |
