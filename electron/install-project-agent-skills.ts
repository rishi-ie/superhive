/**
 * Per-project-agent skill installer.
 *
 * Copies the 5 bundled SKILL.md files into the agent's skills folder
 * at create time:
 *
 *   <agentDir>/skills/<skill-name>/SKILL.md
 *
 * The 5 skill names live in `project-agent-defaults.json::base.skills`:
 *   - sidebar-reflect
 *   - plan
 *   - staff
 *   - self-config
 *   - ask-user
 *
 * Per-skill idempotency: if `<skill-name>/SKILL.md` already exists in
 * the agent's skills folder, we skip it. The user or the agent itself
 * may have edited it.
 *
 * Resolution order for the bundled source dir:
 *   1. `<resourcesPath>/skills/`  (production)
 *   2. `<SUPERHIVE_RESOURCES_PATH>/skills/`  (env override)
 *   3. `<cwd>/resources/skills/`  (dev, running from superhive/)
 *
 * Why per-agent (not per-user): SKILL.md content is identical across
 * project agents, but the agent runtime reads from its own skills
 * folder. Pi's skill loader scans `<agentDir>/skills/<name>/SKILL.md`
 * — the file must exist in the agent's own folder for the skill to
 * be discoverable.
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import log from 'electron-log/main'

export const SKILLS_DIR_NAME = 'skills'

export function resolveSkillsSourceDir(): string {
	const candidates: Array<{ path: string; source: string }> = []

	if (process.resourcesPath) {
		candidates.push({
			path: join(process.resourcesPath, SKILLS_DIR_NAME),
			source: `process.resourcesPath (${process.resourcesPath})`,
		})
	}

	if (process.env.SUPERHIVE_RESOURCES_PATH) {
		candidates.push({
			path: join(process.env.SUPERHIVE_RESOURCES_PATH, SKILLS_DIR_NAME),
			source: `SUPERHIVE_RESOURCES_PATH (${process.env.SUPERHIVE_RESOURCES_PATH})`,
		})
	}

	candidates.push({
		path: join(process.cwd(), 'resources', SKILLS_DIR_NAME),
		source: `cwd fallback (${process.cwd()}/resources/)`,
	})

	for (const candidate of candidates) {
		if (existsSync(candidate.path)) {
			return candidate.path
		}
	}

	throw new Error(
		`skills directory not found.\n` +
			`Checked:\n${candidates
				.map((c) => `  - ${c.source}: ${c.path}`)
				.join('\n')}\n` +
			`Ensure the app was built with extraResources including the resources/ folder.`,
	)
}

/**
 * Names of the 5 bundled skills shipped to every project agent. Kept
 * in sync with `project-agent-defaults.json::base.skills`.
 */
export const BUNDLED_SKILL_NAMES: readonly string[] = [
	'sidebar-reflect',
	'plan',
	'staff',
	'self-config',
	'ask-user',
]

export interface InstallProjectAgentSkillsResult {
	copied: string[]
	skipped: string[]
	sourceDir: string
	agentDir: string
}

/**
 * Ensure the 5 bundled SKILL.md files exist at
 * `<agentDir>/skills/<name>/SKILL.md`. Per-skill idempotency.
 *
 * Called from the `agents:create` IPC handler when
 * `agentKind === 'project-coordinator'`.
 */
export function installProjectAgentSkills(agentDir: string): InstallProjectAgentSkillsResult {
	const sourceDir = resolveSkillsSourceDir()
	const skillsRoot = join(agentDir, SKILLS_DIR_NAME)

	const copied: string[] = []
	const skipped: string[] = []

	for (const skillName of BUNDLED_SKILL_NAMES) {
		const sourceFile = join(sourceDir, skillName, 'SKILL.md')
		const targetDir = join(skillsRoot, skillName)
		const targetFile = join(targetDir, 'SKILL.md')

		if (!existsSync(sourceFile)) {
			log.warn(
				`[install-project-agent-skills] bundled SKILL.md missing for ${skillName} at ${sourceFile}`,
			)
			skipped.push(skillName)
			continue
		}

		if (existsSync(targetFile)) {
			skipped.push(skillName)
			continue
		}

		mkdirSync(targetDir, { recursive: true })
		copyFileSync(sourceFile, targetFile)
		copied.push(skillName)
	}

	// Sanity log if the bundled source dir exists but contains
	// unexpected skill folders. Helps catch bundle drift.
	if (existsSync(sourceDir)) {
		const bundled = readdirSync(sourceDir, { withFileTypes: true })
			.filter((d) => d.isDirectory())
			.map((d) => d.name)
		const extra = bundled.filter((name) => !BUNDLED_SKILL_NAMES.includes(name))
		if (extra.length > 0) {
			log.info(
				`[install-project-agent-skills] bundled source has ${extra.length} extra skill(s) not in BUNDLED_SKILL_NAMES: ${extra.join(', ')}`,
			)
		}
	}

	log.info(
		`[install-project-agent-skills] copied=${copied.length} skipped=${skipped.length} (${sourceDir} → ${skillsRoot})`,
	)

	return {
		copied,
		skipped,
		sourceDir,
		agentDir,
	}
}
