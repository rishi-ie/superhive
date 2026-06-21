import type {
  Employee,
  Telemetry,
  Permissions,
  AuditItem,
  ActionLogEntry,
  EmployeeStore,
} from './interface';

const employees: Employee[] = [
  {
    id: 'emp-ava',
    name: 'Ava Chen',
    role: 'Logic Architect',
    status: 'COMPILING',
    activeTask: 'Building authentication middleware layer',
    uptime: '2h 14m',
  },
  {
    id: 'emp-marcus',
    name: 'Marcus Webb',
    role: 'Backend Engineer',
    status: 'ERROR_LOOP',
    activeTask: 'Recovering from recursive logic fault in payment processing',
    uptime: '0h 38m',
  },
  {
    id: 'emp-priya',
    name: 'Priya Sharma',
    role: 'API Engineer',
    status: 'EXECUTING',
    activeTask: 'Integrating Stripe webhook endpoints',
    uptime: '4h 02m',
  },
  {
    id: 'emp-james',
    name: 'James Liu',
    role: 'Frontend Engineer',
    status: 'IDLE',
    activeTask: 'Standing by for new assignment',
    uptime: '0h 11m',
  },
  {
    id: 'emp-sonia',
    name: 'Sonia Patel',
    role: 'Design Systems Lead',
    status: 'COMPILING',
    activeTask: 'Publishing component library v1.4',
    uptime: '1h 55m',
  },
];

const telemetryMap: Record<string, Telemetry> = {
  'emp-ava':    { contextSaturation: 67, tokensPerSecond: 142, currentCost: 0.0234, evolutionLoop: '47/100', logicKernelIntegrity: 94, sessionCost: 1.42, budget: 5.00 },
  'emp-marcus': { contextSaturation: 100, tokensPerSecond: 0, currentCost: 0.142, evolutionLoop: '8/100', logicKernelIntegrity: 23, sessionCost: 3.87, budget: 5.00 },
  'emp-priya':  { contextSaturation: 45, tokensPerSecond: 89, currentCost: 0.0187, evolutionLoop: '12/100', logicKernelIntegrity: 100, sessionCost: 0.54, budget: 5.00 },
  'emp-james':  { contextSaturation: 12, tokensPerSecond: 0, currentCost: 0.0012, evolutionLoop: '3/100', logicKernelIntegrity: 99, sessionCost: 0.12, budget: 5.00 },
  'emp-sonia':  { contextSaturation: 88, tokensPerSecond: 201, currentCost: 0.0091, evolutionLoop: '23/100', logicKernelIntegrity: 87, sessionCost: 0.89, budget: 5.00 },
};

const permissionsMap: Record<string, Permissions> = {
  'emp-ava':    { modelEngine: 'Opus 4.8', writeAccess: true,  commitAuthority: 'REVIEW_ONLY', maxTokens: 8192,  writeMessages: true,  installDeps: false },
  'emp-marcus': { modelEngine: 'Opus 4.8', writeAccess: true,  commitAuthority: 'AUTO_MERGE',  maxTokens: 8192,  writeMessages: true,  installDeps: true  },
  'emp-priya':  { modelEngine: 'Sonnet',    writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 4096,  writeMessages: false, installDeps: false },
  'emp-james':  { modelEngine: 'Claude',    writeAccess: false, commitAuthority: 'DIRECT_MAIN', maxTokens: 16384, writeMessages: false, installDeps: false },
  'emp-sonia':  { modelEngine: 'Codex',     writeAccess: false, commitAuthority: 'AUTO_MERGE',  maxTokens: 8192,  writeMessages: true,  installDeps: true  },
};

const actionLogMap: Record<string, ActionLogEntry[]> = {
  'emp-ava':    [{ time: '12:34', action: 'Generated 247 lines of auth middleware' }, { time: '12:32', action: 'Evaluated logic branch A — PASS' }, { time: '12:30', action: 'Loaded context (1.2 MB, 247 modules)' }],
  'emp-marcus': [{ time: '12:41', action: 'Stuck in recursive loop — attempting recovery' }, { time: '12:39', action: 'Opened PR #142 for review' }, { time: '12:35', action: 'Ran full test suite — 98% pass rate' }],
  'emp-priya':  [{ time: '12:28', action: 'Integrated Stripe API endpoints' }, { time: '12:24', action: 'Refactored user auth token flow' }, { time: '12:20', action: 'Deployed staging build — healthy' }],
  'emp-james':  [{ time: '12:10', action: 'Idle — awaiting assignment' }, { time: '11:58', action: 'Fixed CSS layout regression in NavBar' }, { time: '11:45', action: 'Shipped hotfix v2.3.1 to prod' }],
  'emp-sonia':  [{ time: '12:31', action: 'Building design token system' }, { time: '12:28', action: 'Published component library v1.4' }, { time: '12:15', action: 'Ran accessibility audit — WCAG AA' }],
};

const nextStepMap: Record<string, string> = {
  'emp-ava':    'Next — Run Evolution Loop 48 in ~3 min',
  'emp-marcus': 'Next — Awaiting human intervention to break loop',
  'emp-priya':  'Next — Ready to deploy after your approval',
  'emp-james':  'Next — Standing by for new tasking',
  'emp-sonia':  'Next — Evolution 24 queued for 14:00',
};

const auditItems: AuditItem[] = [
  { id: 'audit-1', type: 'AUTH_INTERCEPT', title: 'Authorization Intercept', description: 'Attempting to modify core auth middleware. Elevated permission required.', timestamp: '2m ago' },
  { id: 'audit-2', type: 'DIFF_REVIEW', title: 'Evolution Loop 47 Complete', description: 'Simulated query speed +14%. Ready for integration review.', timestamp: '5m ago' },
  { id: 'audit-3', type: 'DIFF_REVIEW', title: 'Evolution Loop 23 Complete', description: 'Patch validated. Net improvement: +8% throughput.', timestamp: '12m ago' },
];

const DEFAULT_TELEMETRY: Telemetry = {
  contextSaturation: 50, tokensPerSecond: 0, currentCost: 0, evolutionLoop: '0/100', logicKernelIntegrity: 100, sessionCost: 0, budget: 5.00,
};

const DEFAULT_PERMISSIONS: Permissions = {
  modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY', maxTokens: 8192, writeMessages: false, installDeps: false,
};

export const mockEmployeeStore: EmployeeStore = {
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
    return auditItems;
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
};
