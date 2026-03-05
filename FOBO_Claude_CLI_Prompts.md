# FOBO Service — Claude CLI Codebase Analysis Prompts
> Enterprise Architect Edition | Java + Python | Thread Pool & Async Architecture
> Use these prompts with `claude` CLI inside your office codebase directory.

---

## HOW TO USE

```bash
# Navigate to your repo root first
cd /path/to/fobo-service

# Then run any prompt below like:
claude "<<PASTE PROMPT HERE>>"

# Or for multi-file analysis (recommended):
claude --files src/ "<<PASTE PROMPT HERE>>"
```

---

## PROMPT 1 — Root Cause Diagnosis (Start Here)

**Purpose:** Understand exactly where and why thread exhaustion happens in the actual code.

```
You are an enterprise architect with deep expertise in Java Spring Boot, distributed systems, 
and financial reconciliation platforms.

Analyze this codebase and identify:

1. THREAD POOL CONFIGURATION
   - Find all ThreadPoolExecutor / TaskExecutor / @Async bean definitions
   - Report: corePoolSize, maxPoolSize, queueCapacity for each pool
   - Identify which pool handles Titan HTTP calls

2. SYNCHRONOUS HTTP COUPLING
   - Find every HTTP call made to the Titan engine (look for RestTemplate, 
     WebClient, HttpClient, FeignClient, or OkHttp usage)
   - For each call: show the method name, file, line number, and whether it 
     blocks a thread (synchronous vs async)
   - Identify if any call is wrapped in a CompletableFuture that still occupies 
     a thread pool slot during the full wait

3. THREAD EXHAUSTION RISK CALCULATION
   - Based on the thread pool config you found, calculate:
     * Max concurrent Titan calls per FOBO instance
     * At 15,000 masterbooks/day (8-hour window), what is peak concurrency demand?
     * At 30,000 masterbooks/day, what is peak concurrency demand?
     * At what masterbook volume does the pool saturate?

4. REJECTION HANDLING
   - Find the RejectedExecutionHandler in use
   - Show what happens when the queue is full (is it logged? retried? silently dropped?)
   - Find any try/catch around RejectedExecutionException

5. TIMEOUT CONFIGURATION
   - Find all HTTP timeout settings (connection timeout, read timeout, socket timeout)
   - Are these set correctly for 10+ minute Titan jobs?
   - Flag any mismatches vs NGINX proxy_read_timeout

Output a structured report with file paths, line numbers, and severity ratings 
(CRITICAL / HIGH / MEDIUM) for each finding.
```

---

## PROMPT 2 — Architectural Options Analysis

**Purpose:** Get Claude to evaluate all fix options against YOUR actual codebase constraints.

