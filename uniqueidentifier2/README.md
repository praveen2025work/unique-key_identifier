# Unique Key Identifier v2.0

An intelligent file comparison and unique key discovery system designed for large-scale datasets with hundreds of columns and millions of rows.

## 🎯 Key Features

### Smart Keys - Intelligent Discovery
- **Auto Discovery Mode**: Automatically searches 2-10 column combinations
  - Generates 100-150 optimized key combinations
  - Balanced distribution across all column sizes
  - Ideal for exploratory analysis on 300+ column datasets
  
- **Guided Discovery Mode**: Enhances business knowledge with AI
  - Provide base combinations (e.g., `customer_id, fiscal_year`)
  - System generates 100-150 variations for EACH base
  - Example: 3 bases × 100 = ~300 comprehensive combinations
  - All results build upon your domain knowledge

- **Manual Mode**: Analyze specific combinations only
  - Full control over which combinations to test
  - No AI enhancement, direct analysis

### Performance & Scalability
- **Large File Support**: Handles millions of rows efficiently
  - Adaptive sampling (500k-1M rows for analysis)
  - Chunked processing for exports
  - Memory-optimized operations
  
- **Memory Management**:
  - Automatic DataFrame cleanup after analysis
  - Configurable page sizes (50-1000 rows)
  - Lazy rendering for large data grids
  - 90% memory reduction in viewer components
  - Support for 200k+ row chunks without crashes

- **Multi-Format Support**: CSV, Excel, DAT, TXT with auto-delimiter detection

### Advanced Analysis
- **Uniqueness Detection**: Identifies duplicate records with detailed metrics
- **Match Analysis**: Side-by-side file comparison with match rates
- **Data Quality Checks**: Pattern analysis and validation
- **Grouping & Visualization**: Collapsible groups by base columns
- **Export Options**: CSV, Excel with formatted results

### Enterprise Features
- **Audit Logging**: Track all operations and user actions
- **Job Queue**: Background processing with status tracking
- **Comparison Cache**: Fast retrieval of previous analyses
- **Notifications**: Email/Slack integration (configurable)
- **Scheduled Jobs**: Automated recurring comparisons

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd uniqueidentifier2/backend
   ```

2. Create virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend:
   ```bash
   python main.py
   ```
   
   Backend runs on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd uniqueidentifier2/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   
   Frontend runs on `http://localhost:3000`

### Production Build

Build for different environments:

```bash
# Development
npm run build:dev

# UAT
npm run build:uat

# Production
npm run build:prod

# All environments
npm run build:all
```

## 📖 Usage Guide

### Basic Analysis

1. **Upload Files**: Select two files (CSV, Excel, etc.)
2. **Choose Mode**:
   - ☑️ **Smart Keys ON** + No combinations = Auto Discovery (100-150 results)
   - ☑️ **Smart Keys ON** + Combinations = Guided Discovery (N × 100 results)
   - ☐ **Smart Keys OFF** = Manual mode (analyze specified only)
3. **Run Comparison**: Click "Run Comparison" and wait 2-10 minutes
4. **View Results**: Explore grouped results with collapsible sections

### Smart Keys - Best Practices

#### For Exploratory Analysis (300+ columns)
```
✓ Enable Smart Keys
✓ Leave combinations empty
✓ System finds 100-150 best combinations (2-10 columns each)
✓ Balanced distribution across all sizes
```

#### For Business-Focused Analysis
```
✓ Enable Smart Keys
✓ Enter business key hints:
  - customer_id, fiscal_year
  - product_code, warehouse
  - invoice_number
✓ System generates ~100-150 variations per base
✓ Total: 3 bases × 100 = ~300 combinations
```

#### For Specific Analysis
```
✗ Disable Smart Keys
✓ Enter exact combinations to test
✓ Full control, no AI enhancement
```

### Memory Optimization Tips

#### For Large Files (200k+ rows)
- Use 50-100 rows per page in viewer
- System auto-clears old data when switching pages
- No memory accumulation

#### Page Size Recommendations
- **50 rows**: Fastest, minimal memory
- **100 rows**: Recommended (default)
- **250-500 rows**: More data viewing
- **1000 rows**: Maximum (slower, for power users)

## 📁 Project Structure

```
uniqueidentifier2/
├── backend/
│   ├── main.py                          # FastAPI application
│   ├── analysis.py                      # Core analysis logic
│   ├── intelligent_key_discovery.py     # Smart Keys implementation
│   ├── chunked_comparison.py            # Large file processing
│   ├── database.py                      # Database operations
│   ├── comparison_cache.py              # Results caching
│   ├── export_manager.py                # Export functionality
│   ├── audit_logger.py                  # Audit logging
│   ├── job_queue.py                     # Background jobs
│   ├── config.py                        # Configuration
│   └── requirements.txt                 # Python dependencies
├── frontend/
│   ├── app/                             # Next.js app directory
│   ├── src/
│   │   ├── components/                  # React components
│   │   │   ├── FileComparisonApp.tsx    # Main application
│   │   │   ├── ChunkedFileListViewer.tsx # Large file viewer
│   │   │   ├── WijmoDataGrid.tsx        # Data grid component
│   │   │   └── ...
│   │   ├── contexts/                    # React contexts
│   │   ├── hooks/                       # Custom hooks
│   │   ├── services/                    # API services
│   │   └── types/                       # TypeScript types
│   ├── next.config.mjs                  # Next.js configuration
│   ├── package.json                     # Dependencies
│   └── tsconfig.json                    # TypeScript config
└── README.md                            # This file
```

