# FOBO Reconciliation Monitor — Claude CLI Prompts
# Run PROMPT 1 first (backend), then PROMPT 2 (frontend) in the same session.

---

## PROMPT 1 — FastAPI Backend

```
You are working in a terminal. Do everything step by step:
install dependencies, write code, fix any errors, and start the server.

Goal: Build and run a FastAPI backend that connects to Oracle DB and
serves data from the table MSBK_BUS_DTL.

--- STEP 1: Setup ---
Create a folder: fobo-api
cd into it and run:
  pip install fastapi uvicorn cx_Oracle python-dotenv

Create .env file with:
  DB_HOST=<HOST>
  DB_PORT=<PORT>
  DB_SID=<SID>
  DB_USER=<USERNAME>
  DB_PASS=<PASSWORD>

--- STEP 2: Write main.py ---
Create fobo-api/main.py with:

1. Oracle DB connection using cx_Oracle and .env values
2. Pydantic model ReconRecord with ALL these fields (use Optional where nullable):
   msbk_bus_dtl_id, bus_date, msbk_id, rec_id, rec_subcategory_id,
   status, expn, expncount, start_time, end_time, service_name,
   is_holiday, regn_id, in_motif, business_area_name,
   hierarchy_level, hierarchy_level7, last_update, last_updated_by

3. Four endpoints:
   GET /api/recon
     query params: bus_date (required), status, region, business_area
     returns: list of ReconRecord filtered by provided params

   GET /api/recon/summary
     query param: bus_date (required)
     returns: { by_status: {}, by_region: {}, by_business_area: {} }
     (counts grouped by each field)

   GET /api/recon/{msbk_bus_dtl_id}
     returns: single ReconRecord

   GET /health
     returns: { status: "ok" }

4. CORS: allow all origins (for local dev)
5. Map Oracle column names to snake_case Python fields in the query result

--- STEP 3: Run and fix ---
Start the server:
  uvicorn main:app --reload --port 8000

If there are any import errors, missing packages, or connection errors:
- Fix them automatically
- Re-run until the server starts successfully
- Show the final output of: curl http://localhost:8000/health

Once running, print:
  ✅ Backend running at http://localhost:8000
  📄 API docs at http://localhost:8000/docs
```

---

## PROMPT 2 — Next.js Frontend

```
You are working in a terminal. The FastAPI backend is already running at
http://localhost:8000. Build and start a Next.js frontend that monitors
the MSBK_BUS_DTL reconciliation table.

--- STEP 1: Setup ---
Run:
  npx create-next-app@latest fobo-ui --typescript --tailwind --eslint --app --no-src-dir
  cd fobo-ui

--- STEP 2: Create these files ---

app/page.tsx
  - Main page, renders <ReconDashboard />

components/ReconDashboard.tsx
  - Single component with all logic and views

lib/api.ts
  - fetch wrapper for http://localhost:8000/api/recon
  - exports: fetchRecon(params), fetchSummary(busDate)

--- STEP 3: Build ReconDashboard.tsx ---

The component fetches from the backend and shows THREE tab views.
Tab state managed with useState. Auto-refresh every 30s.

Data fields from API:
msbk_bus_dtl_id, bus_date, msbk_id, rec_id, rec_subcategory_id,
status, expn, expncount, start_time, end_time, service_name,
is_holiday, regn_id, in_motif, business_area_name,
hierarchy_level, hierarchy_level7, last_update, last_updated_by

TAB 1 — MANAGEMENT
  - Date picker (defaults to today)
  - 5 KPI cards: Total | Complete | Processing | Pending | Failed
    White cards, colored left border + number only (green/blue/amber/red/gray)
  - CSS bar chart: jobs by region (APAC / EMEA / AMER)
  - CSS bar chart: top 10 business areas by count

TAB 2 — OPERATIONS
  - Filters: bus_date, status, region, business_area (dropdowns)
  - Table columns: ID | Bus Date | Book ID | Region | Business Area |
                   Hierarchy | Status | Rec Type | Exceptions | Start | End | Duration
  - STATUS badge: COMPLETE=green, PROCESSING=blue, PENDING=amber, FAILED=red
  - REGION badge: APAC=blue, EMEA=green, AMER=purple
  - Duration = end_time minus start_time in "Xm Ys" format
  - Exceptions > 0: show in amber. Zero: show muted.
  - Click any row → right side drawer showing all 19 fields

TAB 3 — ADMIN
  - Same filters as Operations
  - Table shows ALL columns including: service_name, rec_id,
    rec_subcategory_id, is_holiday, in_motif, last_updated_by, last_update
  - Export CSV button — exports current filtered rows
    filename: recon_{bus_date}_{timestamp}.csv
  - Exceptions > 100: highlight row with a subtle red left border
  - Show LASTUPDATEDBY and LASTUPDATE columns

DESIGN RULES (strict):
- White backgrounds. Color only in text, badges, left borders.
- Tailwind only for layout/spacing. No external UI component libraries.
- Monospace font for IDs and timestamps (font-mono class).
- Compact table rows (py-1.5 px-3).
- Loading skeleton while fetching. Error banner if API fails.
- Refresh countdown timer shown in top bar (30s → 0 → refetch).

--- STEP 4: Run and fix ---
Run:
  npm run dev

If there are TypeScript errors, missing modules, or build failures:
- Fix them automatically one by one
- Re-run until the dev server starts successfully
- Show: curl http://localhost:3000 response code

Once running, print:
  ✅ Frontend running at http://localhost:3000
  🔗 Fetching data from http://localhost:8000/api/recon
```
