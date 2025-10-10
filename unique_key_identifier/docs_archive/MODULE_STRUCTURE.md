# File Comparator - Modular Project Structure

## Overview
The File Comparator application has been refactored into a modular design for better maintainability, scalability, and code organization.

## Module Structure

### 1. `config.py`
**Purpose**: Central configuration and constants

**Contains**:
- `SCRIPT_DIR`: Application directory path
- `DB_PATH`: Database file location
- `SUPPORTED_EXTENSIONS`: List of supported file formats (.csv, .dat, .txt)
- Performance limits:
  - `MAX_ROWS_WARNING`: Warning threshold (100,000 rows)
  - `MAX_ROWS_HARD_LIMIT`: Maximum allowed rows (500,000)
  - `MAX_COMBINATIONS`: Maximum column combinations to analyze (50)
  - `MEMORY_EFFICIENT_THRESHOLD`: Threshold for sampling (50,000 rows)

**Benefits**: Centralized configuration makes it easy to adjust settings without searching through code.

---

### 2. `database.py`
**Purpose**: Database operations and persistence

**Contains**:
- `conn`: SQLite database connection
- `create_tables()`: Initialize database schema
- `update_job_status()`: Update analysis job status
- `update_stage_status()`: Update individual processing stage status

**Database Tables**:
- `runs`: Analysis run metadata
- `job_stages`: Processing stage tracking
- `analysis_results`: Column combination analysis results
- `duplicate_samples`: Sample duplicate records
- `run_parameters`: Parameters for run cloning

**Benefits**: Isolated database logic, easier to test and maintain.

---

### 3. `file_processing.py`
**Purpose**: File reading and data parsing operations

**Contains**:
- `detect_delimiter()`: Auto-detect file delimiter (comma, tab, pipe, etc.)
- `get_file_stats()`: Get file statistics (rows, size) without loading entire file
- `estimate_processing_time()`: Estimate analysis duration based on data size
- `read_data_file()`: Read CSV/DAT/TXT files with intelligent sampling for large files

**Key Features**:
- Automatic delimiter detection
- Stratified sampling for large files (>50k rows)
- Multiple encoding support (UTF-8, Latin-1)
- Memory-efficient file reading

**Benefits**: Reusable file processing logic, easier to add new file formats.

---

### 4. `analysis.py`
**Purpose**: Data analysis and uniqueness detection

**Contains**:
- `smart_discover_combinations()`: Intelligently discover best column combinations
  - Prioritizes ID-like columns (id, code, key, number)
  - Uses high-cardinality analysis
  - Respects exclusions
  
- `analyze_file_combinations()`: Analyze column combinations for uniqueness
  - Memory-optimized with categorical type conversion
  - Fast value_counts for single columns
  - Efficient groupby for multi-column combinations
  - Identifies unique keys and duplicates

**Analysis Strategies**:
1. High cardinality columns (≥80% unique values)
2. ID-like column names
3. Strategic column combinations
4. User-specified combinations

**Benefits**: Separated analysis logic, easier to enhance algorithms.

---

### 5. `file_comparator.py`
**Purpose**: Main application and API routes

**Contains**:
- FastAPI application setup
- Web UI routes (/, /workflow, /run)
- API endpoints (/api/preview-columns, /compare, /api/status)
- Download routes (/download/csv, /download/excel)
- Comparison routes (/comparison/view)
- Background job processing

**Route Categories**:
- **Home & Navigation**: Main page, workflow status
- **File Analysis**: Start comparison, preview columns
- **Results Display**: View analysis results, grouped by combination size
- **Downloads**: CSV, Excel, unique/duplicate records exports
- **Comparison**: Side-by-side file comparison views

**Benefits**: Clear separation of concerns, routes remain organized while using modular utilities.

---

## Migration from Monolithic Design

### Before (Old Structure)
```
file_comparator.py (1,529 lines)
├── All configuration constants
├── Database operations
├── File processing functions
├── Analysis algorithms
└── API routes
```

### After (New Modular Structure)
```
config.py (20 lines) - Configuration
database.py (134 lines) - Database operations
file_processing.py (120 lines) - File I/O
analysis.py (209 lines) - Analysis algorithms
file_comparator.py (~1,050 lines) - API routes only
```

**Total Reduction**: ~1,529 lines → ~1,050 lines in main file
**Code Organization**: 5 focused modules instead of 1 monolithic file

---

## Benefits of Modular Design

### 1. **Maintainability**
- Each module has a single responsibility
- Easier to locate and fix bugs
- Changes in one module don't affect others

### 2. **Testability**
- Modules can be tested independently
- Mock dependencies easily
- Unit tests are simpler to write

### 3. **Scalability**
- Easy to add new features to specific modules
- New file formats can be added to file_processing.py
- New analysis strategies can be added to analysis.py

### 4. **Collaboration**
- Multiple developers can work on different modules
- Reduced merge conflicts
- Clear ownership of components

### 5. **Reusability**
- Modules can be imported by other tools
- Functions can be used in scripts or notebooks
- Analysis logic can be used in batch processing

---

## Usage Examples

### Import Configuration
```python
from config import SCRIPT_DIR, MAX_ROWS_WARNING
```

### Use Database Functions
```python
from database import update_job_status, conn
update_job_status(run_id, status='completed', progress=100)
```

### Process Files
```python
from file_processing import read_data_file, get_file_stats
df, delimiter = read_data_file('data.csv')
row_count, size_mb = get_file_stats('data.csv')
```

### Run Analysis
```python
from analysis import analyze_file_combinations
results = analyze_file_combinations(df, num_columns=2)
```

---

## Future Enhancements

### Potential New Modules
- `export.py`: Dedicated export/download logic
- `comparison.py`: File comparison operations
- `validation.py`: Data validation rules
- `cache.py`: Caching layer for repeated analyses
- `api_routes.py`: Separate routes from main app file

### Recommended Next Steps
1. Extract download routes into `export.py`
2. Move comparison logic into `comparison.py`
3. Add comprehensive unit tests for each module
4. Create integration tests for the full pipeline
5. Add logging module for better observability

---

## Developer Guide

### Adding a New File Format
1. Update `SUPPORTED_EXTENSIONS` in `config.py`
2. Add format detection logic in `file_processing.py`
3. Update `read_data_file()` to handle the new format

### Adding a New Analysis Strategy
1. Add strategy function in `analysis.py`
2. Update `smart_discover_combinations()` to use it
3. Document the strategy in this file

### Adding a New API Endpoint
1. Add route decorator in `file_comparator.py`
2. Use functions from modules (database, file_processing, analysis)
3. Follow existing patterns for consistency

---

## Backup
Original monolithic file is backed up as `file_comparator_backup.py`

## Version
Modular refactoring completed: October 2025

