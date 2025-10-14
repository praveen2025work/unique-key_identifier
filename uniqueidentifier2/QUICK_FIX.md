# 🚀 QUICK FIX - Start Here!

## 🎯 Two Issues, Two Fixes

### Issue 1: Pip Install Error ❌
```
ERROR: Could not find a version that satisfies the requirement numpy==1.21.6
```

### Issue 2: UI Stuck ❌
```
UI shows "loading run #1" and gets stuck forever
```

---

## ⚡ Quick Fix Steps

### 1️⃣ Stop Everything
```bash
# Press Ctrl+C in both backend and frontend terminals
```

### 2️⃣ Fix Backend Dependencies (Mac)
```bash
cd ~/uniquekeyidentifier/uniqueidentifier2/backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3️⃣ Restart Services
```bash
cd ~/uniquekeyidentifier/uniqueidentifier2
./RESTART_SERVICES.sh
```

### 4️⃣ Test
Open: http://localhost:5173

---

## 🪟 Windows Users

### 2️⃣ Fix Backend Dependencies (Windows)
```cmd
cd C:\devhome\projects\python\uniqueidentifier2\backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3️⃣ Restart Services (Windows)
```cmd
cd C:\devhome\projects\python\uniqueidentifier2
RESTART_SERVICES.bat
```

---

## ✅ Success Indicators

You'll know it worked when you see:

**Backend Terminal:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Frontend Terminal:**
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

**Browser:**
- http://localhost:8000/health → `{"status":"healthy"}`
- http://localhost:5173 → UI loads
- Analysis works without getting stuck

---

## 🆘 Still Having Issues?

### Check Database
```bash
cd backend
python repair_database.py check
python repair_database.py repair  # if needed
```

### Check Ports
```bash
# Backend should be on port 8000
curl http://localhost:8000/health

# Frontend should be on port 5173
# Open in browser
```

### Kill Stuck Processes

**Mac/Linux:**
```bash
pkill -f python
pkill -f node
```

**Windows:**
```cmd
taskkill /F /IM python.exe
taskkill /F /IM node.exe
```

---

## 📚 More Help

- **Detailed Guide:** `FIXES_APPLIED.md`
- **Troubleshooting:** `FIX_GUIDE.md`
- **Database Issues:** `backend/repair_database.py`

---

## 🎉 What Was Fixed

1. ✅ Updated numpy 1.21.6 → 1.24.3 (Python 3.12 compatible)
2. ✅ Updated pandas 1.3.5 → 2.0.3 (Python 3.12 compatible)
3. ✅ Added 30-second timeout to all API calls
4. ✅ Added database lock prevention
5. ✅ Added clear error messages
6. ✅ Added "Go Back" buttons on stuck screens

---

## ⏱️ Expected Time

- Stop services: 5 seconds
- Reinstall dependencies: 2-3 minutes
- Restart services: 10 seconds
- **Total: ~3 minutes** ⚡

---

## 🔥 TL;DR

```bash
# Mac - Copy and paste this entire block
cd ~/uniquekeyidentifier/uniqueidentifier2/backend && \
rm -rf venv && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install -q --upgrade pip && \
pip install -q -r requirements.txt && \
cd .. && \
./RESTART_SERVICES.sh
```

```cmd
REM Windows - Run these one by one
cd C:\devhome\projects\python\uniqueidentifier2\backend
rmdir /s /q venv
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
RESTART_SERVICES.bat
```

Done! 🎉

