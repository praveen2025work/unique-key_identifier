# FinanceAgent Workflow Component — Master Fix Prompt (Claude Opus, 1M context)

> Paste this entire document as the first message. Attach / open the repo so the full
> FinanceAgent component tree, WebSocket client, session manager, and API layer are in context.

---

## 1. YOUR ROLE AND MISSION

You are a senior React engineer fixing an **existing, ~95% working** finance agent workflow UI.
Your job is **NOT** to rewrite or redesign it. Your job is to:

1. Read the existing code fully before proposing anything.
2. Identify exactly where the current code violates the **invariants** in Section 5.
3. Apply the **smallest possible, targeted fixes** — minimal diffs, no refactors, no new libraries,
   no new state-management patterns unless an invariant is impossible to satisfy without one.
4. Keep the code **simple enough that a non-React developer can follow it**. Prefer plain
   functions, explicit `if/else` on named conditions, and small pure helper functions
   (e.g. `shouldInjectContext(...)`, `canShowMarkComplete(...)`) over clever abstractions.

### Hard rules for you (the agent)

- **NEVER** guess behavior. If the code contradicts this document, this document wins.
- **NEVER** change working flows (happy path already works). Fix only the failing scenarios.
- **BEFORE writing code**, output: (a) the files you will touch, (b) which invariant each change
  enforces, (c) the exact condition being added/changed. Wait for confirmation if interactive;
  otherwise proceed but keep this analysis at the top of your answer.
- **AFTER writing code**, walk through Use Cases UC1–UC7 (Section 7) step by step against your
  changed code and state PASS/FAIL for each. If any FAIL, fix before finishing.
- All decision logic must live in **pure, unit-testable helper functions** — not inline JSX.

---

## 2. DOMAIN GLOSSARY

| Term | Meaning |
|---|---|
| **Workflow** | A run of the 5-step P&L process, uniquely keyed by `(userId, pnlName, businessDate)`. |
| **Steps (default)** | 1. FOBO Rec → 2. PLEX → 3. Flash vs Formal → 4. Adjustments → 5. Commentary/Sign-off. User-configurable; steps may be sequential or parallel after step 1. Config is saved to backend. |
| **Session** | A backend LLM session attached to one step activation. Holds files (uploaded + generated), prompts, LLM messages, MCP tool calls. Reached via the Agent API; live output streams over **WebSocket**. |
| **Mode: AUTO** | System attaches files + skills to the session, places the prompt, and **auto-triggers** the LLM when the step activates. |
| **Mode: MANUAL** | System attaches files + skills and **pre-fills the prompt box**, but the **user clicks Send**. |
| **Mode: FULL_MANUAL** (default) | User uploads all files/skills, writes the prompt, and triggers everything. System does nothing automatically. In FULL_MANUAL, per-step auto/manual flags are ignored — everything is user-driven. |
| **Context-On** | Default ON per workflow. From step 2 onward, the completed previous step's context (previous session ID, summary, generated files) is concatenated by the system to the user's **first** prompt of the step, and also attached to the session as a **versioned context file** (`context_v1`, `context_v2`, …). The user types only their own prompt; the attached context is shown in chat history as a readable, collapsible "Context V{n}" card (see I5) — never as a raw string. |
| **Context version (V1/V2…)** | Each time an upstream step is **rerun and re-completed**, the downstream context is stale, so the next injection bumps the version and the injected prompt must tell the LLM to process the new version. |
| **Rerun** | User reopens a completed step. All downstream steps reset to `LOCKED`. When the rerun step completes, the next step activates and requires a **new context version** on its first prompt. Step 1 rerun never needs context injection. |

---

## 3. ARCHITECTURE CONTEXT (existing, do not redesign)

```
React FinanceAgent UI
   │
   ├── Agent API (REST)          → create/get sessions, upload files, list session files,
   │                               list messages / MCP tool calls / generated files,
   │                               session status (RUNNING | COMPLETED | IDLE)
   │
   ├── LLM WebSocket             → live streaming of LLM output for the ACTIVE session.
   │                               Connection is per browser session. A page refresh
   │                               DROPS the socket — no live notifications after that.
   │
   └── Workflow Session Manager  → persists workflow + step + session state at
                                   (userId, pnlName, businessDate) level:
                                   step statuses, sessionIds per step, mode,
                                   contextOn flag, context version counters,
                                   lastInjectedContextVersion per step.
```

