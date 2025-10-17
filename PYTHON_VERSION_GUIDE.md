# Python Version Compatibility Guide

## Overview
This project supports both **Python 3.7** and **Python 3.12+**. Different requirements files are provided for each version.

---

## 🔍 Check Your Python Version

```bash
python --version
# or
python3 --version
```

---

## 📦 Installation Instructions

### For Python 3.12+ (Office Laptop)

```bash
# Navigate to the backend directory
cd uniqueidentifier2/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install Python 3.12 compatible packages
pip install -r requirements-py312.txt
```

### For Python 3.7 (Current Mac)

```bash
# Navigate to the backend directory
cd uniqueidentifier2/backend

# Activate virtual environment
source venv/bin/activate

# Install Python 3.7 compatible packages
pip install -r requirements.txt
```

---

## ⚠️ Known Issues

### Issue: "No matching distribution found for numpy==1.21.6"

**Cause:** You're using Python 3.12 with requirements.txt (designed for Python 3.7)

**Solution:** Use `requirements-py312.txt` instead:
```bash
pip install -r requirements-py312.txt
```

---

## 📊 Package Version Differences

| Package | Python 3.7 | Python 3.12+ |
|---------|-----------|--------------|
| numpy | 1.21.6 | 1.26.0+ |
| pandas | 1.3.5 | 2.1.0+ |
| fastapi | 0.103.2 | 0.104.0+ |
| uvicorn | 0.22.0 | 0.24.0+ |
| psutil | 5.8.0+ | 5.9.0+ |

---

## 🚀 Quick Start Commands

### Check if packages are installed:
```bash
pip list | grep -E "(numpy|pandas|psutil|fastapi)"
```

### Upgrade pip (recommended):
```bash
pip install --upgrade pip
```

### Start backend (after installation):
```bash
cd uniqueidentifier2/backend
source venv/bin/activate  # macOS/Linux
python start_backend.py
```

---

## 💡 Tips

1. **Always activate the virtual environment** before installing packages
2. **Use the correct requirements file** for your Python version
3. **Restart the backend** after installing new packages
4. If you switch Python versions, **recreate the virtual environment**

---

## 🔄 Switching Python Versions

If you need to switch from Python 3.7 to 3.12 (or vice versa):

```bash
# Remove old virtual environment
rm -rf venv

# Create new virtual environment with desired Python version
python3.12 -m venv venv  # For Python 3.12
# or
python3.7 -m venv venv   # For Python 3.7

# Activate and install appropriate requirements
source venv/bin/activate
pip install -r requirements-py312.txt  # or requirements.txt
```

---

## 📞 Need Help?

If you encounter any installation issues:
1. Check your Python version: `python --version`
2. Ensure virtual environment is activated (you should see `(venv)` in your prompt)
3. Make sure you're using the correct requirements file for your Python version
4. Try upgrading pip: `pip install --upgrade pip`

