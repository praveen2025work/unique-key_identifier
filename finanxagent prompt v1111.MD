# Implementation Prompt: Agent One PnL Workflow Orchestration UI (React, Frontend Only)

Copy everything below this line into Claude Opus.

---

You are a senior frontend architect. Implement a production-grade **React frontend only** for a finance workflow orchestration UI that drives an LLM agent platform ("Agent One"). The backend APIs already exist — do NOT design or implement backend endpoints. Consume them through a typed API client layer (`src/api/`) with the actual endpoint calls stubbed behind interfaces; I will wire real URLs. Mock everything with MSW for development and tests. Follow this spec exactly. Where the spec is silent, make industry-standard choices and document them in DECISIONS.md.

## Tech Stack (mandatory)

- React 18 + TypeScript (strict mode)
- TanStack Query v5 for all server state (queries + mutations; no manual fetch in components)
- Zustand for local UI state only (never duplicate server state)
- XState (or a well-typed reducer state machine) for workflow/step/connection lifecycle — explicit state machines, not scattered booleans
- shadcn/ui + Radix primitives, Tailwind CSS
- React Hook Form + Zod for config forms
- Vitest + React Testing Library + MSW (including WebSocket mocking) for tests

## Domain Model

A **Workflow** consists of 5 **Steps**, default order:

1. `FOBO_REC` — FOBO Reconciliation
2. `PLEX` — PLEX
3. `FLASH_VS_FORMAL` — Flash vs Formal
4. `ADJUSTMENTS` — Adjustments
5. `SIGN_OFF` — Sign Off

Each step executes against an Agent One chat session: skill files + data files are uploaded, a prompt is placed in the chat text box, and the LLM is triggered.

### Workflow Modes (workflow-level default)

- **AUTO**: System uploads the step's configured skills + data files, places the configured prompt in the chat text box, and triggers automatically. On step completion the workflow auto-advances and repeats through all steps until Sign Off completes.
- **MANUAL**: System uploads configured skills + data files and pre-fills the prompt — but does NOT trigger. User may upload more files, edit the prompt, and triggers manually. Advancement after completion is the same as AUTO.
- **FULL_MANUAL**: Nothing pre-uploaded or pre-filled. User uploads all files, writes the prompt, triggers — fully user-driven per step. Advancement after completion is the same as the other modes.

### Step-Level Mode Override

Each step can override the workflow mode: `effectiveMode = step.modeOverride ?? workflow.mode`. Example: workflow AUTO, ADJUSTMENTS overridden to MANUAL — steps 1–3 run automatically, step 4 pre-fills and waits for user trigger, then the workflow resumes automatically.

### Execution Order / Parallelism

- Default: strictly sequential — step N+1 starts only after step N is marked complete.
- Custom config (user-configurable, stored in backend): steps declare `dependsOn: StepId[]` forming a dependency DAG, allowing designated steps to run in parallel and converge. Validate client-side (no cycles; SIGN_OFF terminal). Render the plan visually so the user can see which steps run in parallel.

## Core Behaviors (hard requirements)

### 1. Start Workflow
"Start Workflow" initiates the run. Step 1 enters PROCESSING; only when marked complete does the next eligible step (per DAG) begin. Stepper/progress rail with per-step status: `PENDING | UPLOADING | READY (awaiting manual trigger) | RUNNING | COMPLETED | FAILED | SKIPPED`.

### 2. Session + Upload Deduplication Guardrails
- Each step run creates (or reuses) an Agent One session.
- **Never upload the same skill or data file twice** into the same session — including on retry. Before any upload, consult the session's upload manifest (from the backend, hydrated via TanStack Query) and skip files already present. Applies in AUTO and MANUAL.
- On **screen refresh** or **retry**, if a session already exists for the step, **reattach** — never create a new session, never re-upload existing files, never re-place an already-sent prompt. All session/manifest state is server-persisted; the UI must fully rehydrate from queries on load. Component memory is never the source of truth.

### 3. Session Reconnection & Connection Resilience — CRITICAL FOR UI STABILITY

This is the most important stability requirement. The UI talks to Agent One sessions over a live connection (WebSocket for streaming agent responses/step events, HTTP for commands). Connections WILL drop (network blips, laptop sleep, VPN renegotiation, long-running steps, backend restarts). The UI must survive all of this without losing workflow state, duplicating work, or requiring the user to start over.

Model a dedicated **connection state machine**, separate from workflow state:

```
CONNECTED → (socket close / heartbeat timeout) → RECONNECTING
RECONNECTING → (backoff attempts) → CONNECTED | DEGRADED (fallback to polling) | OFFLINE
OFFLINE → (network restored / user retry) → RECONNECTING
```

Required behaviors:

