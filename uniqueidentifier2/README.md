# Unique Key Identifier

A file comparison and unique key identification system for CSV files.

## Prerequisites

- Python 3.7+
- Node.js 16+
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```bash
   python main.py
   ```

   The backend will start on `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Upload two CSV files for comparison
3. Select the number of columns to analyze
4. Click "Run Analysis"
5. View results in the Comparison tab

## Features

- File comparison with chunked processing
- Unique key identification
- Data quality checking
- Export results to CSV/Excel
- Pre-generated comparison files (10k records per chunk)
- Support for large files (millions of records)

