/**
 * Single source of truth for mock data and the mock toggle.
 *
 * Every domain store imports `mockableData` from here instead of reading
 * `@/data/mock.json` directly, and reads/writes against the data it gets back.
 *
 * The `VITE_USE_MOCK_DATA` env var (defaults to `true`) decides whether to
 * seed `mockableData` from `mock.json` or hand back an empty `MockData`.
 * When empty, every store starts with no records but its mutators (createProject,
 * createThreadForAgent, etc.) still work — they push into the same mutable
 * arrays. That gives a real fresh-user experience: empty app, but the user
 * can create things in-session.
 */
import mockData from '@/data/mock.json';
import type { MockData } from './types';

export const MOCKS_ENABLED = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const EMPTY_DATA: MockData = {
  workspaces: [],
  currentWorkspaceId: '',
  projects: [],
  universalTickets: [],
  agents: [],
  telemetry: {},
  permissions: {},
  actionLogs: {},
  nextSteps: {},
  auditItems: [],
  pendingQuestions: [],
  chatThreads: [],
  favorites: [],
  channelMessages: [],
  costUsage: [],
  chatQuickStart: [],
  customThemes: [],
  homeActivityEvents: [],
  agentDefaults: {
    telemetry: {
      contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5,
    },
    permissions: {
      modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false,
    },
  },
};

export const mockableData: MockData = MOCKS_ENABLED ? (mockData as MockData) : EMPTY_DATA;