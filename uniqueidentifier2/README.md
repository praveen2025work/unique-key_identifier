# Unique Key Identifier v2.0

Enterprise-grade file comparison and unique key identification tool with React frontend and FastAPI backend.

## Features

- **Dashboard**: File configuration, column loading, analysis setup
- **Workflow Tracking**: Real-time progress monitoring with stage-by-stage updates
- **Analysis Results**: 4 comprehensive tabs
  - 📊 Analysis: Side-by-side comparison of unique key combinations
  - ⚙️ Workflow: Processing stages review
  - 🔄 File Comparison: Actual data records (Matched, Only in A, Only in B) with Excel export
  - ✅ Data Quality: Complete column pattern analysis and risk details
- **Data Quality Checks**: Pattern detection, null analysis, cross-file validation
- **Downloads**: CSV and Excel exports for all results and comparisons

## Quick Start

### Backend

```bash
cd backend
./venv/bin/python3 main.py
```

Backend runs on: http://localhost:8000

### Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:5173

## Usage

1. Open http://localhost:5173
2. Enter File A and File B paths
3. Click "Load Columns"
4. Enable "Data Quality Check" (optional but recommended)
5. Click "Run Analysis"
6. View results in 4 tabs with complete data

## Tech Stack

- **Backend**: FastAPI, Python 3.7+, SQLite, Pandas
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Features**: Real-time updates, async processing, data quality checks, file comparison

## Documentation

- Backend: See `backend/README.md`
- Frontend: See `frontend/README.md`
- Architecture: See `backend/ARCHITECTURE.md`

## Version

2.0.0 - Enterprise Edition
