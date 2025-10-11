# Unique Key Identifier - File Comparison & Analysis Tool

A web-based application for analyzing data files to identify unique key combinations, detect duplicates, and compare files side-by-side with detailed metrics.

## Features

- **Multi-format Support**: CSV, DAT, TXT files with auto-delimiter detection
- **Duplicate Detection**: Identify duplicate records and uniqueness scores
- **File Comparison**: Side-by-side comparison with match analysis
- **Data Export**: Export unique/duplicate records and comparison results
- **Enterprise Features**: Audit logging, notifications, scheduled comparisons
- **Data Quality Checks**: Pattern analysis and data validation
- **Modern UI**: Responsive design with interactive features

## Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation & Setup

**1. Clone or download the repository**
```bash
cd /path/to/uniquekeyidentifier/unique_key_identifier
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Start the application**

**Option A - Using run script (Recommended):**
```bash
# macOS/Linux
./run.sh

# Windows
run.bat
```

**Option B - Direct Python:**
   ```bash
python file_comparator.py
```

**4. Open your browser**
```
http://localhost:8000
```

The application will:
- Create SQLite database on first run
- Initialize audit logging
- Start the web server on port 8000

## Usage

### Basic File Analysis

1. Place your CSV/DAT/TXT files in the `unique_key_identifier` directory
2. Open http://localhost:8000
3. Enter file names (e.g., `trading_system_a.csv`, `trading_system_b.csv`)
4. Specify number of columns to combine (or use INCLUDE builder)
5. Click "Analyze Files"
6. Review results showing uniqueness scores and duplicate counts

### Data Quality Check

1. Navigate to http://localhost:8000/data-quality
2. Enter file name and directory
3. Run quality analysis to detect patterns, issues, and get recommendations

### File Comparison

1. After analysis, click "View" button for any column combination
2. See matched records, records only in A, records only in B
3. Export results as Excel file with detailed breakdown

### Enterprise Features

**Audit Logging:**
- All user actions and system events are logged
- View audit logs at http://localhost:8000/audit/logs

**Notifications:**
- Configure email/Slack notifications in `config.py`
- Get notified when scheduled comparisons complete

**Scheduled Comparisons:**
- View scheduler at http://localhost:8000/scheduler
- Create recurring comparison jobs with cron syntax
- Monitor job status and history

## Configuration

Edit `config.py` to customize:

```python
# Database
DATABASE_PATH = "file_comparison.db"

# Email Notifications
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = "your-app-password"
NOTIFICATION_EMAIL = "recipient@example.com"

# Slack Notifications
SLACK_WEBHOOK_URL = "your-webhook-url"
```

## Project Structure

```
unique_key_identifier/
├── file_comparator.py          # Main FastAPI application
├── analysis.py                 # Analysis logic
├── database.py                 # Database operations
├── data_quality.py             # Data quality checks
├── audit_logger.py             # Audit logging
├── notifications.py            # Email/Slack notifications
├── scheduler.py                # Job scheduling
├── config.py                   # Configuration
├── requirements.txt            # Python dependencies
├── run.sh / run.bat            # Startup scripts
├── templates/                  # HTML templates
│   ├── index_modern.html       # Main interface
│   ├── results.html            # Results page
│   ├── comparison_view.html    # Comparison viewer
│   ├── data_quality.html       # Data quality UI
│   └── workflow.html           # Workflow page
└── README.md                   # This file
```

## Dependencies

Core packages (installed via requirements.txt):
- fastapi - Web framework
- uvicorn - ASGI server
- pandas - Data processing
- sqlalchemy - Database ORM
- jinja2 - Template engine
- APScheduler - Job scheduling
- openpyxl, xlsxwriter - Excel export

## Troubleshooting

**Port 8000 already in use:**
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9
./run.sh

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
run.bat
```

**Import errors:**
```bash
pip install -r requirements.txt --upgrade
```

**Database locked:**
```bash
# Stop server (Ctrl+C) and restart
./run.sh
```

**Files not found:**
- Ensure files are in the `unique_key_identifier` directory
- Check file names (case-sensitive)
- Verify file format (CSV, DAT, or TXT)

## Performance Tips

- Use Row Limit for large files (e.g., 50000 rows)
- Use INCLUDE combinations instead of auto-discovery
- Files over 500k rows will be automatically sampled

## Data Privacy

- All processing happens locally on your machine
- No external API calls
- Data stored only in local SQLite database
- Export files stream directly to browser

## Support & Documentation

For detailed feature documentation, see inline help in the web interface.

## License

This project is provided as-is for educational and commercial use.

---

**Built with FastAPI and modern web technologies**
