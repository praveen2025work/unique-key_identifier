# Build Prompt — Integrate Agent One Finance (REST + WebSocket) into my React UI

## Role & objective
You are a senior React/TypeScript engineer. I have an existing React app (converted from a Barclays-blue "Agent One PnL Workflow" HTML mockup with a Dashboard, a Workflow screen, a Files screen, and a slide-over **AI Assistant drawer** that currently calls a placeholder chat). 

Replace the placeholder with a **real integration** against the Agent One Finance backend:
- **REST** for session/document/model/quick-action management.
- **WebSocket** for the live conversation (sending user messages, receiving streamed assistant tokens and tool invocations).
- A rich **chat renderer** that reads messages and renders assistant markdown, **tool-invocation cards** (Input/Output JSON, collapsible, status badge), and auto-detects tabular/numeric results to render **tables and charts** inline — exactly like the Agent One web client.

**Do not change** the existing visual design system (Barclays-blue light theme + dark toggle, the sidebar nav, the drawer layout, fonts, the `--cyan/--accent/--success` CSS variables). Reuse those tokens for every new component.

---

## 1. Backend contract — REST

Base URL (configurable via env, default): `http://localhost:8765` (falls back to `:8080`).

Key constants:
- Demo session ID: `c9db1973-54cd-4818-9ecd-6ad62e05e650`
- Default plugin ID: `1f79fe96-153f-4862-829e-fb14cec288e5` (`daily-pnl-v2`, "Daily Profit & Loss (Orchestrated)")
- Default model: `opus-4.6`

Endpoints to wrap in a typed `apiClient`:

| Fn | Method | Path | Purpose |
|---|---|---|---|
| `health()` | GET | `/health` | liveness |
| `listModels()` | GET | `/api/models` | model selector options (`{models[], default}`) |
| `listSessions()` | GET | `/api/sessions` | sessions list (newest first) |
| `createSession(title?, agent_type?)` | POST | `/api/sessions` | returns new session |
| `getSession(id)` | GET | `/api/sessions/:id` | single session |
| `getSessionStats(id)` | GET | `/api/sessions/:id/stats` | usage stats |
| `getDocuments(id)` | GET | `/api/sessions/:id/documents` | `{input_documents[], output_artifacts[]}` → Files screen |
| `getMessages(id)` | GET | `/api/sessions/:id/messages` | historical messages on load (`{messages[], total}`) |
| `getActions(id)` | GET | `/api/sessions/:id/actions` | quick-action chips (grouped by category) |
| `activatePlugin(id, pluginId?)` | POST | `/api/sessions/:id/plugins/activate` | body `{plugin_id}`, defaults to daily-pnl-v2 |
| `uploadFile(file, sessionId, async?)` | POST | `/api/upload` | multipart `file` + `session_id` |
| `adminReset()` | POST | `/api/admin/reset` | dev helper |

Notes: unknown session → `404 {error:"Session not found"}`. Upload returns `201 {id, filename, status:"processing", s3_key, processing_status}`; mock completes processing after ~3s, after which `getDocuments` includes the file. Handle these states.

Quick actions payload shape (render as chips that, when clicked, send `action.message` over the WS):
```ts
type ActionGroup = { category: string; actions: Action[] };
type Action = { id: string; category: string; label: string; description: string; icon: string; message: string };
// icons are lucide-react names: "BarChart3" | "Search" | "FileText" → map to <Icon/>
```

---

## 2. Backend contract — WebSocket (ASSUMED — isolate in one adapter)

The exact WS envelope is **not yet confirmed**. Implement against the normalized model below and put ALL transport-specific parsing in a single file `wsAdapter.ts` so I can swap field names in one place.

Assumed connection: `ws://localhost:8765/ws?session_id=<id>` (make the URL builder configurable; also support `/api/sessions/:id/ws`).

**Outgoing** (user → server), send JSON:
```ts
{ type: "user_message", session_id, model, content, plugin_id? }
```

