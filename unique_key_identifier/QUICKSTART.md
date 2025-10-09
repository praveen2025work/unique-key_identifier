# 🚀 Quick Start - Unique Key Identifier

## Instant Setup (New System)

```bash
# 1. Go to project directory
cd /path/to/uniquekeyidentifier/unique_key_identifier

# 2. Install dependencies
pip3 install -r requirements.txt

# 3. Run application
python3 file_comparator.py
```

**Then open:** http://localhost:8000

---

## Essential Commands

### **Start Application**
```bash
python3 file_comparator.py
```

### **Stop Application**
Press `Ctrl + C` in terminal

### **Check if Running**
```bash
lsof -i:8000
# or
curl http://localhost:8000
```

### **Force Stop**
```bash
pkill -9 -f file_comparator.py
```

### **Run on Different Port**
```bash
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8080
```

### **Run in Background**
```bash
nohup python3 file_comparator.py > app.log 2>&1 &
```

---

## Requirements

**Install Python packages:**
```bash
pip3 install fastapi uvicorn pandas jinja2 python-multipart xlsxwriter
```

**Or from file:**
```bash
pip3 install -r requirements.txt
```

---

## File Locations

✅ **Data files must be in:** `unique_key_identifier/` folder  
✅ **Supported formats:** .csv, .dat, .txt (auto-detects delimiter)  
✅ **Run command from:** `unique_key_identifier/` folder  
✅ **Access UI at:** http://localhost:8000  

---

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Module not found:**
```bash
pip3 install --upgrade -r requirements.txt
```

**Check Python version:**
```bash
python3 --version  # Should be 3.7+
```

---

## Access URLs

- **Main UI:** http://localhost:8000
- **Results:** http://localhost:8000/run/{run_id}
- **Workflow:** http://localhost:8000/workflow/{run_id}
- **API Docs:** http://localhost:8000/docs

---

That's it! 🎉