## ⚙️ Configuration

### Backend Configuration (`backend/config.py`)

```python
# Database
DATABASE_PATH = "file_comparison.db"

# File Processing
MAX_SAMPLE_SIZE = 1000000  # 1M rows for analysis
CHUNK_SIZE = 10000         # Export chunk size

# Smart Keys
DEFAULT_COMBINATIONS_LIMIT = 150
MIN_UNIQUENESS_THRESHOLD = 0.95

# Email Notifications (optional)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = "your-app-password"

# Slack Notifications (optional)
SLACK_WEBHOOK_URL = "your-webhook-url"
```

### Environment Files (Frontend)

Create `.env.<environment>` files:

```bash
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

## 🔧 Advanced Features

### Chunked File Processing

For very large files (millions of rows):
1. Analysis uses adaptive sampling (up to 1M rows)
2. Results show accurate statistics from sample
3. Exports process full data in chunks
4. Each chunk: 10k records in separate files

### Comparison Cache

- Previously analyzed combinations are cached
- Instant retrieval of cached results
- Reduces redundant processing
- Automatic cache management

### Job Queue System

- Background processing for long-running jobs
- Real-time status updates
- Progress tracking
- Error handling and retry logic

## 🎨 UI Features

### Analysis Results Display

- **Summary Banner**: Shows total combinations breakdown
  ```
  Total: 300 combinations
  3 base combinations × ~100 variations each
  
  Breakdown:
    Base 1: customer_id, fiscal_year (98 variations)
    Base 2: product_code, warehouse (105 variations)
    Base 3: invoice_number (97 variations)
  ```

- **Collapsible Groups**: Organized by base columns
  - Click to expand/collapse
  - Shows variation count
  - Clear visual hierarchy

- **Enhanced Display**: 
  - Base columns in **bold indigo**
  - Additional columns with "+" separator
  - Example: `customer_id, fiscal_year + product_id, warehouse_code`
  - Click any row to copy full combination

### Data Grid Features

- Lazy rendering (only visible rows)
- Pagination with configurable page size
- Column sorting and filtering
- Cell value truncation (200 chars)
- Export selected data

## 📊 Performance Benchmarks

| Dataset Size | Columns | Analysis Time | Memory Usage |
|-------------|---------|---------------|--------------|
| 100k rows | 50 cols | ~30 seconds | ~200 MB |
| 500k rows | 100 cols | ~2 minutes | ~400 MB |
| 1M rows | 300 cols | ~5 minutes | ~800 MB |
| 5M rows | 500 cols | ~10 minutes | ~1.2 GB (with sampling) |

Memory optimizations:
- DataFrames freed immediately after use
- Garbage collection enforced
- Viewer uses only 5-10 MB per page
- No memory accumulation during navigation

## 🐛 Troubleshooting

### Backend Issues

**Port 8000 already in use:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows (find PID, then taskkill)
```

**Database corruption:**
```bash
# Repair database
cd backend
sqlite3 file_comparison.db ".dump" > db_dump.sql
rm file_comparison.db
sqlite3 file_comparison.db < db_dump.sql
```

**Memory issues:**
- Check logs for memory usage warnings
- Reduce sample size in config.py
- Use smaller page sizes in viewer

### Frontend Issues

**Build errors:**
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Memory crashes in browser:**
- Use smaller page size (50-100 rows)
- Clear browser cache
- Close unused tabs

**TypeScript errors:**
```bash
# Rebuild TypeScript
npm run build
```

## 📚 API Documentation

Backend API available at `http://localhost:8000/docs` (Swagger UI)

Key endpoints:
- `POST /upload` - Upload files
- `POST /run-comparison` - Start analysis
- `GET /job-status/{job_id}` - Check job status
- `GET /results/{job_id}` - Get analysis results
- `GET /export/{job_id}` - Download exports
- `GET /chunks/{filename}` - List file chunks
- `GET /chunk-records/{filename}/{chunk_id}` - Get chunk data

## 🔐 Security & Privacy

- All processing happens locally
- No external API calls
- Data stored in local SQLite database
- No data transmission to cloud services
- Audit logging for compliance

## 🤝 Contributing

This is a private/internal project. For bug reports or feature requests, contact the development team.

## 📝 Version History

See [CHANGELOG.md](../CHANGELOG.md) for detailed version history.

## 📄 License

Copyright © 2025. All rights reserved.

---

**Version**: 2.0.1  
**Last Updated**: October 17, 2025  
**Status**: Production Ready  

For support or questions, refer to the inline help within the application interface.
