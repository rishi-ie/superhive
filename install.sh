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

**One-time setup (Gatekeeper):**
1. Launch ${APP_NAME} from /Applications.
2. macOS will show: "Apple could not verify ${APP_NAME} is free of malware."
3. Click OK.
4. Open System Settings -> Privacy & Security.
5. Scroll to the Security section at the bottom.
6. Click "Open Anyway" next to "${APP_NAME} was blocked to protect your Mac".
7. Click "Open" to confirm.
8. ${APP_NAME} launches. Subsequent launches are instant.

You only do this once per major version.

EOF
