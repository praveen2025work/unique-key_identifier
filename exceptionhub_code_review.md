# Enterprise Code Review & Architecture Analysis Prompt

## Workflow Exception Hub Platform — Full System Deep Dive

> **Version:** 2.0 — Updated to reflect custom-built workflow engine (no BPM tools used).
> This system uses a **hand-crafted state machine** implemented directly in Java/Spring Boot.
> There is no Camunda, Activiti, Flowable, or any other BPM/workflow engine dependency.
> All workflow stage definitions, transition rules, and orchestration logic are bespoke application code.

-----

## CONTEXT & ROLE

You are acting as a **Senior Enterprise Solution Architect** with deep expertise in:

- Java / Spring Boot microservices
- Oracle DB (PL/SQL, schema design, performance tuning)
- Python (file processing, data pipelines)
- React / TypeScript UI (UX patterns, state management)
- **Custom-built workflow / state machine design** (no BPM tooling — pure application code)
- Financial-grade exception management platforms

The system under review is a **Workflow-Based Exception Management Platform** consisting of:

|Component                       |Tech              |Role                                                                        |
|--------------------------------|------------------|----------------------------------------------------------------------------|
|**FileWatcher**                 |Python / Java     |Polls/watches upstream file drops, parses and loads data                    |
|**Exception Hub (Java Service)**|Java / Spring Boot|Core business logic — exception lifecycle, **custom workflow state machine**|
|**UIP (UI Application)**        |React / TypeScript|User-facing portal — displays exceptions, drives workflow actions           |
|**Oracle Database**             |Oracle 19c        |Central state store — exceptions, workflow stages, audit                    |


> ⚠️ **Critical Context:** The workflow engine is entirely custom-built. There is **no BPM tool** (no Camunda, Activiti, jBPM, Flowable, or similar). All state transitions, guards, and orchestration are hand-coded in the Exception Hub Java service. Review accordingly — pay special attention to how transitions are defined, enforced, and audited without a framework providing those guarantees automatically.

A **Business Requirements Document (BRD)** is also provided alongside the code. Use it as the authoritative source of truth for expected behavior, rules, and business intent.

-----

## PHASE 1 — BRD ANALYSIS (Do This First)

Before touching code, extract the following from the BRD:

1. **Business Objectives** — What problem is this system solving? Who are the users?
1. **Exception Types Inventory** — List all defined exception categories, their triggers, priorities, and SLAs.
1. **Workflow Stages & Transitions** — Document every stage (e.g., NEW → ASSIGNED → IN_REVIEW → RESOLVED → CLOSED). Include:
- Entry conditions per stage
- Exit conditions / transition triggers
- Allowed roles per stage action
- Auto-escalation or timeout rules
1. **File Ingestion Rules** — What upstream files are expected? Format, frequency, validation rules, error handling expectations.
1. **User Roles & Entitlements** — Who can see what? Who can act on which exception types at which stages?
1. **Reporting & Audit Requirements** — What must be logged? What reports are expected?
1. **Non-Functional Requirements** — SLAs, volume expectations, availability, data retention.

**Output:** A structured BRD Summary table with findings, gaps, and ambiguities flagged.

-----

## PHASE 2 — DATABASE REVIEW (Oracle)

### 2a. Schema Analysis

- List all tables with their purpose (inferred from BRD + column names).
- Identify primary/foreign key relationships. Produce an **Entity Relationship summary**.
- Flag missing indexes on frequently queried columns (workflow stage, exception type, date ranges, user ID).
- Identify tables that should have **audit columns** (`CREATED_BY`, `CREATED_DATE`, `LAST_UPDATED_BY`, `LAST_UPDATED_DATE`) but are missing them.
- Check for use of `VARCHAR2` vs `NVARCHAR2` for text fields — flag inconsistencies.
- Identify any tables storing JSON blobs — assess if this is appropriate or if it should be normalized.

### 2b. Workflow State Machine in DB

- Identify the table(s) tracking workflow stage transitions.
- Is the current stage stored redundantly in multiple places? Flag this.
- Is there a **workflow history/audit trail table**? If not, flag as a critical gap.
- Are stage transition rules enforced at DB level (check constraints, triggers) or only in application code?