- **Heartbeat/liveness**: ping-pong or heartbeat over the WebSocket; if no pong within a timeout, treat the connection as dead even if the socket appears open (half-open connection detection).
- **Automatic reconnect with exponential backoff + jitter** (e.g., 1s → 2s → 4s → … capped at 30s), infinite retries while the tab is open. Reconnect immediately on `navigator.onLine` returning true and on `visibilitychange` to visible (laptop wake).
- **Session reattach, not recreate**: on reconnect, resubscribe to the SAME session/run IDs (persist them server-side; keep sessionId/runId in the URL or rehydratable query so even a full page reload reattaches). Never spawn a new Agent One session because a socket dropped.
- **State resync on reconnect**: after reattaching, refetch run state + session manifest + message history (TanStack Query `invalidateQueries`) to reconcile anything missed while disconnected — the agent keeps running server-side during a client disconnect, so the step may have COMPLETED or FAILED in the gap. The UI must converge to server truth, including auto-advancing to the next step if AUTO mode progressed while disconnected.
- **Missed-event recovery**: if the event stream supports sequence numbers / lastEventId, send it on resubscribe to replay missed events; otherwise rely on full state refetch. Never assume the stream is gap-free.
- **Polling fallback (DEGRADED mode)**: if WebSocket reconnection keeps failing but HTTP works, fall back to TanStack Query polling (`refetchInterval` ~3–5s while any step is RUNNING) so the workflow remains usable. Upgrade back to WebSocket silently when it recovers.
- **In-flight action safety**: commands issued during a disconnect (trigger, mark complete, send message) must not fire blindly or duplicate. Queue user intents with idempotency keys, or block the action with a clear "reconnecting…" affordance — pick one strategy, apply it consistently, document it. A trigger must never execute twice because of a reconnect race.
- **Upload resilience**: an upload interrupted by a disconnect is verified against the session manifest on reconnect before any re-attempt — the dedupe guardrail (section 2) is what makes reconnect-retry safe.
- **Visible connection status**: subtle indicator when CONNECTED; non-blocking banner "Connection lost — reconnecting (attempt N)…" when RECONNECTING; explicit DEGRADED notice when on polling fallback; manual "Reconnect now" button in OFFLINE. Never hard-block the whole UI behind a modal for a connection blip.
- **No state loss**: draft prompt text typed by the user must survive reconnects and (ideally) refresh — keep drafts in Zustand with persistence, keyed by step/session.

### 4. Retry
Retry is available whenever a session doesn't go through on Agent One (session failure, trigger failure, agent error, timeout). Retry reuses the existing session where possible; dedupe guarantees no duplicate uploads. FAILED state shows the error reason + Retry button per step. Retry respects effective mode (AUTO re-triggers automatically once resources are confirmed; MANUAL returns to READY).

### 5. Rerun After Completion
After a step or the whole workflow COMPLETES, expose **Rerun**. Behavior behind config flag `rerunStrategy: "new-session" | "reuse-session"`. Whole-workflow rerun resets all steps to PENDING and restarts per the DAG.

### 6. Chat Text Area — Always Unblocked
The prompt/chat text area must NEVER be disabled, in any mode, workflow state, or connection state (during RECONNECTING the user can still type; only the send action may queue/block per the in-flight strategy). Pre-filled prompts populate the same editable text area. Free-form messages mid-step go to the same step session as additional chat turns.

### 7. Backend-Driven Configuration (consume only)
Workflow definition, per-step config (mode override, skill/data file refs, prompt template), DAG, run state, session IDs, and upload manifests are all served by existing backend APIs. Build a typed client interface for them and a Settings screen (React Hook Form + Zod) that reads/writes config through that client. Do not invent endpoint shapes beyond what the client interface needs — leave the transport thin and swappable.

## State Machine (per step)

```
PENDING → (dependencies met) → PREPARING (uploads, dedupe-checked)
PREPARING → AUTO: RUNNING (auto-trigger) | MANUAL/FULL_MANUAL: READY
READY → (user trigger) → RUNNING
RUNNING → (agent success + mark complete) → COMPLETED
RUNNING / PREPARING → (error) → FAILED
FAILED → (retry) → PREPARING (reattach session, skip existing uploads)
COMPLETED → (rerun) → PENDING (new run record)
```

Workflow-level: RUNNING while any step active; COMPLETED when SIGN_OFF completes; FAILED-PARTIAL if a step failure blocks the DAG. Connection state machine runs alongside and never mutates workflow state directly — it only gates transport and triggers resyncs.

## UI Requirements

- Single-page workflow console: left rail = stepper/DAG view with statuses; center = active step's chat panel (message history, file upload zone, always-editable prompt text area, Trigger button); right/drawer = step config summary (effective mode, files, prompt template).
- Mode badges per step (AUTO / MANUAL / FULL MANUAL — show override vs inherited).
- Per-session uploaded-files list with "already uploaded — skipped" indicators when dedupe fires.
- Connection status indicator + reconnect banner as specified in section 3.
- Toasts for state transitions; error banner with reason + Retry on failure.
- Settings page: workflow mode, per-step overrides, DAG editor (dependsOn multi-select with cycle validation), rerun strategy.
- Accessible (Radix), keyboard operable, responsive.

## Testing (must include)

MSW handlers with failure/disconnect injection. Tests:
1. AUTO advances through all 5 steps
2. MANUAL step pauses at READY, proceeds on trigger
3. Retry does not re-upload files already in the manifest
4. Refresh mid-run rehydrates session with no duplicate uploads
5. WebSocket drop mid-step → RECONNECTING → reattach → state resync shows step completed during the gap and workflow auto-advances
6. Repeated WS failure → DEGRADED polling fallback keeps run state updating; recovers to WS
7. Trigger clicked during RECONNECTING never double-fires (idempotency)
8. Draft prompt text survives reconnect and refresh
9. Parallel DAG runs two steps concurrently and converges
10. Text area enabled in every workflow and connection state
11. Rerun after completion resets correctly

## Deliverables

1. Full project: typed API client interfaces, workflow + connection state machines, components, MSW mocks.
2. DECISIONS.md documenting assumptions (especially the in-flight action strategy and reconnect parameters).
3. README with run instructions.

Build iteratively: types + state machines (workflow AND connection) first, then API client interfaces + MSW, then UI, then tests. Confirm both state machine designs with me before writing UI code if anything is ambiguous.
