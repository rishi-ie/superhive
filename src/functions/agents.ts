/**
 * Pure business logic for agent operations extracted from data/agent/store.ts.
 * These helpers do validation, transformation, and shape building.
 * They do NOT call DataSource directly.
 */
import type { CreateAgentInput } from '@/data/agent/interface';

/**
 * Validates the required fields for creating an agent.
 * All three fields must be non-empty after trimming.
 * @param input - Raw input from the create-agent modal
 * @returns Trimmed required fields if valid; null if invalid
 */
export function validateAgentInput(input: CreateAgentInput): { name: string; role: string; piPath: string } | null {
  const name = input.name.trim();
  const role = input.role.trim();
  const piPath = input.piPath.trim();
  if (!name || !role || !piPath) return null;
  return { name, role, piPath };
}

/**
 * Generates a unique agent id (ULID-style 26 chars: 10-char timestamp + 16-char random).
 * @returns A new agent id string
 */
export function generateAgentId(): string {
  const ts = Date.now().toString(36).padStart(10, '0').toUpperCase();
  let random = '';
  while (random.length < 16) {
    random += Math.random().toString(36).slice(2).toUpperCase();
  }
  return (ts + random).slice(0, 26);
}