# FOBO Agent — System Architecture

**Version:** 1.0  
**Status:** Architecture Baseline  
**Date:** 2026-09-05  

---

## 1. Executive Summary

The FOBO (Front Office / Back Office) Agent is an AI-assisted reconciliation investigation system. It automates the root-cause analysis of P&L breaks between front-office trading systems and back-office ledger systems, produces draft explanations with evidence chains, and routes them through human review before recording resolutions.

**Core design principles:**
- **Deterministic control flow** — LangGraph orchestrates a fixed state machine; the model never decides what to do next
- **Ground-truth first** — All arithmetic and business rules live in Java recon engines (C6); the model only weighs pre-computed candidates
- **Entitlement at the data layer** — Role-based visibility is enforced in graph queries, never in the UI
- **Human-in-the-loop** — Every draft pauses for human approval/rejection/escalation with full evidence
- **Audit by design** — Every state transition is checkpointed; every decision is traceable

---

## 2. System Context

```
+-----------------------------------------------------------------------------+
|                              EXTERNAL SYSTEMS                                |
|  +-------------+  +-------------+  +-------------+  +---------------------+ |
|  |   SSO/IdP   |  |   Phoenix   |  |   Bedrock   |  |   Source Systems    | |
|  |  (OAuth2)   |  | (Observab.) |  |   (Claude)  |  | (Trading, Ledger,   | |
|  |             |  |             |  |             |  |  Static Data)       | |
|  +------+------+  +------+------+  +------+------+  +----------+----------+ |
+--------+---------------+---------------+---------------+----------+---------+
         |               |               |               |
         v               v               v               v
+-----------------------------------------------------------------------------+
|                              FOBO AGENT PLATFORM                             |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |                        C1 — FinanceAgent UI                           |   |
|  |                    React / TypeScript / Vite                          |   |
|  |  Queue | Evidence Panel | Draft Viewer | Decision Form | Chat Surface |   |
|  +-------------------------------+--------------------------------------+   |
|                                 | HTTPS / SSE                                |
|  +-------------------------------v--------------------------------------+   |
|  |                        C2 — Agent API                                 |   |
|  |                      Python / FastAPI / Uvicorn                       |   |
|  |  Auth | Caller Construction | Idempotency | Routing | OTel Spans       |   |
|  +---------------+----------------+----------------+----------------------+   |
|                 |                |                |                          |
|                 v                v                v                          |
|  +------------------+  +------------------+  +------------------+         |
|  |  C3 — Workflow   |  |  C8 — MCP Tool   |  |  Chat Controller |         |
|  |     Runtime      |  |     Server       |  |   (Streaming)    |         |
|  |   LangGraph      |  |    FastMCP       |  |   FastAPI SSE    |         |
|  +--------+---------+  +--------+---------+  +--------+---------+         |
|           |                     |                     |                     |
|           +---------------------+---------------------+                     |
|                                 v                                           |
|  +----------------------------------------------------------------------+   |
|  |                    C4 — Graph Repository + C9 Entitlement             |   |
|  |              Python | SQLAlchemy | Parameterized Queries               |   |
|  |  Book Resolution | Lineage | Similar Breaks | Context | Scope Filter  |   |
|  +-------------------------------+--------------------------------------+   |
|                                 |                                          |
|           +---------------------+---------------------+                   |
|           v                     v                     v                   |
|  +---------------+   +---------------+   +-----------------+        |
|  |  C5 — Graph   |   |  C6 — Recon   |   |  C10 — Checkpoint|        |
|  |    Store      |   |   Engines     |   |     Store        |        |
|  | Oracle 19c    |   | Java 21 / SB  |   | Oracle / Postgres|        |
|  | (→ Neptune)   |   | 6 Cause Checks|   |  State Snapshots |        |
|  +---------------+   +---------------+   +-----------------+        |
|                                                                             |
|  +----------------------------------------------------------------------+   |
|  |                    C7 — Reasoning Client                              |   |
|  |              Anthropic SDK | Bedrock | Pydantic | Prompt Versioning   |   |
|  |  Forced Tool Use | Retry | Token Cap | Cost Tracking | Latency Log    |   |
|  +----------------------------------------------------------------------+   |
|                                                                             |
|  +----------------------------------------------------------------------+   |
|  |                    C11 — Graph Ingestion                              |   |
|  |              Apache Airflow | Daily Static | Per-COB Events            |   |
|  +----------------------------------------------------------------------+   |
|                                                                             |
|  +----------------------------------------------------------------------+   |
|  |                    C12 — Observability                                |   |
|  |              Arize Phoenix | OTel | Structured Evaluation              |   |
|  +----------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
```