```
You are an enterprise architect. You have analyzed this Java Spring Boot codebase (FOBO Service).
The core problem: FOBO makes synchronous blocking HTTP calls to Titan (a Python/Pandas engine).
Titan jobs now take 10+ minutes, causing thread pool exhaustion and RejectedExecutionExceptions.

Constraints (hard limits, do not suggest alternatives):
- No new infrastructure (no Kafka, no RabbitMQ, no Redis in the near term)
- Existing database: MADB (PostgreSQL-compatible, used by both FOBO and Titan)
- FOBO: Java Spring Boot, 5 instances, load-balanced
- Titan: Python (pika/Flask), 100 instances, NGINX load-balanced, supervisord-managed
- Priority order for this solution: Resilience > Simplicity > Latency > Throughput

Evaluate FOUR architectural options against this codebase:

OPTION A — DB-Backed Polling Queue (SELECT FOR UPDATE SKIP LOCKED)
- FOBO inserts a job row into a new MADB table (recon_job_queue) on each masterbook trigger
- A Spring @Scheduled poller on each FOBO instance claims jobs using SELECT FOR UPDATE SKIP LOCKED
- Titan polls the same table (Python psycopg2 or SQLAlchemy) to pick up and process jobs
- FOBO polls job status table until COMPLETED or FAILED
- Assess: How much code change is needed in THIS codebase? What Spring components are involved?

OPTION B — Async HTTP Callback (Webhook Pattern)
- FOBO POSTs job to Titan with a callbackUrl, Titan returns 202 Accepted immediately
- FOBO stores pending job state in MADB
- Titan POSTs back to FOBO /callback endpoint when done
- Assess: What new endpoints are needed? How does FOBO correlate callbacks? Crash recovery?

OPTION C — Spring WebFlux / Reactive (Non-Blocking HTTP)
- Replace RestTemplate/HttpClient with WebClient (reactive, non-blocking)
- FOBO subscribes to the response without holding a thread
- Assess: Is this codebase already using Spring MVC or WebFlux? 
  What is the migration cost? Does this solve crash resilience?

OPTION D — Expanded Thread Pool + Circuit Breaker (Tactical, No Async)
- Increase thread pool queue to 4,000+ (already planned)
- Add Resilience4j circuit breaker around Titan calls
- Add bulkhead pattern to isolate Titan thread pool
- Assess: Is Resilience4j already in pom.xml? What is the ceiling before this fails again?

For each option provide:
- Pros and Cons (5 each minimum)
- Implementation effort: Lines of code estimate, number of files touched
- Crash resilience rating: What happens if FOBO restarts mid-job?
- My recommendation with justification based on the resilience-first priority

End with a comparison table.
```

---

## PROMPT 3 — DB Queue Implementation Plan (Phase 1 Build)

**Purpose:** Get a concrete, production-ready implementation plan using YOUR existing stack.

```
You are a senior Java architect. Based on this FOBO Spring Boot codebase, design and 
generate the implementation for a DB-backed async job queue using the existing MADB database.

This replaces the current synchronous HTTP call to Titan.

STEP 1 — DATABASE SCHEMA
Generate the SQL DDL for:
- Table: recon_job_queue (columns: job_id UUID PK, masterbook_id, rec_type, priority INT, 
  status ENUM[PENDING/CLAIMED/PROCESSING/COMPLETED/FAILED/DEAD_LETTER], 
  created_at, claimed_at, completed_at, claimed_by_instance VARCHAR, 
  retry_count INT, error_message TEXT, payload JSONB)
- Index strategy for: status + priority polling, claimed_by cleanup, SLA alerting

STEP 2 — JAVA IMPLEMENTATION (Spring Boot)
Generate production-ready code for:

a) JobQueueRepository.java
   - Spring Data JPA or JdbcTemplate (use whichever pattern is already in this codebase)
   - Method: claimNextJob(instanceId) using SELECT FOR UPDATE SKIP LOCKED
   - Method: markCompleted(jobId), markFailed(jobId, errorMsg)
   - Method: requeueStaleClaimed(timeoutMinutes) — for crash recovery

b) JobQueueScheduler.java
   - @Scheduled poller with configurable interval (default 5 seconds)
   - Claim up to N jobs per poll cycle (configurable, default 10)
   - Submit each claimed job to TitanAsyncService

c) TitanAsyncService.java
   - Replace current synchronous RestTemplate call with fire-and-forget dispatch
   - Submit job details to Titan via HTTP POST (Titan now polls or receives push)
   - Update job status based on Titan response

d) JobStatusPoller.java
   - For jobs submitted to Titan, poll MADB job_status until COMPLETED or FAILED
   - Timeout after configurable duration (default 30 minutes)
   - On timeout: mark as FAILED with error, increment retry_count

e) application.yml additions
   - job.queue.poll-interval-ms=5000
   - job.queue.max-claims-per-cycle=10
   - job.queue.titan-timeout-minutes=30
   - job.queue.stale-claim-timeout-minutes=15
   - job.queue.max-retries=3

STEP 3 — PYTHON IMPLEMENTATION (Titan Engine)
Generate Python code for:

a) job_poller.py
   - Uses psycopg2 (or SQLAlchemy — check which is already in Titan's requirements.txt)
   - Polls recon_job_queue for PENDING jobs using SELECT FOR UPDATE SKIP LOCKED
   - Claims job, sets status=PROCESSING, runs reconciliation
   - On success: sets status=COMPLETED, writes results to existing MADB output tables
   - On failure: sets status=FAILED, writes error_message

b) Integration point: how does this poller run alongside supervisord?
   - Provide supervisord config block for job_poller.py process

STEP 4 — MIGRATION PATH
- What is the feature flag / toggle strategy to run old and new code in parallel?
- How do we verify the new queue is working before cutting over?
- Rollback plan if issues are found in production

Use the exact package structure, naming conventions, and annotation style 
already present in this codebase.
```

