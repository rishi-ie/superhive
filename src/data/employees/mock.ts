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
  {
    id: 'emp-elena',
    name: 'Elena Rodriguez',
    role: 'DevOps Engineer',
    status: 'EXECUTING',
    activeTask: 'Rolling out canary deployment for v2.4',
    uptime: '1h 30m',
  },
  {
    id: 'emp-david',
    name: 'David Kim',
    role: 'ML Engineer',
    status: 'EXECUTING',
    activeTask: 'Fine-tuning intent classification model',
    uptime: '3h 45m',
  },
  {
    id: 'emp-fatima',
    name: 'Fatima Al-Hassan',
    role: 'Product Manager',
    status: 'AWAITING_HUMAN',
    activeTask: 'Reviewing Q3 roadmap with stakeholders',
    uptime: '0h 50m',
  },
  {
    id: 'emp-noah',
    name: 'Noah Chen',
    role: 'Security Engineer',
    status: 'COMPILING',
    activeTask: 'Running penetration test on auth service',
    uptime: '2h 05m',
  },
];

const telemetryMap: Record<string, Telemetry> = {
  'emp-ava':     { contextSaturation: 67,  tokensPerSecond: 142, currentCost: 0.0234, evolutionLoop: '47/100', logicKernelIntegrity: 94,  sessionCost: 1.42,  budget: 5.00 },
  'emp-marcus':  { contextSaturation: 100, tokensPerSecond: 0,   currentCost: 0.142,  evolutionLoop: '8/100',  logicKernelIntegrity: 23,  sessionCost: 3.87,  budget: 5.00 },
  'emp-priya':   { contextSaturation: 45,  tokensPerSecond: 89,  currentCost: 0.0187, evolutionLoop: '12/100', logicKernelIntegrity: 100, sessionCost: 0.54,  budget: 5.00 },
  'emp-james':   { contextSaturation: 12,  tokensPerSecond: 0,   currentCost: 0.0012, evolutionLoop: '3/100',  logicKernelIntegrity: 99,  sessionCost: 0.12,  budget: 5.00 },
  'emp-sonia':   { contextSaturation: 88,  tokensPerSecond: 201, currentCost: 0.0091, evolutionLoop: '23/100', logicKernelIntegrity: 87,  sessionCost: 0.89,  budget: 5.00 },
  'emp-elena':   { contextSaturation: 55,  tokensPerSecond: 67,  currentCost: 0.0312, evolutionLoop: '31/100', logicKernelIntegrity: 91,  sessionCost: 2.14,  budget: 8.00 },
  'emp-david':   { contextSaturation: 78,  tokensPerSecond: 110, currentCost: 0.0451, evolutionLoop: '19/100', logicKernelIntegrity: 96,  sessionCost: 3.22,  budget: 10.00 },
  'emp-fatima':  { contextSaturation: 22,  tokensPerSecond: 15,  currentCost: 0.0034, evolutionLoop: '5/100',  logicKernelIntegrity: 100, sessionCost: 0.18,  budget: 2.00 },
  'emp-noah':    { contextSaturation: 61,  tokensPerSecond: 95,  currentCost: 0.0278, evolutionLoop: '38/100', logicKernelIntegrity: 88,  sessionCost: 1.76,  budget: 6.00 },
};

const permissionsMap: Record<string, Permissions> = {
  'emp-ava':     { modelEngine: 'Opus 4.8', writeAccess: true,  commitAuthority: 'REVIEW_ONLY',  maxTokens: 8192,  writeMessages: true,  installDeps: false },
  'emp-marcus':  { modelEngine: 'Opus 4.8', writeAccess: true,  commitAuthority: 'AUTO_MERGE',   maxTokens: 8192,  writeMessages: true,  installDeps: true  },
  'emp-priya':   { modelEngine: 'Sonnet',    writeAccess: false, commitAuthority: 'REVIEW_ONLY',  maxTokens: 4096,  writeMessages: false, installDeps: false },
  'emp-james':   { modelEngine: 'Claude',    writeAccess: false, commitAuthority: 'DIRECT_MAIN', maxTokens: 16384, writeMessages: false, installDeps: false },
  'emp-sonia':   { modelEngine: 'Codex',     writeAccess: false, commitAuthority: 'AUTO_MERGE',   maxTokens: 8192,  writeMessages: true,  installDeps: true  },
  'emp-elena':   { modelEngine: 'Sonnet',    writeAccess: true,  commitAuthority: 'DIRECT_MAIN', maxTokens: 8192,  writeMessages: true,  installDeps: true  },
  'emp-david':   { modelEngine: 'Opus 4.8', writeAccess: false, commitAuthority: 'REVIEW_ONLY',  maxTokens: 16384, writeMessages: false, installDeps: false },
  'emp-fatima':  { modelEngine: 'Claude',    writeAccess: false, commitAuthority: 'REVIEW_ONLY',  maxTokens: 4096,  writeMessages: true,  installDeps: false },
  'emp-noah':    { modelEngine: 'Opus 4.8', writeAccess: true,  commitAuthority: 'REVIEW_ONLY',  maxTokens: 8192,  writeMessages: true,  installDeps: false },
};

