# Backend - Unique Key Identifier API

FastAPI-based REST API for file comparison and unique key identification.

## Setup

### 1. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 2. Install Dependencies (if needed)
```bash
pip install -r requirements.txt
```

### 3. Start Server
```bash
python3 main.py
```

Or use the startup script:
```bash
./start_backend.sh
```

Server will run on: **http://0.0.0.0:8000**

## API Endpoints

### Core Endpoints
- `GET /health` - Health check
- `POST /compare` - Start file analysis
- `GET /api/status/{run_id}` - Get job status
- `GET /api/run/{run_id}` - Get analysis results
- `GET /api/runs` - List all runs

### File Comparison
- `GET /api/comparison/{run_id}/summary` - Get comparison summary
- `GET /api/comparison/{run_id}/data` - Get comparison data (matched, only_a, only_b)
- `GET /api/download/{run_id}/comparison` - Download comparison as Excel

### Data Quality
- `GET /api/data-quality/{run_id}` - Get quality check results

### Downloads
- `GET /api/download/{run_id}/csv` - Download results as CSV
- `GET /api/download/{run_id}/excel` - Download results as Excel

## Key Modules

- `main.py` - FastAPI application and endpoints
- `database.py` - SQLite database operations
- `analysis.py` - Unique key analysis logic
- `data_quality.py` - Data quality checks and pattern detection
- `file_comparison.py` - File comparison logic (matched/A-only/B-only)
- `file_processing.py` - CSV/Excel file reading
- `job_queue.py` - Background job processing
- `export_manager.py` - Result file generation

## Configuration

Edit `config.py` for:
- Max rows limits
- Max combinations
- Performance thresholds
- File size limits

## Database

SQLite database: `file_comparison.db`

Tables:
- `runs` - Analysis run metadata
- `analysis_results` - Uniqueness analysis results
- `job_stages` - Workflow stage tracking
- `data_quality_results` - Quality check results
- `run_parameters` - Run configuration

## Features

- ✅ Async job processing with threading
- ✅ Real-time progress tracking
- ✅ Data quality checks with pattern detection
- ✅ File comparison (matched, A-only, B-only)
- ✅ Excel/CSV exports
- ✅ Audit logging
- ✅ CORS enabled for React frontend

## API Documentation

When server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:8000 | xargs kill -9
```

### Clear Cache
```bash
find . -type d -name __pycache__ -exec rm -rf {} +
find . -name "*.pyc" -delete
```

### Reset Database
```bash
rm -f file_comparison.db
# Database will be recreated on next startup
```

## Version

2.0.0 - Enterprise Edition with File Comparison & Data Quality

