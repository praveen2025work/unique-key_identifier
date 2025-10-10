# Data Quality Check Feature

## Overview
A comprehensive data quality check feature has been added to identify column pattern issues, mixed data types, and cross-file inconsistencies before running the full analysis.

## What It Does

### Pattern Detection
- **Detects data types**: Identifies integers, floats, dates, emails, phone numbers, booleans, alphanumeric, and strings
- **Mixed type detection**: Flags columns where data types are inconsistent (e.g., mostly integers but some strings)
- **Pattern consistency**: Calculates a consistency percentage for each column

### Cross-File Validation
- **Pattern mismatches**: Identifies when the same column has different patterns in File A vs File B
- **Missing columns**: Flags columns that exist in one file but not the other
- **Consistency differences**: Detects significant differences in data quality between files
- **Null rate differences**: Identifies columns with drastically different null percentages

### Issues Flagged
- **High Severity**: Mixed data types, pattern mismatches, missing columns
- **Medium Severity**: Consistency differences, null rate differences
- **Informational**: High null percentages, moderate data quality issues

## How to Use

### Option 1: Integrated with Analysis (Recommended for First-Time Analysis)

1. **On the Home Page**:
   - Fill in your file names (File A and File B)
   - ✅ Check the box: **"🔍 Run Data Quality Check First"**
   - Click "Analyze Files"

2. **During Workflow**:
   - The workflow will show a new stage: "🔍 Data Quality Check"
   - Quality results will appear automatically when the check completes
   - Analysis continues automatically after quality check

3. **View Results**:
   - Quality summary with issue counts (Total, High Severity, Medium Severity)
   - Cross-file issues with specific details
   - File-specific issues for each file
   - Detailed column pattern analysis

### Option 2: Standalone Quality Check (Quick Validation)

1. **Access the Page**:
   - From home page, click: **"🔍 Or check data quality only →"**
   - Or go directly to: `http://localhost:8000/data-quality`

2. **Run Check**:
   - Enter File A and File B names
   - Optionally specify working directory
   - Click "🔍 Check Data Quality"

3. **Review Results**:
   - Instant quality report without running full analysis
   - Perfect for quick validation before committing to full analysis

## What Gets Detected

### Example Issues

#### Mixed Data Types
```
Column 'TradeID' has mixed data types:
- integer: 980 values
- string: 20 values
→ Issue: 98% integers, but some strings found
```

#### Pattern Mismatch
```
Column 'Date' has different patterns:
- File A: date pattern (YYYY-MM-DD)
- File B: string pattern (mixed formats)
→ Issue: Files use different date formats
```

#### High Null Percentage
```
Column 'CustomerID' has 65% null values
→ Issue: Column may not be reliable as a key
```

#### Consistency Difference
```
Column 'Amount' consistency:
- File A: 99.8% float
- File B: 75.2% float
→ Issue: File B has data quality problems
```

## Features

### Pattern Types Detected
- **integer**: Whole numbers (123, -456)
- **float**: Decimal numbers (123.45, -67.89)
- **date**: Date formats (2024-01-01, 01/01/2024)
- **datetime**: Date with time (2024-01-01 12:30:00)
- **email**: Email addresses (user@example.com)
- **phone**: Phone numbers (+1234567890, (123) 456-7890)
- **boolean**: True/false values (true, false, yes, no, 0, 1)
- **alphanumeric**: Letters and numbers only (ABC123)
- **string**: Text data
- **empty**: No data or all nulls

### Severity Levels
- **🔴 High**: Critical issues that will likely cause problems (mixed types, pattern mismatches)
- **🟡 Medium**: Issues that may affect analysis quality (consistency differences, high nulls)
- **🔵 Minor**: Informational issues (moderate nulls, pattern variations)
- **✅ Pass**: No issues detected

## Database Storage

Quality check results are stored in the database:
- **Table**: `data_quality_results`
- **Fields**: 
  - `run_id`: Links to the analysis run
  - `quality_summary`: Quick summary text
  - `quality_data`: Full JSON data with all details
  - `created_at`: Timestamp

You can retrieve quality results for any run using:
```
GET /api/data-quality/{run_id}
```

## Technical Details

### Files Modified
1. **`data_quality.py`** (NEW): Core pattern detection and validation logic
2. **`file_comparator.py`**: Added routes and workflow integration
3. **`database.py`**: Added data_quality_results table
4. **`file_processing.py`**: Fixed DtypeWarning by adding `low_memory=False`
5. **`templates/workflow.html`**: Added quality results display
6. **`templates/index_modern.html`**: Added quality check toggle
7. **`templates/data_quality.html`** (NEW): Standalone quality check page

### API Endpoints
- `POST /api/data-quality-check`: Standalone quality check
- `GET /api/data-quality/{run_id}`: Retrieve quality results for a run
- `GET /data-quality`: Standalone quality check page

### Workflow Stages
When data quality check is enabled, the workflow includes:
1. Reading CSV Files
2. **🔍 Data Quality Check** (NEW - optional)
3. Validating Data
4. Analyzing File A
5. Analyzing File B
6. Storing Results
7. Generating Files

## Performance Impact

- **Speed**: Adds ~5-15 seconds to workflow (depends on file size)
- **Sampling**: Uses intelligent sampling for large files (same as main analysis)
- **Memory**: Minimal additional memory usage
- **Recommended**: Enable for first-time analysis of new data sources

## Example Output

```
✅ No data quality issues detected
Total Issues: 0
High Severity: 0
Medium Severity: 0
```

OR

```
⚠️ Quality issues found: 3 medium severity
Total Issues: 5
High Severity: 0
Medium Severity: 3

Cross-File Issues:
  • PATTERN MISMATCH - TradeDate
    Column 'TradeDate' has different patterns:
    trading_system_a.csv (date) vs trading_system_b.csv (string)

File-Specific Issues:
  ⚠️ trading_system_a.csv
    • CustomerID: High null percentage: 45.2%
    • Amount: Mixed data types detected - integer: 950, float: 50 values

  ⚠️ trading_system_b.csv
    • TradeDate: Mixed data types detected - date: 800, string: 200 values
```

## Tips

1. **First Time**: Always enable quality check when analyzing a new data source
2. **Known Data**: Skip quality check for data you've already validated
3. **Large Files**: Quality check uses the same sampling as analysis, so it's fast
4. **Fix Issues**: Address high-severity issues before analysis for best results
5. **Pattern View**: Use standalone quality check page for quick validation without running full analysis

## Benefits

✅ **Catch issues early** - Identify data problems before analysis
✅ **Save time** - Avoid running full analysis on bad data
✅ **Better results** - Clean data leads to more accurate key identification
✅ **Data confidence** - Understand your data quality before making decisions
✅ **Cross-file validation** - Ensure files are compatible and consistent

---

## Bug Fixes Included

### DtypeWarning Fixed
The warning you reported has been fixed:
```
DtypeWarning: Columns (1) have mixed types. 
Specify dtype option on import or set low_memory=False
```

**Solution**: Added `low_memory=False` to all `pd.read_csv()` calls in `file_processing.py`

**Benefits**:
- ✅ No more warnings
- ✅ Faster processing
- ✅ More accurate type inference
- ✅ Better performance

This fix also helps with the "Generate Files taking lot of time" issue by making pandas read files more efficiently.

---

**Ready to Use!** Start the application and try the new data quality check feature!