**Critical backend behavior:** if the LLM **finished** while the socket was dead, everything
(messages, MCP tool calls, generated files) is retrievable from the Agent API on reload.
If the LLM **had not finished** (or never ran), the reloaded session shows only the prompt
with no LLM output — the run is effectively lost and must be re-triggered by the user.

---

## 4. CANONICAL STATE MODEL

Use (or map existing code onto) these shapes. Do not invent parallel sources of truth.

```ts
type WorkflowMode = 'AUTO' | 'MANUAL' | 'FULL_MANUAL';

type StepStatus =
  | 'LOCKED'        // upstream not complete (or reset by an upstream rerun)
  | 'IN_PROGRESS'   // active step, session attached
  | 'COMPLETED';    // user clicked Mark as Complete

type LlmRunState =
  | 'IDLE'          // session exists, nothing running
  | 'RUNNING'       // LLM executing (socket streaming, or API says RUNNING)
  | 'COMPLETED'     // LLM finished producing output for last trigger
  | 'DISCONNECTED_INCOMPLETE'; // derived on reload: prompt exists but no LLM
                               // output / MCP calls, and API status is not RUNNING/COMPLETED

interface StepState {
  stepId: string;              // 'FOBO' | 'PLEX' | 'FVF' | 'ADJ' | 'COMMENTARY' | custom
  order: number;
  status: StepStatus;
  sessionId: string | null;
  llmRunState: LlmRunState;
  requiredContextVersion: number;      // bumped when upstream rerun completes; step1 = 0
  lastInjectedContextVersion: number;  // 0 = never injected
}

interface WorkflowState {
  key: { userId: string; pnlName: string; businessDate: string };
  mode: WorkflowMode;          // default FULL_MANUAL on Start Workflow
  contextOn: boolean;          // default true
  steps: StepState[];
  started: boolean;
}
```

**Derivation rule for `DISCONNECTED_INCOMPLETE` (on load/refresh):**
session has ≥1 user prompt AND zero LLM output messages AND zero MCP tool calls AND
Agent API session status is not `RUNNING` → the socket died mid-run. Show a
"Connection was lost — please re-trigger" state. **Reuse the same session; never create a new one.**

---

## 5. INVARIANTS (the system MUST always satisfy these)

**I1 — Entry point.** Given `(pnlName, businessDate)` with no started workflow → show only
**Start Workflow**. Clicking it: mode = FULL_MANUAL, contextOn = true, step 1 → `IN_PROGRESS`
with a session attached; steps 2..n → `LOCKED`.

**I2 — Step 1 never gets context injection.** No versioning, no concatenation — ever,
including reruns.

**I3 — Context injection is exactly-once per required version.** For step N ≥ 2 with
`contextOn`, inject previous-step context into the outgoing prompt **iff**
`lastInjectedContextVersion < requiredContextVersion`. On successful send:
set `lastInjectedContextVersion = requiredContextVersion`, and attach the context file to the
session as `context_v{requiredContextVersion}`. Follow-up prompts in the same step **must not**
re-inject.

**I4 — Injection idempotency is verifiable from session files.** Before injecting, check
session files: if `context_v{requiredContextVersion}` already exists in the session,
**do not inject again** (covers refresh-after-send races). Session files are the source of
truth; the local counter is a cache.

**I5 — Injection is visible but formatted, never raw.** The user does not type or edit the
context — the system builds it at send time — but the chat history MUST show that context was
attached, rendered as a **readable, structured block**, not a raw concatenated string:
- Render the user's message bubble normally, with a distinct **"Context V{n} attached"**
  section above or inside it (collapsible/expandable is preferred).
