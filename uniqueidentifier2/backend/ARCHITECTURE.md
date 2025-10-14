# Unique Key Identifier v2 - Backend Architecture

## 📂 Module Overview

### Core Modules

#### 1. **main.py** - FastAPI Application
- REST API endpoints for React frontend
- Background job processing
- CORS configuration
- Health checks and status monitoring

#### 2. **config.py** - Configuration Constants
- File processing limits
- Memory thresholds
- Sampling parameters
- Database paths

#### 3. **database.py** - SQLite Database Manager
- Table creation and schema
- Job status tracking
- Stage status updates
- Result persistence

#### 4. **file_processing.py** - File Operations
- CSV/TSV delimiter detection
- File size estimation
- Smart sampling for large files
- Memory-efficient reading

#### 5. **analysis.py** - Unique Key Analysis
- Smart combination discovery
- Duplicate detection
- Uniqueness scoring
- Statistical analysis

### Enterprise Features

#### 6. **data_quality.py** - Data Quality Checking
- Column pattern analysis
- Data type validation
- Missing value detection
- Schema comparison

#### 7. **result_generator.py** - Export Manager
- CSV export generation
- Excel workbook creation
- Unique/duplicate record extraction
- Comparison file generation

#### 8. **audit_logger.py** - Audit Trail
- User action logging
- Compliance tracking
- Historical record keeping

#### 9. **scheduler.py** - Job Scheduling
- Scheduled analysis runs
- Recurring job management
- Cron-like functionality

#### 10. **notifications.py** - Alert System
- Email notifications
- Slack integration
- Webhook support
- Status alerts

#### 11. **run_comparison.py** - Historical Analysis
- Run-to-run comparison
- Trend analysis
- Anomaly detection
- Performance metrics

#### 12. **parallel_processor.py** - Performance Optimization
- Multi-threaded processing
- Chunked file handling
- Memory optimization
- Large file support (>1M rows)

#### 13. **job_queue.py** - Async Job Management
- Background job queue
- Working directory management
- Job prioritization
- Status tracking

#### 14. **export_manager.py** - Advanced Exports
- Custom format exports
- Batch file generation
- Compressed archives
- Streaming large files

## 🔄 Data Flow

```
1. User uploads files via React UI
   ↓
2. FastAPI receives request (/compare endpoint)
   ↓
3. Job created in database (analysis_runs table)
   ↓
4. Background thread starts processing
   ↓
5. Stages executed:
   - Reading files (file_processing.py)
   - Data quality check (data_quality.py) [optional]
   - Validating structure
   - Analyzing File A (analysis.py)
   - Analyzing File B (analysis.py)
   - Storing results (database.py)
   - Generating exports (result_generator.py)
   ↓
6. Results available via API (/api/run/{run_id})
   ↓
7. React UI displays results
```

## 🗄️ Database Schema

### Tables:
- **analysis_runs** - Main job records
- **analysis_results_a** - File A unique key results
- **analysis_results_b** - File B unique key results
- **run_parameters** - Job configuration
- **job_stages** - Stage tracking
- **data_quality_results** - Quality check data

## 🚀 API Endpoints

### Core Endpoints:
- `GET /health` - Health check
- `POST /compare` - Start analysis
- `GET /api/status/{run_id}` - Job status
- `GET /api/run/{run_id}` - Get results
- `GET /api/runs` - List all runs
- `GET /api/preview-columns` - Preview file columns
- `GET /api/clone/{run_id}` - Clone run configuration

### Download Endpoints:
- `GET /api/download/{run_id}/csv` - CSV export
- `GET /api/download/{run_id}/excel` - Excel export
- `GET /api/download/{run_id}/unique-records` - Unique records
- `GET /api/download/{run_id}/duplicate-records` - Duplicate records

### Quality & Analytics:
- `GET /api/data-quality/{run_id}` - Quality results

## 🔧 Python Version Compatibility

**Target:** Python 3.7+
**Dependencies:**
- fastapi==0.103.2 (3.7 compatible)
- uvicorn==0.22.0
- pandas==1.3.5
- numpy==1.21.6

## 📝 Key Features

✅ **Smart Sampling** - Handles files up to 10M+ rows  
✅ **Memory Optimization** - Efficient chunked processing  
✅ **Data Quality** - Pre-analysis validation  
✅ **Export Flexibility** - CSV, Excel, filtered exports  
✅ **Historical Tracking** - Compare runs over time  
✅ **Background Processing** - Non-blocking analysis  
✅ **Real-time Status** - Progress tracking per stage  
✅ **Enterprise Ready** - Audit logging, notifications, scheduling

## 🏗️ Module Dependencies

```
main.py
├── config.py
├── database.py
│   └── config.py
├── file_processing.py
│   └── config.py
├── analysis.py
│   ├── config.py
│   └── file_processing.py
├── data_quality.py
│   └── config.py
├── result_generator.py
│   ├── config.py
│   └── database.py
├── audit_logger.py
├── scheduler.py
├── notifications.py
├── run_comparison.py
│   └── database.py
├── parallel_processor.py
│   ├── config.py
│   ├── file_processing.py
│   └── analysis.py
├── job_queue.py
│   └── database.py
└── export_manager.py
    ├── database.py
    └── result_generator.py
```

## 🧪 Testing

Run backend:
```bash
cd uniqueidentifier2/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

Test endpoints:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/runs
```

## 📊 Performance Benchmarks

| File Size | Rows | Columns | Processing Time | Memory Usage |
|-----------|------|---------|----------------|--------------|
| Small | <10K | any | <1s | <50MB |
| Medium | 10K-100K | any | 2-10s | 50-200MB |
| Large | 100K-1M | any | 10-60s | 200-500MB |
| X-Large | 1M-10M+ | any | 1-5min | 500MB-2GB |

*With intelligent sampling and parallel processing*
