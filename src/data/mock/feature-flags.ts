export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export type MockDomain =
  | 'workspaces'
  | 'favorites'
  | 'agents'
  | 'chat'
  | 'projects'
  | 'tickets'
  | 'costUsage'
  | 'themes';

export function isMockEnabled(domain: MockDomain): boolean {
  if (!USE_MOCK_DATA) return false;
  const flag = import.meta.env[`VITE_MOCK_${domain.toUpperCase().replace(/-/g, '_')}`];
  return flag !== 'false';
}