---

## 3. Component Specifications

### 3.1 C1 — FinanceAgent UI

**Runtime:** React 18 + TypeScript + Vite  
**State Management:** TanStack Query (server state) + Zustand (client state)  
**Styling:** Tailwind CSS + shadcn/ui  
**Real-time:** Server-Sent Events (SSE) for chat streaming

**Pages & Routes:**

| Route | Purpose | Role-Agnostic |
|---|---|---|
| `/queue` | Review queue with filters | Yes — server filters by entitlement |
| `/breaks/:id` | Investigation detail | Yes — evidence hydrated server-side |
| `/breaks/:id/trace` | Phoenix trace viewer | Yes — link only |
| `/chat` | Conversational surface | Yes — tools scoped by Caller |

**Key UI Constraints (from design doc):**
- Reject must require a reason (blocks submission until text provided)
- Draft never renders without evidence panel
- Attempt counter always visible
- Decisions disabled when workflow unreachable (read-only cache mode)
- Never queue decisions client-side

**Component Hierarchy:**
```
App
├── AuthProvider (OAuth2 PKCE)
├── Layout
│   ├── TopNav (role badge, region, staff ID)
│   └── Sidebar (queue counts by status)
├── QueuePage
│   └── BreakTable (columns adapt to caller.roles)
├── BreakDetailPage
│   ├── BreakHeader (attempt counter, status badge)
│   ├── EvidencePanel (generic renderer, role-driven data)
│   ├── DraftViewer (ranked causes + commentary)
│   ├── DecisionForm (approve / reject / escalate)
│   └── ChatDrawer (conversational agent)
└── TraceViewer (iframe to Phoenix)
```

---

### 3.2 C2 — Agent API

**Runtime:** Python 3.12 + FastAPI + Uvicorn  
**Auth:** OAuth2 bearer token → entitlement service resolution  
**Middleware:** OTel instrumentation, request ID propagation, rate limiting

**API Contract:**

```yaml
openapi: 3.0.0
paths:
  /breaks:
    get:
      summary: List breaks awaiting review
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [awaiting_review, escalated, resolved] }
        - name: limit
          in: query
          schema: { type: integer, default: 50 }
      responses:
        200:
          description: Entitlement-filtered break list
          content:
            application/json:
              schema:
                type: object
                properties:
                  breaks:
                    type: array
                    items: { $ref: '#/components/schemas/BreakSummary' }
                  total: { type: integer }

  /breaks/{break_id}:
    get:
      summary: Break detail with hydrated evidence
      responses:
        200:
          description: Full investigation state
          content:
            application/json:
              schema:
                type: object
                properties:
                  break: { $ref: '#/components/schemas/Break' }
                  draft: { $ref: '#/components/schemas/Draft' }
                  evidence: { type: array, items: { $ref: '#/components/schemas/EvidenceItem' } }
                  ranking: { $ref: '#/components/schemas/Ranking' }
                  attempt: { type: integer }
                  review_cycle: { type: integer }

  /breaks/{break_id}/decision:
    post:
      summary: Approve, reject, or escalate
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                decision: { type: string, enum: [approve, reject, escalate] }
                reason: { type: string }
              required: [decision]
      responses:
        200: { description: Decision recorded }
        409: { description: Duplicate idempotency key }

  /breaks/{break_id}/investigate:
    post:
      summary: Trigger or re-trigger workflow
      responses:
        202: { description: Investigation initiated }

  /chat:
    post:
      summary: Conversational surface
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                message: { type: string }
                thread_id: { type: string }
      responses:
        200:
          description: SSE stream of message chunks

  /breaks/{break_id}/trace:
    get:
      summary: Phoenix trace link
      responses:
        200:
          description: Redirect URL to Phoenix trace
```

**Internal Flow:**
1. Validate bearer token via IdP
2. Resolve `staff_id` and `roles[]` from entitlement service
3. Construct `Caller` object (sole authority — never built elsewhere)
4. Derive `thread_id = break_id` for workflow operations
5. Emit OTel span with `trace_id` downstream

---

### 3.3 C3 — Workflow Runtime (LangGraph)

