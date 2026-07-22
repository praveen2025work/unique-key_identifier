---
name: java-spring-standards
description: Industry-standard coding, refactoring, and testing guide for an existing Java Spring application (Exception Management System style stack - Spring MVC, Hibernate/JPA, Spring Data repositories, auditing, H2 for local and unit testing). Use this skill whenever the user asks to refactor, clean up, review, standardize, or add tests to Java/Spring code; mentions controllers, services, repositories, entities, DTOs, Hibernate, JPA, transactions, audit fields, or unit/integration tests; or asks whether code follows best practices. Also trigger when writing ANY new Java code for this project, so it lands in the right layer with the right conventions. The prime directive of this skill - preserve existing behavior; refactoring must not introduce breaking changes.
---

# Java Spring Standards & Safe Refactoring

This skill governs how to write, refactor, and test Java code for an **existing, working Spring application**. The application already serves users. The goal is to raise code quality to industry standard **without changing observable behavior** — same endpoints, same request/response contracts, same database schema semantics, same business rules.

## The Prime Directive: No Breaking Changes

Before touching any code, internalize this: **a refactor that changes behavior is a bug, not an improvement.** Every change must be justifiable as "the system does exactly what it did before, but the code is cleaner/safer/more testable."

What counts as a breaking change (never do these silently):
- Changing a REST endpoint path, HTTP method, request/response field name, status code, or content type
- Renaming or retyping a database column, changing nullability, or altering JPA mappings in a way that changes generated SQL semantics
- Changing validation rules (making something required that wasn't, or vice versa)
- Changing transaction boundaries in a way that alters commit/rollback behavior
- Changing exception types thrown across a public API boundary
- Reordering or altering business logic side effects (audit writes, workflow triggers, notifications)

If a genuine improvement *requires* a behavior change (e.g., a bug that callers may depend on), stop and present it to the user as a decision — never fold it into a refactor.

### Safe-refactoring workflow

1. **Read before writing.** Understand the class, its callers, and its tests. Search for all usages of anything you rename or move.
2. **Characterize first.** If the code you're refactoring has no tests, write characterization tests that pin down current behavior (including quirks) BEFORE refactoring. These tests are your safety net.
3. **Small, mechanical steps.** Extract method → rename → move → introduce interface. One transformation at a time, keeping the code compiling and tests green between steps.
4. **Verify.** Run the full test suite after the refactor. If tests exist for the touched area, they must pass unmodified (modifying a test to make a refactor pass is a red flag — investigate why).
5. **Summarize the diff** for the user: what changed structurally, and explicitly confirm "no behavior change" or list any behavior deltas for approval.

## Layered Architecture (Spring MVC pattern)

Every piece of code belongs to exactly one layer. When refactoring, the most common win is moving logic to its correct layer.

```
Controller  →  Service  →  Repository  →  Database
   (web)       (business)    (data access)
     ↓             ↓
    DTOs        Entities
```

**Controller (`@RestController` / `@Controller`)**
- Thin. Only: bind/validate input, delegate to service, map result to response.
- Accepts and returns **DTOs, never entities**. Exposing entities leaks schema, causes lazy-loading serialization failures, and couples API to database.
- No business logic, no repository access, no transaction management.
- Validation via `@Valid` + Jakarta Bean Validation annotations on DTOs.
- Errors handled centrally by a `@RestControllerAdvice` global exception handler mapping domain exceptions to HTTP statuses — not try/catch in every endpoint.

**Service (`@Service`)**
- Owns business logic and transaction boundaries: `@Transactional` on write methods, `@Transactional(readOnly = true)` on reads.
- Orchestrates repositories; converts between entities and DTOs (or delegates to a mapper such as MapStruct or a dedicated mapper class).
- Throws meaningful domain exceptions (`ExceptionRecordNotFoundException`, `InvalidStatusTransitionException`), not raw `RuntimeException`.

**Repository (Spring Data JPA)**
- Interfaces extending `JpaRepository<Entity, ID>` (or `JpaSpecificationExecutor` for dynamic filtering).
- Prefer derived query methods and `@Query` JPQL over native SQL. Native SQL only when necessary, and flagged — it can behave differently on H2 vs the production database.
- No business logic in repositories.

**Entity (`@Entity`)**
- Maps the table; contains mapping annotations and (optionally) small invariant logic. No service dependencies, no web concerns.

When you find logic in the wrong layer (queries in controllers, business rules in entities' setters, DTO mapping in repositories), relocate it in a dedicated refactoring step with tests guarding behavior.

## Hibernate / JPA rules

- **Lazy by default**: `@ManyToOne(fetch = FetchType.LAZY)`, `@OneToMany` is lazy already. Eager fetching hides N+1 problems.
- **N+1 avoidance**: use `JOIN FETCH` in JPQL or `@EntityGraph` when the use case needs associations. When refactoring, look for loops that trigger per-row queries.
- **Equals/hashCode** on entities: base on the business key or ID-when-assigned, never on mutable fields or collections.
- **No entity leakage** past the service layer.
- **Dirty checking**: inside a transaction, modifying a managed entity persists automatically — avoid redundant `save()` calls, but don't remove existing `save()` calls during refactoring unless you've verified the entity is managed in that context (behavior preservation first).
- **Schema changes** belong in migration scripts (Flyway/Liquibase) if the project has them; never rely on `ddl-auto=update` outside local dev.
- **Oracle specifics** (production DB is Oracle): prefer `GenerationType.SEQUENCE` with an explicit `@SequenceGenerator` matching the existing Oracle sequence — never change an entity's existing ID generation strategy during a refactor. Watch for Oracle's empty-string-is-NULL behavior in any string comparisons, `VARCHAR2` length semantics, and reserved words in column names. Native SQL using Oracle syntax (`ROWNUM`, `NVL`, `SYSDATE`, `(+)` joins, hints) works in production but may fail or behave differently on H2 — when refactoring, prefer converting it to JPQL/derived queries *only* if you can prove equivalence; otherwise leave it and note it's Oracle-only.

## Auditing

Standard pattern — apply consistently, don't reinvent per entity:

- A `@MappedSuperclass` base (e.g., `Auditable`) with `createdBy`, `createdDate`, `lastModifiedBy`, `lastModifiedDate`, annotated `@CreatedBy`, `@CreatedDate`, `@LastModifiedBy`, `@LastModifiedDate`.
- `@EntityListeners(AuditingEntityListener.class)` on the base class, `@EnableJpaAuditing` in configuration, and an `AuditorAware<String>` bean resolving the current user (from Spring Security context or request context).
- For row-level history (who changed which field when), Hibernate Envers (`@Audited`) or an explicit audit table written by the service — follow whichever pattern the project already uses. **Never remove or reorder existing audit writes during refactoring** — audit trails are often a compliance requirement in this domain.

## Coding standards (apply when writing or refactoring)

- **Constructor injection only** — final fields, no `@Autowired` on fields. Use Lombok `@RequiredArgsConstructor` if the project uses Lombok.
- **Naming**: `ExceptionRecordController` / `ExceptionRecordService` / `ExceptionRecordRepository`; DTOs suffixed `Request`/`Response`/`Dto` consistently with existing project convention.
- **Immutability where cheap**: DTOs as records (Java 17+) or immutable classes if the project's Java version allows; otherwise follow existing style.
- **Null discipline**: return `Optional<T>` from repository-like lookups; never return null collections (return empty).
- **Logging**: SLF4J with parameterized messages (`log.info("Loaded {} exceptions", count)`); no `System.out`, no string concatenation in log calls, no logging sensitive data. Log at boundaries and failures, not every line.
- **Constants over magic values**: statuses, aging thresholds, file paths in enums/config properties (`@ConfigurationProperties`), not string literals scattered in code.
- **Externalize config**: environment-specific values in `application-{profile}.yml`, never hardcoded.
- **Keep methods small and single-purpose**; extract private methods with intention-revealing names rather than comments explaining blocks.
- Match the project's existing formatting/style; consistency beats personal preference. Don't reformat entire files you aren't otherwise changing — it pollutes diffs and code review.

For detailed examples of before/after refactorings in this stack, read `references/refactoring-patterns.md`.

## Testing standards (H2-based)

Read `references/testing-standards.md` for full detail and templates. Summary:

- **Unit tests** (JUnit 5 + Mockito + AssertJ): services tested with mocked repositories. Fast, no Spring context. Naming: `methodName_condition_expectedResult` or `should...When...` — follow whatever the existing tests use.
- **Repository tests**: `@DataJpaTest` — boots only JPA slice against in-memory H2. Verifies queries, mappings, and audit fields populate.
- **Controller tests**: `@WebMvcTest` + MockMvc with mocked services. Verifies routing, validation, status codes, JSON contracts, and the global exception handler.
- **Integration tests**: `@SpringBootTest` sparingly, for critical end-to-end flows (file load → persist → status change → workflow trigger).
- **H2 caveat**: production runs on **Oracle**; H2 is only a local/test stand-in. Keep queries to JPQL/derived methods so they're portable across both. Use `MODE=Oracle` in the H2 URL to narrow dialect gaps, but remember H2 tests don't fully prove Oracle behavior — native SQL, sequences, `DATE`/`TIMESTAMP` semantics, empty-string-as-NULL, and pagination differ. Flag any Oracle-specific SQL so it gets covered by integration testing against a real Oracle instance (or Testcontainers with an Oracle image if the build environment permits).
- **Coverage target**: meaningful coverage of business logic (services) first. Don't chase 100% by testing getters; do test edge cases (nulls, empty lists, invalid status transitions, aging boundaries).
- Tests must be independent and repeatable — no shared mutable state, no order dependence, `@Transactional` rollback or explicit cleanup for data tests.

## When asked to review or refactor existing code

Produce output in this order:

1. **Behavior contract** — one short paragraph: what this code currently does (endpoints, side effects, transactions, audit writes).
2. **Findings** — grouped by severity: correctness risks, layer violations, JPA pitfalls (N+1, eager fetch, entity leakage), testability gaps, style issues.
3. **Refactored code** — complete, compiling code, not fragments, preserving the behavior contract.
4. **Tests** — new/updated tests proving the behavior is unchanged.
5. **Explicit statement** of any behavior differences (ideally: "none").
