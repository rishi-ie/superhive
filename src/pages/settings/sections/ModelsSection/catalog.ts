export interface CatalogModel {
  id: string;
  provider: string;
  name: string;
}

export interface CatalogProviderMeta {
  /** Stable provider name used as the key in `db.settings.json` and the
   *  provider entrypoint throughout the app. */
  name: string;
  /** Default base URL override; not all providers expose one. */
  baseUrl: string;
  showBaseUrl: boolean;
  keyLabel: string;
  /** External page where the user can obtain an API key. */
  docsUrl: string;
  /** Whether this provider has a block in the API Keys section. */
  hasApiKeysBlock: boolean;
  /** For AWS Bedrock: multi-field auth. */
  authKind: 'single' | 'aws';
}

export const PROVIDERS: CatalogProviderMeta[] = [
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    showBaseUrl: true,
    keyLabel: 'API Key',
    docsUrl: 'https://platform.openai.com/api-keys',
    hasApiKeysBlock: true,
    authKind: 'single',
  },
  {
    name: 'anthropic',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    docsUrl: 'https://anthropic.com',
    hasApiKeysBlock: true,
    authKind: 'single',
  },
  {
    name: 'google',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    docsUrl: 'https://aistudio.google.com/apikey',
    hasApiKeysBlock: true,
    authKind: 'single',
  },
  {
    name: 'azure',
    baseUrl: '',
    showBaseUrl: true,
    keyLabel: 'API Key',
    docsUrl: '',
    hasApiKeysBlock: true,
    authKind: 'single',
  },
  {
    name: 'aws',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: '',
    docsUrl: '',
    hasApiKeysBlock: true,
    authKind: 'aws',
  },
  {
    name: 'minimax',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    docsUrl: '',
    hasApiKeysBlock: false,
    authKind: 'single',
  },
  {
    name: 'deepseek',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    docsUrl: '',
    hasApiKeysBlock: false,
    authKind: 'single',
  },
];

export function getProviderMeta(name: string): CatalogProviderMeta | undefined {
  return PROVIDERS.find((p) => p.name === name);
}

/** Curated catalog rows shown in the Models section. One model per provider. */
export const CATALOG: CatalogModel[] = [
  { id: 'minimax:MiniMax-Text-01', provider: 'minimax', name: 'MiniMax-Text-01' },
  { id: 'anthropic:claude-sonnet-4-5', provider: 'anthropic', name: 'claude-sonnet-4-5' },
  { id: 'openai:gpt-4o', provider: 'openai', name: 'gpt-4o' },
  { id: 'google:gemini-2-5-pro', provider: 'google', name: 'gemini-2-5-pro' },
  { id: 'deepseek:deepseek-v3', provider: 'deepseek', name: 'deepseek-v3' },
];

export const CATALOG_IDS = new Set(CATALOG.map((m) => m.id));

export function isCatalogModel(id: string): boolean {
  return CATALOG_IDS.has(id);
}

export function getCatalogModel(id: string): CatalogModel | undefined {
  return CATALOG.find((m) => m.id === id);
}