- Collapsed view: one line — `📎 Context V{n} · from {prevStepName} · {k} files · session {shortId}`.
- Expanded view: a formatted card with labeled fields — Previous step, Session ID, Summary
  (rendered as text, not JSON), Generated files (as a list), and the version instruction.
- Never dump the raw payload/JSON/concatenated string into the chat.
- The prompt **box** (input area) still contains only the user's own prompt; the context block
  appears in the sent message history only.
- The payload sent to the LLM is still the full concatenated prompt (Section 6 shape) —
  the readable block is a UI rendering of that same data, driven by a structured
  `injectedContext` object stored with the message, not by re-parsing the payload string.

**I6 — Rerun resets downstream.** Rerun of step N: step N → `IN_PROGRESS` (same or new session
per existing backend behavior), steps N+1..end → `LOCKED`. When step N is marked complete:
step N+1 → `IN_PROGRESS` and `requiredContextVersion` of step N+1 increments by 1.
(Deeper steps get their bump when their own upstream completes, cascading naturally.)

**I7 — Mark as Complete visibility.** Show the button iff
`status === 'IN_PROGRESS' && llmRunState !== 'RUNNING'`. While `RUNNING`, hide/disable it —
the user must never advance past a live LLM run. When shown and clicked: step → `COMPLETED`,
next step activates per I6/I1.

**I8 — Refresh, LLM finished.** On reload, if the Agent API shows completed output for the
step's session → render all messages, MCP tool calls, and generated files from the API.
User may send follow-up prompts (no context re-injection per I3/I4) or Mark as Complete.

**I9 — Refresh, LLM not finished.** On reload, if state derives to `DISCONNECTED_INCOMPLETE`
→ show the prompt that was sent, plus a clear re-trigger affordance. The user re-sends
(they may copy the visible context/prompt from the screen). Same session is reused.
Context handling on the re-send follows I3/I4 — if `context_v{n}` is already a session file,
do not append it again to the prompt payload... **unless the file upload also failed**
(file absent) in which case a fresh injection is required (I3 fires normally).

**I10 — Mode semantics.**
- AUTO: on step activation → attach files/skills, place prompt, auto-send (injection rules I2–I5 apply at that auto-send).
- MANUAL: on step activation → attach files/skills, pre-fill prompt box; injection happens when the user clicks Send.
- FULL_MANUAL: no automatic attachment or prompting; injection still happens at the user's first Send, system-built and rendered per I5 (context-on is a workflow feature, not a mode feature).

**I11 — Persistence.** All of `WorkflowState` (statuses, sessionIds, mode, contextOn,
version counters) survives refresh via the Workflow Session Manager keyed by
`(userId, pnlName, businessDate)`. The UI must rehydrate from it on load, then reconcile
`llmRunState` against the Agent API (never trust only local/socket state after a reload).

---

## 6. CONTEXT INJECTION DECISION TABLE

Implement as a pure function — `shouldInjectContext(step, sessionFiles, workflow): boolean` —
and use it everywhere a prompt is sent.

| # | contextOn | step order | requiredV vs lastInjectedV | `context_v{requiredV}` in session files? | Inject? |
|---|---|---|---|---|---|
| 1 | false | any | — | — | **No** |
| 2 | true | 1 | — | — | **No** (I2) |
| 3 | true | ≥2 | required > lastInjected | No | **Yes** → inject, upload file, set lastInjected = required |
| 4 | true | ≥2 | required > lastInjected | Yes | **No** — repair counter: lastInjected = required (I4) |
| 5 | true | ≥2 | required == lastInjected | — | **No** (follow-up prompt) |

Injected payload shape (what goes to the LLM):

```
[CONTEXT V{n} — process this version; supersedes V{n-1} if present]
prevStepSessionId: ...
prevStepSummary: ...
prevStepGeneratedFiles: [...]
---
{user's actual prompt}
```

Alongside the payload, store a **structured object** on the sent message so the UI can render
the readable context block (I5) without parsing the payload string:

