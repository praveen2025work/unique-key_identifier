# Fix Guide for Two Major Issues

## Issue 1: Python/NumPy Compatibility Error

### Problem
Your Python version (3.12.7) is incompatible with the old numpy (1.21.6) and pandas (1.3.5) versions in requirements.txt.

### Solution
I've updated `requirements.txt` with compatible versions:
- **numpy**: 1.21.6 → 1.24.3
- **pandas**: 1.3.5 → 2.0.3

### Steps to Fix:

#### On Windows:
```cmd
cd C:\devhome\projects\python\uniqueidentifier2\backend
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### On Mac/Linux:
```bash
cd uniqueidentifier2/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Issue 2: UI Stuck on "Loading Run #1"

### Root Causes
1. **Backend API timeout** - API calls hanging or taking too long
2. **Database locks** - SQLite database locked during concurrent access
3. **No error handling** - Silent failures without user feedback

### Solutions Applied

#### 1. Added Request Timeouts (Frontend)
- All API calls now have 15-30 second timeouts
- Shows clear error message: "Request timed out. The backend may be processing a large dataset or is not responding."

#### 2. Database Lock Prevention (Backend)
- Added `PRAGMA busy_timeout = 10000` to prevent database locks
- Backend will now wait up to 10 seconds instead of immediately failing

#### 3. Better Error Messages
- Timeout errors are now caught and displayed clearly
- Console logging added for debugging

---

## Troubleshooting Steps

### If UI Still Gets Stuck:

#### Step 1: Check Backend Status
Open a new terminal and run:
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check specific run status
curl http://localhost:8000/api/status/1
```

#### Step 2: Check Database Health
```bash
cd uniqueidentifier2/backend
python repair_database.py check
```

If corrupted data is found, repair it:
```bash
python repair_database.py repair
```

#### Step 3: Check Backend Logs
Look at the terminal where backend is running. Look for:
- ❌ Error messages
- ⏳ Hanging operations
- 🔒 Database locked messages

#### Step 4: Restart Services Cleanly

**On Windows:**
```cmd
# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)

# Restart backend
cd C:\devhome\projects\python\uniqueidentifier2\backend
venv\Scripts\activate
python main.py

# Restart frontend (new terminal)
cd C:\devhome\projects\python\uniqueidentifier2\frontend
npm run dev
```

**On Mac/Linux:**
```bash
# Stop both services
./STOP_SERVERS.sh

# Start both services
./START_SERVERS.sh
```

#### Step 5: Check for Stuck Processes

**On Windows:**
```cmd
# Check for stuck Python processes
tasklist | findstr python

# Kill stuck processes (if needed)
taskkill /F /IM python.exe
```

**On Mac/Linux:**
```bash
# Check for stuck processes
ps aux | grep python
ps aux | grep node

# Kill stuck processes (if needed)
kill -9 <process_id>
```

---

## Database Issues

### If Database is Corrupted:

#### Option 1: Repair Specific Run
```bash
cd uniqueidentifier2/backend
python repair_database.py repair 1  # Replace 1 with your run_id
```

#### Option 2: Vacuum/Optimize Database
```bash
python repair_database.py vacuum
```

#### Option 3: Last Resort - Recreate Database (⚠️ DELETES ALL DATA)
```bash
python repair_database.py recreate
```

---

## Prevention Tips

### 1. For Large Files
- Use the "Max Rows" limit to process smaller chunks
- Start with 100,000 rows, then increase gradually

### 2. Monitor Backend
- Keep the backend terminal visible to see progress
- Watch for error messages

### 3. Regular Maintenance
```bash
# Run weekly
cd uniqueidentifier2/backend
python repair_database.py check
python repair_database.py vacuum
```

### 4. Check Logs
```bash
# Backend logs
cd uniqueidentifier2/backend
ls -lh *.log

# Check recent errors
tail -n 50 backend.log
```

---

## Quick Reference Commands

### Install Dependencies
```bash
# Backend
cd uniqueidentifier2/backend
pip install -r requirements.txt

# Frontend
cd uniqueidentifier2/frontend
npm install
```

### Start Services
```bash
# Backend
cd uniqueidentifier2/backend
python main.py

# Frontend  
cd uniqueidentifier2/frontend
npm run dev
```

### Check Health
```bash
# Backend health
curl http://localhost:8000/health

# Frontend (open in browser)
http://localhost:5173
```

### Database Maintenance
```bash
cd uniqueidentifier2/backend
python repair_database.py check      # Check integrity
python repair_database.py repair     # Fix corrupted runs
python repair_database.py vacuum     # Optimize
```

---

## Still Having Issues?

### Check These:

1. **Port Conflicts**
   - Backend: Port 8000 must be free
   - Frontend: Port 5173 must be free

2. **Firewall/Antivirus**
   - May block local server connections
   - Add exceptions for Python and Node

3. **File Permissions**
   - Ensure write access to `backend/data/` directory
   - Check database file permissions

4. **System Resources**
   - Large files need 8GB+ RAM
   - Check disk space for results

5. **Python/Node Versions**
   - Python: 3.12.7 (confirmed working)
   - Node: 18+ recommended

---

## Success Indicators

You'll know it's working when:
- ✅ Backend shows: `INFO:     Uvicorn running on http://0.0.0.0:8000`
- ✅ Frontend shows: `Local: http://localhost:5173/`
- ✅ Health check returns: `{"status":"healthy"}`
- ✅ UI loads without "Loading Run #1" stuck message
- ✅ No timeout errors in console

---

## Contact / Support

If you've tried all the above and still have issues, check:
1. Browser console (F12) for JavaScript errors
2. Backend terminal for Python errors
3. Network tab (F12) for failed API calls

