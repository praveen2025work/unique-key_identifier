# Setup Guide - Unique Key Identifier

Complete guide to set up and run this application on a new system.

---

## 📋 Prerequisites

Before you begin, ensure you have:
- **Python 3.7 or higher** installed
- **pip** (Python package manager) installed
- Terminal/Command Line access

---

## 🚀 Quick Start (Copy-Paste Commands)

### **Option 1: Using pip (Recommended)**

```bash
# 1. Navigate to the project directory
cd /path/to/uniquekeyidentifier/unique_key_identifier

# 2. Install dependencies
pip3 install -r requirements.txt

# 3. Run the application
python3 file_comparator.py
```

### **Option 2: Using Python virtual environment (Best Practice)**

```bash
# 1. Navigate to the project directory
cd /path/to/uniquekeyidentifier/unique_key_identifier

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the application
python3 file_comparator.py
```

### **Option 3: Using uvicorn directly**

```bash
# After installing dependencies
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8000
```

---

## 📦 Step-by-Step Installation

### **Step 1: Check Python Installation**

```bash
python3 --version
# Should show: Python 3.7.x or higher
```

If Python is not installed:
- **macOS:** `brew install python3` (requires Homebrew)
- **Ubuntu/Debian:** `sudo apt-get install python3 python3-pip`
- **Windows:** Download from https://www.python.org/downloads/

### **Step 2: Navigate to Project Directory**

```bash
cd /path/to/uniquekeyidentifier/unique_key_identifier
```

### **Step 3: Install Required Packages**

The `requirements.txt` includes:
- fastapi
- uvicorn
- pandas
- jinja2
- python-multipart
- xlsxwriter (for Excel export)

```bash
pip3 install -r requirements.txt
```

Or install individually:
```bash
pip3 install fastapi uvicorn pandas jinja2 python-multipart xlsxwriter
```

### **Step 4: Verify Installation**

```bash
pip3 list | grep -E "fastapi|uvicorn|pandas"
```

Should show installed versions.

### **Step 5: Run the Application**

```bash
python3 file_comparator.py
```

You should see:
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### **Step 6: Access the Application**

Open your browser and go to:
- **http://localhost:8000** (from same machine)
- **http://YOUR_IP:8000** (from other machines on network)

---

## 🔧 Troubleshooting

### **Problem: "Port 8000 already in use"**

**Solution 1:** Kill existing process
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Solution 2:** Use different port
```bash
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8080
# Then access at http://localhost:8080
```

### **Problem: "Module not found" errors**

```bash
# Reinstall all dependencies
pip3 install --upgrade -r requirements.txt

# Or specific package
pip3 install fastapi
```

### **Problem: Permission denied**

```bash
# macOS/Linux - use user install
pip3 install --user -r requirements.txt

# Or use sudo (not recommended)
sudo pip3 install -r requirements.txt
```

### **Problem: Python 2 vs Python 3**

If `python3` command doesn't exist:
```bash
# Try
python --version

# If it shows Python 3.x, use:
python file_comparator.py

# If it shows Python 2.x, install Python 3
```

---

## 🌐 Network Access

### **Run on localhost only (default):**
```bash
python3 -m uvicorn file_comparator:app --host 127.0.0.1 --port 8000
```

### **Allow network access:**
```bash
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8000
```

### **Run with auto-reload (development):**
```bash
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📁 File Structure Requirements

Ensure your CSV files are in the correct directory:

```
uniquekeyidentifier/
└── unique_key_identifier/
    ├── file_comparator.py          ← Main application
    ├── requirements.txt            ← Dependencies
    ├── templates/                  ← HTML templates
    │   ├── index_modern.html
    │   ├── results.html
    │   └── workflow.html
    ├── trading_system_a.csv        ← Your CSV files go here
    ├── trading_system_b.csv        ← Your CSV files go here
    └── file_comparison.db          ← Created automatically
```

**Important:** CSV files must be in the same directory as `file_comparator.py`!

---

## 🛑 Stopping the Application

### **From Terminal:**
Press `Ctrl + C` (or `Cmd + C` on macOS)

### **If running in background:**
```bash
# Find process
ps aux | grep file_comparator

# Kill by PID
kill -9 <PID>

# Or kill all
pkill -9 -f file_comparator.py
```

---

## 🐳 Docker Alternative (Optional)

If you prefer Docker:

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python3", "file_comparator.py"]
EOF

# Build image
docker build -t unique-key-identifier .

# Run container
docker run -p 8000:8000 -v $(pwd):/app unique-key-identifier
```

---

## 🔄 Updating the Application

### **Pull latest changes:**
```bash
cd /path/to/uniquekeyidentifier
git pull origin main  # If using Git

# Reinstall dependencies (in case of updates)
pip3 install --upgrade -r requirements.txt

# Restart application
python3 file_comparator.py
```

---

## 📝 One-Line Commands

### **Complete fresh install and run:**
```bash
cd /path/to/uniquekeyidentifier/unique_key_identifier && pip3 install -r requirements.txt && python3 file_comparator.py
```

### **With virtual environment:**
```bash
cd /path/to/uniquekeyidentifier/unique_key_identifier && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python3 file_comparator.py
```

### **Background mode (keep running after closing terminal):**
```bash
nohup python3 file_comparator.py > app.log 2>&1 &
```

To stop background process:
```bash
pkill -f file_comparator.py
```

---

## 🔐 Production Deployment

For production environments:

```bash
# Install gunicorn or other WSGI server
pip3 install gunicorn

# Run with gunicorn (better performance)
gunicorn file_comparator:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Or with systemd service (Linux)
# Create /etc/systemd/system/unique-key-identifier.service
```

---

## 💡 Tips

1. **First Time Setup:** Use virtual environment to avoid conflicts
2. **Development:** Use `--reload` flag for auto-restart on code changes
3. **Production:** Use gunicorn or similar for better performance
4. **Security:** Don't expose to internet without authentication
5. **Logs:** Check `app.log` for debugging issues

---

## 📞 Getting Help

If you encounter issues:

1. Check Python version: `python3 --version`
2. Check pip installation: `pip3 --version`
3. Verify all packages: `pip3 list`
4. Check port availability: `lsof -i:8000`
5. Review error logs in terminal

---

## ✅ Verification Checklist

- [ ] Python 3.7+ installed
- [ ] All dependencies installed successfully
- [ ] Can navigate to project directory
- [ ] Application starts without errors
- [ ] Can access http://localhost:8000 in browser
- [ ] CSV files are in correct directory
- [ ] Modern UI loads (Tailwind + Alpine.js)

---

**Ready to analyze your data! 🚀**

