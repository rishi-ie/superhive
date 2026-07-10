export interface CatalogModel {
  id: string;
  provider: string;
  name: string;
}

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