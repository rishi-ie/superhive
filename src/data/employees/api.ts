import type {
  Employee,
  Telemetry,
  Permissions,
  AuditItem,
  ActionLogEntry,
} from './interface';

interface EmployeesApi {
  list(): Promise<Employee[]>;
  get(id: string): Promise<Employee | undefined>;
  getTelemetry(employeeId: string): Promise<Telemetry | null>;
  getPermissions(employeeId: string): Promise<Permissions | null>;
  getAuditItems(employeeId?: string): Promise<AuditItem[]>;
  getActionLog(employeeId: string): Promise<ActionLogEntry[]>;
  getNextStep(employeeId: string): Promise<string>;
  approveAudit(id: string): Promise<void>;
  denyAudit(id: string): Promise<void>;
}

export const employeesApi: EmployeesApi = {
  list() { throw new Error('Not implemented — replace with real API call'); },
  get() { throw new Error('Not implemented — replace with real API call'); },
  getTelemetry() { throw new Error('Not implemented — replace with real API call'); },
  getPermissions() { throw new Error('Not implemented — replace with real API call'); },
  getAuditItems() { throw new Error('Not implemented — replace with real API call'); },
  getActionLog() { throw new Error('Not implemented — replace with real API call'); },
  getNextStep() { throw new Error('Not implemented — replace with real API call'); },
  approveAudit() { throw new Error('Not implemented — replace with real API call'); },
  denyAudit() { throw new Error('Not implemented — replace with real API call'); },
};