**Runtime:** Python 3.12 + LangGraph  
**State Machine:** Directed graph with conditional edges and human interrupts

**State Schema:**

```python
from typing import TypedDict, Optional, List
from datetime import date

class Caller(TypedDict):
    staff_id: str
    roles: List[str]
    entity_scope: List[str]
    region: str

class EvidenceRef(TypedDict):
    kind: str
    id: str

class CandidateCause(TypedDict):
    check_id: str          # C1-C6
    description: str
    estimated_value: Optional[float]
    supporting_ids: List[str]
    positive: bool

class RankingEntry(TypedDict):
    candidate_id: str
    share_bps: int         # must sum to 10000 ± 100
    evidence_ids: List[str]

class InvestigationState(TypedDict):
    # Inputs
    break_id: str
    cob_date: date
    caller: Caller

    # Resolve outputs
    book_id: Optional[str]
    pnl_line: Optional[str]
    as_of: Optional[date]
    context: Optional[dict]   # desk, entity, owners, tolerances

    # Gather outputs
    delta: Optional[dict]     # fo_value, bo_value, delta, tolerance_breach
    candidates: List[CandidateCause]
    priors: List[dict]        # similar breaks
    lineage: List[dict]       # feeds, jobs, run times
    evidence: List[EvidenceRef]
    evidence_gaps: List[str]

    # Rank outputs
    ranking: Optional[List[RankingEntry]]
    validation_errors: List[str]
    hypothesis_attempts: int

    # Draft outputs
    draft: Optional[str]

    # Review outputs
    review_cycles: int
    decision: Optional[str]   # approve | reject | escalate
    decision_reason: Optional[str]

    # Outcome
    outcome: Optional[str]
    escalation_reason: Optional[str]
```

**Node Graph:**

```
                    +-------------+
         +--------->|   resolve   |<--------+
         |          +------+------+         |
         |                 |                |
    +----+----+      +-----+-----+    +----+----+
    | escalate|      |  gather   |    | escalate|
    |UNRESOLVED      +-----+-----+    |AMBIGUOUS|
    |_BOOK    |            |          |_BOOK    |
    +----+----+      +-----+-----+    +----+----+
         |           |   rank    |         |
         |           +-----+-----+         |
         |     +-----------+-----------+   |
         |     v           v           v   |
         |  +------+   +------+   +------+ |
         |  |draft |   |validate|   |retry | |
         |  +--+---+   +--+-----+   +--+---+ |
         |     |          |          |      |
         |     +-----+----+          |      |
         |           v               |      |
         |     +---------+           |      |
         |     |  review |<----------+      |
         |     |(interrupt)                  |
         |     +----+----+                  |
         |          | human decision         |
         |     +----+----+                  |
         |     v         v                  |
         |  +------+  +------+             |
         |  |record|  |reject|-------------+
         |  +--+---+  +--+---+  (retry loop)
         |     |         |
         +-----+---------+
               |
               v
              END
```

**Loop Control Constants:**
```python
MAX_HYPOTHESIS_ATTEMPTS = 3
MAX_REVIEW_CYCLES = 2
```

Both counters live in `InvestigationState`, checkpointed to C10. They survive process restarts.

**Node Details:**

| Node | Type | Description |
|---|---|---|
| `resolve` | Deterministic | Read break record, resolve book via C4, pin `as_of = cob_date` |
| `gather` | Deterministic | Fan-out 4 calls to C6/C4 with 30s budget per call, 45s overall |
| `rank` | Hybrid | Fast-path: if single positive candidate, skip model. Else call C7 with forced tool use |
| `draft` | Model | Generate commentary with 400 token cap, reject invented numbers |
| `validate` | Deterministic | Hard assertions: reason code, amounts, citations, length, PII, adjustments |
| `review` | Human interrupt | Checkpoint and pause. Resume via C2 on human decision |
| `record` | Deterministic | Transactional write to C5 + Oracle, emit to Phoenix |
| `escalate` | Terminal | Set reason, notify owner, preserve all evidence |

---

### 3.4 C4 — Graph Repository + C9 Entitlement Filter

**Runtime:** Python 3.12 + SQLAlchemy 2.0  
**Query Builder:** Parameterized only — no string interpolation, no model-supplied queries

**Interface Methods:**

