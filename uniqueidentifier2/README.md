# Unique Key Identifier v2.0

A modern, full-stack application for analyzing and identifying unique key combinations in CSV files. This is a complete rewrite of the original application using React.js for the frontend and FastAPI for the backend.

## Architecture

```
uniqueidentifier2/
├── frontend/          # React.js + TypeScript + Tailwind CSS
├── backend/           # FastAPI + Python
├── README.md
└── docker-compose.yml # (Future: Docker setup)
```

## Features

- 🚀 **Modern UI**: Beautiful, responsive React interface with Tailwind CSS
- ⚡ **Fast API**: High-performance FastAPI backend with async operations
- 📊 **Real-time Analysis**: Live file preview and column detection
- 🔍 **Smart Combinations**: Include/exclude specific column combinations
- 📈 **Advanced Scoring**: Multiple scoring algorithms for key quality
- 🎯 **Data Quality**: Optional data quality checks and validation
- 💾 **Run History**: Save and clone previous analysis configurations
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices

## Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd uniqueidentifier2/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

5. **Start the backend server:**
   ```bash
   python start.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd uniqueidentifier2/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Update VITE_API_URL if needed (default: http://localhost:8000)
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Usage

### Basic Analysis

1. **Enter File Information:**
   - File A: Path to your first CSV file
   - File B: Path to your second CSV file
   - Working Directory: (Optional) Base directory for file paths

2. **Configure Analysis:**
   - Number of Columns: How many columns to combine (1-10)
   - Row Limit: Limit processing for large files (0 = process all)
   - Quality Check: Enable additional data quality validations

3. **Build Combinations:**
   - **Include Mode**: Specify exact combinations to analyze
   - **Exclude Mode**: Exclude specific combinations from analysis
   - Toggle between modes using the switch
   - Add columns by clicking them
   - Build combinations and add to lists

4. **Run Analysis:**
   - Click "⚡ Analyze" to start processing
   - View real-time progress
   - Get redirected to results page

### Advanced Features

#### Column Combination Builder

- **Visual Builder**: Drag-and-drop interface for building combinations
- **Include Lists**: Specify exact combinations to test
- **Exclude Lists**: Remove unwanted combinations from analysis
- **Smart Toggle**: Switch between include/exclude modes
- **Real-time Validation**: Immediate feedback on column selection

#### Data Quality Checks

When enabled, the system performs additional validations:
- Null value analysis
- Data type consistency
- Format validation
- Duplicate detection
- Statistical outliers

#### Run Management

- **History**: View all previous analysis runs
- **Clone**: Duplicate successful configurations
- **Compare**: Side-by-side comparison of results
- **Export**: Download results in various formats

## API Documentation

### Endpoints

#### File Operations

- `GET /api/preview-columns` - Preview file columns and metadata
- `GET /health` - API health check

#### Analysis Operations

- `POST /api/compare` - Submit analysis request
- `GET /api/analysis/{run_id}` - Get analysis results

#### Run Management

- `GET /api/runs` - List all analysis runs
- `GET /api/clone/{run_id}` - Clone run configuration
- `GET /api/run/{run_id}` - Get detailed run results

### Sample Request

```bash
curl -X POST "http://localhost:8000/api/compare" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "file_a=sample_data_a.csv&file_b=sample_data_b.csv&num_columns=2"
```

## Development

### Frontend Development

The frontend is built with:
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hook Form** for form management
- **Axios** for API communication
- **Heroicons** for icons

Key directories:
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/services/` - API service layer
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

### Backend Development

The backend is built with:
- **FastAPI** for API framework
- **Pydantic** for data validation
- **Pandas** for data processing
- **AsyncIO** for concurrent operations
- **Uvicorn** as ASGI server

Key directories:
- `app/api/` - API route handlers
- `app/core/` - Core configuration
- `app/models/` - Pydantic models
- `app/services/` - Business logic
- `app/utils/` - Utility functions

### Adding New Features

1. **Frontend**: Create components in `src/components/`
2. **Backend**: Add routes in `app/api/`
3. **Models**: Define data structures in `app/models/`
4. **Services**: Implement business logic in `app/services/`

## Testing

### Sample Data

The project includes sample CSV files for testing:
- `backend/sample_data_a.csv` - Employee data with ID, name, email, department, salary
- `backend/sample_data_b.csv` - Employee data with ID, name, email, location, manager_id

### Test Analysis

1. Start both frontend and backend
2. Use sample files: `sample_data_a.csv` and `sample_data_b.csv`
3. Try different column combinations:
   - Single column: `id`
   - Two columns: `id,name` or `name,email`
   - Three columns: `id,name,email`

Expected results:
- `id` should score highest as unique key
- `name,email` should also score well
- `email` alone should be good but may have lower overlap

## Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Files will be in dist/ directory
```

**Backend:**
```bash
cd backend
# Set environment variables for production
export DEBUG=False
export HOST=0.0.0.0
export PORT=8000
python start.py
```

### Docker (Future Enhancement)

A `docker-compose.yml` file will be added to support containerized deployment.

## Performance

### Optimization Tips

1. **Use Row Limits**: For files > 100K rows, use max_rows parameter
2. **Specific Combinations**: Use include/exclude lists instead of generating all combinations
3. **File Size**: Keep files under 500MB for optimal performance
4. **Column Count**: Limit combination size to avoid exponential growth

### Scalability

- Backend supports async operations for better concurrency
- Frontend uses debounced requests to avoid excessive API calls
- File processing is optimized for memory efficiency
- Results are cached for quick retrieval

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the API documentation at `http://localhost:8000/docs`
2. Review sample data and test cases
3. Check console logs for detailed error messages
4. Ensure file paths are correct and files are accessible

## Version History

### v2.0.0 (Current)
- Complete rewrite with React.js frontend
- FastAPI backend with async operations
- Modern UI with Tailwind CSS
- Enhanced analysis algorithms
- Run history and cloning features

### v1.0.0 (Original)
- Flask backend with HTML templates
- Basic file comparison functionality
- Simple UI with vanilla JavaScript