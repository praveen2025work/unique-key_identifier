---
name: react-finance-agent
description: React coding standards and workflow-domain rules for the FinanceAgent P&L workflow UI (FOBO Rec, PLEX, Flash vs Formal, Adjustments, Commentary). ALWAYS use this skill when writing, reviewing, or fixing any code in the FinanceAgent component tree, the workflow session manager, the LLM WebSocket client, context injection, step status logic, Mark-as-Complete visibility, rerun/versioning, or session reconnection. Trigger on any mention of workflow steps, sessions, context V1/V2, PnL/business date, auto/manual/full-manual modes, or WebSocket reconnect issues — even if the user just says "fix the step logic" or "the button shows at the wrong time."
---

# React FinanceAgent — Coding Standards & Domain Rules

Read `FINANCE_AGENT_MASTER_PROMPT.md` (repo root) for the full invariants (I1–I11),
decision table, and use cases UC1–UC7. That document is the source of truth for behavior.
This skill covers **how to write the code**.

## 1. Golden rules

1. **Minimal diffs.** This app is 95% working. Fix the failing condition; never refactor
   working flows, rename files, or introduce libraries/state managers.
2. **Simple over clever.** A non-React developer must be able to read every function.
   Plain `if/else` on named booleans beats ternary chains, HOCs, and generic abstractions.
3. **One code path per behavior.** Injection, completion, and reconnection logic must be
   shared across AUTO / MANUAL / FULL_MANUAL. If you find mode-specific copies, unify them
   behind one helper — that duplication is the root cause of most current bugs.
4. **Decision logic = pure functions, not JSX.** Components render; helpers decide.

## 2. Required pure helpers (create in `src/workflow/logic/`, unit-test each)

```ts
// All side-effect free. All fully covered by table-driven tests.
shouldInjectContext(step: StepState, sessionFiles: string[], wf: WorkflowState): boolean
buildInjectedPrompt(userPrompt: string, ctx: PrevStepContext, version: number): string
deriveLlmRunState(session: AgentSessionSnapshot): LlmRunState   // incl. DISCONNECTED_INCOMPLETE
canShowMarkComplete(step: StepState): boolean                   // IN_PROGRESS && !RUNNING
applyRerunReset(steps: StepState[], rerunStepId: string): StepState[]  // lock downstream
nextRequiredContextVersion(step: StepState): number
```

Test style — table-driven, mirroring the decision table:

```ts
test.each([
  ['contextOn false',        offWf, step2, [],              false],
  ['step 1 never injects',   wf,    step1, [],              false],
  ['first send, v1 needed',  wf,    step2NeedsV1, [],       true ],
  ['file already uploaded',  wf,    step2NeedsV1, ['context_v1'], false],
  ['follow-up prompt',       wf,    step2Injected, ['context_v1'], false],
])('%s', (_n, w, s, files, expected) =>
  expect(shouldInjectContext(s, files, w)).toBe(expected));
```

## 3. State: single source of truth

- `WorkflowState` (see master prompt §4) lives in **one** reducer/context. No component
  keeps its own copy of step status, run state, or version counters in `useState`.
- Server is authoritative after reload: rehydrate from the Workflow Session Manager
  (`userId + pnlName + businessDate`), then reconcile each active step's session against
  the **Agent API** before rendering run state. Never trust socket-derived state after refresh.
- Derive, don't store: `LlmRunState` and Mark-as-Complete visibility are **computed** from
  session data, never set as independent flags that can drift.

## 4. WebSocket rules

- One socket per active session, owned by a single `useLlmSocket(sessionId)` hook.
- On mount/reconnect: **first** fetch session snapshot via Agent API, render it, **then**
  subscribe to live updates. (Prevents the "empty screen after refresh" bug.)
- On disconnect mid-run: do not silently retry into a dead run. Derive
  `DISCONNECTED_INCOMPLETE` per master prompt §4 and surface a re-trigger UI.
- Re-trigger **reuses the same sessionId**. Creating a new session on reconnect is a bug.
- Clean up listeners in the hook's effect return. No global socket singletons touched
  from components.

## 5. Context injection implementation

- Injection happens in the **send pipeline only** (`sendPrompt()` service). The pipeline
  produces a `SentMessage { userPrompt, injectedContext, payload }` (see master prompt §6):
  the payload goes to the LLM; the UI renders `userPrompt` as the message bubble and
  `injectedContext` as a **collapsible context card** — collapsed one-liner
  (`📎 Context V{n} · from {prevStepName} · {k} files`), expanded labeled fields
  (Previous step, Session ID, Summary, Generated files). Build a small
  `<ContextCard injectedContext={...} />` component; never render the raw payload string
  in chat, and never re-parse the payload to build the card.
- Order of operations on an injecting send:
  1. `shouldInjectContext(...)` → true
  2. Upload `context_v{n}` file to session (await success)
  3. Send `buildInjectedPrompt(...)` over the socket/API
  4. On confirmed send: `lastInjectedContextVersion = n` (persist via session manager)
- If step 2 of that sequence already succeeded previously (file exists), skip 2 **and** 3's
  context portion — repair the local counter instead (idempotency, invariant I4).
- The injected header must instruct the LLM explicitly:
  `[CONTEXT V{n} — process this version; supersedes V{n-1}]`.

## 6. Component conventions

- Function components + hooks only; no classes, no `useEffect` chains that set state
  another effect reads — compute during render or in the reducer.
- Naming: `StepCard`, `StepPromptBox`, `SessionOutputPanel`, `WorkflowStepper`,
  `useWorkflowState`, `useLlmSocket`, `useSessionSnapshot`.
- Props down, events up. A `StepCard` receives `step`, `canComplete`, `onSend`,
  `onMarkComplete`, `onRerun` — it never reaches into workflow state itself.
- Loading/empty/error states are explicit branches at the top of the component,
  not nested ternaries in JSX.
- No `any`. Reuse the canonical types from the master prompt §4.

## 7. Definition of done for any change

1. All helper unit tests pass (including the decision-table tests).
2. Walk UC1–UC7 from the master prompt against the diff; every one PASS.
3. `grep` confirms injection/completion logic exists in exactly one place.
4. Diff summary lists each invariant (I1–I11) the change enforces.