```ts
interface InjectedContext {
  version: number;             // n
  prevStepId: string;
  prevStepName: string;        // e.g. "FOBO Rec"
  prevSessionId: string;
  summary: string;
  generatedFiles: { name: string; fileId: string }[];
}

interface SentMessage {
  userPrompt: string;                    // shown as the user's bubble
  injectedContext: InjectedContext | null; // rendered as the collapsible context card
  payload: string;                       // full concatenated string sent to LLM
}
```

---

## 7. USE CASES — verify each against your fix, report PASS/FAIL

**UC1 — Happy path (FULL_MANUAL).**
Start Workflow → step 1 IN_PROGRESS. User uploads files/skills, types prompt, Send. LLM runs
(Mark as Complete hidden), finishes (button appears). Complete → step 2 IN_PROGRESS. First Send
on step 2: context V1 injected + `context_v1` file attached; chat shows the user's prompt with
a collapsible "Context V1 attached · from FOBO Rec" card (I5). Follow-up prompts: no
re-injection, no context card. Repeat through steps 3–5. Every step N ≥ 2 gets exactly one V1 injection.

**UC2 — Full rerun after all complete.**
All 5 done. User reruns step 1 → steps 2–5 LOCKED, step 1 IN_PROGRESS (no injection, I2).
User works, completes → step 2 IN_PROGRESS with requiredContextVersion = 2. First Send on
step 2 injects **V2** (payload says "process as V2"; chat shows a "Context V2 attached" card),
uploads `context_v2`. Second prompt on step 2: no injection, no card. Completing step 2 bumps step 3 to required V2, and so on down the chain.

**UC3 — Partial rerun.**
Steps 1–2 complete, step 3 IN_PROGRESS. User reruns step 1 → steps 2–5 LOCKED. Identical
mechanics to UC2 from here. (Same code path — there must be no special case.)

**UC4 — Refresh mid-run (LLM incomplete).**
Step 2, first Send happened (context V1 injected, file uploaded). User refreshes before LLM
finishes. Reload: socket gone; session shows prompt but no output → `DISCONNECTED_INCOMPLETE`.
UI offers re-trigger. User re-sends. `context_v1` exists in session files → **no second
injection** (row 4). If the file upload had failed too → inject fresh (row 3).

**UC5 — Refresh after LLM completed.**
Step running, user refreshes, but LLM had already finished. Reload: API returns full output,
MCP calls, generated files → render everything. Mark as Complete visible. Follow-ups allowed,
no re-injection.

**UC6 — Follow-up prompts within a step.**
Any step, any number of prompts after the first: never re-inject, never re-upload context,
never create a new session.

**UC7 — Modes.**
Same workflow in AUTO: activation of step 2 auto-attaches, auto-prompts, auto-sends —
injection happens at that auto-send exactly once (all UC1–UC6 logic identical).
MANUAL: attach + pre-fill, user sends. FULL_MANUAL: user does everything. The injection and
completion logic is **mode-independent** — verify there is one shared code path.

---

## 8. KNOWN FAILURE AREAS IN CURRENT CODE (look here first)

1. Context gets appended on **every** prompt, or re-appended after refresh (violates I3/I4).
2. Version is not bumped after upstream rerun, so stale V1 context is reused (violates I6).
3. Mark as Complete rendered while LLM is RUNNING, or not rendered when IDLE (violates I7).
4. After refresh, UI trusts local/socket state instead of reconciling with the Agent API
   (violates I11), so completed runs look empty or dead runs look alive.
5. Re-trigger after disconnect creates a **new session** instead of reusing (violates I9).
6. Mode-specific branches duplicate injection logic, so fixes in one mode miss the others
   (violates UC7's single-code-path requirement).

## 9. DELIVERABLE FORMAT

1. **Findings table**: file → line/area → invariant violated → one-line diagnosis.
2. **Minimal diffs** per file (unified diff or full changed function only).
3. New/changed pure helpers: `shouldInjectContext`, `deriveLlmRunState`,
   `canShowMarkComplete`, `applyRerunReset` — each with a 3–5 case unit test.
4. **UC1–UC7 walkthrough** with PASS/FAIL against the changed code.
5. One-paragraph summary of what changed and what was deliberately left untouched.
