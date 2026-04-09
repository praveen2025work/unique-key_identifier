# ITERATION 01 — GA Reconciliation HTML

**UI LOCKED** — Do not change `:root` CSS variables, tab names, sidebar layout, or component structure.  
Apply only the data logic, calculation, and display changes listed below.  
All files are already in the project folder.

-----

## CHANGES REQUIRED

### 1. DEMAND vs MTP TAB — Remove three broken checks (High Priority)

The following attribute comparisons do not exist in the Demand file and must be removed entirely from the Demand vs MTP tab. Remove them from both the Python processing in `data_builder.py` and the rendered table in `index.html`.

**Remove these checks:**

- Grade (Demand does not have Grade — it would only be a vlookup from Supply)
- City (Demand does not have City — same reason)
- Role (MTP does not contain Role information)

After removal, the Demand vs MTP tab should only show comparisons that are genuinely present in both files.

-----

### 2. DEMAND vs MTP TAB — Add Forecast FTE check (High Priority)

Add a new comparison section to the Demand vs MTP tab called **“Forecast FTE (Jan–Dec 26)”**.

**Mapping:**

- Demand file forecast columns → MTP columns **Jan-26 FTE (W)** through **Dec-26 FTE (AH)**
- Compare each month’s FTE value per resource between Demand and MTP
- Output per row: `Person/Role | Month | Demand FTE | MTP FTE | Delta | Status`
- Status logic:
  - ✓ Match — values equal (within 0.01 tolerance)
  - ✗ Mismatch — values differ
  - — Missing — value absent in one or both sides
- Show a summary row at the bottom: total matched / total mismatched / total missing

In `data_builder.py`, add this as a new key `forecastFTE` inside the `demandVsMTP` object:

```json
"demandVsMTP": {
  "attributes": [],
  "forecastFTE": []
}
```

In `index.html`, render this as a second sub-section inside the Demand vs MTP tab with a toggle:
**[Attribute Comparison] [Forecast FTE Check]**

-----

### 3. DEMAND vs MTP TAB — Add Deliverable Allocation check (High Priority)

Add a second new comparison section to the Demand vs MTP tab called **“Deliverable Allocation”**.

**Mapping:**

- Demand Column G = Deliverable Name
- Demand Column E = Deliverable Unique ID
- Compare both against the corresponding Deliverable Name and Deliverable Unique ID columns in MTP
- Match rows on person/resource identifier first, then check deliverable fields
- Output per row: `Person | Demand Deliverable Name | MTP Deliverable Name | Demand Unique ID | MTP Unique ID | Status`

Add this as key `deliverableAllocation` inside `demandVsMTP` in the JSON schema:

```json
"demandVsMTP": {
  "attributes": [],
  "forecastFTE": [],
  "deliverableAllocation": []
}
```

Extend the tab toggle to three options:
**[Attribute Comparison] [Forecast FTE Check] [Deliverable Allocation]**

-----

### 4. OVERVIEW TAB — Count unique BRIDs only for headcount KPI cards (Medium Priority)

The current headcount KPI cards are overcounting because Demand has multiple rows per resource (one per project allocation).

**Change the headcount calculation as follows:**

- Supply count → count of unique BRIDs (or Employee ID) in Supply tab
- Team count → count of unique BRIDs in Team Members tab
- Demand count → count of unique BRIDs in Demand tab *(not total rows)*
- MTP Supply count → count of unique BRIDs in filtered MTP All Resources tab
- MTP Demand count → count of unique BRIDs in filtered MTP Demand tab

Add a small tooltip or subscript label under each KPI card value:

- For Demand: `"(unique BRIDs — N total rows)"`
- For MTP Demand: `"(unique BRIDs — N total rows)"`

This makes the counts meaningful to viewers who don’t know the file structure.

-----

### 5. SUPPLY vs TEAM TAB — Clarify FTE Deltas description (Medium Priority)

The FTE Deltas sub-section currently shows numbers without sufficient context.

**Add a description banner at the top of the FTE Deltas sub-section:**

> “FTE Delta = Supply FTE minus Team FTE per person, per month. A positive delta means Supply has more FTE allocated than Team. A negative delta means Team has more FTE than Supply records. Zero means both files agree.”

This text should render in `var(--text-muted)` above the table, no other styling changes.

-----

### 6. SUPPLY vs MTP TAB — Add data note about row count gap (Low Priority)

There is a known gap: ~402 rows in Supply vs ~304 rows in MTP after filtering. This is likely because some resources fall under other CIOs (e.g. Pavan) and are filtered out of MTP.

**Add a dismissible info banner at the top of the Supply vs MTP tab:**

> “ℹ️ Note: Supply contains more rows than the filtered MTP extract. Resources missing from MTP may belong to other CIO areas (e.g. Pavan) and have been excluded by the CIO-1 filter. These appear as ‘Missing’ in the comparison below.”

Banner style: background `var(--accent-dim)`, border `var(--accent)`, text `var(--text-primary)`. Dismissible with an ✕ button (sets `display:none` on click, no page reload).

-----

## WHAT NOT TO CHANGE

- Do not modify `:root` CSS variables
- Do not rename or reorder tabs in the sidebar
- Do not change the layout of Overview, Supply vs Team, Gaps & Totals, or Raw Data tabs
- Do not change the Supply vs MTP attribute comparison logic (Grade, Type, Location) — only Demand vs MTP checks are being modified
- Do not change chart types, colours, or the Gaps & Totals panel grid
- Do not change pagination, search, or CSV export behaviour

-----

## DELIVERABLES

Update and overwrite the following files only:

```
data_builder.py       ← updated Python with new comparisons + unique BRID counts
index.html            ← updated template with new tab sections + banners
index_filled.html     ← regenerated final output (run data_builder.py after changes)
```

After making all code changes, run `data_builder.py` automatically and confirm `index_filled.html` has been written successfully.