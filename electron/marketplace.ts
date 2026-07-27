import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { app } from 'electron'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import type { MarketplaceActivationResult, MarketplaceCatalogItem, MarketplaceItem, InstalledMarketplaceItem } from '../src/models/marketplace'
import { runtime } from './general-kai-runtime'
import { copyTree } from './agent-assets'

type CatalogFile = { version: number; items: MarketplaceCatalogItem[] }
type Registry = { version: 1; items: Record<string, InstalledMarketplaceItem> }

const PACKAGE_ID = /^[a-z0-9][a-z0-9-]*$/
const root = () => join(homedir(), '.superhive', 'marketplace')
const registryPath = () => join(root(), 'installed.json')

function bundledRoot(): string {
	const candidates = [
		join(process.resourcesPath, 'marketplace'),
		join(app.getAppPath(), 'resources', 'marketplace'),
		join(process.cwd(), 'resources', 'marketplace'),
	]
	const found = candidates.find((candidate) => existsSync(join(candidate, 'catalog.json')))
	if (!found) throw new Error('Bundled marketplace catalog is unavailable')
	return found
}

function readJson(path: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
	} catch { return {} }
}

function writeJsonAtomic(path: string, value: unknown): void {
	mkdirSync(resolve(path, '..'), { recursive: true })
	const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
	writeFileSync(temporary, JSON.stringify(value, null, '\t') + '\n', 'utf8')
	renameSync(temporary, path)
}

function sha256(path: string): string {
	return `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`
}

function assertCatalogItem(item: MarketplaceCatalogItem): void {
	if (!PACKAGE_ID.test(item.id)) throw new Error(`Invalid marketplace package id: ${item.id}`)
	if (!['skill', 'plugin', 'mcp-adapter'].includes(item.kind)) throw new Error(`Invalid marketplace package kind: ${item.id}`)
	if (!item.version || !item.label || !item.source || item.activation !== 'restart-required') throw new Error(`Incomplete marketplace package: ${item.id}`)
	if (basename(item.source.entry) !== item.source.entry || !item.source.integrity.startsWith('sha256-')) throw new Error(`Invalid marketplace source: ${item.id}`)
	if ((item.kind === 'skill' && item.source.entry !== 'SKILL.md') || (item.kind !== 'skill' && item.source.entry !== 'index.ts')) throw new Error(`Invalid marketplace package layout: ${item.id}`)
}

function catalog(): MarketplaceCatalogItem[] {
	const parsed = JSON.parse(readFileSync(join(bundledRoot(), 'catalog.json'), 'utf8')) as CatalogFile
	if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error('Unsupported marketplace catalog')
	for (const item of parsed.items) assertCatalogItem(item)
	return parsed.items
}

function readRegistry(): Registry {
	const parsed = readJson(registryPath())
	return parsed.version === 1 && parsed.items && typeof parsed.items === 'object'
		? { version: 1, items: parsed.items as Record<string, InstalledMarketplaceItem> }
		: { version: 1, items: {} }
}

function packageDir(item: MarketplaceCatalogItem): string { return join(root(), 'packages', item.id, item.version) }

function itemById(id: string): MarketplaceCatalogItem {
	const item = catalog().find((entry) => entry.id === id)
	if (!item) throw new Error(`Marketplace package not found: ${id}`)
	return item
}

export function listMarketplace(): MarketplaceItem[] {
	const installed = readRegistry().items
	return catalog().map((item) => ({ ...item, installed: installed[item.id] }))
}

export function getMarketplaceItem(id: string): MarketplaceItem | null {
	return listMarketplace().find((item) => item.id === id) ?? null
}

