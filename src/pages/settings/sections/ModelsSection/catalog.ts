export interface CatalogModel {
  id: string;
  provider: string;
  name: string;
  baseUrl: string;
  showBaseUrl: boolean;
  keyLabel: string;
  defaultName: string;
  docsUrl: string;
}

export const CATALOG: CatalogModel[] = [
  {
    id: 'minimax:MiniMax-Text-01',
    provider: 'minimax',
    name: 'MiniMax-Text-01',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    defaultName: 'MiniMax-Text-01',
    docsUrl: '',
  },
  {
    id: 'anthropic:claude-sonnet-4-5',
    provider: 'anthropic',
    name: 'claude-sonnet-4-5',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    defaultName: 'claude-sonnet-4-5',
    docsUrl: '',
  },
  {
    id: 'openai:gpt-4o',
    provider: 'openai',
    name: 'gpt-4o',
    baseUrl: 'https://api.openai.com/v1',
    showBaseUrl: true,
    keyLabel: 'API Key',
    defaultName: 'gpt-4o',
    docsUrl: '',
  },
  {
    id: 'google:gemini-2-5-pro',
    provider: 'google',
    name: 'gemini-2-5-pro',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    defaultName: 'gemini-2-5-pro',
    docsUrl: '',
  },
  {
    id: 'deepseek:deepseek-v3',
    provider: 'deepseek',
    name: 'deepseek-v3',
    baseUrl: '',
    showBaseUrl: false,
    keyLabel: 'API Key',
    defaultName: 'deepseek-v3',
    docsUrl: '',
  },
];

export const CATALOG_IDS = new Set(CATALOG.map((m) => m.id));

export function isCatalogModel(id: string): boolean {
  return CATALOG_IDS.has(id);
}

export function getCatalogModel(id: string): CatalogModel | undefined {
  return CATALOG.find((m) => m.id === id);
}