```python
class GraphRepository:
    def resolve_book(self, book_ref: str, as_of: date, caller: Caller) -> BookResolution:
        # Returns book_id or raises UnresolvedBook / AmbiguousBook

    def book_context(self, book_id: str, as_of: date, caller: Caller) -> BookContext:
        # Returns desk, entity, owners, tolerances

    def lineage(self, book_id: str, direction: str, depth: int, 
                as_of: date, caller: Caller) -> List[LineageNode]:
        # Bounded recursive CTE traversal

    def similar_breaks(self, book_id: str, line_code: str, 
                       cob_date: date, lookback: int, caller: Caller) -> List[PriorBreak]:
        # Heaviest query; indexed on (book_id, line_code, cob_date)
```

**Entitlement Predicate (C9):**

Applied to every query before execution:

```python
def build_entitlement_predicate(caller: Caller) -> SQLWhereClause:
    role_visible_types = get_visible_node_types(caller.roles)
    return and_(
        Node.node_type.in_(role_visible_types),
        Node.legal_entity_id.in_(caller.entity_scope)
    )
```

**Visibility Matrix:**

| Node Type | FO | BO | PC | REG | RISK |
|---|---|---|---|---|---|
| Trade | ✅ | ❌ | ✅ | ❌ | ✅ |
| Position | ✅ | ❌ | ❌ | ❌ | ✅ |
| LedgerEntry | ❌ | ✅ | ✅ | ✅ | ❌ |
| StaticMapping | ❌ | ✅ | ❌ | ✅ | ❌ |
| Adjustment | ❌ | ✅ | ✅ | ❌ | ❌ |
| RiskRun | ✅ | ❌ | ❌ | ❌ | ✅ |
| Job | ✅ | ✅ | ✅ | ❌ | ❌ |
| Book | ✅ | ✅ | ✅ | ✅ | ✅ |
| Desk | ✅ | ✅ | ✅ | ✅ | ✅ |

**Caching:**
- Reference-layer reads: cached on `(method, args, as_of, caller_scope)`
- Event-layer reads: not cached
- **Cache key includes caller_scope** to prevent cross-user entitlement leaks

---

### 3.5 C5 — Graph Store

**Phase 1–2: Oracle 19c**

**Schema:**

```sql
-- Bitemporal graph with valid time and transaction time
CREATE TABLE node (
    node_id         VARCHAR2(64) PRIMARY KEY,
    node_type       VARCHAR2(32) NOT NULL,
    natural_key     VARCHAR2(128) NOT NULL,
    attrs_json      CLOB CHECK (attrs_json IS JSON),
    valid_from      DATE NOT NULL,
    valid_to        DATE,  -- NULL = currently valid
    recorded_from   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recorded_to     TIMESTAMP
);

CREATE TABLE edge (
    edge_id         VARCHAR2(64) PRIMARY KEY,
    from_node_id    VARCHAR2(64) NOT NULL REFERENCES node(node_id),
    to_node_id      VARCHAR2(64) NOT NULL REFERENCES node(node_id),
    edge_type       VARCHAR2(32) NOT NULL,
    attrs_json      CLOB CHECK (attrs_json IS JSON),
    valid_from      DATE NOT NULL,
    valid_to        DATE,
    recorded_from   TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recorded_to     TIMESTAMP
);

-- Indexes
CREATE INDEX idx_node_type_key ON node(node_type, natural_key);
CREATE INDEX idx_edge_from ON edge(from_node_id, edge_type, valid_from, valid_to);
CREATE INDEX idx_edge_to ON edge(to_node_id, edge_type, valid_from, valid_to);
CREATE INDEX idx_similar_breaks ON break_event(book_id, line_code, cob_date);
```

**Traversal:**
```sql
-- Bounded recursive CTE (depth-limited to prevent cycles)
WITH lineage_cte(node_id, depth) AS (
    SELECT from_node_id, 0 FROM edge 
    WHERE from_node_id = :book_id AND edge_type = :edge_type
      AND valid_from <= :as_of AND (valid_to IS NULL OR valid_to >= :as_of)
    UNION ALL
    SELECT e.to_node_id, c.depth + 1
    FROM edge e
    JOIN lineage_cte c ON e.from_node_id = c.node_id
    WHERE c.depth < :max_depth
      AND e.valid_from <= :as_of AND (e.valid_to IS NULL OR e.valid_to >= :as_of)
)
SELECT * FROM lineage_cte;
```