export function installMarketplaceItem(id: string): MarketplaceItem {
	const item = itemById(id)
	const registry = readRegistry()
	const destination = packageDir(item)
	const sourceRoot = bundledRoot()
	const source = resolve(sourceRoot, item.source.path)
	if (!source.startsWith(`${resolve(sourceRoot)}/`) || !existsSync(source)) throw new Error(`Invalid bundled source for ${id}`)
	const entry = join(source, item.source.entry)
	if (!existsSync(entry) || sha256(entry) !== item.source.integrity) throw new Error(`Integrity check failed for ${id}`)
	if (!existsSync(destination)) {
		mkdirSync(resolve(destination, '..'), { recursive: true })
		const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`
		try {
			cpSync(source, temporary, { recursive: true, errorOnExist: true })
			if (sha256(join(temporary, item.source.entry)) !== item.source.integrity) throw new Error(`Copied package validation failed for ${id}`)
			renameSync(temporary, destination)
		} catch (error) {
			rmSync(temporary, { recursive: true, force: true })
			throw error
		}
	}
	registry.items[id] = { id, version: item.version, installedAt: new Date().toISOString(), integrity: item.source.integrity, status: 'installed' }
	writeJsonAtomic(registryPath(), registry)
	return { ...item, installed: registry.items[id] }
}

function arrays(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [] }

function updateConfig(path: string, key: 'skills' | 'extensions', reference: string): void {
	const current = readJson(path)
	const values = arrays(current[key])
	if (!values.includes(reference)) values.push(reference)
	current[key] = values
	current.version = typeof current.version === 'number' ? current.version : 1
	current.managedBy = `superhive-pi-truth@1#${Date.now()}`
	current.lastModified = new Date().toISOString()
	writeJsonAtomic(path, current)
}

export async function removeMarketplaceItem(id: string): Promise<void> {
	const item = itemById(id)
	for (const agent of await AgentRepository.getAll()) {
		if (!agent.localPath) continue
		const reference = item.kind === 'skill' ? `./skills/${id}/SKILL.md` : `./extensions/${id}`
		const manage = readJson(join(agent.localPath, 'manage.json'))
		if (arrays(manage[item.kind === 'skill' ? 'skills' : 'extensions']).includes(reference)) throw new Error('Remove this capability from active agents before removing it')
	}
	const registry = readRegistry()
	delete registry.items[id]
	writeJsonAtomic(registryPath(), registry)
}

export async function activateMarketplaceItem(agentId: string, id: string): Promise<MarketplaceActivationResult> {
	const item = installMarketplaceItem(id)
	if (item.requiredConfiguration?.length) throw new Error(`${item.label} needs configuration before it can be used`)
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) throw new Error(`Agent not found: ${agentId}`)
	const status = runtime.getStatusPayload(agentId)
	if (status?.status === 'busy' || status?.status === 'waiting') throw new Error('This agent is busy. Try again when the current run finishes.')
	const isSkill = item.kind === 'skill'
	const folder = isSkill ? 'skills' : 'extensions'
	const target = join(agent.localPath, folder, id)
	const source = packageDir(item)
	const reference = isSkill ? `./skills/${id}/SKILL.md` : `./extensions/${id}`
	const createdLink = !existsSync(target)
	if (!createdLink && !existsSync(join(target, item.source.entry))) throw new Error(`A different package already occupies ${folder}/${id}`)
	const managePath = join(agent.localPath, 'manage.json')
	const manifestPath = join(agent.localPath, 'manifest.json')
	const previousManage = readJson(managePath)
	const previousManifest = readJson(manifestPath)
	try {
		runtime.ensureSettingsWatcher(agentId, join(agent.localPath, 'settings.json'))
		mkdirSync(join(agent.localPath, folder), { recursive: true })
		if (createdLink) copyTree(source, target)
		updateConfig(managePath, isSkill ? 'skills' : 'extensions', reference)
		if (!isSkill) updateConfig(manifestPath, 'extensions', reference)
	} catch (error) {
		if (createdLink && existsSync(target)) rmSync(target, { recursive: true, force: true })
		writeJsonAtomic(managePath, previousManage)
		if (!isSkill) writeJsonAtomic(manifestPath, previousManifest)
		throw error
	}
	const restarted = Boolean(status)
	if (restarted) {
		runtime.restart(agentId)
		await new Promise<void>((resolve) => setTimeout(resolve, 900))
		const reloaded = runtime.getStatusPayload(agentId)
		if (!reloaded || reloaded.status === 'idle') {
			if (createdLink && existsSync(target)) rmSync(target, { recursive: true, force: true })
			writeJsonAtomic(managePath, previousManage)
			if (!isSkill) writeJsonAtomic(manifestPath, previousManifest)
			throw new Error('The agent did not come back after enabling this capability')
		}
	}
	return { capability: { id, kind: item.kind, label: item.label, version: item.version, agentPath: reference }, restarted }
}
