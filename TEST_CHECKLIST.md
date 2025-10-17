# ✅ Test Checklist: Verify the Fix Works

## Quick Verification (5 minutes)

### Step 1: Confirm Backend is Running ✅
```bash
cd uniqueidentifier2/backend
curl http://localhost:8000/health
```
**Expected**: `{"status":"healthy",...}`

### Step 2: Run Automated Tests ✅
```bash
python3 test_intelligent_discovery_fix.py
```
**Expected**: `✅ ALL TESTS PASSED!`

### Step 3: Check Backend Logs ✅
```bash
tail -n 50 backend.log
```
**Expected**: No errors, should see startup messages

---

## Full Test With Your Data (10 minutes)

### Step 4: Re-run Your Failed Comparison

1. **Open the UI**: http://localhost:3000 (or your frontend URL)

2. **Start a new comparison**:
   - File A: Your first file
   - File B: Your second file
   - Number of columns: 2 (or whatever you used before)
   - ✅ **Enable**: "Use Intelligent Key Discovery"
   
3. **Submit** and watch the progress

### Step 5: Monitor Progress

In terminal:
```bash
tail -f backend.log
```

**What to look for**:
```
✅ Good Signs:
   🚀 Using Intelligent Key Discovery
   ✅ Found 50 promising 2-column combinations
   Generating full comparison for: GBP currency amount, sap cost centre
   ✅ Exported X matched, Y only_a, Z only_b

❌ Bad Signs (shouldn't happen):
   ❌ Job failed
   ❌ Error: ('GBP currency amount','sap cost centre')
   ❌ Traceback
```

### Step 6: Check Results

Once the job completes:

1. **In the UI**: Navigate to Results → Exports
2. **Or check files**:
   ```bash
   ls -lh comparison_exports/run_*/
   ```

**Expected**: CSV files with matched, only_a, only_b data

---

## Verification Checklist

- [ ] Backend health check passes
- [ ] Automated tests pass (test_intelligent_discovery_fix.py)
- [ ] Backend log shows no errors
- [ ] New comparison job starts successfully
- [ ] Intelligent discovery runs without errors
- [ ] Job completes successfully (status = completed)
- [ ] Export files are generated
- [ ] Can download and view export files in UI

---

## If Something Still Fails

### 1. Check the Exact Error
```bash
cd uniqueidentifier2/backend
sqlite3 file_comparison.db "SELECT run_id, error_message, current_stage FROM runs WHERE status = 'error' ORDER BY run_id DESC LIMIT 1;"
```

### 2. Check Job Stages
```bash
sqlite3 file_comparison.db "SELECT stage_name, status, details FROM job_stages WHERE run_id = YOUR_RUN_ID ORDER BY stage_order;"
```
(Replace YOUR_RUN_ID with the actual run ID)

### 3. Check Backend Log for Traceback
```bash
tail -n 200 backend.log | grep -B 10 -A 20 "Traceback"
```

### 4. Check if it's the Same Error
Look for the tuple string like `('GBP currency amount','sap cost centre')` in the error message.

**If it's the SAME error**: The backend might not have restarted properly
```bash
# Check backend PID
cat backend.pid
ps aux | grep $(cat backend.pid)

# If not running, restart:
python3 main.py > backend.log 2>&1 &
echo $! > backend.pid
```

**If it's a DIFFERENT error**: It's a new issue - share the error message

---

## Success Criteria

✅ **Test is SUCCESSFUL if**:
1. All automated tests pass
2. Your comparison completes without errors
3. Export files are generated
4. You can view the results in the UI

❌ **Test FAILED if**:
1. Same tuple error appears: `('column1','column2')`
2. Job status shows "error"
3. No export files generated

---

## Quick Status Check Command

Run this all-in-one check:
```bash
cd uniqueidentifier2/backend && \
echo "=== Backend Status ===" && \
curl -s http://localhost:8000/health && echo "" && \
echo "" && \
echo "=== Latest Run ===" && \
sqlite3 file_comparison.db "SELECT run_id, status, current_stage FROM runs ORDER BY run_id DESC LIMIT 1;" && \
echo "" && \
echo "=== Recent Errors ===" && \
tail -n 100 backend.log | grep -i "error\|failed" | tail -n 5
```

---

## Expected Timeline

- ⏱️ **Small files** (< 100k rows): 1-2 minutes
- ⏱️ **Medium files** (100k-1M rows): 2-5 minutes  
- ⏱️ **Large files** (1M-10M rows): 5-30 minutes

Watch the progress bar in the UI or monitor `backend.log`!

---

## Get Help

If tests fail, provide:
1. Output of automated test: `test_intelligent_discovery_fix.py`
2. Error message from database: `SELECT error_message FROM runs WHERE ...`
3. Last 50 lines of backend.log
4. Number of columns in your files
5. Whether intelligent discovery was enabled

---

**Ready?** Start with Step 1! 🚀

