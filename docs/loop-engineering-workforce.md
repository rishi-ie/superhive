# Super Hive Loop-Engineered Agentic Workforce

> Product vision, user flow, runtime architecture, data contracts, safety model, and implementation plan  
> Status: Draft specification  
> Updated: 2026-07-29

## 1. Executive summary

Super Hive is a local-first workspace where a user plans substantial work with a persistent **Project Agent**, then lets that Project Agent operate an auditable workforce of specialized agents.

The Project Agent is not merely a chatbot or a one-shot router. It is the project's detailed orchestrator and loop engineer. It:

1. understands the user's goal, constraints, decisions, and project history;
2. turns the goal into a dependency-aware plan;
3. selects suitable assigned agents or obtains specialists from the marketplace;
4. gives each worker only the context and objective needed for one useful iteration;
5. observes the result of that iteration;
6. verifies the result or sends it to a separate evaluator;
7. updates durable project state and lineage;
8. sends a revised or next work packet;
9. escalates genuine gaps to the user; and
10. stops when the agreed outcome and verification conditions are satisfied.

The user sees this operation in two connected surfaces:

- **Project chat** is the command and discussion channel shared by the user, Project Agent, and project workers.
- **Right status bars** expose the live and durable state of the Project Agent and every worker without requiring the user to read the entire chat.

The product promise is:

> Plan once with the Project Agent, retain control of consequential decisions, and return to verified work with a complete explanation of what happened.

---

## 2. What loop engineering means

Loop engineering is the design of agentic workflows that repeatedly move through a bounded cycle:

```text
goal → act → observe → verify → update state → adjust → repeat or stop
```

It differs from adjacent disciplines:

| Discipline | Primary scope | Super Hive responsibility |
|---|---|---|
| Prompt engineering | One instruction or model response | Clear role and task instructions |
| Context engineering | What one model invocation can see | Assemble the smallest sufficient context packet |
| Harness engineering | Tools, permissions, execution, and recovery for one run | Pi runtime, extensions, sandboxing, tool adapters, streaming |
| Loop engineering | What happens across repeated runs | Scheduling, delegation, verification, memory, budgets, escalation, and stopping |