**Incoming** (server → client) — assume a streamed sequence of events. Map each to the normalized model:
```
session.created / ack          → ignore or set status
message.start (role=assistant) → open a new assistant message
content.delta { text }         → append streaming text to current assistant message
tool.start { id, name, input } → push a ToolInvocation (status: running)
tool.delta { id, input_partial}→ merge partial input
tool.result { id, output, status:"success"|"error" } → complete that ToolInvocation
message.complete { usage }     → finalize message, update token/cost telemetry
error { message }              → render an error bubble
```
If the real protocol uses different names (e.g. Bedrock/Anthropic-style `content_block_start`, `content_block_delta`, `content_block_stop`, `message_stop`), translate them here. Support graceful **reconnect with backoff** and a visible connection status indicator (connected / reconnecting / offline) in the drawer header.

---

## 3. Normalized message model (render off THIS, not raw WS)

```ts
type Role = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;                  // markdown; grows during streaming
  streaming: boolean;
  tools: ToolInvocation[];        // tool cards attached to this assistant turn
  createdAt: string;
}

interface ToolInvocation {
  id: string;
  name: string;                   // e.g. "mcp__data-analysis__query_data"
  status: "running" | "success" | "error";
  input: unknown;                 // JSON
  output: unknown;                // JSON
}
```

---

## 4. Architecture / files to create
```
src/
  api/apiClient.ts          // typed REST wrappers (section 1)
  api/config.ts             // BASE_URL, WS_URL, defaults from env
  ws/wsAdapter.ts           // raw WS <-> normalized events (section 2)
  ws/useAgentSocket.ts      // hook: connect, send(content), event callbacks, status
  state/chatStore.ts        // messages[], session, model, status (Zustand or Context+reducer)
  components/chat/
    ChatThread.tsx          // maps messages -> bubbles
    UserBubble.tsx
    AssistantMessage.tsx    // markdown + tool cards
    ToolInvocationCard.tsx  // collapsible Input/Output (section 5)
    SmartContent.tsx        // router: table | chart | json (section 6)
    DataTable.tsx
    DataChart.tsx
    JsonView.tsx
    Markdown.tsx
    QuickActions.tsx
    ModelSelector.tsx
    Composer.tsx            // textarea, Enter=send, Shift+Enter=newline
    ConnectionBadge.tsx
  screens/FilesScreen.tsx   // wire getDocuments() -> existing Files UI
```

---

## 5. Tool-invocation card (match the screenshot)
Render each `ToolInvocation` as a collapsible card inside the assistant message:
- Header row: chevron (expand/collapse), a check/spinner/error icon, the tool **name** in monospace, and a status pill (`Success` green / `Running` blue pulse / `Error` red) — styled with existing `.status-chip` tokens.
- Expanded body has two labeled sections, **Input** and **Output**, each a JSON block. 
- **Output is passed through `SmartContent`** (section 6) so a query result renders as a table/chart rather than raw JSON, with a small toggle to view raw JSON.
- Default collapsed for `success`, auto-expanded while `running` and for `error`.
- Use the Barclays card styling (`--card`, `--border`, `--shadow-sm`), monospace JSON in `--cyan/--accent/--success/--warning` syntax colors already in the mockup.

---

## 6. SmartContent router — tables, charts, graphs (the important part)
Given any JSON value (tool output, or assistant-embedded data), decide how to render:

**Rule A — Result-set object** → **DataTable**
Detect shape `{ columns: string[], data: object[] }` OR `{ row_count, columns, data }` (this is the Agent One `query_data` shape). Render a sortable, sticky-header table from `columns` + `data`. Format numbers (thousands separators), right-align numerics, render a `%`/`pct` column with a subtle inline bar. Show `row_count` and a "showing N of M" note; virtualize if > 200 rows.

**Rule B — Chartable result-set** → **DataChart** (offer alongside the table via a tab/toggle)
If `data` is an array of objects with exactly one categorical/string key and one or more numeric keys:
- 1 categorical + 1 numeric, ≤ 12 rows → **bar** (and a **pie** option if it's a share/`pct` breakdown). *(The screenshot's `STATUS / count / pct` is this case → horizontal bar by STATUS.)*
- a date/time-like key present → **line** (time series).
- multiple numeric keys → **grouped/stacked bar**.
Use **Recharts**. Colors from the design tokens (`--cyan`, `--accent`, `--success`, `--warning`, `--error`). Tooltips on, legend when >1 series.

**Rule C — Array of scalars / simple list** → compact list or chips.

**Rule D — Everything else** → **JsonView** (collapsible, syntax-highlighted, copy button).

Expose a per-card view switcher: **Table · Chart · JSON** (only show the views that apply). Default to Table for Rule A, Chart for obvious breakdowns.