---

## PROMPT 4 — Titan Python Engine Deep Dive

**Purpose:** Analyze why Titan degraded from 1–2 min to 10+ min per job.

```
You are a Python performance expert and enterprise architect.

Analyze the Titan engine codebase (Python/Pandas reconciliation engine) and identify 
the root cause of the 5–10x throughput regression (jobs now taking 10+ minutes instead 
of 1–2 minutes).

INVESTIGATION 1 — CPU CONTENTION
- How many concurrent worker processes does supervisord spawn?
- How many CPU cores does the host server have? (check any config or comments)
- Are Pandas/NumPy operations CPU-bound or IO-bound?
- Flag: if 100 Python processes compete for 4 CPU cores, calculate actual CPU time per process

INVESTIGATION 2 — PANDAS PERFORMANCE ANTI-PATTERNS
Scan for these specific anti-patterns and report each with file + line number:
- iterrows() or itertuples() on large DataFrames (should use vectorized operations)
- apply() with complex lambda functions (check if vectorizable)
- DataFrame concatenation inside loops (pd.concat should be outside loops)
- Missing dtype specification on read_sql / read_csv (causes object dtype inference overhead)
- Chained indexing (df[col][row] instead of df.loc[row, col])
- Not using inplace=True where appropriate to avoid copies
- Loading entire MADB result sets when filtering could be pushed to SQL

INVESTIGATION 3 — DATABASE ACCESS PATTERNS
- Find all SQL queries executed against MADB
- Are queries parameterized or string-interpolated (SQL injection + performance risk)?
- Are there missing indexes? (look for queries filtering on columns not indexed)
- Are transactions left open during long Pandas computations?
- Is SQLAlchemy connection pooling configured correctly?

INVESTIGATION 4 — NGINX + SUPERVISORD CONFIGURATION
- What is the NGINX upstream timeout for Titan workers?
- What is supervisord's stopwaitsecs for graceful shutdown?
- Is there any request queuing at NGINX level? (worker_connections, proxy_buffer_size)

INVESTIGATION 5 — CONCURRENCY ANALYSIS
- Does Titan use Python's GIL-bound threading or multiprocessing?
- Are there any asyncio / concurrent.futures patterns in use?
- Could reducing Titan instances from 100 to 16–20 (matching CPU cores) 
  improve throughput? Model the math.

Output: ranked list of performance issues with estimated impact (% improvement if fixed),
and a prioritized remediation plan.
```

---

## PROMPT 5 — Resilience & Hardening Review (Phase 2)

**Purpose:** Find all the ways the current system can fail silently and harden it.