### 2c. Stored Procedures / Functions / Triggers

- List all PL/SQL objects with their purpose.
- Flag any business logic embedded in DB that should be in the application layer.
- Flag any triggers that could cause performance issues or hidden side effects.
- Assess exception handling within PL/SQL blocks — are errors being swallowed silently?

### 2d. Performance & Scalability

- Identify tables likely to grow large (exception records, audit logs, file load history).
- Are there partitioning strategies in place for large tables? Recommend if missing.
- Flag any N+1 query risks (evidence of row-by-row processing in PL/SQL loops).
- Check for use of `SELECT *` in views or stored procedures.
- Assess sequence/identity column strategies for primary keys.

### 2e. Security

- Are there any columns storing sensitive data unencrypted (user credentials, PII)?
- Is row-level security or VPD (Virtual Private Database) used where entitlements require it?
- Are DB user privileges minimal (principle of least privilege)?

-----

## PHASE 3 — FILEWATCHER REVIEW

### 3a. Architecture & Design

- What design pattern is used — polling, iNotify/OS event, scheduled batch?
- Is the watcher resilient to restarts? Does it track which files have been processed (idempotency)?
- How is the file manifest/inventory tracked — DB table, flat file, in-memory?
- Is there a dead-letter mechanism for files that fail processing?

### 3b. File Parsing & Validation

- What file formats are handled (CSV, fixed-width, XML, JSON)?
- Is schema/format validation done before DB load? What happens on validation failure?
- Are partial loads handled — e.g., if row 5000 of 10000 fails, what happens to rows 1–4999?
- Is there duplicate file detection (same file dropped twice)?

### 3c. Error Handling & Alerting

- Are all exceptions caught and logged with sufficient context (filename, row number, error type)?
- Is there alerting/notification on file load failure?
- Is the error state persisted to DB for visibility in the UI?

### 3d. Code Quality

- Check for hardcoded file paths, credentials, or environment-specific values — should be config/externalized.
- Are file handles properly closed (context managers in Python / try-with-resources in Java)?
- Is logging structured (JSON/key-value) or free-text? Structured is preferred for enterprise log aggregation.
- Is there unit test coverage for parsing logic?

### 3e. Concurrency & Performance

- Can multiple files be processed in parallel? Is there a thread/worker pool?
- Is there a mechanism to prevent two FileWatcher instances from processing the same file simultaneously (file locking, DB-based lock)?

-----

## PHASE 4 — EXCEPTION HUB (JAVA SERVICE) REVIEW

### 4a. Architecture & Design

- What architectural pattern is used — layered (Controller → Service → Repository), hexagonal, CQRS?
- Is there a clear separation between workflow orchestration logic and business/domain logic?
- **Custom FSM Review (no BPM tool in use):** How is the state machine implemented?
  - Is there an explicit `WorkflowStateMachine` or `WorkflowEngine` class, or is logic scattered across multiple services?
  - Are transitions defined as data (e.g., enum map, DB config table) or hardcoded as if/else / switch chains?
  - Is there a single entry point for all transitions, or can stage changes happen from multiple code paths?
  - Is there a `TransitionGuard` / pre-condition validation layer before a transition is allowed?
  - Is there a `TransitionAction` / post-transition hook layer (e.g., send notification, write audit) after a transition completes?
  - Flag if the FSM logic is **implicit** — buried in service methods rather than expressed as a cohesive state machine. This is the most common failure mode in custom-built workflow systems.
- Are there any God classes or services doing too much (e.g., a single service handling business validation AND workflow state AND notifications)?

### 4b. Custom Workflow Engine Analysis

> This system has **no BPM tool**. The workflow engine is entirely hand-coded. Apply extra scrutiny to all items below — there is no framework providing safety nets.

- **Stage Inventory:** List every workflow stage found in the code (enums, constants, DB values). Compare against BRD stages. Flag any missing or extra stages.
- **Transition Map:** For each valid transition (e.g., NEW → ASSIGNED), identify:
  - Which Java class/method drives it
  - What pre-conditions / guard checks are applied (role, data validity, prior stage)
  - What DB writes occur (which tables, which columns)
  - What post-transition actions fire (notifications, audit writes, downstream calls)
