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

### 3. DEMAND vs MTP TAB — Add Deliverable Allocation check (Next Steps ask from team)

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

### 7. OVERVIEW TAB — MTP comparison context note (Low Priority #1)

The Overview tab currently shows raw counts with no context about what the MTP comparison covers.

**Add a context note panel below the KPI cards:**

> “MTP extract is filtered to CIO-1 = Adam Healey + Valid Now = Yes + Optional Team Tag = Group Accounting. Resources from other CIO areas (e.g. Pavan) are excluded from the MTP side of all comparisons. To include other CIOs, re-run with an expanded CIO-1 filter.”

Style: same dismissible banner style as item 6 — background `var(--accent-dim)`, border `var(--accent)`.

-----

### 8. SUPPLY vs MTP TAB — Flag Pete W (PW) resources missing from MTP (Low Priority #4)

Resources that are in Supply under Pete W’s area are not appearing in the MTP comparison because they are filtered out by the CIO-1 filter.

**In `data_builder.py`:**

- After applying MTP filters, identify Supply rows that do NOT match any MTP row
- Of those unmatched rows, flag any where the manager/team field indicates Pete W / PW ownership (check for “Pete”, “PW”, or “Watmore” in any manager/team column available in Supply)
- Add these as a separate list `pwMissingFromMTP` in the JSON:

```json
"supplyVsMTP": {
  "attributes": [],
  "pwMissingFromMTP": [],
  "otherCIOMissingFromMTP": []
}
```

**In `index.html`:**

- Add a second sub-section toggle inside Supply vs MTP tab:
  **[Attribute Comparison] [Missing: PW Resources] [Missing: Other CIO Resources]**
- Missing: PW Resources table — Name | Grade | Type | Location | Reason: “Not in MTP extract (PW filter)”
- Missing: Other CIO Resources table — Name | Grade | Type | Location | Reason: “Not in MTP extract (CIO filter)”

-----

### 9. SUPPLY vs MTP TAB — Flag other CIO resources missing from MTP (Low Priority #5)

Same logic as item 8 above but for all other Supply rows that are unmatched in MTP and are NOT Pete W resources.

These are captured in `otherCIOMissingFromMTP` (see JSON schema in item 8 above) and rendered in the **[Missing: Other CIO Resources]** sub-section.

Add a note in that sub-section:

> “These resources appear in Supply but are absent from the MTP extract. This is expected if they report to a different CIO. Expand the MTP CIO-1 filter to include them.”

-----

### 10. SUPPLY vs MTP TAB — Grade comparison display fix (Low Priority #6)

Currently the Grade comparison between Supply and MTP shows MSP (Fixed Price / FTE) in the MTP Grade column instead of the actual grade value.

**In `data_builder.py`:**

- When comparing Grade between Supply and MTP, detect if the MTP Grade value is `"MSP (Fixed Price)"` or `"MSP (FTE)"` or similar MSP variants
- Do not treat these as a mismatch against a real grade — instead set Status to `"⚠ MSP — Grade not available in MTP"`
- Add a separate count to `overview.mtpMspGradeCount` for how many resources have this condition

**In `index.html`:**

- Render the MSP status with amber `var(--warn)` badge rather than red mismatch
- Add a note above the Supply vs MTP attribute table:

> “⚠ Resources shown as MSP (Fixed Price / FTE) in MTP do not have a grade recorded in MTP. These are shown separately and are not counted as mismatches.”

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

## FULL CHANGE SUMMARY BY PRIORITY

|#       |Priority|Tab           |Change                                                  |
|--------|--------|--------------|--------------------------------------------------------|
|7       |High    |Demand vs MTP |Remove Grade check                                      |
|8       |High    |Demand vs MTP |Remove City check                                       |
|9       |High    |Demand vs MTP |Remove Role check                                       |
|10+11   |High    |Demand vs MTP |Add Forecast FTE (Jan–Dec 26) check                     |
|Team ask|—       |Demand vs MTP |Add Deliverable Allocation check                        |
|2       |Medium  |Overview      |Count unique BRIDs for all KPI headcounts               |
|3       |Medium  |Supply vs Team|Add FTE Delta explanation banner                        |
|1       |Low     |Overview      |Add MTP filter context note                             |
|4       |Low     |Supply vs MTP |Flag missing PW resources as separate sub-section       |
|5       |Low     |Supply vs MTP |Flag missing other CIO resources as separate sub-section|
|6       |Low     |Supply vs MTP |Treat MSP grade as amber warning, not red mismatch      |
|—       |Low     |Supply vs MTP |Add row count gap explanation banner                    |

-----

## WHAT NOT TO CHANGE

- Do not modify `:root` CSS variables
- Do not rename or reorder tabs in the sidebar
- Do not change the layout of Gaps & Totals or Raw Data tabs
- Do not change chart types, colours, or the Gaps & Totals panel grid
- Do not change pagination, search, or CSV export behaviour
- Do not alter the Supply vs MTP Type and Location comparison logic

-----

## DELIVERABLES

Update and overwrite the following files only:

```
data_builder.py       ← updated Python with all new comparisons + unique BRID counts + MSP handling
index.html            ← updated template with new sub-sections, toggles, and banners
index_filled.html     ← regenerated final output (run data_builder.py after all changes)
```

After making all code changes, run `data_builder.py` automatically and confirm `index_filled.html` has been written successfully.