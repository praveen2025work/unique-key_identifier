# Unique Key Identifier - Advanced Analysis Tool

A modern web-based application for analyzing data files (CSV, DAT, TXT) to identify potential unique key combinations through comprehensive duplicate detection and uniqueness scoring. Compares files side-by-side with detailed metrics, visualizations, and data export capabilities.

## 🎯 Key Features

### Multiple File Format Support
- **Smart File Reading**: Supports CSV (.csv), DAT (.dat), and TXT (.txt) files
- **Auto-Delimiter Detection**: Automatically detects comma, tab, pipe (|), semicolon, or space delimiters
- **Encoding Support**: Handles UTF-8 and Latin-1 encodings automatically

### Separate File Analysis
- **Independent Analysis**: Analyzes Side A and Side B separately to identify unique keys for each file
- **Duplicate Detection**: Identifies exactly how many duplicate values exist for each column combination
- **Uniqueness Scoring**: Calculates a 0-100% score showing how unique each combination is

### Advanced Metrics
- **Total Rows**: Number of rows in each file
- **Unique Values**: Count of distinct values for each column combination
- **Duplicate Count**: Total number of duplicate occurrences
- **Uniqueness Score**: Percentage indicating suitability as a unique key
- **Validation Status**: Clear indicators showing which combinations can serve as unique keys

### Performance Control
- **Row Limit Control**: Choose exact number of rows to analyze
  - Perfect for testing large files quickly
  - Example: Analyze 50k rows from 416k file → 2-3 minutes instead of 10+
  - 0 = Auto-mode with intelligent sampling
- **Automatic Sampling**: For files > 50k rows (when row limit = 0)
- **Hard Limits**: Prevents system overload (max 500k rows)

### Data Export Features

**Export Unique/Duplicate Records:**
- Export rows with unique column combinations (CSV format)
- Export rows with duplicates including occurrence count (CSV format)
- Available for every column combination analyzed
- Files auto-named with run ID: `unique_records_run_{id}_side_{A|B}_{columns}.csv`

**Compare A↔B (Side-by-Side Comparison):**
- **View in Browser**: Interactive web UI with tabs for Matched, Only A, Only B records
- **Download Excel**: Complete comparison with 5 sheets
  - Summary sheet with match rate and counts
  - Matched records (from both perspectives)
  - Only in Side A (exclusive records)
  - Only in Side B (exclusive records)
- Perfect for data reconciliation, version comparison, migration validation

### Productivity Features
- **Clone Run**: Copy settings from previous runs instantly
  - Available from home page dropdown, results page, and workflow page
  - Clones: file names, columns, row limits, all combinations
  - Saves 2 minutes per iteration when reusing complex setups