- **Atomicity:** Are all DB writes for a single transition wrapped in one `@Transactional` boundary? A failed mid-transition write in a custom FSM has no automatic rollback unless explicitly coded.
- **Concurrency Control:** Is there optimistic locking (`@Version`) or pessimistic locking (`SELECT FOR UPDATE`) to prevent two users racing on the same exception record? Custom FSMs have no built-in locking.
- **Illegal Transition Handling:** What happens if the code receives a transition request that is not valid for the current stage (e.g., CLOSED → ASSIGNED)? Is it rejected with a clear error, or silently accepted?
- **Missing Transitions vs BRD:** Flag any BRD-defined transitions not implemented in code.
- **Undocumented Transitions:** Flag any code transitions not described in the BRD — these are unreviewed business rules embedded in the system.

### 4c. API Layer

- List all REST endpoints with their HTTP method, path, request/response contract, and mapped BRD function.
- Are HTTP status codes used correctly (200/201/400/404/409/500)?
- Is input validation done at the controller level (Bean Validation / `@Valid`)?
- Are API responses consistent in structure — e.g., a standard envelope `{ data, error, metadata }`?
- Is pagination implemented for list endpoints? What is the default/max page size?
- Are there any endpoints missing authentication/authorization guards?

### 4d. Security & Entitlements

- How is authentication enforced — JWT, OAuth2, session?
- How is role-based authorization applied — annotations, filter chain, service-layer checks?
- Are entitlement checks consistent — no bypass paths where a lower-privilege user could trigger a restricted action via a different endpoint?
- Is there any sensitive data (PII, financial figures) being logged at DEBUG level?

### 4e. Error Handling & Resilience

- Is there a global exception handler (`@ControllerAdvice`)? Does it produce consistent error responses?
- Are downstream failures (DB unavailable, FileWatcher errors) handled gracefully with appropriate fallback or circuit breaker?
- Are there any `catch(Exception e) { e.printStackTrace(); }` anti-patterns?
- Is there retry logic for transient failures?

### 4f. Code Quality & Maintainability

- Are there any obvious code smells: duplicated logic, magic numbers/strings, overly long methods?
- Is business logic leaking into controllers or repositories?
- Are there unit tests? What is the approximate coverage of the core workflow logic?
- Are there integration tests for the workflow transitions?
- Is there consistent use of logging at appropriate levels (DEBUG/INFO/WARN/ERROR)?
- Are there TODO/FIXME comments indicating incomplete or risky code?

### 4g. Performance

- Are there N+1 query problems (JPA lazy loading triggering per-record DB calls in loops)?
- Are database connections properly managed (connection pooling via HikariCP or equivalent)?
- For heavy list queries, is there DB-level pagination or is the service pulling all rows into memory?
- Any obvious missing caches for reference data (lookup tables, user/role data)?

-----

## PHASE 5 — UI APPLICATION (UIP) REVIEW

### 5a. Architecture & Design

- What state management pattern is used — Redux, Context API, Zustand, React Query?
- Is there clear separation between data-fetching logic and presentation components?
- Are components appropriately sized — no monolithic components doing layout + data fetch + business logic?

### 5b. Workflow UI Flows

- For each workflow stage, map the UI interaction:
  - What does the user see?
  - What actions are available per stage?
  - Is the action availability controlled by user role (entitlement-aware rendering)?
  - What happens on action success/failure — is feedback clear to the user?
- Are there any stages where the UI allows an action that the backend will reject (frontend/backend entitlement mismatch)?

### 5c. Data Display & Consistency

- Is exception data displayed consistently with BRD definitions (field labels, date formats, status terminology)?
- Are loading states handled — is there a spinner/skeleton while data fetches?
- Are error states handled — does the UI surface API errors meaningfully?
- Is there pagination/virtualization for large exception lists, or does it load everything?

### 5d. Code Quality

- Are there any direct API calls in components (should be in services/hooks)?
- Is there consistent error boundary usage?
- Are TypeScript types/interfaces defined for all API response shapes?
- Are there any `any` type usages that undermine type safety?
- Are there magic strings for workflow stage names — should be enums/constants?

### 5e. Security