const actionLogMap: Record<string, ActionLogEntry[]> = {
  'emp-ava':    [{ time: '12:34', action: 'Generated 247 lines of auth middleware' }, { time: '12:32', action: 'Evaluated logic branch A — PASS' }, { time: '12:30', action: 'Loaded context (1.2 MB, 247 modules)' }],
  'emp-marcus': [{ time: '12:41', action: 'Stuck in recursive loop — attempting recovery' }, { time: '12:39', action: 'Opened PR #142 for review' }, { time: '12:35', action: 'Ran full test suite — 98% pass rate' }],
  'emp-priya':  [{ time: '12:28', action: 'Integrated Stripe API endpoints' }, { time: '12:24', action: 'Refactored user auth token flow' }, { time: '12:20', action: 'Deployed staging build — healthy' }],
  'emp-james':  [{ time: '12:10', action: 'Idle — awaiting assignment' }, { time: '11:58', action: 'Fixed CSS layout regression in NavBar' }, { time: '11:45', action: 'Shipped hotfix v2.3.1 to prod' }],
  'emp-sonia':  [{ time: '12:31', action: 'Building design token system' }, { time: '12:28', action: 'Published component library v1.4' }, { time: '12:15', action: 'Ran accessibility audit — WCAG AA' }],
  'emp-elena':  [{ time: '12:20', action: 'Kicked off canary deployment to 5% traffic' }, { time: '12:10', action: 'Validated health checks across all pods' }, { time: '11:55', action: 'Updated Helm chart values for v2.4' }],
  'emp-david':  [{ time: '12:25', action: 'Training epoch 14 complete — loss 0.08' }, { time: '12:10', action: 'Prepared training dataset (50K samples)' }, { time: '11:50', action: 'Ran baseline evaluation — F1 0.91' }],
  'emp-fatima': [{ time: '12:00', action: 'Compiled Q3 roadmap summary for leadership' }, { time: '11:40', action: 'Reviewed OKR progress with team leads' }, { time: '11:20', action: 'Prioritized backlog items for sprint 23' }],
  'emp-noah':   [{ time: '12:18', action: 'Running SQL injection scan on auth endpoints' }, { time: '12:05', action: 'Documented pen-test findings in report' }, { time: '11:45', action: 'Configured OWASP ZAP scan profile' }],
};

const nextStepMap: Record<string, string> = {
  'emp-ava':    'Next — Run Evolution Loop 48 in ~3 min',
  'emp-marcus': 'Next — Awaiting human intervention to break loop',
  'emp-priya':  'Next — Ready to deploy after your approval',
  'emp-james':  'Next — Standing by for new tasking',
  'emp-sonia':  'Next — Evolution 24 queued for 14:00',
  'emp-elena':  'Next — Monitor canary metrics for 30 min',
  'emp-david':  'Next — Evaluate model on holdout set at epoch 20',
  'emp-fatima': 'Next — Awaiting stakeholder sign-off on Q3 goals',
  'emp-noah':   'Next — Present pen-test findings to security team',
};

let auditItemsMutable: AuditItem[] = [
  { id: 'audit-1', type: 'AUTH_INTERCEPT', title: 'Authorization Intercept', description: 'Attempting to modify core auth middleware. Elevated permission required.', timestamp: '2m ago' },
  { id: 'audit-2', type: 'DIFF_REVIEW', title: 'Evolution Loop 47 Complete', description: 'Simulated query speed +14%. Ready for integration review.', timestamp: '5m ago' },
  { id: 'audit-3', type: 'DIFF_REVIEW', title: 'Evolution Loop 23 Complete', description: 'Patch validated. Net improvement: +8% throughput.', timestamp: '12m ago' },
  { id: 'audit-4', type: 'AUTH_INTERCEPT', title: 'Elevated Scope Request', description: 'Agent is requesting write access to production database. Requires approval.', timestamp: '1m ago' },
  { id: 'audit-5', type: 'DIFF_REVIEW', title: 'Infrastructure Patch v3', description: 'Network latency improvements. +6% throughput gain on staging.', timestamp: '8m ago' },
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
