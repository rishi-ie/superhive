import { isMockEnabled } from '@/lib/feature-flags';
import mockData from '../mock.json';
import type { MockData } from '../mock-types';
import type { EmployeeStore, Employee, Telemetry, Permissions, AuditItem, ActionLogEntry } from './interface';

const data = mockData as MockData;

const employees: Employee[] = data.employees;
const telemetryMap: Record<string, Telemetry> = data.telemetry;
const permissionsMap: Record<string, Permissions> = data.permissions;
const actionLogMap: Record<string, ActionLogEntry[]> = data.actionLogs;
const nextStepMap: Record<string, string> = data.nextSteps;

let auditItemsMutable: AuditItem[] = structuredClone(data.auditItems);

const DEFAULT_TELEMETRY: Telemetry = {
  contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5.00,
};

const DEFAULT_PERMISSIONS: Permissions = {
  modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false,
};

const mockEmployeeStore: EmployeeStore = {
  list() {
    return employees;
  },
  get(id: string) {
    return employees.find((e) => e.id === id);
  },
  getTelemetry(employeeId: string) {
    return telemetryMap[employeeId] ?? null;
  },
  getPermissions(employeeId: string) {
    return permissionsMap[employeeId] ?? null;
  },
  getAuditItems(_employeeId?: string) {
    return auditItemsMutable;
  },
  getActionLog(employeeId: string) {
    return actionLogMap[employeeId] ?? [];
  },
  getNextStep(employeeId: string) {
    return nextStepMap[employeeId] ?? 'Next — Standing by';
  },
  getDefaultTelemetry() {
    return DEFAULT_TELEMETRY;
  },
  getDefaultPermissions() {
    return DEFAULT_PERMISSIONS;
  },
  approveAudit(id: string) {
    auditItemsMutable = auditItemsMutable.filter(item => item.id !== id);
  },
  denyAudit(id: string) {
    auditItemsMutable = auditItemsMutable.filter(item => item.id !== id);
  },
};

const emptyStore: EmployeeStore = {
  list() { return []; },
  get(_id) { return undefined; },
  getTelemetry() { return null; },
  getPermissions() { return null; },
  getAuditItems() { return []; },
  getActionLog() { return []; },
  getNextStep() { return ''; },
  getDefaultTelemetry() {
    return { contextSaturation: 0, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 0, sessionCost: 0, budget: 0 };
  },
  getDefaultPermissions() {
    return { modelEngine: '—', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 0, writeMessages: false, installDeps: false };
  },
  approveAudit() {},
  denyAudit() {},
};

const store: EmployeeStore = isMockEnabled('employees') ? mockEmployeeStore : emptyStore;

export function listEmployees(): Employee[] {
  return store.list();
}

export function getEmployee(id: string): Employee | undefined {
  return store.get(id);
}

export function getActiveEmployee(preferredId?: string | null): Employee | null {
  const employees = store.list();
  if (preferredId) {
    return employees.find(e => e.id === preferredId) ?? employees[0] ?? null;
  }
  return (
    employees.find((e) => e.status === 'EXECUTING') ??
    employees.find((e) => e.status === 'COMPILING') ??
    employees[0] ??
    null
  );
}

export function getTelemetry(employeeId: string): Telemetry {
  return store.getTelemetry(employeeId) ?? store.getDefaultTelemetry();
}

export function getPermissions(employeeId: string): Permissions {
  return store.getPermissions(employeeId) ?? store.getDefaultPermissions();
}

export function getAuditItems(employeeId?: string): AuditItem[] {
  return store.getAuditItems(employeeId);
}

export function getActionLog(employeeId: string): ActionLogEntry[] {
  return store.getActionLog(employeeId);
}

export function getNextStep(employeeId: string): string {
  return store.getNextStep(employeeId);
}

export function approveAudit(id: string): void {
  store.approveAudit(id);
}

export function denyAudit(id: string): void {
  store.denyAudit(id);
}

export { type Employee, type Telemetry, type Permissions, type AuditItem, type ActionLogEntry };