- Are JWT tokens stored securely (not in localStorage — prefer httpOnly cookies or memory)?
- Is the UI enforcing route-level guards based on role?
- Are there any places where user-controlled input is rendered as raw HTML (XSS risk)?

### 5f. Performance & UX

- Are large lists virtualized (react-window or similar)?
- Are API calls debounced for search/filter interactions?
- Is there optimistic UI for common actions (stage transitions) or does every action require a full reload?

-----

## PHASE 6 — CROSS-CUTTING CONCERNS

### 6a. End-to-End Flow Tracing

Trace the complete lifecycle of a single exception record from birth to closure:

```
Upstream File Drop
  → FileWatcher detects file
  → File parsed & validated
  → Exception record created in Oracle DB (which table, which columns, initial stage)
  → Exception Hub picks up / is triggered (how? polling? event?)
  → Record appears in UIP for user action
  → User performs Stage 1 action → Stage transitions (which API call, which DB update, which audit entry)
  → [Continue through all stages to CLOSED]
  → Audit trail complete in DB
```

Flag any gaps, missing handoffs, or race conditions in this chain.

### 6b. Observability

- Is there distributed tracing (correlation ID flowing from FileWatcher → Exception Hub → DB → UI logs)?
- Is there a centralized logging strategy? Are log levels consistent?
- Are there health check endpoints on all services?
- Is there any metrics instrumentation (Micrometer, Prometheus)?

### 6c. Configuration Management

- Are environment-specific configs (DB URLs, credentials, file paths) externalized (env vars, Vault, Spring Cloud Config)?
- Are there any hardcoded values that should be configurable?

### 6d. Deployment & DevOps

- Is there a Dockerfile / docker-compose for local dev? Does it work as-is?
- Are there CI/CD pipeline definitions? Do they run tests?
- Is there a DB migration tool in use (Flyway, Liquibase)? Are migrations versioned and idempotent?
- Is there a rollback strategy for DB migrations?

### 6e. Documentation

- Is there an up-to-date API contract (OpenAPI/Swagger)?
- Is the workflow state machine documented anywhere in the repo (diagram or markdown)?
- Are environment setup instructions present and accurate?

-----

## PHASE 7 — GAP ANALYSIS & RISK REGISTER

Produce a structured output with:

### 7a. BRD vs Implementation Gap Table

|BRD Requirement       |Component                  |Implemented?            |Notes  |
|----------------------|---------------------------|------------------------|-------|
|[requirement from BRD]|FileWatcher / Hub / UI / DB|✅ Yes / ⚠️ Partial / ❌ No|Details|

### 7b. Risk Register

|Risk ID|Component|Severity|Description                                   |Recommendation                                                            |
|-------|---------|--------|----------------------------------------------|--------------------------------------------------------------------------|
|R001   |DB       |HIGH    |No audit trail table for workflow transitions |Add WORKFLOW_AUDIT table with stage_from, stage_to, actioned_by, timestamp|
|R002   |Java     |HIGH    |Workflow transitions not in single transaction|Wrap multi-step transitions in @Transactional                             |
|…      |         |        |                                              |                                                                          |

Severity: **CRITICAL** (data loss / security) → **HIGH** (correctness / compliance) → **MEDIUM** (maintainability) → **LOW** (style / minor)

### 7c. Immediate Action Items (Top 10)

Prioritized list of the most important fixes before this system goes to production.

-----

## PHASE 8 — ARCHITECTURE RECOMMENDATIONS

As an Enterprise Solution Architect, provide forward-looking recommendations. Note: the team has consciously chosen a **custom-built workflow engine** with no BPM dependency. Recommendations should respect this decision and focus on hardening the custom approach rather than migrating to an external BPM tool, unless the evidence strongly justifies it.

