#!/usr/bin/env bash
set -euo pipefail

REPO="rishi-ie/superhive"
APP_NAME="Superhive"
APP_PATH="/Applications/${APP_NAME}.app"
TMP_DIR="$(mktemp -d)"

# Resolve the latest release tag by following GitHub's /releases/latest redirect
LATEST_URL=$(curl -fsSL -o /dev/null -w "%{url_effective}" \
	"https://github.com/${REPO}/releases/latest")
TAG=$(echo "$LATEST_URL" | sed 's|.*tag/||')
VERSION="${TAG#v}"
ZIP_URL="https://github.com/${REPO}/releases/download/${TAG}/Superhive-${VERSION}-arm64-mac.zip"

echo "Downloading ${APP_NAME} v${VERSION}..."
curl -fL --retry 3 -o "${TMP_DIR}/superhive.zip" "${ZIP_URL}"

echo "Extracting..."
unzip -q -o "${TMP_DIR}/superhive.zip" -d "${TMP_DIR}/extracted"

echo "Installing to ${APP_PATH}..."
rm -rf "${APP_PATH}"
mv "${TMP_DIR}/extracted/${APP_NAME}.app" "${APP_PATH}"

echo "Cleaning up..."
rm -rf "${TMP_DIR}"

cat << EOF

${APP_NAME} v${VERSION} is now installed at ${APP_PATH}.

**Launch:** open ${APP_NAME} from /Applications.

**Gatekeeper prompt (only if you downloaded via browser, not via this installer):**
If macOS shows "Apple could not verify ${APP_NAME} is free of malware":
  1. Click OK.
  2. System Settings -> Privacy & Security.
  3. Click "Open Anyway" -> "Open".

This installer extracted the ZIP via Terminal, so macOS skipped the quarantine
check and you should see no prompt. If you do see one, the steps above recover it
in under a minute. No setup needed after that.

EOF