```
You are an enterprise architect specializing in financial systems resilience.
Priority for this system: Resilience > Simplicity > Latency > Throughput.

Review this FOBO + Titan codebase for resilience gaps and generate hardening recommendations.

RESILIENCE GAP 1 — CRASH RECOVERY
- What happens to in-flight masterbook jobs if any FOBO instance restarts?
- What happens if Titan crashes mid-reconciliation?
- Are there any orphaned jobs that would never be retried?
- Is there a dead-letter mechanism for jobs that fail repeatedly?

RESILIENCE GAP 2 — RETRY LOGIC
- Find all retry logic in the codebase (Spring Retry, manual retry loops, Resilience4j)
- Is retry done with exponential backoff?
- Are retries idempotent? (Can the same masterbook be reconciled twice safely?)
- What is the max retry count, and what happens when exceeded?

RESILIENCE GAP 3 — CIRCUIT BREAKING
- Is Resilience4j or Hystrix in use for Titan HTTP calls?
- If Titan is fully down, does FOBO fail fast or keep queuing up requests?
- Is there a fallback behavior?

RESILIENCE GAP 4 — OBSERVABILITY
- Is there structured logging (JSON) for job start/end/failure with masterbook_id?
- Are thread pool metrics exported to Prometheus or Micrometer?
- Is there any SLA alerting for jobs stuck > 30 minutes?
- Is correlation ID propagated from SOD trigger through to Titan output?

RESILIENCE GAP 5 — MULTI-INSTANCE COORDINATION
- With 5 FOBO instances, is there any risk of the same masterbook being processed twice?
- Is the SELECT FOR UPDATE SKIP LOCKED pattern (or equivalent) used anywhere?
- Are there any distributed locks in use?

For each gap:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Current code location (file + line if applicable)
- Recommended fix with code snippet
- Effort estimate: hours

Generate a Phase 2 hardening backlog in priority order.
```

---

## PROMPT 6 — Management Summary Generator

**Purpose:** After running the above prompts, generate a management-ready document.

```
You are an enterprise architect. Based on your analysis of the FOBO codebase, 
generate a concise management summary document (2 pages max when printed).

Structure:
1. WHAT IS BROKEN (2–3 sentences, non-technical)
2. BUSINESS IMPACT (quantify: jobs failing per day, SLA breach risk, volume growth risk)
3. ROOT CAUSE (1 paragraph, architecture-level, no jargon)
4. THREE OPTIONS CONSIDERED (table: option name | effort | resilience | risk)
5. RECOMMENDED SOLUTION (1 paragraph with rationale)
6. DELIVERY PLAN (4 phases with dates and owners)
   - Phase 0: Immediate hotfix (this weekend)
   - Phase 1: Async DB queue (weeks 1–3)
   - Phase 2: Hardening (weeks 4–8)
   - Phase 3: Scale trigger (RabbitMQ if volume > 100K/day)
7. RISKS & MITIGATIONS (top 3 risks in table form)
8. DECISION REQUIRED (what do you need leadership to approve/unblock?)

Tone: confident, precise, no fluff. Written for a CTO or VP Engineering audience.
```

---

## QUICK REFERENCE — Cheat Sheet

| Prompt | When to Use | Time Estimate |
|--------|-------------|---------------|
| **Prompt 1** — Root Cause Diagnosis | First step, always start here | 5–10 min analysis |
| **Prompt 2** — Architectural Options | After diagnosis, before design | 10–15 min analysis |
| **Prompt 3** — DB Queue Implementation | When ready to build Phase 1 | Generates actual code |
| **Prompt 4** — Titan Deep Dive | When investigating Titan slowness | 10–15 min analysis |
| **Prompt 5** — Resilience Hardening | Phase 2 planning | 10 min analysis |
| **Prompt 6** — Management Summary | After all analysis complete | Generates document |

---

## TIPS FOR BEST RESULTS WITH CLAUDE CLI

```bash
# Give Claude access to both repos at once
claude --files fobo-service/src/ titan-engine/src/ "<<PROMPT>>"

# For large codebases, focus Claude on specific packages
claude --files fobo-service/src/main/java/com/yourco/fobo/service/ "<<PROMPT 1>>"

# Ask Claude to be specific about files it cannot see
claude "<<PROMPT>> — If you cannot find a file, say so explicitly rather than assuming."

# Iterative workflow (recommended)
# 1. Run Prompt 1 → read findings
# 2. Run Prompt 2 with findings pasted in as context
# 3. Run Prompt 3 for the chosen option
```

---

*Generated for FOBO Service Architecture Review | March 2026*
*Priorities: Resilience > Simplicity > Latency > Throughput*
*Hard constraints: No Kafka, No RabbitMQ (Phase 1), Use MADB (existing)*