---

## 7. Assistant text rendering
Render assistant `text` as **Markdown** (GitHub-flavored): headings, lists, bold, inline code, fenced code blocks with syntax highlighting, and tables. Stream-safe (re-render as tokens arrive). Sanitize HTML. If a fenced block is ```json and parses to a result-set, optionally pipe it through `SmartContent` too.

---

## 8. Composer & UX details (from screenshot)
- Textarea placeholder `Message Agent One…`; **Enter sends, Shift+Enter = newline**; helper text "Enter to send · Shift+Enter for new line".
- "+" affordance for file upload that calls `uploadFile()` and shows a processing chip until `getDocuments` reports completed.
- Persistent footer line: **"Agent One can make mistakes — always verify output. Do not enter secret or MNPI data."**
- Disable send while a message is streaming; show the typing/streaming indicator already in the mockup.
- **Quick-action chips** above the composer, loaded from `getActions()`, grouped by category, each rendering its lucide icon; clicking sends `action.message`.
- **Model selector** in the drawer header populated from `listModels()` (default `opus-4.6`), passed on every send.

---

## 9. Session & screen wiring
- On mount: ensure a session (use existing/demo or `createSession()`), `activatePlugin()` (daily-pnl-v2), then `getMessages()` to hydrate history, open the WS.
- A session switcher (from `listSessions()`) that re-hydrates messages + reconnects WS to the chosen session.
- **Files screen**: populate from `getDocuments()` — map `input_documents` → Inputs group, `output_artifacts` → Outputs group, using the existing file-card layout (filename from `original_filename`, type from `content_type`, size from `file_size`, status from `processing_status`). Poll or refresh after uploads.
- Update the top-bar telemetry (tokens/cost) from `message.complete` usage and/or `getSessionStats()`.

---

## 10. Config (env)
```
VITE_AGENT_API_URL=http://localhost:8765
VITE_AGENT_WS_URL=ws://localhost:8765/ws
VITE_DEFAULT_SESSION_ID=c9db1973-54cd-4818-9ecd-6ad62e05e650
VITE_DEFAULT_PLUGIN_ID=1f79fe96-153f-4862-829e-fb14cec288e5
VITE_DEFAULT_MODEL=opus-4.6
```
Centralize in `api/config.ts`. No hardcoded URLs in components.

---

## 11. Resilience
- REST: typed errors, loading/empty/error states, 404 handling.
- WS: auto-reconnect with exponential backoff (cap ~10s), buffer the outgoing message if socket not open, surface status via `ConnectionBadge`.
- Never block the UI on a single failed tool result; render the error card and continue.

---

## 12. Libraries
`recharts` (charts), `react-markdown` + `remark-gfm` + `rehype-highlight` (markdown/code), `zustand` (state, or Context+useReducer if you prefer zero deps), `lucide-react` (icons). Keep the existing CSS/design tokens.

---

## 13. Acceptance criteria
1. Sending a message over WS streams the assistant reply token-by-token into a bubble.
2. Tool calls appear as collapsible cards with name, status pill, and Input/Output sections.
3. A `query_data` output with `{columns, data}` renders as a **sortable table** AND offers a **bar/pie chart** view; the screenshot's `STATUS/count/pct` renders correctly both ways.
4. Assistant markdown (incl. tables/code) renders cleanly while streaming.
5. Files screen reflects real uploaded/produced documents; uploads transition processing → completed.
6. Model selector and quick actions are live from the API; chosen model is sent with each message.
7. Reconnect works after dropping the socket; status is visible.
8. All new UI uses the existing Barclays-blue tokens; light/dark toggle still works.
9. Footer MNPI warning and Enter/Shift+Enter behavior present.

---

## 14. Deliverables
- The files in section 4, wired into my existing drawer + Files screen.
- A short `INTEGRATION.md` documenting: the exact WS event names you assumed in `wsAdapter.ts` and the single place to change them; how `SmartContent` decides table vs chart; and the env vars.
- Inline TODOs where the real WS envelope must be confirmed.

> Important: the WebSocket envelope (event/field names) is assumed. Keep every transport-specific detail inside `wsAdapter.ts` and `useAgentSocket.ts`. The rest of the app must depend only on the normalized `ChatMessage` / `ToolInvocation` model so confirming the real protocol is a one-file change.