**Migration Trigger to Neptune:**
- Median traversal > 200ms at depth 4
- Graph algorithms (centrality, community detection) become required

---

### 3.6 C6 — Recon Engines

**Runtime:** Java 21 + Spring Boot 3.x  
**Deployment:** Containerized microservice, horizontally scalable

**Endpoint:** `POST /recon/cause-checks`

**Internal Flow:**
1. Load FO and BO snapshots for `(book, cob_date)`
2. Run six independent evaluators in parallel
3. Each returns `CandidateCause` or null
4. Return all six results including negatives

**Cause Checks:**

| Check | ID | Logic | FO Evidence | BO Evidence |
|---|---|---|---|---|
| Timing | C1 | FO booking timestamp > BO ledger cut-off | Trade.booking_ts | Job.sla_time |
| Static | C2 | MAPS_TO missing or valid_from in lookback | — | StaticMapping |
| Valuation | C3 | FO/BO reference different rate/curve dataset | Position.dataset_id | LedgerEntry.dataset_id |
| Components | C4 | Fee/funding/commission present one side only | Trade.components | LedgerEntry.components |
| Amendment | C5 | Trade version mismatch across snapshots | Trade.version | LedgerEntry.version |
| Adjustment | C6 | Adjustment applied one side, absent other | Position.adjustments | LedgerEntry.adjustments |

**Idempotency Contract:**
Same `(book, cob_date, snapshot_version)` inputs → identical outputs. These are pure functions over dated snapshots.

---

### 3.7 C7 — Reasoning Client

**Runtime:** Python 3.12 + Anthropic SDK + boto3 (Bedrock)  
**Models:** Claude 3.5 Sonnet (default), Claude 3 Opus (complex cases)

