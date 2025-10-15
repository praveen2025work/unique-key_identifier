# Quick Start: Row-by-Row File Comparison

## 🚀 Get Started in 5 Minutes

This guide shows you how to use the enterprise row-by-row comparison feature to compare two files and get matched/only_a/only_b results.

## Prerequisites

- Backend server running (`python main.py` or `./start-backend.sh`)
- Frontend server running (optional, for UI)
- Two CSV files uploaded to the system

## Method 1: Using the API (Programmatic)

### Step 1: Upload Files and Run Analysis

First, upload your files and run the standard analysis to get a `run_id`:

```bash
# Upload and analyze files
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file_a=@file_a.csv" \
  -F "file_b=@file_b.csv" \
  -F "num_columns=2"

# Response includes: "run_id": 123
```

### Step 2: Generate Row-by-Row Comparison

Once you have a `run_id`, generate the comparison export:

```bash
# Generate comparison for specific columns
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id,order_id"
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "matched_count": 850000,
    "only_a_count": 150000,
    "only_b_count": 100000,
    "match_rate": 85.0,
    "processing_time": 45.2
  },
  "export_info": {
    "export_dir": "/path/to/comparison_exports/run_123/...",
    "files": {
      "matched": "/path/to/matched.csv",
      "only_a": "/path/to/only_a.csv",
      "only_b": "/path/to/only_b.csv"
    }
  }
}
```

### Step 3: View Results with Pagination

Get paginated records (lightning fast!):

```bash
# Get first 100 matched records
curl "http://localhost:8000/api/comparison-export/123/data?columns=customer_id,order_id&category=matched&offset=0&limit=100"

# Get next 100 matched records
curl "http://localhost:8000/api/comparison-export/123/data?columns=customer_id,order_id&category=matched&offset=100&limit=100"

# Get first 100 records only in A
curl "http://localhost:8000/api/comparison-export/123/data?columns=customer_id,order_id&category=only_a&offset=0&limit=100"

# Get first 100 records only in B
curl "http://localhost:8000/api/comparison-export/123/data?columns=customer_id,order_id&category=only_b&offset=0&limit=100"
```

### Step 4: Download Complete Files

Download the full CSV files:

```bash
# Download matched records
curl "http://localhost:8000/api/comparison-export/123/download?columns=customer_id,order_id&category=matched" -o matched.csv

# Download only_a records
curl "http://localhost:8000/api/comparison-export/123/download?columns=customer_id,order_id&category=only_a" -o only_a.csv

# Download only_b records
curl "http://localhost:8000/api/comparison-export/123/download?columns=customer_id,order_id&category=only_b" -o only_b.csv
```

## Method 2: Using the UI (React Frontend)

### Step 1: Upload Files

1. Open the web interface: `http://localhost:3000`
2. Click "Upload Files"
3. Select File A and File B
4. Click "Analyze Files"
5. Wait for analysis to complete
6. Note the Run ID

### Step 2: View Comparison Results

1. Navigate to the results page
2. Look for the "Row-by-Row Comparison" section
3. If not generated yet, click "Generate Comparison"
4. Select the columns you want to compare

### Step 3: Explore Results

Once generated, you'll see:
- **Summary Cards**: Matched count, Only A count, Only B count
- **Tabs**: Switch between Matched / Only in A / Only in B
- **Data Table**: View paginated records
- **Download Buttons**: Download complete CSV files

### Step 4: Pagination

- Use page numbers to navigate
- Change rows per page (50, 100, 250, 500)
- Click "Previous" / "Next" buttons

### Step 5: Download

Click the "Download CSV" button on any tab to get the complete file.

## Method 3: Using Python Script

### Simple Python Example

```python
from chunked_file_exporter import ChunkedFileExporter

# Create exporter
exporter = ChunkedFileExporter(
    run_id=123,
    file_a_path="path/to/file_a.csv",
    file_b_path="path/to/file_b.csv"
)

# Generate comparison
result = exporter.compare_and_export(
    columns=['customer_id', 'order_id']
)

# Print results
print(f"Matched: {result['matched_count']:,}")
print(f"Only A: {result['only_a_count']:,}")
print(f"Only B: {result['only_b_count']:,}")
print(f"Match Rate: {result['match_rate']}%")
print(f"Processing Time: {result['processing_time']}s")
```

### Read Paginated Results

```python
from chunked_file_exporter import read_export_file_paginated

# Read first page
data = read_export_file_paginated(
    file_path="comparison_exports/run_123/.../matched.csv",
    offset=0,
    limit=100
)

print(f"Total: {data['total']:,} records")
print(f"Showing: {len(data['records'])} records")

# Display records
for record in data['records']:
    print(record)
```

