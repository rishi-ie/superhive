import { isMockEnabled } from '@/lib/feature-flags';
import { mockEmployeeStore } from './mock';
import type { EmployeeStore, Employee, Telemetry, Permissions, AuditItem, ActionLogEntry } from './interface';

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
};

const store: EmployeeStore = isMockEnabled('employees') ? mockEmployeeStore : emptyStore;

export function listEmployees(): Employee[] {
  return store.list();
}

export function getEmployee(id: string): Employee | undefined {
  return store.get(id);
}

export function getActiveEmployee(): Employee | null {
  const employees = store.list();
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

export { type Employee, type Telemetry, type Permissions, type AuditItem, type ActionLogEntry };
