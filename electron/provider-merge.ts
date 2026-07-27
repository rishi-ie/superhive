export type ProviderConfig = { name?: string; baseUrl?: string | null; apiKey?: string }

/** A blank legacy per-agent value must not erase the configured global key. */
export function mergeProviders(
	globalProviders: Record<string, ProviderConfig>,
	perAgentProviders: Record<string, ProviderConfig>,
): Record<string, ProviderConfig> {
	const merged: Record<string, ProviderConfig> = {}
	for (const name of new Set([...Object.keys(globalProviders), ...Object.keys(perAgentProviders)])) {
		const global = globalProviders[name] ?? {}
		const agent = perAgentProviders[name] ?? {}
		merged[name] = {
			...global,
			...agent,
			apiKey: agent.apiKey?.trim() || global.apiKey,
			baseUrl: agent.baseUrl?.trim() || global.baseUrl,
		}
	}
	return merged
}

type RuntimeSettings = {
	providers?: Record<string, ProviderConfig>
	model?: { provider?: string; name?: string }
	defaultProvider?: string
	defaultModel?: string
	enabledModels?: string[]
}

const MINIMAX_ANTHROPIC_URL = 'https://api.minimax.io/anthropic'
const LEGACY_MINIMAX_URL = 'https://api.minimax.io/v1'
const MINIMAX_MODELS: Record<string, string> = {
	'minimax-m2.7': 'MiniMax-M2.7',
	'minimax-m2.7-highspeed': 'MiniMax-M2.7-highspeed',
	'minimax-m3': 'MiniMax-M3',
}

function canonicalMinimaxModel(name: string | undefined): string | undefined {
	return name ? MINIMAX_MODELS[name.toLowerCase()] ?? name : name
}

/**
 * Move known legacy MiniMax entries onto Pi's native provider identity and
 * endpoint without touching other providers or custom endpoints.
 */
export function normalizeRuntimeSettings<T extends RuntimeSettings>(settings: T): T {
	const providers: Record<string, ProviderConfig> = {}
	for (const [name, config] of Object.entries(settings.providers ?? {})) {
		if (name.toLowerCase() !== 'minimax') {
			providers[name] = config
			continue
		}
		const previous = providers.minimax ?? {}
		providers.minimax = {
			...previous,
			...config,
			name: 'minimax',
			apiKey: config.apiKey?.trim() || previous.apiKey,
			baseUrl: config.baseUrl === LEGACY_MINIMAX_URL ? MINIMAX_ANTHROPIC_URL : (config.baseUrl ?? previous.baseUrl),
		}
	}

	const canonicalProvider = (provider: string | undefined) =>
		provider?.toLowerCase() === 'minimax' ? 'minimax' : provider
	const normalizeModel = (provider: string | undefined, name: string | undefined) =>
		provider?.toLowerCase() === 'minimax' ? canonicalMinimaxModel(name) : name
	const provider = canonicalProvider(settings.model?.provider)
	const model = normalizeModel(settings.model?.provider, settings.model?.name)
	const enabledModels = settings.enabledModels?.map((id) => {
		const separator = id.indexOf(':')
		if (separator < 0) return id
		const providerName = canonicalProvider(id.slice(0, separator))
		const modelName = normalizeModel(id.slice(0, separator), id.slice(separator + 1))
		return providerName && modelName ? `${providerName}:${modelName}` : id
	})

	return {
		...settings,
		providers,
		model: settings.model ? { ...settings.model, provider, name: model } : settings.model,
		defaultProvider: canonicalProvider(settings.defaultProvider),
		defaultModel: normalizeModel(settings.defaultProvider, settings.defaultModel),
		enabledModels,
	}
}
