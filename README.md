# Superhive

Superhive is a local-first desktop workspace for running AI agents and coordinating projects. It is built with Electron, React, Vite, Tailwind, and the Pi runtime.

The supported developer workflow is the same on Windows, macOS, and Linux:

```text
install prerequisites → bun install → bun run dev
```

On the first project or agent creation, Superhive prepares its pinned Pi runtime and extensions in `~/.superhive/runtime/`. A normal Superhive-only clone therefore works without manually cloning or staging runtime repositories. Later starts reuse that cache. `bun run setup` remains the explicit command for preparing the `.runtime/` bundle used by release packaging.

## Prerequisites

### All platforms

- Git 2.40 or newer
- Bun 1.3 or newer
- Node.js 22.19 or newer (the Pi runtime uses Node)
- Network access for the initial `bun install` and first project/agent creation
- A provider API key only when sending a live request to a provider; the app, setup, and automated tests start without credentials

Check the installed versions before setup:

```bash
git --version
bun --version
node --version
```

The Superhive checkout can be developed beside canonical runtime repositories: `../general-kai` and `../superhive-pi-*`. First-use provisioning copies and builds from those sibling sources when present, otherwise it clones their pinned Git refs into the per-user runtime. Set `SUPERHIVE_GENERAL_KAI_PATH` or `SUPERHIVE_PI_*_PATH` to use a specific live source. `bun run setup` stages pinned, compiled output into ignored `.runtime/` for bundle validation and packaging; packaged apps resolve only bundled `resources/runtime` assets.

### Windows 10/11

Install:

1. [Git for Windows](https://git-scm.com/download/win)
2. [Node.js LTS](https://nodejs.org/)
3. Bun from PowerShell:

   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

4. Visual Studio Build Tools with **Desktop development with C++** if Electron reports a native-module rebuild error.

Windows Developer Mode is not required. Superhive copies agent extensions instead of requiring directory symlinks.

Use PowerShell for development:

```powershell
git clone https://github.com/rishi-ie/superhive.git
Set-Location superhive
bun install
bun run setup
bun run dev
```

Run the Windows checks and remove generated build/runtime output with PowerShell:

```powershell
bun run typecheck
bun test
bun run build
Remove-Item -Recurse -Force .runtime, dist, dist-electron, release -ErrorAction SilentlyContinue
```

### macOS 12+

Install Xcode Command Line Tools:

```bash
xcode-select --install
```

Then install Git, Node.js LTS, and Bun. Apple Silicon developers should use the arm64 toolchain. Install Rosetta 2 only if a separate Intel-only native dependency requires it:

```bash
softwareupdate --install-rosetta --agree-to-license
```

Development:

```bash
git clone https://github.com/rishi-ie/superhive.git
cd superhive
bun install
bun run setup
bun run dev
```

Package for each Apple architecture on the matching macOS runner:

```bash
bun x electron-builder --config electron-builder.yml --mac --arm64 --publish never
bun x electron-builder --config electron-builder.yml --mac --x64 --publish never
```

### Ubuntu/Debian Linux

Install Git, Node.js LTS, and Bun, then install Electron's runtime libraries:

```bash
sudo apt-get update
sudo apt-get install \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libxtst6 \
  xdg-utils \
  libatspi2.0-0 \
  libdrm2 \
  libgbm1 \
  libasound2
```

For native-module rebuilds and packaging, also install:

```bash
sudo apt-get install build-essential
```

On Wayland, run with a desktop session that supports Electron. Headless CI needs an X server such as Xvfb for GUI smoke tests.

For headless Linux GUI checks, install Xvfb and run the dev process under it:

```bash
sudo apt-get install xvfb
xvfb-run -a bun run dev
```

Development:

```bash
git clone https://github.com/rishi-ie/superhive.git
cd superhive
bun install
bun run setup
bun run dev
```

## Development commands

Run these from the `superhive/` directory:

```bash
bun install                 # install app dependencies
bun run dev                 # start Vite and Electron together
bun run setup               # prepare the release bundle in .runtime/
bun run typecheck           # TypeScript validation
bun test                    # app-level tests
bun run build               # production renderer/main build
bun run electron:build      # setup, build, and package for the current OS
bun run electron:preview    # preview the production build in Electron
```

First project/agent creation may take several minutes because it installs and builds the Pi workspace once. The result is cached in `~/.superhive/runtime/`; individual agents reuse it immediately. `bun run setup` performs the same work into `.runtime/` only for release packaging.

To use a local checkout of `general-kai` or an extension repository during development, set the corresponding environment override before setup. For example, in PowerShell:

```powershell
$env:SUPERHIVE_GENERAL_KAI_PATH = "C:\src\general-kai"
$env:SUPERHIVE_PI_PLAN_PATH = "C:\src\superhive-pi-plan"
bun run setup
```

On macOS/Linux:

```bash
export SUPERHIVE_GENERAL_KAI_PATH=/path/to/general-kai
export SUPERHIVE_PI_PLAN_PATH=/path/to/superhive-pi-plan
bun run setup
```

## Credentials

Copy `.env.example` to `.env.local` only when testing a live provider request:

```bash
cp .env.example .env.local
```

Never commit `.env.local`, agent settings, or provider keys. Superhive can start, create projects, create agents, and run tests without credentials. Configure a provider and key before asking an agent to call an external model.

## Repository structure

- `src/` — React renderer, flows, models, storage, and UI components
- `electron/` — Electron main process, IPC, runtime lifecycle, watchers, persistence, and packaging integration
- `resources/` — templates, marketplace packages, skills, and default profiles
- `runtime/` — portable agent launchers for POSIX, CMD, and PowerShell
- `~/.superhive/runtime/` — generated per-user Pi runtime and extension cache
- `.runtime/` — generated release-bundle staging area
- `../general-kai/` — canonical Pi runtime source when checked out beside Superhive
- `../superhive-pi-*` — canonical extension repositories when checked out beside Superhive

The runtime contract is filesystem-based: Superhive seeds an agent folder, copies the selected extensions and launchers into it, then starts the Pi launcher. Development uses the prepared per-user runtime, built from sibling sources or pinned clones on first use. Packaged apps use their bundled Electron executable in Node mode and never reach back to GitHub or a developer checkout.

## Troubleshooting

### `bun run setup` says Node is too old

Install Node.js 22.19 or newer, open a new terminal, and confirm with `node --version`.

### Setup cannot clone a pinned source

Confirm Git and network access. You can also provide a local source path with `SUPERHIVE_GENERAL_KAI_PATH` or an extension-specific `SUPERHIVE_PI_*_PATH` override.

### Electron fails to start on Linux

Install the Electron libraries listed in the Linux section. For headless environments, run the GUI smoke test under Xvfb.

### An agent says the Pi runtime is missing

Create or start an agent while online and Superhive will prepare the runtime. For a release bundle, run:

```bash
bun run setup
```

Then restart the app. Do not install dependencies inside the agent directory.

## Packaging

`electron-builder.yml` is the single packaging configuration. It produces:

- macOS DMG and ZIP for the current architecture
- Windows NSIS installer and portable build
- Linux AppImage and deb packages

Build on the target operating system:

```bash
bun run electron:build
```

The output is written to `release/`. Signing and notarization are release concerns and are not required for local development.
