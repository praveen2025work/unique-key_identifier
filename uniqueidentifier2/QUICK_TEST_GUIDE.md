# Quick Test Guide - Enhanced Comparison Features

## 🚀 How to Test the New Features

### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- At least one completed analysis run with data

---

## Test Scenario 1: Full Pagination for Column Combinations

### Steps:
1. Open browser to `http://localhost:5173`
2. Navigate to an existing run or create a new analysis
3. Once analysis completes, go to **Analysis Results** tab

### What to Verify:
✅ **All results loaded**: Should see message like "Loaded 500 column combinations" (not limited to 100)
✅ **Pagination controls**: Should see page size dropdown and navigation buttons at bottom
✅ **Page size options**: Try changing between 25, 50, 100, 250, 500 rows per page
✅ **Navigation**: Test First, Previous, Next, Last buttons
✅ **Page numbers**: Click specific page numbers
✅ **Status indicator**: Shows "Showing X to Y of Z results"

### Test Filters:
- Type in "Filter columns..." search box
- Check "Show Unique Keys Only" checkbox
- Verify pagination resets to page 1 when filters change

**Expected Behavior:**
- Can view ALL column combinations (no artificial limits)
- Pagination is smooth and fast
- Filters work correctly with pagination

---

## Test Scenario 2: Unified Comparison View

### Steps:
1. From Analysis Results, click **File Comparison** tab
2. Select a column combination from the dropdown
3. Wait for data to load

### What to Verify:

#### Section 1: Column Combination Analysis
✅ **File A Analysis** (blue card on left):
- Total rows
- Unique rows (green)
- Duplicate rows (red)
- Duplicate count (orange)
- Uniqueness score with progress bar
- "Unique Key" or "Has Duplicates" badge

✅ **File B Analysis** (purple card on right):
- Same metrics as File A
- Side-by-side comparison is easy to read

#### Section 2: File-to-File Row Comparison
✅ **Summary cards** show:
- Match Rate %
- Matched Records count
- Only in A count
- Only in B count

✅ **Tabs work**:
- Click "✅ Matched" tab
- Click "📘 Only in A" tab
- Click "📙 Only in B" tab
- Verify data loads for each tab

✅ **Data table**:
- Shows actual row data
- Can scroll to load more
- "Load More" button appears
- Shows "Showing X of Y records"

#### Section 3: Enterprise Row-by-Row Exports
✅ **Generate exports**:
- Click "Generate Comparison" button if needed
- See matched, only_a, only_b file stats
- Can download each CSV file
- Shows file sizes and row counts

**Expected Behavior:**
- One screen shows EVERYTHING about that column combination
- No need to switch between multiple screens
- Analysis stats + actual data + export options all together

---

## Test Scenario 3: Workflow Timing Information

### Steps:
1. From any run, click **Workflow Stages** tab
2. View the timing information

### What to Verify:

#### Overall Progress Section
✅ **Top timing bar** shows:
- Started time (HH:MM:SS format)
- Completed/Running time
- Total Duration (Xh Ym Zs or Ym Zs or Zs)

✅ **Visual indicators**:
- Progress bar fills correctly
- Status badge (COMPLETED, RUNNING, ERROR)

#### Processing Stages Section
✅ **Each stage** shows:
- Stage name with icon
- Status badge (Running, Done, Failed, Pending)
- Start time icon with timestamp
- Completion time icon with timestamp  
- Duration in bold (blue for running, green for completed)

**Expected Behavior:**
- Can see exactly when job started and ended
- Can see total duration at a glance
- Each stage has its own timing breakdown
- Easy to identify bottlenecks or slow stages

---

## Test Scenario 4: Compare Button from Analysis

### Steps:
1. Go to **Analysis Results** tab
2. Find any column combination row
3. Click the **Compare** button in the Actions column

### What to Verify:
✅ Automatically switches to File Comparison tab
✅ Selected column combination is pre-selected in dropdown
✅ Unified comparison view loads immediately
✅ Shows analysis + comparison + exports for that combination

**Expected Behavior:**
- One-click navigation from analysis to detailed comparison
- Context is preserved (knows which combination to show)

---

## Common Issues & Solutions

### Issue: "No comparison exports found"
**Solution:** Click "Generate Comparison" button to create the exports

### Issue: Pagination not showing
**Solution:** Make sure you have more results than the page size (e.g., > 100 results with page size 100)

### Issue: Workflow timing shows "N/A"
**Solution:** 
1. Backend needs to be updated (check `main.py` line 521-566)
2. Run a NEW analysis (old runs may not have timing data)
3. Restart backend if recently updated

### Issue: UnifiedComparisonViewer not found
**Solution:** Clear browser cache or hard refresh (Ctrl+F5 / Cmd+Shift+R)

---

## Performance Testing

### Large Dataset Test:
1. Run analysis with 1000+ column combinations
2. Verify pagination handles it smoothly
3. Test page size changes (25 vs 500)
4. Verify no lag or freezing

### Large File Test:
1. Use files with 100K+ rows
2. Generate comparison export
3. Verify chunked processing works
4. Test pagination in export data viewer

---

## Quick Verification Checklist

Use this checklist for quick smoke testing:

**Analysis Results:**
- [ ] All results load (not limited to 100)
- [ ] Pagination controls present
- [ ] Can change page size
- [ ] Can navigate pages
- [ ] Filters work

**File Comparison:**
- [ ] Shows column analysis (both files)
- [ ] Shows match rate and counts
- [ ] Can switch between matched/only_a/only_b
- [ ] Can load more rows
- [ ] Can generate exports
- [ ] Can download CSVs

**Workflow:**
- [ ] Shows start time
- [ ] Shows end/current time
- [ ] Shows total duration
- [ ] Each stage shows timing
- [ ] Stage durations calculated

**Navigation:**
- [ ] Compare button works
- [ ] Tab switching works
- [ ] Back buttons work
- [ ] Context preserved

---

## Success Criteria

✅ **All tests pass** = Ready for production
⚠️ **Some tests fail** = Review ENHANCED_COMPARISON_FEATURES.md for troubleshooting
❌ **Many tests fail** = Backend may not be updated, restart services

---

## Screenshots to Capture

For documentation/validation:
1. Analysis Results with pagination (showing 200+ results)
2. Unified Comparison View (full screen showing all 3 sections)
3. Workflow timing (showing started, completed, duration)
4. Page navigation (showing page buttons and counts)
5. Export generation (showing matched/only_a/only_b files)

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark features as validated
2. 📝 Update release notes
3. 👥 Demo to stakeholders
4. 🚀 Deploy to production

If issues found:
1. 📋 Document specific errors
2. 🔍 Check browser console for errors
3. 🛠️ Review backend logs
4. 💬 Report findings

---

**Testing completed by:** _____________
**Date:** _____________
**Status:** ⬜ Pass  ⬜ Pass with issues  ⬜ Fail
**Notes:** _____________________________________________

---

Happy Testing! 🎉

