# Claude CLI Prompt: BRD → QA Checklist & Test Cases

## How to Use

Run this command in your terminal (replace `your-brd.docx` with your actual file):

```bash
cat brd-checklist-prompt.txt | claude --stdin -a your-brd.docx
```

Or copy the prompt below and pass it directly:

```bash
claude -a your-brd.docx "$(cat brd-checklist-prompt.txt)"
```

---

## The Prompt (copy everything below into `brd-checklist-prompt.txt`)

```
You are a Senior QA Architect. I'm attaching a Business Requirements Document (BRD). Analyze it thoroughly and produce TWO deliverables:

═══════════════════════════════════════════════════════════
DELIVERABLE 1: checklist.html — Interactive Validation Checklist
═══════════════════════════════════════════════════════════

Create a professional, self-contained HTML file with an interactive checklist covering the FULL front-to-back validation lifecycle. Organize it into these sections:

1. **REQUIREMENTS VALIDATION**
   - Every functional requirement from the BRD has a checkbox
   - Business rules are enumerated and verifiable
   - Acceptance criteria are listed per feature/module
   - Data requirements and field-level validations identified

2. **UI / FRONTEND CHECKLIST**
   - Screen-by-screen or component-by-component list
   - Form validations (required fields, formats, min/max, regex)
   - Navigation flows and routing
   - Error message display and user feedback
   - Responsive/cross-browser checks
   - Accessibility (WCAG basics)
   - Loading states, spinners, empty states

3. **API / MIDDLEWARE CHECKLIST**
   - Every API endpoint identified from the BRD
   - Request/response payload validations
   - Authentication & authorization checks
   - Error handling (4xx, 5xx scenarios)
   - Rate limiting, timeout behavior
   - Data transformation / mapping rules

4. **BACKEND / DATABASE CHECKLIST**
   - Data model validations
   - CRUD operation coverage
   - Business logic / calculation verification
   - Batch processing / scheduled jobs (if applicable)
   - Audit trail / logging requirements
   - Data integrity constraints

5. **INTEGRATION CHECKLIST**
   - Upstream/downstream system touchpoints
   - Message queue / event validations (if applicable)
   - File import/export validations
   - Third-party service integration points

6. **NON-FUNCTIONAL CHECKLIST**
   - Performance benchmarks from BRD
   - Security requirements (encryption, PII handling)
   - Scalability considerations
   - Disaster recovery / failover expectations

7. **DEPLOYMENT & RELEASE READINESS**
   - Environment-specific configs validated
   - Database migration scripts reviewed
   - Rollback plan documented
   - Smoke test suite identified

HTML Requirements:
- Self-contained single HTML file, modern clean design
- Use a blue (#337ab7) professional color palette
- Each section is collapsible
- Checkboxes are interactive (JS-powered)
- Show progress bar per section and overall
- Include a "Print" button and "Export Status" button
- Add a header with BRD title, date generated, total items count
- Mobile-friendly layout

═══════════════════════════════════════════════════════════
DELIVERABLE 2: test-cases.csv — Detailed QA Test Cases
═══════════════════════════════════════════════════════════

Create a CSV file with these columns:

TestCaseID, Module, Category, TestCaseTitle, Description, Preconditions, TestSteps, ExpectedResult, Priority, TestType, Layer, Status

Column definitions:
- TestCaseID: Sequential ID like TC-001, TC-002...
- Module: Feature/module name from the BRD
- Category: One of [Functional, UI, API, Database, Integration, Security, Performance, Negative, Boundary, Regression]
- TestCaseTitle: Short descriptive title
- Description: Detailed description of what is being tested
- Preconditions: Setup needed before execution
- TestSteps: Numbered steps (use | as step separator, e.g., "1. Open login page | 2. Enter credentials | 3. Click submit")
- ExpectedResult: Clear expected outcome
- Priority: P1 (Critical), P2 (High), P3 (Medium), P4 (Low)
- TestType: One of [Positive, Negative, Boundary, Edge Case, Smoke, Regression]
- Layer: One of [Frontend, API, Backend, Database, Integration, E2E]
- Status: Default to "Not Started"

Test case coverage requirements:
- At minimum 3 positive + 2 negative test cases per functional requirement
- Boundary value tests for every numeric/date field
- Auth/permission tests per role mentioned in BRD
- API contract tests for every endpoint
- Data validation tests for every input field
- Integration tests for every system touchpoint
- At least 5 E2E happy-path scenarios covering critical business flows

═══════════════════════════════════════════════════════════
IMPORTANT INSTRUCTIONS
═══════════════════════════════════════════════════════════

- Read the ENTIRE BRD before generating anything
- Extract every requirement, rule, field, and flow — do NOT generalize or skip details
- Use the exact terminology from the BRD (module names, field names, role names)
- If the BRD references specific systems, APIs, or databases — include them by name
- For ambiguous requirements, create test cases for BOTH interpretations and flag them
- Ensure test cases trace back to specific BRD sections/requirements
- Save the HTML as checklist.html
- Save the CSV as test-cases.csv
- After creating both files, provide a brief summary: total checklist items, total test cases, coverage breakdown by module and priority
```

---

## Tips

- **Large BRDs**: If your BRD is very large (50+ pages), consider splitting it by module and running the prompt per module, then consolidating.
- **Custom additions**: Append to the prompt if you need specific frameworks covered (e.g., "The frontend uses Angular 17 with PrimeNG components" or "The API layer is .NET Core 8 with Entity Framework").
- **Iterating**: After the first run, you can follow up with: `"Add negative test cases for the payment module"` or `"Expand the security checklist section"`.
