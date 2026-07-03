/**
 * Maps settings.models.providers[*].id → the environment-variable name that
 * the upstream Pi coding agent (`@earendil-works/pi-coding-agent`) reads
 * during provider auto-detect. Pi natively supports ~30 env-var names; we
 * only carry here the providers exposed in the Superhive settings UI.
 *
 * Source: Pi's README provider list + env keys. Tweak as Pi adds providers.
 */
export type ModelProviderEnvMap = Record<string, { envVar: string; defaultModel: string }>;

export const MODEL_PROVIDER_ENV: ModelProviderEnvMap = {
  minimax:    { envVar: 'MINIMAX_API_KEY',    defaultModel: 'MiniMax-M3' },
  anthropic:  { envVar: 'ANTHROPIC_API_KEY',  defaultModel: 'claude-sonnet-4-5' },
  google:     { envVar: 'GEMINI_API_KEY',     defaultModel: 'gemini-2.5-flash' },
  openai:     { envVar: 'OPENAI_API_KEY',     defaultModel: 'gpt-4o' },
  deepseek:   { envVar: 'DEEPSEEK_API_KEY',   defaultModel: 'deepseek-chat' },
  groq:       { envVar: 'GROQ_API_KEY',       defaultModel: 'llama-3.3-70b-versatile' },
  mistral:    { envVar: 'MISTRAL_API_KEY',    defaultModel: 'mistral-large-latest' },
  openrouter: { envVar: 'OPENROUTER_API_KEY', defaultModel: 'anthropic/claude-3.5-sonnet' },
  together:   { envVar: 'TOGETHER_API_KEY',   defaultModel: 'meta-llama/Llama-3.3-70B-Instruct' },
  fireworks:  { envVar: 'FIREWORKS_API_KEY',  defaultModel: 'accounts/fireworks/models/llama-v3p1-70b' },
  nvidia:     { envVar: 'NVIDIA_API_KEY',     defaultModel: 'nvidia/llama-3.1-nemotron-70b-instruct' },
  huggingface:{ envVar: 'HF_TOKEN',           defaultModel: 'meta-llama/Llama-3.3-70B-Instruct' },
};

/** Returns the env var name for a provider id, or null if unknown. */
export function envVarForProvider(providerId: string): string | null {
  return MODEL_PROVIDER_ENV[providerId.toLowerCase()]?.envVar ?? null;
}