**Internal Flow:**
1. Select model and region from config (region derived from book's entity scope)
2. Build request with forced `tool_choice = "required"`
3. Call with 60s timeout
4. On throttle: exponential backoff, max 3 retries (do NOT increment `hypothesis_attempts`)
5. Extract `tool_use` block — absence is hard error
6. Validate against Pydantic model
7. Record token counts and latency to Phoenix

**Prompt Versioning:**
- System prompts are versioned artifacts with IDs
- Prompt version ID written into workflow state
- Drafts are attributable to prompt version for evaluation

**Tool Schema (forced):**
```python
class RankCausesOutput(BaseModel):
    rankings: List[RankingEntry]

class RankingEntry(BaseModel):
    candidate_id: str      # must exist in input candidates
    share_bps: int         # must sum to 10000 ± 100
    evidence_ids: List[str] # must exist in input evidence
    rationale: str
```

---

### 3.8 C8 — MCP Tool Server

**Runtime:** Python 3.12 + FastMCP  
**Purpose:** Typed tool surface for conversational agent

**Tools Exposed:**
```python
@mcp.tool()
def get_book_lineage(book_id: str, depth: int = 4) -> List[LineageNode]:
    # Returns lineage truncated at 50 hops

@mcp.tool()
def get_similar_breaks(book_id: str, lookback_days: int = 180) -> List[PriorBreak]:
    # Returns similar breaks truncated at 20

@mcp.tool()
def get_book_context(book_id: str) -> BookContext:
    # Returns desk, entity, owners, tolerances
```

**Result Caps:**
- `lineage`: max 50 hops
- `similar_breaks`: max 20 results
- Prevents unbounded context windows and cost incidents

**Why C3 bypasses C8:** Workflow nodes call C4 directly. No model in that loop means MCP adds unnecessary network hop and serialization overhead.

---

### 3.9 C10 — Checkpoint Store

**Schema (Postgres / Oracle):**

```sql
CREATE TABLE workflow_checkpoint (
    thread_id       VARCHAR(64) NOT NULL,      -- = break_id
    node_name       VARCHAR(32) NOT NULL,
    state_snapshot  JSONB NOT NULL,
    timestamp       TIMESTAMP DEFAULT NOW(),
    schema_version  VARCHAR(16) NOT NULL,
    PRIMARY KEY (thread_id, node_name, timestamp)
);

CREATE INDEX idx_checkpoint_thread ON workflow_checkpoint(thread_id, timestamp DESC);
```

**Retention:** Matches P&L record retention policy (not a default TTL). These rows are part of the audit record.

**Resume Behavior:**
1. Load latest checkpoint for `thread_id`
2. Compare `schema_version` with current code
3. Mismatch → route to migration or drain, never best-effort deserialize

---

### 3.10 C11 — Graph Ingestion

**Runtime:** Apache Airflow 2.x  
**Two pipelines:**

**Reference Layer (Daily):**
1. Extract book, desk, entity, cost centre, mapping, ownership from static data
2. Compare against current graph state
3. For each change: close existing edge (`valid_to = effective_date - 1`), insert new edge
4. **Never update in place** — destroys `as_of` history
5. Report unmapped books and orphaned nodes as data quality exceptions

**Event Layer (Per COB):**
- Breaks written by C3 as they are raised and resolved
- Backfill: one-off historical load, reconciled on count and value before trusting for `similar_breaks`

---

### 3.11 C12 — Observability

**Platform:** Arize Phoenix  
**Instrumentation:** OpenTelemetry auto-instrumentation for LangGraph and Bedrock

**Span Attributes:**

| Attribute | Source | Purpose |
|---|---|---|
| `book_id` | C3 resolve | Correlate to business record |
| `cob_date` | C3 resolve | Correlate to business record |
| `as_of` | C3 resolve | Verify temporal correctness |
| `hypothesis_attempts` | C3 state | Distinguish first-pass from retried |
| `candidate_count` | C3 rank | Explain model-skip vs model-call |
| `evidence_gaps` | C3 gather | Flag degraded runs |
| `prompt_version` | C7 | Attribute evaluation results |
| `caller_scope` | C9 | Verify entitlement applied |

**Evaluation Split:**

| Assertion | Type | Gate |
|---|---|---|
| Resolved to correct book ID | Exact match | Required |
| `as_of` equals COB date | Exact match | Required |
| All six checks executed | Exact match | Required |
| Ranking references only supplied candidates | Structural | Required |
| Every claim carries evidence | Structural | Required |
| Commentary quality and tone | LLM judge | Advisory |

---

## 4. Data Flow Diagrams

### 4.1 Happy Path (Single-Cause, Deterministic)

```
User (FO Trader)
    |
    v
+-------------+
|  C1 UI      |-- GET /breaks -->+-------------+
|  Queue      |                  |  C2 API     |-- Auth + Caller -->+-------------+
+------+------+                  +-------------+                    |  C3 Workflow |
       |                                                            |  resolve     |
       |                                                            |    |         |
       |                                                            |    v         |
       |                                                            |  gather -----+--> C6 (compute_delta)
       |                                                            |    |         |    C6 (cause_checks)
       |                                                            |    |         |    C4 (lineage)
       |                                                            |    |         |    C4 (similar_breaks)
       |                                                            |    v         |
       |                                                            |  rank -------+--> [FAST-PATH: single positive]
       |                                                            |    |         |     deterministic 10000 bps
       |                                                            |    v         |
       |                                                            |  draft ------+--> [SKIP MODEL]
       |                                                            |    |         |
       |                                                            |  validate    |
       |                                                            |    |         |
       |<---------------------- interrupt_before -------------------|    v         |
       |                          [PAUSE: human review]             |  review      |
       |                                                            +-------------+
       |
       v
+-------------+     POST /decision
|  Decision   |-----------------------------------------> C3 resumes
|  (Approve)  |                                             |
+-------------+                                             v
                                                       +-------------+
                                                       |  record     |--> C5 (graph write)
                                                       |             |--> Oracle (commentary)
                                                       |             |--> C12 (Phoenix)
                                                       +-------------+
```

### 4.2 Model-Involved Path (Multiple Candidates)

Same flow, but `rank` node calls C7 instead of fast-path:

```
C3 rank --> C7 (Reasoning Client)
                |
                +-- Select model/region from config
                +-- Build prompt with evidence block
                +-- Force tool_choice="required"
                +-- Call Bedrock (60s timeout)
                +-- Validate output against Pydantic
                +-- Assert candidate_id in input set
                +-- Assert evidence_ids in evidence[]
                +-- Assert sum(share_bps) = 10000 ± 100
                +-- Return ranking --> C3 draft
```

### 4.3 Escalation Path

```
C3 resolve --> [Zero matches] --> escalate(UNRESOLVED_BOOK)
C3 resolve --> [Multiple matches] --> escalate(AMBIGUOUS_BOOK)
C3 gather --> [compute_delta fails] --> escalate(DELTA_UNAVAILABLE)
C3 gather --> [cause_checks fail] --> escalate(CHECKS_UNAVAILABLE)
C3 rank --> [hypothesis_attempts > MAX] --> escalate(RETRY_EXHAUSTED)
C3 validate --> [validation_errors persist] --> escalate(VALIDATION_FAILED)

escalate node:
    +-- Set escalation_reason code
    +-- Notify resolved owner from context
    +-- Record partial state to C5
    +-- Preserve all evidence gathered
    +-- END
```

---

## 5. Security Architecture

### 5.1 Authentication
- OAuth 2.0 + OIDC via corporate IdP
- Bearer tokens with 15-minute expiry
- Refresh token rotation

### 5.2 Authorization (Entitlement)
- **Enforcement point:** C4 (Graph Repository) — every query
- **Never:** Frontend filtering, prompt instructions, or post-filtering
- **Caller object:** Built once in C2, immutable, carried through all nodes

### 5.3 Data Protection
- PII detection in `validate` node (`PII_LEAK` check)
- Counterparty names redacted from model inputs where not entitled
- Commentary drafts rejected if they contain unauthorized counterparty references

### 5.4 Audit
- All decisions written to Oracle with approver stamp
- Graph edges Break -[EXPLAINED_BY]-> Commentary and -[RESOLVED_BY]-> Adjustment
- Workflow checkpoints retained per P&L policy
- Idempotency keys prevent duplicate adjustments

---

## 6. Deployment Architecture

```
+-----------------------------------------------------------------------------+
|                              KUBERNETES CLUSTER                              |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |                         Ingress / API Gateway                         |   |
|  |                    (TLS termination, rate limiting)                     |   |
|  +-------------------------------+--------------------------------------+   |
|                                 |                                          |
|  +-------------------------------v--------------------------------------+   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+ |   |
|  |  |  C1 UI      |  |  C2 API     |  |  C3 Worker  |  |  C8 MCP     | |   |
|  |  |  (Nginx)    |  |  (FastAPI)  |  |  (LangGraph)|  |  (FastMCP)  | |   |
|  |  |  3 replicas |  |  3 replicas |  |  5 replicas |  |  2 replicas | |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+ |   |
|  |                                                                      |   |
|  |  +-------------+  +-------------+  +-------------+                  |   |
|  |  |  C6 Recon   |  |  C7 Reason  |  |  C4 Graph   |                  |   |
|  |  |  (Spring)   |  |  (Python)   |  |  (Python)   |                  |   |
|  |  |  4 replicas |  |  2 replicas |  |  3 replicas |                  |   |
|  |  +-------------+  +-------------+  +-------------+                  |   |
|  +----------------------------------------------------------------------+   |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |                         Data Layer                                    |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+ |   |
|  |  |  Oracle 19c |  |  Postgres   |  |  Redis      |  |  Kafka      | |   |
|  |  |  (C5 + C10) |  |  (C10 alt)  |  |  (Cache)    |  |  (Events)   | |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+ |   |
|  +----------------------------------------------------------------------+   |
|                                                                              |
|  +----------------------------------------------------------------------+   |
|  |                         Observability                                 |   |
|  |  +-------------+  +-------------+  +-------------+                  |   |
|  |  |  Phoenix    |  |  Prometheus |  |  Grafana    |                  |   |
|  |  |  (C12)      |  |  (Metrics)  |  |  (Dashboard)|                  |   |
|  |  +-------------+  +-------------+  +-------------+                  |   |
|  +----------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+

External:
+-------------+  +-------------+  +-------------+  +---------------------+
|  Corporate  |  |   AWS       |  |   AWS       |  |   Source Systems    |
|    IdP      |  |  Bedrock    |  |  Airflow    |  |  (via Kafka/DB)     |
+-------------+  +-------------+  +-------------+  +---------------------+
```

---

## 7. Sizing Estimates

| Component | Metric | Estimate |
|---|---|---|
| C5 Graph Store | Nodes (reference) | ~50,000 |
| C5 Graph Store | Edges (reference) | ~200,000 |
| C5 Graph Store | Typical traversal depth | 3–4 |
| C5 Graph Store | `similar_breaks` lookback | 180 days |
| C3 Workflow | Breaks/day | 500–2,000 |
| C3 Workflow | Single-cause fast-path | ~60% |
| C3 Workflow | Model-involved path | ~40% |
| C3 Workflow | Avg. investigation latency | < 30s (fast-path), < 90s (model) |
| C7 Reasoning | Avg. tokens per rank call | ~2,000 input, ~500 output |
| C7 Reasoning | Avg. tokens per draft call | ~3,000 input, ~400 output |
| C10 Checkpoint | Retention | 7+ years (P&L policy) |
| C1 UI | Concurrent reviewers | 50–100 |

---

## 8. Implementation Roadmap

### Phase 0: Kernel (Weeks 1–4)
- [ ] Define `Caller` schema and entitlement matrix
- [ ] Build C6 with one cause check (e.g., C1 timing)
- [ ] Mock C4 with in-memory graph
- [ ] Build C3 happy path as plain Python function
- [ ] Validate deterministic fast-path end-to-end

### Phase 1: Workflow Engine (Weeks 5–8)
- [ ] Port kernel to LangGraph with state machine
- [ ] Implement checkpointing to Postgres (C10)
- [ ] Add `interrupt_before` at review node
- [ ] Build C2 API with idempotency
- [ ] Add basic C1 UI (queue + decision buttons)

### Phase 2: Graph & Entitlement (Weeks 9–12)
- [ ] Implement C4 with Oracle schema
- [ ] Build C9 entitlement predicate injection
- [ ] Add lineage and similar_breaks queries
- [ ] Implement C11 ingestion pipeline (Airflow)
- [ ] Add caching with caller-scoped keys

### Phase 3: Reasoning (Weeks 13–16)
- [ ] Build C7 with forced tool use
- [ ] Implement prompt versioning
- [ ] Add validation rules (amounts, citations, PII)
- [ ] Integrate Phoenix tracing (C12)
- [ ] Build evaluation framework

### Phase 4: Polish & Scale (Weeks 17–20)
- [ ] Build C8 MCP server for chat
- [ ] Add SSE streaming for chat
- [ ] Implement full C6 (all six checks)
- [ ] Load testing and tuning
- [ ] Security audit and penetration testing

### Phase 5: Production Hardening (Weeks 21–24)
- [ ] DR strategy for C10 checkpoints
- [ ] Graph store migration plan (Oracle → Neptune)
- [ ] Runbook and on-call procedures
- [ ] Training data collection for model improvement
- [ ] Gradual rollout (pilot desk → full entity)

---

## 9. Failure Matrix Summary

| Failure | Detected In | Behavior |
|---|---|---|
| Book unresolvable | C3 `resolve` | Escalate `UNRESOLVED_BOOK` |
| Book ambiguous | C3 `resolve` | Escalate `AMBIGUOUS_BOOK`, never auto-pick |
| Mapping missing for `as_of` | C4 | Escalate `UNMAPPED_BOOK`, raise control finding |
| Delta unavailable | C6 | Escalate — nothing to explain |
| Cause checks unavailable | C6 | Escalate — refuse to rank without candidates |
| Priors unavailable | C4 | Continue degraded, flag `evidence_gaps` |
| Model returns unknown candidate | C3 `rank` | Validation error, retry within cap |
| Model invents a number | C3 `draft` | Validation error, retry within cap |
| Bedrock throttled | C7 | Backoff, does not consume reasoning attempts |
| Retry cap reached | C3 | Escalate with all evidence attached |
| Checkpoint schema mismatch | C10 | Migrate or drain, never best-effort |

---

## 10. Key Design Decisions

| Decision | Rationale |
|---|---|
| **LangGraph over custom orchestrator** | Human-in-the-loop, checkpointing, and loop caps are solved problems; do not rebuild |
| **Deterministic fast-path for single-cause** | 60% of breaks need no judgment; saves cost, latency, and variance |
| **Model never calls engines directly** | C3 calls C6, passes results as text; prevents model from inventing computations |
| **Entitlement in C4 queries** | Post-filtering leaks through counts and timing; prompt instructions are not controls |
| **Oracle first, Neptune later** | Measurable migration trigger (200ms at depth 4); avoids premature optimization |
| **Idempotency on decisions** | Mobile retries + duplicated adjustments = worst possible outcome |
| **Reject requires reason** | Empty rejection gives the model nothing to correct in retry cycle |
| **Checkpoint schema version check** | Best-effort deserialization after deploy = silent data corruption |
| **as_of = cob_date** | Pins every graph read to hierarchy in force on COB date, not today's |

---

*End of Architecture Document*
