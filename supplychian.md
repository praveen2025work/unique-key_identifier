# GA WORKFORCE RECONCILIATION DASHBOARD

**Project:** USCB & Revenue Accounting | CIO: Adam Healey  
**Output:** `index_filled.html` — single self-contained file, shareable without deployment  
**UI LOCK:** Do not redesign UI structure, CSS variables, tab names, or layout in any iteration

-----

## ROLE

You are a senior data engineer and frontend developer. Your task is to:

1. Read and process all xlsx input files using Python
1. Extract, filter, and compare the data (all logic in Python)
1. Embed the resulting dataset as a JSON constant inside a single `index.html`
1. Build the full interactive dashboard UI in that same HTML file using vanilla JS + Chart.js (CDN)

No build step. No server. The output opens directly in any browser.

-----

## INPUT FILES

All files are in the current working directory.

|File                                           |Primary Sheet |Purpose                        |
|-----------------------------------------------|--------------|-------------------------------|
|`GA Supply Master.xlsm`                        |Supply        |Headcount supply (Jan–Dec FTE) |
|`GA Team Master.xlsx`                          |Team Members  |Team roster vs Supply          |
|`GA Demand Master.xlsm`                        |Demand        |Demand/capacity plan           |
|`MTPDump7thApril.xlsx`                         |All Resources |MTP actuals — supply comparison|
|*(Large MTP download)*                         |*(main sheet)*|MTP actuals — demand comparison|
|`E Mapping Demand tab to MTP Full Extract.docx`|—             |Column mapping reference       |

-----

## STEP 1 — PYTHON: `data_builder.py`

### Libraries

```
pandas, openpyxl (no xlrd), python-docx
```

### MTP Filters

**MTP Supply (All Resources tab):**

- Column C `CIO-1` == `"Adam Healey"`
- Column AA `Valid Now` == `"Yes"`
- Column F `Optional Team Tag` == `"Group Accounting"` *(apply only if column exists)*

**MTP Demand:**

- Column W `CIO-1` == `"Adam Healey"`
- Column DH `Optional Team Tag` == `"Group Accounting"` *(apply only if column exists)*

### Normalisation Rules

- Strip whitespace + uppercase all join key columns before any merge or compare
- Blank cells → NaN, never empty string
- Join on Employee Name OR Employee ID — use whichever exists in both files

### Comparisons to Produce

**A) Supply vs Team**

- Supply orphans: rows in Supply NOT in Team
- Team orphans: rows in Team NOT in Supply
- FTE delta table: matched rows, Jan–Dec columns showing `Supply FTE − Team FTE`

**B) Supply vs MTP — Attribute Comparison**  
For each person present in both Supply and MTP (All Resources):

- Compare: Grade | Type | Location
- Output per row: `Person | Attribute | Supply Value | MTP Value | Status`

**C) Demand vs MTP — Attribute Comparison**  
Parse `E Mapping Demand tab to MTP Full Extract.docx` using python-docx to extract column mappings.

- Match demand rows to MTP demand rows on role/person identifier
- Compare all mapped columns
- Output: `Role/Person | Demand Col → MTP Col | Demand Value | MTP Value | Status`

**D) Gaps & Totals**

- Monthly FTE totals: Supply vs MTP (Jan–Dec)
- Grade distribution counts: Supply vs MTP
- Location split counts: Supply vs MTP
- Type split (Perm/Contractor): Supply vs MTP
- Demand vs Supply net gap by month (`demand FTE − supply FTE`)

**E) Raw Data Slices** *(post-filter, max 500 rows each)*  
Supply | Team | Demand | MTP Supply | MTP Demand

### JSON Output Schema

`data_builder.py` reads `index.html`, replaces `__DATA_PLACEHOLDER__` with the JSON below, and writes `index_filled.html`.

```json
{
  "meta": {
    "generated": "<ISO timestamp>",
    "version": "1.0",
    "warnings": []
  },
  "overview": {
    "supplyCount": 0,
    "teamCount": 0,
    "demandCount": 0,
    "mtpSupplyCount": 0,
    "mtpDemandCount": 0,
    "supplyTeamDiff": 0,
    "supplyMtpMismatches": 0,
    "demandMtpMismatches": 0
  },
  "supplyVsTeam": {
    "supplyOrphans": [],
    "teamOrphans": [],
    "fteDelta": []
  },
  "supplyVsMTP": [],
  "demandVsMTP": [],
  "gaps": {
    "monthlyFTE": [],
    "gradeDistribution": [],
    "locationSplit": [],
    "typeSplit": [],
    "demandSupplyGap": []
  },
  "raw": {
    "supply": [],
    "team": [],
    "demand": [],
    "mtpSupply": [],
    "mtpDemand": []
  }
}
```

**Error handling:** If any file fails to load, append a message to `meta.warnings[]` and continue. Never crash on missing files or sheets.

-----

## STEP 2 — HTML: `index.html`

A complete standalone file:

- All CSS in a `<style>` block
- All JS in a `<script>` block at bottom of `<body>`
- Chart.js from CDN: `https://cdn.jsdelivr.net/npm/chart.js@4`
- IBM Plex fonts from Google Fonts CDN
- Placeholder line exactly as: `const DASHBOARD_DATA = __DATA_PLACEHOLDER__;`

### ⚠️ UI LOCK — These values are immutable across all iterations

```css
:root {
  --bg:           #0f1117;
  --surface:      #1a1d27;
  --surface-alt:  #21253a;
  --border:       #2a2d3a;
  --accent:       #4f8ef7;
  --accent-dim:   rgba(79,142,247,0.12);
  --warn:         #f59e0b;
  --danger:       #ef4444;
  --success:      #22c55e;
  --text-primary: #f1f5f9;
  --text-muted:   #64748b;
  --font-mono:    'IBM Plex Mono', monospace;
  --font-sans:    'IBM Plex Sans', sans-serif;
  --radius:       6px;
  --transition:   0.18s ease;
}
```

**Layout:** Fixed left sidebar `240px` + scrollable main content area.  
All colour, font, and spacing values must reference CSS variables only — no hardcoded values anywhere else.

### Tab Names (exact — do not rename)

|#|Tab           |
|-|--------------|
|1|Overview      |
|2|Supply vs Team|
|3|Supply vs MTP |
|4|Demand vs MTP |
|5|Gaps & Totals |
|6|Raw Data      |

-----

## STEP 3 — TAB SPECS

### Tab 1 — Overview

- 5 KPI cards: Supply | Team | Demand | MTP Supply | MTP Demand (count + label each)
- 3 delta badges: Supply/Team Diff | Supply/MTP Mismatches | Demand/MTP Mismatches
  - Green if 0 · Amber if >0 · Red if >10
- Warning banner if `meta.warnings` has entries
- Last generated timestamp from `meta.generated`
- Setup banner if `DASHBOARD_DATA` is still the placeholder string: *“Run data_builder.py first to load your data”*

### Tab 2 — Supply vs Team

Three sub-sections toggled by buttons: **[Supply Orphans] [Team Orphans] [FTE Deltas]**

- **Supply Orphans:** Name | Grade | Type | Location
- **Team Orphans:** Name | Role | Department
- **FTE Delta:** Name | Jan–Dec columns | Total Delta
  - Cell colour: grey = 0 · amber = 0.1–0.5 · red > 0.5
- Export CSV button per sub-section (client-side Blob download)

### Tab 3 — Supply vs MTP

- Table: Person | Attribute | Supply Value | MTP Value | Status
- Status badge: ✓ Match (green) · ✗ Mismatch (red) · — Missing (amber)
- Filter bar: Attribute dropdown + Status dropdown
- Row count shown above table

### Tab 4 — Demand vs MTP

- Same layout as Tab 3
- Column header format: `"Demand Column → MTP Column"`

### Tab 5 — Gaps & Totals

2×2 panel grid:

|Panel       |Content                                                           |
|------------|------------------------------------------------------------------|
|Top-left    |Monthly FTE grouped bar chart — Supply vs MTP, Jan–Dec            |
|Top-right   |Grade distribution bar chart — Supply vs MTP side-by-side         |
|Bottom-left |Location split table + Type split (Perm/Contractor) table         |
|Bottom-right|Demand vs Supply gap line chart — Jan–Dec with zero reference line|

Chart colours: `--accent` for Supply · `--warn` for MTP · `--danger` for negative gap

### Tab 6 — Raw Data

- Tab switcher: [Supply] [Team] [Demand] [MTP Supply] [MTP Demand]
- Shows: filtered row count vs total row count
- Client-side search input (filters across all visible columns)
- Paginated table: 50 rows/page · Prev/Next controls
- Columns auto-generated from JSON keys
- “No data” empty state when 0 rows

-----

## DELIVERABLES

```
data_builder.py       ← Python processing script
index.html            ← UI template with __DATA_PLACEHOLDER__ (dev/testing)
index_filled.html     ← Final output written by data_builder.py (share this)
```

-----

## HOW TO RUN

```bash
# 1. Place all xlsx and docx files in this directory
# 2. Install dependencies
pip install pandas openpyxl python-docx

# 3. Run the builder
python data_builder.py

# 4. Open in browser — no server needed
open index_filled.html
```

-----

## CONSTRAINTS

- Zero runtime dependencies beyond CDN links (no npm, no node)
- Must work as `file://` in Chrome, Firefox, and Edge
- All CSV exports via `Blob + URL.createObjectURL` — no server calls
- FTE values formatted to 2 decimal places · counts as integers
- Tables must handle 0-row datasets with a “No data” state — never crash

-----

## ITERATION INSTRUCTIONS

When making changes in future sessions, start your prompt with:

> **“ITERATION — GA Reconciliation HTML. UI LOCKED. Do not change :root variables, tab names, or layout. Change required: [describe only the data/logic/chart change]”**

This signals Claude to modify only Python logic or chart data — never the CSS variables, sidebar, or tab structure.