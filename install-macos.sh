#!/usr/bin/env bash
# Strip macOS quarantine attribute from Superhive.app after manual install.
# Use this if System Settings → "Open Anyway" isn't enough or you want zero prompts.

set -e

APP_PATH="/Applications/Superhive.app"

if [ ! -d "$APP_PATH" ]; then
	echo "Error: $APP_PATH not found. Did you drag Superhive to /Applications?"
	exit 1
fi

if xattr -dr com.apple.provenance "$APP_PATH" 2>/dev/null; then
	echo "Done. Launching Superhive…"
	open "$APP_PATH"
else
	echo "Quarantine attribute not present (already removed or never set). Launching Superhive…"
	open "$APP_PATH"
fi