### Modern UI
- **Bootstrap-inspired Design**: Professional blue theme (#337ab7)
- **Side-by-Side Comparison**: View both file analyses simultaneously
- **Color-Coded Results**: 
  - 🟢 Green: Unique records and matched data
  - 🟡 Orange: Duplicate records
  - 🔵 Blue: Side A specific data
  - 🟠 Orange: Side B specific data
- **Clipboard Copy**: Click any column name or cell value to copy
- **Progress Bars**: Visual representation of uniqueness scores
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Toast Notifications**: Visual feedback for actions

### Persistent Storage
- **SQLite Database**: All analysis results stored for future reference
- **Historical Runs**: Access previous analyses via dropdown
- **Detailed Metadata**: Timestamps, file names, row counts, and parameters

## 📊 Use Cases

1. **Data Quality Assessment**: Identify which column combinations can serve as primary keys
2. **Duplicate Detection**: Find and quantify duplicate records in your data
3. **Validation Planning**: Determine the best combinations for data validation
4. **File Comparison**: Compare data quality between two versions of the same dataset
5. **Data Reconciliation**: Find matched, missing, or extra records between systems
6. **Migration Validation**: Ensure all data migrated successfully between systems

## 🚀 Quick Start

### Automated Setup (Recommended)

**macOS/Linux:**
```bash
cd unique_key_identifier
./run.sh
```

**Windows:**
```cmd
cd unique_key_identifier
run.bat
```

The script will automatically:
- ✓ Check Python installation
- ✓ Install all dependencies
- ✓ Check port availability
- ✓ Start the application

### Manual Setup

1. Navigate to the project directory:
   ```bash
   cd unique_key_identifier
   ```

2. Install dependencies:
   ```bash
   pip3 install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python3 file_comparator.py
   ```

Then open your browser to: **http://localhost:8000**

## 📖 How to Use

### Step 1: Prepare Your Files
Place your data files in the `unique_key_identifier` directory. Both files must have:
- The same column structure
- Supported formats: **CSV (.csv)**, **DAT (.dat)**, **TXT (.txt)**
- Headers in the first row
- **Auto-detects delimiters:** comma, tab, pipe (|), semicolon, space

### Step 2: Run Analysis
1. Enter the names of File A and File B (e.g., `trading_system_a.csv`, `trading_system_b.csv`)
2. Specify the number of columns to combine (e.g., `2` for pairs, `3` for triplets) OR use INCLUDE builder
3. **(Optional)** Set Row Limit for faster processing on large files (e.g., `50000` for 50k rows)
   - `0` or empty = Auto-mode (recommended)
   - Specific number = Analyze only first N rows
4. Click "Analyze Files"

### Step 3: Review Results
The application will display:

**For Each File (Side A and Side B):**
- All possible column combinations sorted by uniqueness
- Uniqueness score (100% = perfect unique key)
- Count of unique vs duplicate values
- Visual progress bar showing uniqueness percentage

**Export Options:**
- **📥 Unique** - Export records with unique column combinations
- **📥 Dup** - Export duplicate records with occurrence count
- **👁️ View** - View comparison in browser (interactive UI)
- **📥 Excel** - Download complete comparison (Excel with 5 sheets)

### Step 4: Compare Files
Click the **👁️ View** button to see:
- Match rate percentage
- Matched records (in both files)
- Records only in Side A
- Records only in Side B
- Interactive tabs with data tables
- Click any cell to copy value to clipboard

## 🔍 Understanding the Results

### Uniqueness Score
- **100%**: Perfect unique key - every combination of values appears exactly once
- **70-99%**: High uniqueness - mostly unique but some duplicates exist
- **Below 70%**: Low uniqueness - many duplicate values present

### Comparison Results
- **Matched**: Records that exist in BOTH files (intersection)
- **Only in Side A**: Records exclusive to File A (may be deletions or unique data)
- **Only in Side B**: Records exclusive to File B (may be additions or unique data)
- **Match Rate**: Percentage of Side A records found in Side B

### When to Use Different Column Counts

**1 Column**: 
- Quick single-field validation
- Best for IDs, unique identifiers

**2 Columns**: 
- Quick validation with two fields (e.g., desk + book)
- Best for smaller datasets

**3 Columns**:
- More specific combinations (e.g., desk + book + sedol)
- Better for larger datasets with more complexity

**4+ Columns**:
- Very specific combinations
- Use INCLUDE builder for precise combinations

## 📁 Project Structure

```
unique_key_identifier/
├── file_comparator.py        # FastAPI application with analysis logic
├── templates/
│   ├── index_modern.html     # Modern responsive web interface
│   ├── results.html          # Results display page
│   ├── workflow.html         # Processing workflow page
│   └── comparison_view.html  # Comparison viewer
├── trading_system_a.csv      # Sample trading data file A
├── trading_system_b.csv      # Sample trading data file B
├── generate_trading_data.py  # Data generator script
├── requirements.txt          # Python dependencies
├── README.md                 # This file
└── file_comparison.db        # SQLite database (created on first run)
```

## 🗄️ Database Schema

### runs
Stores metadata about each analysis run
- `run_id`: Unique identifier
- `timestamp`: When the analysis was performed
- `file_a`, `file_b`: File names
- `num_columns`: Number of columns analyzed
- `file_a_rows`, `file_b_rows`: Row counts

### analysis_results
Stores detailed metrics for each column combination
- `side`: A or B
- `columns`: Column combination (comma-separated)
- `total_rows`: Total rows in file
- `unique_rows`: Count of unique combinations
- `duplicate_rows`: Count of duplicate rows
- `duplicate_count`: Total duplicate occurrences
- `uniqueness_score`: Percentage score (0-100)
- `is_unique_key`: Boolean indicator

### duplicate_samples
Stores examples of duplicate values
- `duplicate_value`: The duplicated combination
- `occurrence_count`: How many times it appears

## 🎨 Sample Data

The included sample files demonstrate the analysis:

**trading_system_a.csv**: Trading data with 124 columns and various combinations
**trading_system_b.csv**: Trading data with similar structure for comparison

Try analyzing with:
- **1 column**: See which single columns like "trade_id" have duplicates
- **2 columns**: See which pairs like (desk, book) have duplicates
- **3 columns**: Analyze (desk, book, sedol) combinations

## 🛠️ Technical Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Frontend**: HTML5, CSS3 with Bootstrap-inspired design
- **Data Processing**: pandas, itertools
- **Server**: Uvicorn (ASGI server)

## 📋 Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- Pandas
- Jinja2
- python-multipart
- xlsxwriter
- openpyxl

## ⚡ Performance

- Handles large CSV files efficiently
- In-memory analysis with pandas
- Persistent storage in SQLite
- Results cached in database for instant retrieval
- Optimized set operations for fast comparisons

## 🔒 Data Privacy

- All data processing happens locally
- No external API calls
- Data stored only in local SQLite database
- No data leaves your machine
- Export files stream directly to browser (no server storage)

## 🐛 Troubleshooting

**Issue**: Port 8000 already in use
```bash
# Solution: Kill existing process and restart
lsof -ti:8000 | xargs kill -9
python3 file_comparator.py
```

**Issue**: Files not found
- Ensure CSV files are in the `unique_key_identifier` directory
- Check file names are spelled correctly (case-sensitive)

**Issue**: "Files have different columns" error
- Both files must have identical column names in the same order
- Check for extra spaces or typos in column headers

**Issue**: Export buttons return "Not Found"
- Server needs to be restarted after updates
- Press Ctrl+C and run `./run.sh` again

**Issue**: Slow performance with large files
- Use Row Limit feature (e.g., 50000 for 50k rows)
- Use INCLUDE combinations instead of auto-discovery
- Ensure files are under 500k rows

## 🎨 UI Features

### Color Scheme
- **Primary**: #337ab7 (Bootstrap blue)
- **Success**: #5cb85c (Green) for matches and unique records
- **Info**: #5bc0de (Light blue) for Side A specific data
- **Warning**: #f0ad4e (Orange) for Side B specific data
- **Secondary**: #6c757d (Gray) for navigation

### Interactive Features
- **Click to Copy**: Click any column name to copy to clipboard
- **Cell Copy**: Click table cells in comparison view to copy values
- **Toast Notifications**: Visual feedback when copying
- **Tab Navigation**: Switch between matched/only-A/only-B views
- **Hover Effects**: Visual feedback on all interactive elements

## 📈 What's New in Latest Version

**Version 2.2:**
- ✅ Export unique records to CSV
- ✅ Export duplicate records with occurrence count
- ✅ Compare A↔B with web viewer
- ✅ Download comparison as Excel (5 sheets)
- ✅ Clipboard copy for columns and cells
- ✅ Bootstrap-inspired color theme (#337ab7)
- ✅ Toast notifications
- ✅ Optimized performance (no UI freeze)

## 📝 License

This project is provided as-is for educational and commercial use.

## 🤝 Contributing

Feel free to extend and modify this application for your specific needs!

---

**Built with ❤️ using FastAPI and modern web technologies**