IBM describes loop engineering as designing workflows that let agents act, observe, decide, and iterate toward a user-defined goal with minimal manual prompting. Its basic stages are goal, action, observation, and adjustment, with explicit stopping criteria and a persistent “spine” of state. [IBM: What Is Loop Engineering?](https://www.ibm.com/think/topics/loop-engineering)

OpenAI describes an agent run as a loop that continues until an exit condition such as final output, an error, or a maximum number of turns. Its manager pattern is a close match for Super Hive: one agent retains control of the workflow and user relationship while invoking specialists. [OpenAI: A Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)

Long-running-agent research reinforces four choices in this specification:

- work should be decomposed into incremental, verifiable units;
- handoffs should be structured artifacts rather than vague prose;
- context should be compacted and selectively retrieved;
- the producer should not be the only evaluator of its own work.

See [Anthropic: Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), and [Harness Design for Long-Running Application Development](https://www.anthropic.com/engineering/harness-design-long-running-apps).

Parallel agents can increase useful throughput, but only when work is isolated and objectively testable. Anthropic's compiler experiment highlights both the potential and the operational cost of long-running agent teams. [Anthropic: Building a C Compiler with a Team of Parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)

A loop must also be bounded. Uncontrolled retries, handoffs, or recursive tool calls can produce cost exhaustion, context growth, and repeated external side effects. [When Agents Do Not Stop: Uncovering Infinite Agentic Loops in LLM Agents](https://arxiv.org/abs/2607.01641)

### 2.1 The Super Hive interpretation

Super Hive implements three nested loops:

1. **Worker iteration loop**  
   A worker receives one work packet, acts, verifies locally, reports, and waits.

2. **Project orchestration loop**  
   The Project Agent reconciles the plan, worker reports, evidence, blockers, budgets, and user decisions; it then dispatches the next useful iteration.

3. **Human governance loop**  
   The user plans, approves boundaries, responds to escalations, changes direction, and accepts the final result.

The Project Agent performs the “babysitting” that a user normally performs with a coding or knowledge-work agent, but it does so through explicit state, bounded work packets, verification, and visible communication.

### 2.2 What loop engineering is not

It is not:

- repeatedly sending “continue” to an agent;
- giving a worker the complete project transcript every time;
- allowing agents to recursively delegate without limits;
- treating an agent's claim of completion as proof;
- keeping a process alive forever;
- hiding agent-to-agent communication from the user;
- replacing user approval for high-impact actions; or
- using a context summary as the only historical record.

---

## 3. Product principles

### 3.1 One accountable Project Agent

The Project Agent owns plan coherence, staffing, sequencing, synthesis, escalation, and final reporting. Workers do not compete to control the plan.

### 3.2 One bounded iteration at a time

A worker receives the context required for its current iteration, not the entire long-term plan. A new packet is produced after the Project Agent observes the worker's result.

### 3.3 Durable state lives outside model context

Chats help humans understand the work, but structured project state determines what the system does. Agent context may be compacted or reset without losing the plan, assignments, decisions, evidence, or lineage.

### 3.4 The shared channel is visible

Project Agent → worker requests and worker → Project Agent questions or results appear in project chat with actor identity, task linkage, and delivery state.

### 3.5 Verification is part of the loop

Completion means that defined evidence passed. For subjective or high-impact output, a separate evaluator or user gate is preferred over self-evaluation.

### 3.6 Parallelism is earned

The Project Agent parallelizes only independent or safely isolated work. Dependencies, shared resources, merge conflicts, and external side effects constrain concurrency.

### 3.7 Autonomy is bounded by authority

The Project Agent may choose the next operational step inside user-approved scope. It may not silently expand scope, spend money, publish, contact people, deploy, delete data, or change security boundaries without the required authority.

### 3.8 The user can always answer four questions

At any moment the UI should answer:

1. What is the project trying to achieve?
2. What is happening now?
3. Why is each agent doing its current work?
4. What needs the user's attention?

---

## 4. Core product actors

### 4.1 User

The user defines outcomes, constraints, budgets, deadlines, and approval policy. They can pause, redirect, cancel, inspect, or resume the project.

### 4.2 Project Agent

The Project Agent is a persistent project-level orchestrator with:

- the canonical project goal and approved plan;
- current tasks and dependency graph;
- project decisions and constraints;
- assigned staff and capability inventory;
- access to project memory and context-compaction retrieval;
- authority and approval policy;
- project-wide status and attention queue;
- worker reports and evidence;
- budgets, retry limits, and stopping rules; and
- an auditable lineage of dispatches, results, verifications, and decisions.

The Project Agent is the only agent that:

- changes the project plan;
- assigns work to workers;
- requests new marketplace staff;
- resolves cross-worker conflicts;
- asks the user project-level questions; and
- declares project completion.

### 4.3 General Agent

The initial worker is a general-purpose agent that can handle a wide range of tasks. It follows the standard worker protocol and does not independently re-plan the project.

### 4.4 Specialist Agent

A specialist is an assigned agent or marketplace-provisioned agent whose profile, skills, tools, model, or permissions match a required capability.

Examples include:

- research and literature review;
- experiment implementation;
- statistical evaluation;
- product design;
- software engineering;
- QA and adversarial review;
- marketing operations;
- sales operations; and
- domain-specific compliance review.

### 4.5 Evaluator Agent

An evaluator is a worker role with independent instructions and evidence access. It checks deliverables against an explicit rubric. It should not inherit the producer's internal conclusion as fact.

An evaluator is created only when objective checks are insufficient or the impact warrants the extra cost.

---

## 5. Core product artifacts

| Artifact | Purpose |
|---|---|
| Project brief | User-approved goal, non-goals, constraints, success criteria |
| Project plan | Versioned task graph and milestones |
| Work item | Durable unit in the dependency graph |
| Loop iteration | One dispatch → result → verification cycle |
| Work packet | Minimal context and instructions for one worker iteration |
| Project event | Append-only audit event |
| Decision record | What changed, why, who decided, and supporting evidence |
| Artifact reference | Pointer and digest for code, files, datasets, documents, or external objects |
| Verification record | Check performed, evidence, result, and evaluator |
| Approval record | Requested action, risk, scope, decision, and actor |
| Context node | Compact, retrievable project knowledge linked to source events |
| Current snapshot | Fast derived view for UI and recovery |

Chat entries are communication records. They may reference these artifacts but do not replace them.

---

## 6. End-to-end user flow

### 6.1 Create or open a project

The user creates a project with a name and initial intent. Super Hive creates or resumes the Project Agent and loads:

- the current project snapshot;
- the latest approved plan;
- unresolved questions and approvals;
- active worker assignments;
- recent events;
- relevant context-compaction nodes; and
- enabled capabilities and permissions.

If recovering after a crash, the Project Agent reconciles durable state before taking new action.

### 6.2 Plan the work with the Project Agent

The user can plan a few hours, a day, or a longer program of work in project chat.

The Project Agent discovers:

- target outcome and definition of done;
- hypotheses or strategic assumptions;
- deliverables and required formats;
- constraints and non-goals;
- relevant source material;
- deadline or time budget;
- token, cost, and external-spend budgets;
- allowed external actions;
- required approval gates;
- acceptable risk and quality bar;
- experiment or work dependencies; and
- how results should be reported.

The Project Agent returns a plan containing:

- milestones;
- work items and dependencies;
- proposed parallel branches;
- required agent capabilities;
- verification methods;
- user decision points;
- budgets and stopping rules; and
- the first set of ready iterations.

The user can revise the plan. Execution starts only when the plan is approved or the user has configured an explicit auto-approval policy.

### 6.3 Staff the plan

For every ready work item, the Project Agent compares the required capabilities with the project's assigned agents.

Selection order:

1. reuse an idle assigned agent that meets the capability and permission requirements;
2. wait for a suitable busy assigned agent if delay is better than adding cost;
3. propose or select a marketplace agent template;
4. activate required skills, plugins, extensions, or MCP adapters under policy;
5. ask the user when installation, connection, credentials, spending, or expanded permission is required.

The Project Agent should not spawn a specialist merely because one exists. It should prefer the smallest team that can complete the plan reliably.

### 6.4 Dispatch the first iteration

The Project Agent writes a versioned work packet and posts a visible project-chat message:

```text
@Research Agent — Iteration EXP-03/A1
Compare three sparse-attention baselines under the agreed dataset split.
Return metrics, raw result paths, failed runs, and a recommendation.
Stop after the defined checks; do not change the global hypothesis.
```

The visible message and machine delivery envelope share the same `messageId`, `iterationId`, and `taskId`.

The worker receives a direct wake-up event and reads the durable work packet. Delivery is idempotent: a restart must not create a second logical iteration.

### 6.5 Worker executes

The worker follows the standard loop:

```text
read assignment
→ inspect required context
→ execute bounded work
→ perform local verification
→ report result, evidence, or blocker
→ wait for the next assignment
```

The worker may make tactical decisions inside the work packet's constraints. It may not change the project goal, assign peers, obtain new agents, or broaden permissions.

### 6.6 Worker asks for missing context

If blocked, the worker posts in project chat:

```text
@Project Agent — blocked on EXP-03/A1
The dataset split is specified, but the random seed policy is not.
I need either a fixed seed list or permission to choose and record one.
```

The Project Agent then:

1. answers from existing project decisions;
2. chooses a reversible tactical default within its authority;
3. revises the work packet;
4. routes a question to another worker if it owns the missing evidence; or
5. creates a user attention item and asks the user.

The worker remains in `blocked` or `waiting_for_context`; it does not invent project-level policy.

### 6.7 Observe and verify the result

The worker reports:

- concise outcome;
- deliverables and artifact references;
- verification performed;
- relevant metrics;
- deviations from the packet;
- unresolved risks;
- recommended next step; and
- resource usage.

The Project Agent validates the report envelope and evidence. It then chooses:

- **accept** — iteration satisfies its definition of done;
- **revise** — send focused feedback in a new attempt;
- **verify externally** — dispatch an evaluator;
- **split** — turn a discovered issue into new work items;
- **block** — wait for missing input or dependency;
- **escalate** — ask the user;
- **fail** — stop after retry or safety limits; or
- **cancel** — plan changed or work is no longer needed.

### 6.8 Continue the project loop

After every material event, the Project Agent:

1. updates the task graph and current snapshot;
2. appends a project event;
3. records new decisions and evidence;
4. updates the Project Agent's right status bar;
5. identifies newly ready work;
6. checks worker capacity, isolation, and budget;
7. dispatches the next bounded iterations; and
8. evaluates project-level stopping conditions.

### 6.9 User intervention

The user may at any time:

- send a new instruction;
- answer an escalation;
- pause the whole project or one worker;
- change priority;
- change the plan or budget;
- approve or deny a consequential action;
- replace an agent;
- inspect an artifact or event;
- retry a failed iteration;
- cancel work; or
- take manual control.

New user instructions are recorded as project events and may supersede earlier plan versions. Existing in-flight work is either allowed to finish, safely stopped, or invalidated explicitly.

### 6.10 Completion and handoff

The Project Agent may declare the project or milestone complete only when:

- required work items are complete or explicitly waived;
- verification conditions pass;
- unresolved risks are disclosed;
- required approvals are present;
- final deliverables are addressable;
- reproducibility information is stored where applicable; and
- the completion summary links to its supporting lineage.

The user receives:

- outcome against the original goal;
- deliverable links;
- evidence and key metrics;
- major decisions and changes of direction;
- failed approaches and why they were stopped;
- outstanding limitations;
- cost and runtime summary; and
- recommended follow-up work.

---

## 7. Research-project example

### 7.1 User goal

The user is developing a new reasoning architecture and wants to determine whether its central hypothesis is supported.

### 7.2 Plan

The Project Agent creates:

1. hypothesis and falsification criteria;
2. baseline selection;
3. experiment matrix;
4. implementation tasks;
5. independent execution branches;
6. evaluation and statistical checks;
7. ablation studies;
8. replication run;
9. synthesis; and
10. a decision gate: support, reject, or remain inconclusive.

### 7.3 Parallel work

The Project Agent may dispatch:

- a literature agent to validate novelty and comparable baselines;
- an engineering agent to implement the architecture;
- experiment agents to run isolated configurations;
- an evaluation agent to check metrics and statistical validity; and
- a replication agent to reproduce the strongest result from clean state.

Parallel branches must use:

- immutable dataset and configuration identifiers;
- isolated working directories or compute jobs;
- fixed seeds or an explicit seed policy;
- consistent metric schemas;
- unique artifact paths;
- resource budgets; and
- no shared mutable output file.

### 7.4 Example iteration sequence

```text
Project Agent → @Experiment Agent:
Run baseline B2 for seeds 3, 7, and 11. Do not tune hyperparameters.
Evidence required: config digest, logs, per-seed metrics, aggregate metrics.

Experiment Agent → @Project Agent:
Seed 7 diverged at step 18k. Seeds 3 and 11 completed.
The packet does not define whether divergence counts as zero or a failed run.

Project Agent → @Experiment Agent:
Record it as a failed run; do not impute a score. Re-run seed 7 once with
identical configuration to distinguish transient infrastructure failure.

Experiment Agent → @Project Agent:
Second seed-7 run diverged at the same step. Result packet and logs attached.

Project Agent → @Evaluation Agent:
Check whether the claimed improvement survives excluding failed runs and
whether the failure rate itself falsifies the reliability criterion.
```

### 7.5 Research completion rule

The Project Agent must not force a positive conclusion. Valid outcomes are:

- hypothesis supported within declared limits;
- hypothesis rejected;
- evidence inconclusive;
- experiment invalid; or
- budget exhausted before a reliable conclusion.

All are useful if evidence and lineage are intact.

---

## 8. Project chat as command channel

### 8.1 Conversation roles

Every rendered message carries:

```ts
type ChatActor =
  | { kind: "user"; userId: string; displayName: string }
  | { kind: "project-agent"; agentId: string; displayName: string }
  | { kind: "worker"; agentId: string; displayName: string }
  | { kind: "system"; displayName: "Super Hive" };
```

Worker output must not render as an anonymous Project Agent assistant message.

### 8.2 Mention semantics

Mentions are both readable text and typed routing instructions.

| Sender | Allowed target | Meaning |
|---|---|---|
| User | Project Agent | Ordinary project instruction |
| User | Worker | Request routed through and visible to Project Agent |
| Project Agent | Worker | Create or update a direct request/iteration |
| Worker | Project Agent | Result, question, blocker, or progress update |
| Worker | Worker | Not directly allowed in v1; Project Agent mediates |

The composer should resolve `@` against the actual project roster. Selecting a worker inserts a structured mention, not only display text.

### 8.3 Message and delivery separation

One user-visible chat entry may produce a delivery envelope:

```ts
interface DeliveryEnvelope {
  id: string;
  messageId: string;
  projectId: string;
  fromActorId: string;
  toAgentId: string;
  taskId?: string;
  iterationId?: string;
  kind: "dispatch" | "question" | "result" | "feedback" | "broadcast";
  status: "queued" | "delivered" | "acked" | "failed" | "cancelled";
  attempt: number;
  createdAt: string;
  deliveredAt?: string;
  ackedAt?: string;
}
```

Chat display and machine delivery must be linked but not conflated. Retrying delivery must not duplicate the visible message or logical assignment.

### 8.4 Chat presentation

Project chat should show:

- actor avatar, name, and role;
- `@` target;
- linked task and iteration;
- message kind;
- delivery/acknowledgment state when relevant;
- compact artifact and verification attachments;
- reply relationship;
- timestamps; and
- expandable machine details for audit.

System noise such as heartbeats should stay out of the main chat and remain in the trace.

### 8.5 User questions

When a worker question requires the user, the Project Agent creates one canonical attention item. The UI links:

```text
worker question → Project Agent escalation → user answer → revised packet
```

The answer is delivered to the worker through the Project Agent so plan ownership remains clear.

---

## 9. Right status bars

The status bar has two layers:

- **Live runtime state**: ephemeral signals such as starting, thinking, calling a tool, compacting, retrying, or waiting.
- **Durable work state**: current phase, assignment, progress, blocker, evidence, and next decision.

Live state takes visual priority while active. When the run ends, the durable snapshot remains.

### 9.1 Project Agent status bar

The project view should show:

1. **Now**
   - current phase;
   - safe live activity summary;
   - current orchestration decision;
   - last durable update time.

2. **Plan progress**
   - completed / total work items;
   - running, queued, verifying, blocked, and failed counts;
   - current milestone;
   - plan version.

3. **Worker hive**
   - worker name and role;
   - live status;
   - current task and iteration;
   - elapsed time;
   - last report time;
   - blocker or error;
   - action to open worker chat.

4. **Needs attention**
   - user questions;
   - approval requests;
   - exhausted retries;
   - capability gaps;
   - budget warnings;
   - conflicts and failed verification.

5. **Budget**
   - elapsed wall time;
   - model/tool cost where available;
   - external spend;
   - iteration and retry usage;
   - remaining limits.

6. **Recent decisions and activity**
   - milestone updates rather than raw tool spam;
   - links into the audit lineage.

### 9.2 Worker status bar

Every worker chat should show:

1. project and Project Agent;
2. current task and iteration;
3. objective and definition of done;
4. current loop step;
5. safe live activity;
6. deliverables produced;
7. latest local verification result;
8. context and dependency references;
9. elapsed time and budget;
10. blocker or pending question;
11. current attempt / maximum attempts; and
12. last Project Agent message and next expected action.

The worker status bar is derived from the same durable iteration record used by the Project Agent. It must not be a second manually maintained truth.

### 9.3 Status vocabulary

Runtime status:

```text
offline → starting → idle → working → waiting → stopping
                         ↘ blocked
                         ↘ error
```

Work-item status:

```text
draft → queued → ready → dispatched → running → verifying → completed
                              ↘ blocked       ↘ revision_required
                              ↘ failed
                              ↘ cancelled
```

Iteration status:

```text
created → queued → delivered → accepted → working → reported
                                                  → blocked
reported → verifying → accepted
                     → revision_required → superseded
                     → failed
```

Runtime and work status are deliberately separate. A process can be `idle` while its work item is `blocked`, or `working` while the iteration is `verifying`.

---

## 10. Loop runtime

### 10.1 Event-driven orchestration

The Project Agent reasons at decision points; deterministic code enforces routing, limits, and state transitions.

Triggers include:

- user instruction;
- plan approval;
- worker result or question;
- task dependency completion;
- evaluator result;
- approval decision;
- agent error or exit;
- stale heartbeat;
- budget threshold;
- scheduled wake-up; and
- manual resume.

The runtime should not burn tokens by asking the Project Agent to poll unchanged state.

### 10.2 Project orchestration algorithm

```ts
async function reconcileProject(projectId: string) {
  const state = await loadDurableProjectState(projectId);

  recoverOrMarkStaleIterations(state);
  applyNewEvents(state);

  if (state.cancelled || state.paused) return;
  if (state.requiresUserDecision) return notifyUser(state);
  if (projectDone(state)) return finalizeProject(state);
  if (budgetExceeded(state)) return pauseAndEscalate(state);

  for (const report of state.unverifiedReports) {
    await requestOrRunVerification(report);
  }

  const ready = findReadyWork(state);
  const dispatches = chooseSafeDispatches(ready, state.workers, state.limits);

  for (const dispatch of dispatches) {
    await persistPacketAndEvent(dispatch);
    await deliverIdempotently(dispatch);
  }
}
```

The model chooses plans and revisions. Deterministic code owns:

- legal state transitions;
- dependency checks;
- concurrency limits;
- idempotency;
- delivery acknowledgments;
- retry counters;
- timeout and stale handling;
- approval enforcement;
- budget enforcement; and
- append-only event recording.

### 10.3 Worker work packet

The repository already has `WorkPacket` v1. Evolve it, rather than inventing a parallel dispatch format:

```ts
interface WorkPacketV2 {
  version: 2;
  projectId: string;
  planVersion: number;
  taskId: string;
  iterationId: string;
  attempt: number;

  coordinatorAgentId: string;
  workerAgentId: string;

  objective: string;
  deliverables: DeliverableSpec[];
  definitionOfDone: string;
  verification: VerificationSpec[];

  constraints: string[];
  permissions: string[];
  forbiddenActions: string[];
  decisions: DecisionRef[];

  inputArtifacts: ArtifactRef[];
  dependencyOutputs: ArtifactRef[];
  contextRefs: ContextRef[];

  timeBudgetSeconds?: number;
  tokenBudget?: number;
  costBudget?: number;
  maxToolCalls?: number;

  reportingProtocol: string;
  stopConditions: string[];
  escalationConditions: string[];

  createdAt: string;
  packetDigest: string;
}
```

The packet is immutable. Feedback creates a new attempt or iteration linked to the previous one.

### 10.4 Worker result envelope

```ts
interface WorkerResult {
  version: 1;
  projectId: string;
  taskId: string;
  iterationId: string;
  workerAgentId: string;
  packetDigest: string;

  status: "completed" | "blocked" | "failed" | "partial";
  summary: string;
  artifacts: ArtifactRef[];
  checks: VerificationResult[];
  metrics: Record<string, number | string | boolean | null>;
  decisionsRequested: string[];
  deviations: string[];
  risks: string[];
  recommendedNextStep?: string;

  startedAt: string;
  endedAt: string;
  resultDigest: string;
}
```

The packet digest prevents a late result from being mistaken for the result of a newer assignment.

### 10.5 Verification

Verification order:

1. deterministic checks: schema validation, tests, linters, query results, checksums;
2. domain-specific programmatic evaluation;
3. separate evaluator agent using a rubric;
4. user review for subjective, strategic, regulated, or high-impact output.

An iteration cannot become `accepted` without a verification record or an explicit waiver event.

### 10.6 Retry policy

Retries are not identical repeats.

Before retrying, the Project Agent must classify the failure:

- transient infrastructure failure;
- missing context;
- invalid assumptions;
- implementation defect;
- failed verification;
- permission or credential gap;
- incompatible agent capability; or
- irreducible uncertainty.

Each retry records what changed. Default maximums should be conservative, configurable per project, and lower for external side effects.

### 10.7 Stop conditions

Every loop has at least one terminal bound:

- work accepted;
- task or project cancelled;
- user pauses;
- maximum attempts reached;
- time, token, or cost budget reached;
- deadline reached;
- required approval denied;
- unrecoverable error;
- no safe next action; or
- hypothesis classified as supported, rejected, or inconclusive.

---

## 11. Persistent context, memory, and lineage

### 11.1 Five distinct layers

Super Hive should preserve:

1. **Raw interaction record**  
   User messages, agent messages, tool events, and runtime traces.

2. **Append-only project event ledger**  
   Typed facts about plans, dispatches, results, verification, approvals, decisions, and status changes.

3. **Structured current snapshots**  
   Fast views for the Project Agent and UI: current plan, work states, team, blockers, budget.

4. **Context-compaction graph**  
   Compact knowledge nodes with references back to source events and session entries.

5. **Artifacts**  
   Files, commits, datasets, reports, external object IDs, and their digests.

These layers serve different purposes. Compaction is the Project Agent's retrieval-oriented knowledge base, but it is not the sole audit log.

### 11.2 Context assembly for one iteration

The Project Agent assembles worker context in this order:

1. role and immutable worker protocol;
2. current work packet;
3. relevant project constraints and decisions;
4. required input artifacts;
5. accepted dependency outputs;
6. selected context nodes;
7. the latest linked feedback or question; and
8. tool and permission availability.

It excludes:

- unrelated project chat;
- raw logs available through artifact references;
- other workers' private scratch work;
- superseded plan details unless needed for a decision;
- secrets not needed by the worker; and
- speculative future tasks.

### 11.3 Project event schema

```ts
interface ProjectEvent {
  id: string;
  projectId: string;
  sequence: number;
  timestamp: string;
  type:
    | "goal.updated"
    | "plan.proposed"
    | "plan.approved"
    | "plan.superseded"
    | "agent.assigned"
    | "agent.provisioned"
    | "iteration.created"
    | "iteration.delivered"
    | "iteration.acked"
    | "iteration.reported"
    | "iteration.blocked"
    | "verification.completed"
    | "decision.recorded"
    | "approval.requested"
    | "approval.resolved"
    | "budget.warning"
    | "task.completed"
    | "project.paused"
    | "project.completed"
    | "project.failed";
  actor: ChatActor;
  entityId?: string;
  correlationId: string;
  causationId?: string;
  payload: Record<string, unknown>;
  evidence: ArtifactRef[];
  previousDigest?: string;
  digest: string;
}
```

`correlationId` groups a user goal or iteration. `causationId` identifies the event that caused this event. Digest chaining makes accidental history rewriting detectable.

### 11.4 Recovery

On restart:

1. load the latest valid snapshot;
2. replay later project events;
3. reconcile runtime processes with durable assignments;
4. mark expired leases stale;
5. redeliver unacknowledged envelopes idempotently;
6. preserve acknowledged work as in progress;
7. ask workers for status only when needed; and
8. wake the Project Agent at the first unresolved decision point.

---

## 12. Marketplace and real-world capabilities

### 12.1 Capability types

| Capability | Role |
|---|---|
| Agent template | Worker identity, role, default model, and operating instructions |
| Skill | Reusable procedural knowledge for a task |
| Plugin | Packaged collection of skills, tools, connectors, or UI integration |
| Extension | Pi/runtime behavior such as planning, orchestration, telemetry, or compaction |
| MCP adapter | Standard tool/data interface to an external system |
| Native connector | Product-managed integration with credentials and policy |

### 12.2 Capability matching

Agent profiles and tasks should use stable capability IDs rather than matching free-form role names.

```ts
interface CapabilityRequirement {
  id: string;
  level: "required" | "preferred";
  permissions: string[];
  dataSensitivity?: "public" | "internal" | "confidential" | "restricted";
}
```

Suitability considers:

- required skills and tools;
- model modality and context needs;
- permission compatibility;
- data sensitivity;
- availability;
- historical task performance;
- estimated cost; and
- user preference.

### 12.3 Provisioning flow

```text
capability gap detected
→ search assigned agents
→ search installed marketplace entries
→ show or auto-select allowed candidate
→ obtain installation/connection approval if required
→ provision least-privilege agent
→ bind to project
→ start only when a ready packet exists
→ record provenance and version
```

The Project Agent must never fabricate an unavailable capability. It reports the gap and the proposed resolution.

### 12.4 External actions

External tool calls must include:

- actor and project;
- intended side effect;
- idempotency key when supported;
- approval reference;
- target account/workspace;
- sanitized request summary;
- result or failure;
- external object ID; and
- compensation or recovery path when applicable.

---

## 13. Safety, authority, and governance

### 13.1 Authority matrix

| Action | Worker | Project Agent | User |
|---|---:|---:|---:|
| Execute assigned reversible work | Yes | Yes | Yes |
| Change project plan | No | Within approved scope | Yes |
| Assign another worker | No | Yes | Yes |
| Provision an allowed agent | No | Policy-dependent | Yes |
| Expand permissions | No | Request only | Yes |
| Spend external money | No by default | Within explicit budget only | Yes |
| Publish/send/deploy | No by default | Policy-dependent approval | Yes |
| Delete or irreversibly mutate data | No by default | Explicit approval | Yes |
| Declare project complete | Recommend only | Yes, with evidence | Accept/reopen |

### 13.2 Approval policy

Approval may be:

- always required;
- pre-authorized within named scope and budget;
- required above a threshold;
- required only for irreversible actions; or
- denied.

Approvals are scoped to an exact action class, target, and limit. Approval for one email campaign does not authorize all future messaging.

### 13.3 Prompt injection and untrusted content

Content read from websites, email, documents, issue trackers, or other agents is data, not authority. Workers must not treat embedded instructions as project policy.

Connectors enforce:

- explicit tool schemas;
- target allowlists where appropriate;
- output sanitization;
- secret isolation;
- least privilege;
- user identity and tenant checks; and
- confirmation for consequential actions.

### 13.4 Cancellation

Cancellation is a first-class event. The system:

1. stops future dispatch;
2. sends cancellation to affected workers;
3. interrupts safe-to-stop runtime work;
4. records partial artifacts;
5. avoids compensating external actions without policy;
6. marks superseded results so late reports cannot reopen work; and
7. tells the user what did and did not stop.

---

## 14. Architecture in the existing Super Hive repository

### 14.1 Current stack

The existing application is an Electron + React + TypeScript local-first desktop app using the Pi runtime. It already has the correct overall separation:

```text
React renderer
  ↕ typed IPC
Electron control plane
  ↕ process events + watched files
Pi Project Agent and worker processes
  ↕ tools, extensions, files, connectors
Project workspace and external systems
```

### 14.2 Existing foundations to retain

| Existing seam | Current role | Direction |
|---|---|---|
| `ProjectChatView` + shared `ConversationArea` | Project Agent chat and streaming UI | Extend for multi-actor project messages |
| `ProjectChatComposer` | Plan/build controls, capabilities, `@` trigger | Add roster-backed structured mentions |
| `RightStatusBar` | Plan progress, workers, attention | Connect to iteration and budget state |
| `LiveStatusLine` and runtime queue | Safe live agent activity | Reuse in project and worker status bars |
| `superhive-pi-orchestration` | Roster, mailbox, task plan, task completion | Evolve into versioned iteration protocol |
| `mailbox-store` + `mailbox-watcher` | Shared project chat and direct worker inbox | Add typed delivery envelope and idempotency |
| `TaskRunner` | Dependency-aware worker dispatch and stale retry | Add safe parallel dispatch and verification states |
| `WorkPacket` | Durable worker assignment | Version to `WorkPacketV2` |
| `superhive-pi-spawn` | Marketplace-template worker provisioning | Add capability matching and approval policy |
| `superhive-pi-context` | Coordinator compaction graph and retrieval | Link nodes to project events and artifacts |
| `superhive-pi-truth` | Live settings, overview, inbox snapshots | Keep as bounded snapshot/schema owner |
| `superhive-pi-telemetry` | Usage and lifecycle journal | Add iteration correlation and normalized runtime state |
| `overview.json` | Project Agent-authored right-sidebar snapshot | Derive more fields from canonical iteration state |
| task repository and watcher | Durable task graph | Add plan version, verification, attempt, and lease fields |

### 14.3 Important current gaps

The current repository has much of the skeleton, but the complete vision still requires:

1. first-class loop iterations separate from tasks;
2. multi-actor chat rendering that retains worker identity and message linkage;
3. roster-backed `@agent` routing rather than only textual insertion;
4. one canonical delivery envelope with ack and idempotent retry;
5. safe parallel dispatch instead of only the first ready task;
6. verification and revision states;
7. a project event ledger and decision/approval lineage;
8. a worker-specific right status bar connected to its assignment;
9. capability-based marketplace selection;
10. project and iteration budgets;
11. crash-safe leases and late-result handling; and
12. evals for orchestration quality, not only unit correctness.

### 14.4 Proposed on-disk layout

Keep the current project-local, filesystem-backed design:

```text
<projectDir>/
└── agent/
    ├── chat.jsonl
    ├── manage.json
    ├── overview.json
    ├── project-events.jsonl
    ├── snapshots/
    │   └── current.json
    ├── plans/
    │   └── PLAN-0004.json
    ├── iterations/
    │   ├── ITER-0012.packet.json
    │   ├── ITER-0012.result.json
    │   └── ITER-0012.verification.json
    ├── approvals/
    │   └── APR-0008.json
    ├── context/
    │   ├── log.jsonl
    │   ├── index.json
    │   └── nodes/
    └── artifacts/
        └── index.jsonl

<workerDir>/
├── inbox.jsonl
└── assignments/
    ├── current.json
    └── <iterationId>.json
```

Large artifacts remain in their natural project locations; the artifact index stores references and digests rather than copying everything.

### 14.5 Source-of-truth rule

- `project-events.jsonl` is the append-only lineage.
- plan, task, iteration, approval, and artifact files are durable domain records.
- the task repository and `snapshots/current.json` are query-optimized projections.
- `overview.json` is a user-facing summary projection.
- `chat.jsonl` is the conversation record.
- the context graph is a retrieval projection.
- live renderer runtime state is ephemeral.

No renderer component or model prompt should independently invent project status.

The event ledger has one writer: the Electron control plane's project-event
store. Pi extensions submit validated file-drop commands, just as the current
task-plan watcher works; the control plane assigns the sequence, timestamp, and
digest before appending. This avoids competing agent processes assigning event
order or breaking the digest chain.

---

## 15. Implementation phases

Each phase is independently useful and keeps the existing architecture operational.

### Phase 0 — Freeze contracts and add compatibility tests

**Goal:** establish current behavior before schema changes.

Work:

- document chat, mailbox, task, work-packet, overview, and telemetry formats;
- add fixtures for existing v1 rows and packets;
- add schema-version readers;
- define ID, timestamp, digest, and actor conventions;
- define legal task and iteration transitions.

Acceptance:

- existing projects and agents still load;
- old `WorkPacket` v1 assignments remain readable;
- malformed or unknown versions fail safely;
- bundle-copy drift checks remain clean.

### Phase 1 — Multi-actor project chat and connected status

**Goal:** make the workforce visible before increasing autonomy.

Work:

- add actor metadata to persisted `ChatRow`;
- preserve worker identity when reading mailbox-written assistant rows;
- subscribe project chat to mailbox changes;
- render worker, Project Agent, user, and system messages distinctly;
- resolve `@` menu from project roster;
- link messages to task and iteration IDs;
- expose worker current assignment in agent right status bar;
- use the existing live activity queue for safe current-action summaries.

Acceptance:

- a worker post appears in project chat without reload;
- it is visually attributed to the correct worker;
- clicking the worker opens its chat;
- Project Agent → worker and worker → Project Agent messages show delivery state;
- the worker status bar and project workboard agree.

### Phase 2 — First-class loop iterations and lineage

**Goal:** make each dispatch/revision auditable.

Work:

- add `WorkPacketV2`, `WorkerResult`, `VerificationRecord`, and `ProjectEvent`;
- add append-only event writing with sequence, correlation, causation, and digest;
- add task fields for plan version and accepted result;
- store immutable iteration packet/result/verification records;
- build current snapshots by replay/reducer;
- correlate telemetry with project/task/iteration IDs.

Acceptance:

- every dispatch can be traced to a plan and triggering event;
- every accepted task links to a result and verification;
- a late result from a superseded packet is retained but not applied;
- state rebuild from the event ledger matches the saved snapshot.

### Phase 3 — Bounded orchestration loop

**Goal:** let the Project Agent reliably babysit workers across iterations.

Work:

- extend orchestration tools with typed dispatch, report, feedback, and verify operations;
- replace completion-by-claim with result + verification;
- classify blockers and failures;
- implement configurable attempt, time, token, cost, and tool-call limits;
- add approval and user-attention gates;
- add cancellation and pause propagation;
- wake the Project Agent only on decision events.

Acceptance:

- a failed check causes a focused revision packet;
- identical failure cannot recurse past the attempt limit;
- user-required decisions pause only affected work;
- cancellation prevents later dispatch and safely handles late reports;
- no loop path lacks a terminal bound.

### Phase 4 — Safe parallel execution

**Goal:** run independent work concurrently without corrupting shared state.

Work:

- dispatch all ready work up to `maxParallel`;
- enforce one active iteration per worker by default;
- add per-resource conflict keys;
- add worktree/job isolation adapters for engineering and experiments;
- serialize tasks with shared external side-effect targets;
- add worker leases and heartbeats;
- reconcile stale work after restart.

Acceptance:

- independent experiment branches run concurrently;
- dependency-gated work does not start early;
- two workers cannot claim the same exclusive resource;
- stale leases recover without duplicate accepted output;
- reducing `maxParallel` takes effect without losing work.

### Phase 5 — Verification and evaluator roles

**Goal:** make trustworthy completion the default.

Work:

- define verification schemas and rubrics;
- run deterministic checks before model evaluation;
- provision evaluator roles only when required;
- prevent evaluator context from blindly inheriting producer conclusions;
- allow explicit user waiver with recorded rationale;
- add evidence UI in chat, status bars, and final summaries.

Acceptance:

- tasks cannot become accepted without verification or waiver;
- failing evidence is visible and linked;
- evaluator disagreement creates a Project Agent decision point;
- final project completion is supported by accepted verification records.

### Phase 6 — Capability marketplace and connectors

**Goal:** obtain the smallest suitable workforce and let it act in real systems.

Work:

- add stable capability manifests to agent templates and tasks;
- match assigned agents before marketplace provisioning;
- install/activate approved skills, plugins, extensions, and MCP adapters;
- handle connection and credential gaps through user attention;
- enforce per-agent tool and data permissions;
- log external actions with idempotency and approval references.

Acceptance:

- a capability gap produces explainable candidates;
- no agent is provisioned outside policy;
- a connector cannot be used by an unapproved worker;
- external side effects are attributable and retry-safe;
- uninstalling or revoking a capability blocks future use cleanly.

### Phase 7 — Evals, operations, and product hardening

**Goal:** measure whether the workforce actually improves outcomes.

Work:

- create golden project scenarios for research, engineering, and business work;
- grade plan quality, context sufficiency, routing, verification, escalation, and stopping;
- add fault injection for crashes, malformed mail, stale workers, duplicate events, and connector failure;
- measure useful parallelism, retries, user interruptions, time, cost, and acceptance rate;
- add exportable audit reports;
- add retention, redaction, and project deletion policies.

Acceptance:

- project replay is deterministic at the state level;
- fault tests do not cause duplicate external side effects;
- orchestration regressions are caught by trace graders;
- the user can export a human-readable lineage;
- deletion clearly distinguishes project data, agent data, and external artifacts.

---

## 16. File-level implementation map

Expected areas of change:

```text
superhive/src/models/
  assistant-message.ts       actor, routing, task/iteration linkage
  work-packet.ts             versioned v1/v2 packet parsing
  project-event.ts           new event and domain schemas

superhive/src/storage/
  types.ts                   task/plan/iteration projection fields
  repositories/              projections and queries

superhive/src/pages/project-chat/
  ProjectChatView.tsx        mailbox/live multi-actor subscription
  ProjectChatComposer.tsx    roster-backed structured mentions
  components/                actor headers, delivery state, linked records

superhive/src/pages/agent-chat/
  AgentChatView.tsx          worker project/assignment state

superhive/src/components/layout/right-sidebar/
  RightStatusBar.tsx         iteration, worker, budget, attention projections
  AgentSettingsPanel.tsx     worker status surface
  sections/                  project and worker loop cards

superhive/electron/
  mailbox-store.ts           typed chat + envelope compatibility
  mailbox-watcher.ts         delivery/ack and renderer refresh
  task-runner.ts             bounded parallel dispatch
  tasks-file-watcher*.ts     versioned records and projections
  project-event-store.ts     new append/replay/digest module
  iteration-store.ts         new immutable record module
  runtime-status.ts          correlation and safe live activity
  ipc/                       typed plan/iteration/event queries

superhive-pi-orchestration/
  tools.ts                   typed loop operations
  project.ts                 packet/result and event-command file drops
  system-prompt.ts           bounded Project Agent and worker protocols

superhive-pi-context/
  ReferenceExtractor.ts      event, iteration, decision, artifact refs
  Retrieval.ts               packet-scoped retrieval

superhive-pi-telemetry/
  types/journal              project/task/iteration correlation

superhive-pi-spawn/
  template schema            capability requirements and provenance
```

New modules should be introduced only where an existing owner cannot safely hold the behavior. In particular, extend `TaskRunner`, `WorkPacket`, mailbox, truth, and context seams before introducing a general workflow framework.

---

## 17. Commands and verification

Run from the repository modules:

```bash
cd /Users/rishi/work/superhive-5/superhive
bun run typecheck
bun test
bun run build

cd /Users/rishi/work/superhive-5/superhive-pi-orchestration
bun test

cd /Users/rishi/work/superhive-5/superhive-pi-context
bun test

cd /Users/rishi/work/superhive-5/superhive-pi-truth
bun test
```

Cross-module drift checks remain required for canonical extensions and their bundled copies.

### 17.1 Test strategy

**Unit tests**

- schemas and version migration;
- legal state transitions;
- dependency readiness;
- concurrency and conflict keys;
- idempotency and digest validation;
- context selection;
- budget and retry bounds;
- event reduction and snapshot rebuild.

**Integration tests**

- user → Project Agent → worker → Project Agent → user flow;
- mailbox delivery and ack;
- worker restart during an iteration;
- Project Agent crash and recovery;
- duplicate and late results;
- plan revision with in-flight work;
- marketplace provisioning and permission denial;
- verifier acceptance and rejection.

**End-to-end tests**

- research experiment matrix;
- parallel engineering work with isolated worktrees;
- business workflow requiring connector approval;
- pause, resume, cancel, and export lineage.

**Agent evals**

- did the Project Agent create useful bounded packets?
- did it retrieve sufficient but not excessive context?
- did it assign the right capability?
- did it detect and resolve blockers?
- did it verify rather than trust claims?
- did it stop at the right time?
- did it escalate only when needed?
- did its final summary match the event lineage?

---

## 18. Code and schema conventions

Use explicit versioned records and narrow transitions:

```ts
const transitionIteration = (
  current: IterationStatus,
  event: IterationEvent,
): IterationStatus => {
  const next = ITERATION_TRANSITIONS[current]?.[event.type];
  if (!next) throw new Error(`Illegal iteration transition: ${current} → ${event.type}`);
  return next;
};
```

Conventions:

- IDs are generated by the trusted runtime, never by model prose.
- Server/runtime timestamps are authoritative.
- immutable records use content digests.
- snapshots contain `lastAppliedSequence`.
- external mutations use idempotency keys where supported.
- user-visible status never exposes raw hidden reasoning or secrets.
- tool arguments are sanitized before display or audit.
- schema changes include migration fixtures.
- one module owns each write path.

---

## 19. Boundaries

### Always

- persist a packet before dispatch;
- record causation and actor for material state changes;
- validate every model-produced structured object;
- keep retries, recursion, parallelism, and spend bounded;
- make external side effects idempotent or approval-gated;
- preserve worker identity in shared chat;
- verify before accepting work;
- keep the user-visible status truthful;
- recover from restart using durable state; and
- retain links from compact memory to source evidence.

### Ask first

- installing or connecting a new external capability;
- increasing permission, budget, or parallelism beyond user policy;
- publishing, sending, deploying, purchasing, or deleting;
- changing the canonical project goal or non-goals;
- waiving required verification;
- storing restricted data in a new system; and
- destructive schema or retention changes.

### Never

- let workers directly re-plan or recursively staff the project;
- use chat text alone as executable state;
- mark work complete solely because an agent says it is;
- silently discard failed or contradictory evidence;
- treat compaction as a lossless audit record;
- retry external actions without idempotency or confirmation;
- expose secrets in chat, status, telemetry, or lineage;
- allow unbounded agent-to-agent ping-pong; or
- hide a blocked, failed, cancelled, or inconclusive outcome.

---

## 20. Product success criteria

The vision is implemented when:

1. a user can approve a multi-hour plan and leave the app to execute it;
2. the Project Agent dispatches only bounded, versioned work packets;
3. independent work runs in parallel and dependent work waits;
4. workers can ask the Project Agent for context inside project chat;
5. the Project Agent can answer or escalate to the user without losing linkage;
6. project chat visibly attributes every participant and routing action;
7. project and worker status bars show truthful live and durable state;
8. assigned agents are reused before marketplace agents are provisioned;
9. capability installation and external actions obey approval policy;
10. every accepted result has evidence, verification, or an explicit waiver;
11. retries, spend, time, tool use, and agent recursion are bounded;
12. a crash or restart does not duplicate accepted work or side effects;
13. the Project Agent's compaction graph retrieves relevant prior knowledge;
14. raw lineage remains independently auditable;
15. the final report can trace claims back to artifacts and events; and
16. the system can truthfully conclude success, failure, rejection, or uncertainty.

---

## 21. Open product decisions

These decisions should be resolved before the corresponding implementation phase:

1. Is project-plan approval mandatory by default, or can a project be configured for automatic execution?
2. Which external action classes require approval in the first release?
3. What are the default limits for attempts, parallel agents, tokens, cost, wall time, and tool calls?
4. Should the user be able to address a worker directly, or should all direct mentions visibly route through the Project Agent?
5. Which marketplace metadata is trusted, and who can publish agent templates?
6. What isolation primitives exist for non-code work where Git worktrees do not apply?
7. What retention and redaction policy applies to raw tool traces and external content?
8. Are hidden model reasoning traces stored at all, or only safe activity summaries and tool evidence?
9. When may the Project Agent automatically choose and activate an installed capability?
10. What is the minimum verification bar for marketing, sales, product, and research outputs?
11. How should external compute budgets for experiments be reserved and reconciled?
12. Which final actions require the user to explicitly accept completion?

Until answered, the safe default is: visible planning, least privilege, conservative limits, explicit approval for consequential actions, and evidence-backed completion.
