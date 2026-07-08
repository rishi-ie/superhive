// @ts-check
const { execSync } = require('node:child_process');
const path = require('node:path');

/**
 * Re-sign the macOS .app bundle ad-hoc after electron-builder finishes
 * packaging. Fixes the Gatekeeper "modified or damaged" false-positive that
 * occurs when an unsigned bundle's linker-baked signature references sealed
 * resources that don't match the final on-disk bundle layout.
 *
 * Replacing the signature with `codesign --force --deep --sign -` rewrites it
 * against the actual bundle contents and sets Sealed Resources=none, which
 * allows Gatekeeper to surface the standard "unidentified developer" prompt
 * (recoverable via System Settings → Privacy & Security → "Open Anywhere")
 * instead of the unrecoverable "is damaged" trap.
 *
 * Auto-skips when real Apple code-signing is configured in the future so we
 * never double-sign the bundle.
 */
module.exports = async (context) => {
	if (context.electronPlatformName !== 'darwin') return;

	if (process.env.CSC_LINK || process.env.CSC_KEY_PASSWORD) {
		console.log('[after-pack] real signing identity detected, skipping ad-hoc re-sign');
		return;
	}

	const appName = `${context.packager.appInfo.productFilename}.app`;
	const appPath = path.join(context.appOutDir, appName);
	console.log(`[after-pack] re-signing ${appPath} ad-hoc`);
	execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
};