## Common Use Cases

### Use Case 1: Find Missing Records

**Goal:** Find records in File A that don't exist in File B

```bash
# Generate comparison
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=transaction_id"

# Download only_a file
curl "http://localhost:8000/api/comparison-export/123/download?columns=transaction_id&category=only_a" -o missing_in_b.csv
```

Now `missing_in_b.csv` contains all records that exist in A but not in B!

### Use Case 2: Data Reconciliation

**Goal:** Verify two systems have the same data

```bash
# Generate comparison
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id,order_id"

# Check match rate
curl "http://localhost:8000/api/comparison-export/123/status?columns=customer_id,order_id"

# If match rate is not 100%, download mismatches
curl "http://localhost:8000/api/comparison-export/123/download?columns=customer_id,order_id&category=only_a" -o system_a_extra.csv
curl "http://localhost:8000/api/comparison-export/123/download?columns=customer_id,order_id&category=only_b" -o system_b_extra.csv
```

### Use Case 3: Data Migration Verification

**Goal:** Verify all records migrated from old system to new system

```bash
# File A = Old System Export
# File B = New System Export

# Compare
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=record_id"

# Get summary
curl "http://localhost:8000/api/comparison-export/123/summary"

# If only_a_count > 0, these records failed to migrate
curl "http://localhost:8000/api/comparison-export/123/download?columns=record_id&category=only_a" -o failed_migration.csv
```

### Use Case 4: Duplicate Detection Across Files

**Goal:** Find which records appear in both files

```bash
# Generate comparison
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=email"

# Download duplicates
curl "http://localhost:8000/api/comparison-export/123/download?columns=email&category=matched" -o duplicates.csv
```

## Performance Guide

### File Size vs Processing Time

| Rows (each file) | Columns | Processing Time | Export Size |
|------------------|---------|----------------|-------------|
| 10,000           | 10      | < 5 sec        | ~2 MB       |
| 100,000          | 10      | 10-20 sec      | ~20 MB      |
| 1,000,000        | 10      | 1-2 min        | ~200 MB     |
| 10,000,000       | 10      | 8-15 min       | ~2 GB       |
| 50,000,000       | 10      | 30-60 min      | ~10 GB      |

### Tips for Large Files

1. **Use fewer columns**: Compare only on key columns
2. **Run during off-peak**: Large comparisons can be CPU-intensive
3. **Test with limits**: Use `max_export_rows` parameter for testing
4. **Monitor disk space**: Exports can be large
5. **Clean up old runs**: Use cleanup API when done

## Troubleshooting

### Problem: "Out of Memory" Error

**Solution:** Reduce chunk size in `config.py`:
```python
COMPARISON_CHUNK_SIZE = 25000  # Default is 50000
```

### Problem: Export Taking Too Long

**Options:**
1. Test with a limit first:
   ```bash
   curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id&max_export_rows=10000"
   ```
2. Run during off-peak hours
3. Consider comparing fewer columns

### Problem: File Not Found

**Solution:** Regenerate the comparison:
```bash
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id"
```

### Problem: Pagination is Slow

This shouldn't happen! If it does:
1. Check disk I/O performance
2. Ensure export files exist
3. Try regenerating the comparison

## Advanced Features

### Multiple Column Combinations

You can generate multiple comparisons for the same run:

```bash
# Compare by single column
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id"

# Compare by composite key
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=customer_id,order_id"

# Compare by different key
curl -X POST "http://localhost:8000/api/comparison-export/123/generate?columns=email"
```

Each comparison creates separate matched/only_a/only_b files!

### Batch Processing

Process multiple runs:

```bash
for run_id in 120 121 122 123; do
  curl -X POST "http://localhost:8000/api/comparison-export/$run_id/generate?columns=customer_id"
done
```

### Check What's Available

See all comparisons for a run:

```bash
curl "http://localhost:8000/api/comparison-export/123/summary"
```

### Cleanup Old Exports

Remove exports when done:

```bash
# Clean specific run
curl -X DELETE "http://localhost:8000/api/comparison-export/123/cleanup"
```

## Next Steps

1. **Read Full Documentation**: See `ENTERPRISE_COMPARISON_GUIDE.md`
2. **API Reference**: All endpoints documented in guide
3. **Frontend Integration**: Add `ChunkedComparisonViewer` component
4. **Python API**: Use `chunked_file_exporter` module directly

## Support

For issues or questions:
1. Check `ENTERPRISE_COMPARISON_GUIDE.md` for detailed info
2. Review error messages in backend logs
3. Test with smaller files first
4. Verify files exist and are accessible

---

**Ready to process files of ANY size without memory issues!** 🚀

