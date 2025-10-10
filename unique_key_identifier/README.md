# Unique Key Identifier - Advanced Analysis Tool

A modern web-based application for analyzing data files (CSV, DAT, TXT) to identify potential unique key combinations through comprehensive duplicate detection and uniqueness scoring. Compares files side-by-side with detailed metrics and visualizations. Features automatic delimiter detection for seamless file processing.

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
- **Row Limit Control**: Choose exact number of rows to analyze (NEW!)
  - Perfect for testing large files quickly
  - Example: Analyze 50k rows from 416k file → 2-3 minutes instead of 10+
  - 0 = Auto-mode with intelligent sampling
- **Automatic Sampling**: For files > 50k rows (when row limit = 0)
- **Hard Limits**: Prevents system overload (max 500k rows)

### Productivity Features
- **Clone Run**: Copy settings from previous runs instantly (NEW!)
  - Available from home page dropdown, results page, and workflow page
  - Clones: file names, columns, row limits, all combinations
  - **Saves 2 minutes per iteration** when reusing complex setups
  - Perfect for: iterative testing, version comparisons, parameter tuning

### Modern UI
- **Side-by-Side Comparison**: View both file analyses simultaneously
- **Color-Coded Results**: 
  - 🟢 Green: Perfect unique keys (100% uniqueness)
  - 🟡 Orange: Contains duplicates
- **Progress Bars**: Visual representation of uniqueness scores
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Animated Cards**: Smooth transitions and interactions

### Persistent Storage
- **SQLite Database**: All analysis results stored for future reference
- **Historical Runs**: Access previous analyses via dropdown
- **Detailed Metadata**: Timestamps, file names, row counts, and parameters

## 📊 Use Cases

1. **Data Quality Assessment**: Identify which column combinations can serve as primary keys
2. **Duplicate Detection**: Find and quantify duplicate records in your data
3. **Validation Planning**: Determine the best combinations for data validation
4. **File Comparison**: Compare data quality between two versions of the same dataset

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

> 📖 **Detailed Setup:** See [SETUP_GUIDE.md](SETUP_GUIDE.md) for comprehensive instructions  
> ⚡ **Quick Reference:** See [QUICKSTART.md](QUICKSTART.md) for essential commands  
> 🚀 **Large Files:** See [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) for handling 100k+ rows  
> 📊 **Row Limits:** See [ROW_LIMIT_GUIDE.md](ROW_LIMIT_GUIDE.md) for controlling rows to analyze  
> 🔄 **Clone Runs:** See [CLONE_RUN_GUIDE.md](CLONE_RUN_GUIDE.md) for reusing previous settings

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
- Top duplicate values (for combinations with duplicates)

**Color Indicators:**
- **Green border**: Perfect unique key (no duplicates)
- **Orange border**: Contains duplicates

## 🔍 Understanding the Results

### Uniqueness Score
- **100%**: Perfect unique key - every combination of values appears exactly once
- **70-99%**: High uniqueness - mostly unique but some duplicates exist
- **Below 70%**: Low uniqueness - many duplicate values present

### When to Use Different Column Counts

**2 Columns**: 
- Quick validation with two fields (e.g., desk + book)
- Best for smaller datasets

**3 Columns**:
- More specific combinations (e.g., desk + book + sedol)
- Better for larger datasets with more complexity

**4+ Columns**:
- Very specific combinations (e.g., desk + book + sedol + quantity)
- Use INCLUDE builder for precise combinations

## 📁 Project Structure

```
unique_key_identifier/
├── file_comparator.py        # FastAPI application with analysis logic
├── templates/
│   ├── index.html            # Modern responsive web interface
│   ├── results.html          # Results display page
│   └── workflow.html         # Processing workflow page
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
- **2 columns**: See which pairs like (desk, book) have duplicates
- **3 columns**: Analyze (desk, book, sedol) combinations
- **5 columns**: Use INCLUDE builder for specific combinations like (desk, book, sedol, quantity, high_frequency)

## 🛠️ Technical Stack

- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **Frontend**: HTML5, CSS3 (Pure CSS, no frameworks)
- **Data Processing**: pandas, itertools
- **Server**: Uvicorn (ASGI server)

## 📋 Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- Pandas
- Jinja2
- python-multipart

## ⚡ Performance

- Handles large CSV files efficiently
- In-memory analysis with pandas
- Persistent storage in SQLite
- Results cached in database for instant retrieval

## 🔒 Data Privacy

- All data processing happens locally
- No external API calls
- Data stored only in local SQLite database
- No data leaves your machine

## 🐛 Troubleshooting

**Issue**: Port 8000 already in use
```bash
# Solution: Use a different port
python3 -m uvicorn file_comparator:app --host 0.0.0.0 --port 8080
```

**Issue**: Files not found
- Ensure CSV files are in the `unique_key_identifier` directory
- Check file names are spelled correctly (case-sensitive)

**Issue**: "Files have different columns" error
- Both files must have identical column names in the same order
- Check for extra spaces or typos in column headers

## 📈 Future Enhancements

- Export results to CSV/Excel
- Batch file processing
- Custom column selection (instead of all combinations)
- Duplicate record viewer
- Data profiling statistics

## 📝 License

This project is provided as-is for educational and commercial use.

## 🤝 Contributing

Feel free to extend and modify this application for your specific needs!

---

**Built with ❤️ using FastAPI and modern web technologies**
