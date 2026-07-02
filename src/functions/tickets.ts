/**
 * Pure ticket business logic extracted from data/ticket/store.ts.
 * These helpers validate, transform, and shape ticket data.
 * They do NOT call DataSource directly.
 */
import type { Priority, TicketType, UniversalTicket } from '@/data/ticket/interface';

/**
 * Input shape for ticket validation.
 */
export type TicketInput = {
  title: string;
  projectName: string;
  workspaceId: string;
  priority: Priority;
  type: TicketType;
  assigneeName: string;
  assigneeIsAI?: boolean;
  assigneeAvatarUrl?: string;
};

/**
 * Validated ticket payload ready for the repository layer.
 * assigneeIsAI is required (defaults to true) since the repo needs a strict boolean.
 */
export type ValidatedTicket = {
  title: string;
  projectName: string;
  workspaceId: string;
  priority: Priority;
  type: TicketType;
  assigneeName: string;
  assigneeIsAI: boolean;
  assigneeAvatarUrl?: string;
};

/**
 * Validates a ticket creation input.
 * @param input - Raw input from the ticket modal
 * @returns Normalized ticket payload if valid; null otherwise
 */
export function validateTicketInput(input: TicketInput): ValidatedTicket | null {
  if (!input.title.trim() || !input.workspaceId) return null;
  return {
    title: input.title.trim(),
    projectName: input.projectName,
    workspaceId: input.workspaceId,
    priority: input.priority,
    type: input.type,
    assigneeName: input.assigneeName,
    assigneeIsAI: input.assigneeIsAI ?? true,
    assigneeAvatarUrl: input.assigneeAvatarUrl,
  };
}

/**
 * Generates a unique ticket id.
 * @returns A new ticket id string
 */
export function generateTicketId(): string {
  return `UT-${Date.now().toString(36)}`;
}

/**
 * Maps done/snooze actions to status transitions. Encapsulates the rule
 * that "done" sets status to MERGED and "snooze" sends it to BACKLOG.
 * @param action - The user's intent
 * @returns The new status; null for non-status actions
 */
export function ticketActionToStatus(action: 'done' | 'snooze'): 'MERGED' | 'BACKLOG' | null {
  if (action === 'done') return 'MERGED';
  if (action === 'snooze') return 'BACKLOG';
  return null;
}

/**
 * Validates that a ticket belongs to the expected workspace.
 * @param ticket - Ticket to check
 * @param workspaceId - Expected workspace
 * @returns True if the ticket belongs to the workspace
 */
export function ticketBelongsToWorkspace(ticket: UniversalTicket, workspaceId: string): boolean {
  return ticket.workspaceId === workspaceId;
}