1. **Custom FSM Hardening** — Is the state machine expressed as a first-class construct (a dedicated `WorkflowEngine` or `StateMachine<Stage>` class) or scattered across service methods? Recommend centralising all transition logic into one authoritative engine class with explicit guard → action → audit pipeline per transition. Provide a sample refactoring pattern if the current code is implicit.
1. **Event-Driven Handoff** — Should FileWatcher → Exception Hub use a message queue (RabbitMQ/Kafka) instead of polling/direct DB write? Assess based on volume, reliability, and the need to decouple ingestion from processing in the custom workflow.
1. **Scalability** — Can the Exception Hub scale horizontally given its custom FSM? Are there any singleton/stateful patterns (in-memory stage caches, static transition maps) that would break under multiple instances?
1. **Resilience** — Is there a retry/dead-letter pattern for failed file loads and failed workflow transitions? The custom FSM must implement this itself — there is no BPM engine providing compensation or retry.
1. **Audit & Compliance** — Is the audit trail sufficient for regulatory review? Since there is no BPM tool generating an audit log automatically, the application must do this explicitly. Recommend Hibernate Envers on the Exception entity or a dedicated `WORKFLOW_AUDIT` table populated inside every transition’s `@Transactional` boundary.
1. **API Versioning** — Is there a versioning strategy for the REST API to support UI and consumer upgrades independently?
1. **Testing Strategy** — Recommend a test pyramid (unit / integration / contract / E2E) with specific focus on:
- Unit tests for every valid and invalid transition in the custom FSM
- Integration tests verifying atomicity of multi-write transitions
- Contract tests between Exception Hub REST API and UIP
1. **Security Hardening** — Any OAuth2/RBAC improvements, secrets management, or data masking recommendations. Ensure role enforcement is in the custom transition guards, not just UI button visibility.

-----

## OUTPUT FORMAT

Structure your full response as follows:

```
## EXECUTIVE SUMMARY
[3-5 paragraph overall health assessment for a VP/CIO audience]

## BRD ANALYSIS
[Phase 1 findings]

## DATABASE REVIEW
[Phase 2 findings, schema map, risks]

## FILEWATCHER REVIEW
[Phase 3 findings]

## EXCEPTION HUB REVIEW
[Phase 4 findings]

## UI APPLICATION REVIEW
[Phase 5 findings]

## END-TO-END FLOW TRACE
[Phase 6a — the full chain narrative]

## CROSS-CUTTING CONCERNS
[Phases 6b–6e]

## GAP ANALYSIS & RISK REGISTER
[Phase 7 tables]

## ARCHITECTURE RECOMMENDATIONS
[Phase 8 narrative]

## APPENDIX: CODE SNIPPETS OF CONCERN
[Paste specific problematic code blocks with inline commentary]
```

-----

## DELIVERABLE: HTML ISSUE TRACKER

The output of this review should also be loaded into the **team HTML Issue Tracker** (`workflow-review-tracker.html`) — a self-contained, light-theme, single-file tool the team can open in any browser with no server or install required.

### What the HTML tracker provides:

- **Issue log** — log every finding from this review as a tracked issue with severity, component, type, assignee, status, description, fix recommendation, and file reference
- **Status workflow** — move issues through Open → In Progress → Fixed → Closed
- **Filters & search** — filter by component (FileWatcher / Exception Hub / UI / DB / Cross-Cutting), severity, status, assignee, or free-text search
- **Review checklist** — per-component checklist items ticked off as the team works through the review
- **E2E flow diagram** — visual map of the custom workflow stage chain rendered in-browser
- **Risk register** — pre-seeded enterprise risks with ability to raise any risk as a tracked issue
- **Stats dashboard** — live counts of total / critical / high / open / fixed issues
- **Persistence** — all data saved to browser `localStorage`; no backend required
- **Export** — JSON and CSV export for sharing with project managers or importing into JIRA

### How to use it with this prompt:

1. Run this review prompt against the codebase (attach all source folders + BRD)
1. For each finding in the output, click **＋ New Issue** in the tracker and fill in the fields
1. Assign issues to developers on the team
1. As fixes are deployed, update status to **Fixed** and add a comment with the commit reference
1. Use the **Review Checklist** page to track which review phases have been completed per component
1. Export JSON at the end of each sprint to share progress with stakeholders

-----

*Generated by Claude — Enterprise Architecture Review Template v2.0*
*Updated: Custom-built workflow engine (no BPM tools). Includes HTML Issue Tracker deliverable.*
*Designed for: Workflow Exception Hub Platform — FileWatcher + Exception Hub (Java) + UIP (React) + Oracle DB*