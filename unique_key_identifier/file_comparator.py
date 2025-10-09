from fastapi import FastAPI, Form, HTTPException, Request, BackgroundTasks, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
import pandas as pd
import sqlite3
from itertools import combinations
import os
from datetime import datetime
import uvicorn
import threading
import time
import io
import csv

app = FastAPI()
script_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(script_dir, "templates"))

# SQLite connection
db_path = os.path.join(script_dir, "file_comparison.db")
conn = sqlite3.connect(db_path, check_same_thread=False)

def create_tables():
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            run_id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            file_a TEXT,
            file_b TEXT,
            num_columns INTEGER,
            file_a_rows INTEGER,
            file_b_rows INTEGER,
            status TEXT DEFAULT 'pending',
            current_stage TEXT DEFAULT 'initializing',
            progress_percent INTEGER DEFAULT 0,
            started_at TEXT,
            completed_at TEXT,
            error_message TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS job_stages (
            stage_id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER,
            stage_name TEXT,
            stage_order INTEGER,
            status TEXT DEFAULT 'pending',
            started_at TEXT,
            completed_at TEXT,
            details TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analysis_results (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            total_rows INTEGER,
            unique_rows INTEGER,
            duplicate_rows INTEGER,
            duplicate_count INTEGER,
            uniqueness_score REAL,
            is_unique_key INTEGER,
            UNIQUE(run_id, side, columns),
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS duplicate_samples (
            run_id INTEGER,
            side TEXT,
            columns TEXT,
            duplicate_value TEXT,
            occurrence_count INTEGER,
            FOREIGN KEY (run_id) REFERENCES runs(run_id)
        )
    ''')
    conn.commit()

# Initialize database
create_tables()

# Job processing lock
job_lock = threading.Lock()

def update_job_status(run_id, status=None, stage=None, progress=None, error=None):
    """Update job status in database"""
    cursor = conn.cursor()
    updates = []
    values = []
    
    if status:
        updates.append("status = ?")
        values.append(status)
    if stage:
        updates.append("current_stage = ?")
        values.append(stage)
    if progress is not None:
        updates.append("progress_percent = ?")
        values.append(progress)
    if error:
        updates.append("error_message = ?")
        values.append(error)
    if status == 'completed':
        updates.append("completed_at = ?")
        values.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    if updates:
        values.append(run_id)
        cursor.execute(f"UPDATE runs SET {', '.join(updates)} WHERE run_id = ?", values)
        conn.commit()

def update_stage_status(run_id, stage_name, status, details=None):
    """Update individual stage status"""
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if status == 'in_progress':
        cursor.execute('''
            UPDATE job_stages SET status = ?, started_at = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, timestamp, details, run_id, stage_name))
    elif status == 'completed':
        cursor.execute('''
            UPDATE job_stages SET status = ?, completed_at = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, timestamp, details, run_id, stage_name))
    elif status == 'error':
        cursor.execute('''
            UPDATE job_stages SET status = ?, details = ?
            WHERE run_id = ? AND stage_name = ?
        ''', (status, details, run_id, stage_name))
    
    conn.commit()

def process_analysis_job(run_id, file_a_path, file_b_path, num_columns, specified_combinations=None, excluded_combinations=None):
    """Background job to process file analysis"""
    try:
        # Stage 1: Reading Files
        update_job_status(run_id, status='running', stage='reading_files', progress=10)
        update_stage_status(run_id, 'reading_files', 'in_progress', 'Loading CSV files from disk')
        
        df_a = pd.read_csv(file_a_path)
        df_b = pd.read_csv(file_b_path)
        
        update_stage_status(run_id, 'reading_files', 'completed', f'Loaded {len(df_a)} and {len(df_b)} rows')
        update_job_status(run_id, progress=20)
        
        # Stage 2: Validating Data
        update_job_status(run_id, stage='validating_data', progress=25)
        mode_msg = 'User-specified combinations' if specified_combinations else 'Smart auto-discovery mode'
        if excluded_combinations:
            exclude_msg = f' | Excluding {len(excluded_combinations)} items'
        else:
            exclude_msg = ''
        update_stage_status(run_id, 'validating_data', 'in_progress', f'Checking column structure | {mode_msg}{exclude_msg}')
        
        if list(df_a.columns) != list(df_b.columns):
            raise ValueError("Files have different columns")
        if num_columns > len(df_a.columns):
            raise ValueError(f"Number of columns ({num_columns}) exceeds available columns ({len(df_a.columns)})")
        
        combo_info = f'Using {len(specified_combinations)} specified combinations' if specified_combinations else 'Auto-discovering best combinations (max 50)'
        if excluded_combinations:
            combo_info += f' | Excluded {len(excluded_combinations)} items'
        update_stage_status(run_id, 'validating_data', 'completed', f'Validated {len(df_a.columns)} columns | {combo_info}')
        update_job_status(run_id, progress=30)
        
        # Stage 3: Analyzing File A
        update_job_status(run_id, stage='analyzing_file_a', progress=35)
        update_stage_status(run_id, 'analyzing_file_a', 'in_progress', f'Processing combinations for File A')
        
        results_a = analyze_file_combinations(df_a, num_columns, specified_combinations, excluded_combinations)
        
        update_stage_status(run_id, 'analyzing_file_a', 'completed', f'Analyzed {len(results_a)} combinations')
        update_job_status(run_id, progress=55)
        
        # Stage 4: Analyzing File B
        update_job_status(run_id, stage='analyzing_file_b', progress=60)
        update_stage_status(run_id, 'analyzing_file_b', 'in_progress', f'Processing combinations for File B')
        
        results_b = analyze_file_combinations(df_b, num_columns, specified_combinations, excluded_combinations)
        
        update_stage_status(run_id, 'analyzing_file_b', 'completed', f'Analyzed {len(results_b)} combinations')
        update_job_status(run_id, progress=80)
        
        # Stage 5: Storing Results
        update_job_status(run_id, stage='storing_results', progress=85)
        update_stage_status(run_id, 'storing_results', 'in_progress', 'Saving analysis to database')
        
        cursor = conn.cursor()
        
        # Update run with row counts
        cursor.execute('''
            UPDATE runs SET file_a_rows = ?, file_b_rows = ?
            WHERE run_id = ?
        ''', (len(df_a), len(df_b), run_id))
        
        # Store results for File A
        for result in results_a:
            cursor.execute('''
                INSERT OR REPLACE INTO analysis_results 
                (run_id, side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (run_id, 'A', result['columns'], result['total_rows'], result['unique_rows'], 
                  result['duplicate_rows'], result['duplicate_count'], result['uniqueness_score'], result['is_unique_key']))
            
            for dup in result['top_duplicates'][:5]:
                dup_value = str({k: v for k, v in dup.items() if k != 'count'})
                cursor.execute('''
                    INSERT INTO duplicate_samples (run_id, side, columns, duplicate_value, occurrence_count)
                    VALUES (?, ?, ?, ?, ?)
                ''', (run_id, 'A', result['columns'], dup_value, dup['count']))
        
        # Store results for File B
        for result in results_b:
            cursor.execute('''
                INSERT OR REPLACE INTO analysis_results 
                (run_id, side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (run_id, 'B', result['columns'], result['total_rows'], result['unique_rows'], 
                  result['duplicate_rows'], result['duplicate_count'], result['uniqueness_score'], result['is_unique_key']))
            
            for dup in result['top_duplicates'][:5]:
                dup_value = str({k: v for k, v in dup.items() if k != 'count'})
                cursor.execute('''
                    INSERT INTO duplicate_samples (run_id, side, columns, duplicate_value, occurrence_count)
                    VALUES (?, ?, ?, ?, ?)
                ''', (run_id, 'B', result['columns'], dup_value, dup['count']))
        
        conn.commit()
        
        update_stage_status(run_id, 'storing_results', 'completed', f'Saved {len(results_a) + len(results_b)} results')
        update_job_status(run_id, status='completed', stage='completed', progress=100)
        
    except Exception as e:
        error_msg = str(e)
        import traceback
        traceback.print_exc()  # Print full error to console
        update_job_status(run_id, status='error', error=error_msg)
        # Update the current stage to error status
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE job_stages SET status = 'error', details = ?
            WHERE run_id = ? AND status = 'in_progress'
        ''', (error_msg, run_id))
        conn.commit()

def smart_discover_combinations(df, num_columns, max_combinations=50, excluded_combinations=None):
    """Intelligently discover the best column combinations to analyze"""
    columns = df.columns.tolist()
    total_rows = len(df)
    
    # Filter out excluded columns
    excluded_cols = set()
    excluded_combos = set()
    if excluded_combinations:
        for exc in excluded_combinations:
            if len(exc) == 1:
                # Single column exclusion
                excluded_cols.add(exc[0])
            else:
                # Combination exclusion
                excluded_combos.add(tuple(sorted(exc)))
    
    # Remove excluded single columns from consideration
    columns = [col for col in columns if col not in excluded_cols]
    
    if not columns:
        return []  # All columns excluded
    
    # Strategy 1: Single columns with high cardinality (likely unique)
    single_col_candidates = []
    for col in columns:
        nunique = df[col].nunique()
        cardinality_ratio = nunique / total_rows
        if cardinality_ratio >= 0.8:  # At least 80% unique
            single_col_candidates.append((col, cardinality_ratio))
    
    # Sort by cardinality
    single_col_candidates.sort(key=lambda x: -x[1])
    
    # Strategy 2: ID-like columns (contains 'id', 'code', 'number')
    id_columns = [col for col in columns if any(keyword in col.lower() 
                  for keyword in ['id', 'code', 'number', 'key', 'identifier'])]
    
    # Strategy 3: If user wants specific column count, prioritize combinations with ID columns
    selected_combos = []
    
    # Add top single ID columns
    for col in id_columns[:5]:
        if col in columns:
            selected_combos.append((col,))
    
    # Add top single high-cardinality columns
    for col, ratio in single_col_candidates[:5]:
        if (col,) not in selected_combos:
            selected_combos.append((col,))
    
    # For 2+ columns, combine ID columns with other significant columns
    if num_columns >= 2:
        for id_col in id_columns[:3]:
            for other_col in columns:
                if other_col != id_col and len(selected_combos) < max_combinations:
                    combo = tuple(sorted([id_col, other_col]))
                    if combo not in selected_combos and len(combo) == num_columns:
                        selected_combos.append(combo)
        
        # Add high-cardinality combinations
        for i, (col1, _) in enumerate(single_col_candidates[:5]):
            for col2, _ in single_col_candidates[i+1:5]:
                combo = tuple(sorted([col1, col2]))
                if combo not in selected_combos and len(combo) == num_columns and len(selected_combos) < max_combinations:
                    selected_combos.append(combo)
    
    # If still under max, add more combinations systematically
    if len(selected_combos) < max_combinations:
        all_combos = list(combinations(columns, num_columns))
        for combo in all_combos:
            if combo not in selected_combos:
                selected_combos.append(combo)
                if len(selected_combos) >= max_combinations:
                    break
    
    # Filter out explicitly excluded combinations
    if excluded_combos:
        filtered_combos = []
        for combo in selected_combos:
            sorted_combo = tuple(sorted(combo))
            # Check if this combination is excluded
            is_excluded = sorted_combo in excluded_combos
            # Also check if any column in the combo is in an excluded combination
            if not is_excluded:
                for exc_combo in excluded_combos:
                    if len(exc_combo) == len(combo) and all(c in combo for c in exc_combo):
                        is_excluded = True
                        break
            if not is_excluded:
                filtered_combos.append(combo)
        selected_combos = filtered_combos
    
    return selected_combos[:max_combinations]

def analyze_file_combinations(df, num_columns, specified_combinations=None, excluded_combinations=None):
    """Analyze all column combinations for a single file - OPTIMIZED VERSION"""
    results = []
    columns = df.columns.tolist()
    total_rows = len(df)
    
    # Optimize: Convert to categorical if beneficial
    for col in columns:
        if df[col].dtype == 'object' and df[col].nunique() / len(df) < 0.5:
            df[col] = df[col].astype('category')
    
    # Determine which combinations to analyze
    if specified_combinations:
        # Use user-specified combinations
        combos_to_analyze = specified_combinations
    else:
        # Smart auto-discovery: limit to top 50 most promising combinations
        combos_to_analyze = smart_discover_combinations(df, num_columns, max_combinations=50, excluded_combinations=excluded_combinations)
    
    for combo in combos_to_analyze:
        combo_str = ','.join(combo)
        combo_list = list(combo)
        
        # OPTIMIZATION 1: Use value_counts instead of groupby for better performance
        # This is faster for counting occurrences
        if len(combo_list) == 1:
            # Single column - use value_counts (fastest)
            counts = df[combo_list[0]].value_counts()
            unique_rows = len(counts)
            duplicate_mask = counts > 1
            duplicate_count = counts[duplicate_mask].sum() if duplicate_mask.any() else 0
            duplicate_rows = duplicate_count - duplicate_mask.sum() if duplicate_mask.any() else 0
            
            # Top duplicates
            top_duplicates = []
            if duplicate_mask.any():
                top_dup_counts = counts[duplicate_mask].nlargest(5)
                top_duplicates = [
                    {combo_list[0]: idx, 'count': int(val)} 
                    for idx, val in top_dup_counts.items()
                ]
        else:
            # OPTIMIZATION 2: Use groupby with sort=False for multi-column (faster)
            grouped = df.groupby(combo_list, sort=False, observed=True).size()
            
            unique_rows = len(grouped)
            duplicate_mask = grouped > 1
            duplicate_count = grouped[duplicate_mask].sum() if duplicate_mask.any() else 0
            duplicate_rows = duplicate_count - duplicate_mask.sum() if duplicate_mask.any() else 0
            
            # Top duplicates
            top_duplicates = []
            if duplicate_mask.any():
                top_dup = grouped[duplicate_mask].nlargest(5)
                top_duplicates = [
                    {**dict(zip(combo_list, idx if isinstance(idx, tuple) else (idx,))), 'count': int(val)}
                    for idx, val in top_dup.items()
                ]
        
        # Calculate uniqueness score (0-100%)
        uniqueness_score = (unique_rows / total_rows) * 100 if total_rows > 0 else 0
        is_unique_key = 1 if unique_rows == total_rows else 0
        
        results.append({
            'columns': combo_str,
            'total_rows': total_rows,
            'unique_rows': unique_rows,
            'duplicate_rows': duplicate_rows,
            'duplicate_count': int(duplicate_count),
            'uniqueness_score': round(uniqueness_score, 2),
            'is_unique_key': is_unique_key,
            'top_duplicates': top_duplicates
        })
    
    # Sort by uniqueness score (descending) then by duplicate count (ascending)
    results.sort(key=lambda x: (-x['uniqueness_score'], x['duplicate_count']))
    
    return results

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    cursor = conn.cursor()
    cursor.execute("SELECT run_id, timestamp, file_a, file_b, num_columns FROM runs ORDER BY timestamp DESC")
    runs = cursor.fetchall()
    run_list = [{"id": r[0], "label": f"Run {r[0]} - {r[1]} (Files: {r[2]}, {r[3]}, Columns: {r[4]})"} for r in runs]
    return templates.TemplateResponse("index_modern.html", {"request": request, "runs": run_list})

@app.get("/api/preview-columns")
async def preview_columns(file_a: str, file_b: str):
    """Preview columns from both files before analysis"""
    try:
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        
        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)
        
        file_a_path = os.path.join(script_dir, file_a_name)
        file_b_path = os.path.join(script_dir, file_b_name)
        
        if not os.path.exists(file_a_path):
            return JSONResponse({"error": f"❌ File A not found: '{file_a_name}'. Please ensure the file is in the unique_key_identifier folder."}, status_code=404)
        if not os.path.exists(file_b_path):
            return JSONResponse({"error": f"❌ File B not found: '{file_b_name}'. Please ensure the file is in the unique_key_identifier folder."}, status_code=404)
        
        # Read just the headers (nrows=0 for fast loading)
        try:
            df_a = pd.read_csv(file_a_path, nrows=5)
            df_b = pd.read_csv(file_b_path, nrows=5)
        except pd.errors.EmptyDataError:
            return JSONResponse({"error": "One or both files are empty or invalid CSV format"}, status_code=400)
        except Exception as csv_error:
            return JSONResponse({"error": f"Error reading CSV files: {str(csv_error)}"}, status_code=400)
        
        cols_a = df_a.columns.tolist()
        cols_b = df_b.columns.tolist()
        
        # Check if columns match
        if cols_a != cols_b:
            return JSONResponse({
                "error": f"❌ Files have different column structures. File A has {len(cols_a)} columns, File B has {len(cols_b)} columns.",
                "columns_a": cols_a,
                "columns_b": cols_b
            }, status_code=400)
        
        # Get basic stats
        try:
            row_count_a = len(pd.read_csv(file_a_path))
            row_count_b = len(pd.read_csv(file_b_path))
        except Exception as count_error:
            return JSONResponse({"error": f"Error counting rows: {str(count_error)}"}, status_code=500)
        
        return JSONResponse({
            "columns": cols_a,
            "column_count": len(cols_a),
            "file_a_rows": row_count_a,
            "file_b_rows": row_count_b,
            "files_compatible": True
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Unexpected error: {str(e)}"}, status_code=500)

@app.post("/compare")
async def compare_files(
    file_a: str = Form(...), 
    file_b: str = Form(...), 
    num_columns: int = Form(...),
    expected_combinations: str = Form(None),
    excluded_combinations: str = Form(None)
):
    """Start async analysis job and return run_id"""
    try:
        import traceback
        
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        expected_combos = expected_combinations.strip() if expected_combinations else None
        excluded_combos = excluded_combinations.strip() if excluded_combinations else None

        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)

        file_a_path = os.path.join(script_dir, file_a_name)
        file_b_path = os.path.join(script_dir, file_b_name)

        if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
            return JSONResponse({"error": "One or both files not found in unique_key_identifier directory"}, status_code=400)

        # Create new run record
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO runs (timestamp, file_a, file_b, num_columns, status, current_stage, progress_percent, started_at)
            VALUES (?, ?, ?, ?, 'queued', 'initializing', 0, ?)
        ''', (timestamp, file_a_name, file_b_name, num_columns, timestamp))
        run_id = cursor.lastrowid
        
        # Create job stages
        stages = [
            ('reading_files', 1, 'pending'),
            ('validating_data', 2, 'pending'),
            ('analyzing_file_a', 3, 'pending'),
            ('analyzing_file_b', 4, 'pending'),
            ('storing_results', 5, 'pending')
        ]
        
        for stage_name, order, status in stages:
            cursor.execute('''
                INSERT INTO job_stages (run_id, stage_name, stage_order, status)
                VALUES (?, ?, ?, ?)
            ''', (run_id, stage_name, order, status))
        
        conn.commit()
        
        # Parse expected combinations if provided
        parsed_combinations = None
        if expected_combos:
            try:
                # Format: "col1,col2;col3,col4" or "col1,col2|col3,col4" or newline-separated
                combo_list = []
                # First split by newlines to handle line-by-line format
                for line in expected_combos.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    # Then split by ; or | for multi-combination lines
                    for combo_str in line.replace('|', ';').split(';'):
                        combo_str = combo_str.strip()
                        if combo_str:
                            # Split by comma for multi-column combinations
                            cols = tuple([c.strip() for c in combo_str.split(',') if c.strip()])
                            if cols:
                                combo_list.append(cols)
                parsed_combinations = combo_list if combo_list else None
            except:
                pass  # If parsing fails, use auto-discovery
        
        # Parse excluded combinations/columns if provided
        parsed_exclusions = None
        if excluded_combos:
            try:
                exclusion_list = []
                # Parse excluded items - can be single columns or combinations
                for line in excluded_combos.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    for combo_str in line.replace('|', ';').split(';'):
                        combo_str = combo_str.strip()
                        if combo_str:
                            cols = tuple([c.strip() for c in combo_str.split(',') if c.strip()])
                            if cols:
                                exclusion_list.append(cols)
                parsed_exclusions = exclusion_list if exclusion_list else None
            except:
                pass  # If parsing fails, ignore exclusions
        
        # Start background processing
        thread = threading.Thread(target=process_analysis_job, 
                                 args=(run_id, file_a_path, file_b_path, num_columns, parsed_combinations, parsed_exclusions))
        thread.daemon = True
        thread.start()
        
        return JSONResponse({"run_id": run_id, "status": "queued"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Server error: {str(e)}"}, status_code=500)

@app.get("/api/status/{run_id}")
async def get_job_status(run_id: int):
    """Get current job status for polling"""
    cursor = conn.cursor()
    cursor.execute('''
        SELECT status, current_stage, progress_percent, error_message, file_a, file_b, num_columns
        FROM runs WHERE run_id = ?
    ''', (run_id,))
    run_info = cursor.fetchone()
    
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get stage details
    cursor.execute('''
        SELECT stage_name, stage_order, status, details, started_at, completed_at
        FROM job_stages 
        WHERE run_id = ?
        ORDER BY stage_order
    ''', (run_id,))
    stages = cursor.fetchall()
    
    return JSONResponse({
        "run_id": run_id,
        "status": run_info[0],
        "current_stage": run_info[1],
        "progress": run_info[2],
        "error": run_info[3],
        "file_a": run_info[4],
        "file_b": run_info[5],
        "num_columns": run_info[6],
        "stages": [
            {
                "name": s[0],
                "order": s[1],
                "status": s[2],
                "details": s[3],
                "started_at": s[4],
                "completed_at": s[5]
            }
            for s in stages
        ]
    })

@app.get("/workflow/{run_id}", response_class=HTMLResponse)
async def workflow_status(request: Request, run_id: int):
    """Workflow status page with auto-refresh"""
    cursor = conn.cursor()
    cursor.execute('''
        SELECT timestamp, file_a, file_b, num_columns, status, current_stage, progress_percent, error_message
        FROM runs WHERE run_id = ?
    ''', (run_id,))
    run_info = cursor.fetchone()
    
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get all runs for dropdown
    cursor.execute("SELECT run_id, timestamp, file_a, file_b, num_columns FROM runs ORDER BY timestamp DESC")
    runs = cursor.fetchall()
    run_list = [{"id": r[0], "label": f"Run {r[0]} - {r[1]} (Files: {r[2]}, {r[3]}, Columns: {r[4]})"} for r in runs]
    
    return templates.TemplateResponse("workflow.html", {
        "request": request,
        "run_id": run_id,
        "timestamp": run_info[0],
        "file_a": run_info[1],
        "file_b": run_info[2],
        "num_columns": run_info[3],
        "status": run_info[4],
        "current_stage": run_info[5],
        "progress": run_info[6],
        "error": run_info[7],
        "runs": run_list
    })

@app.get("/download/{run_id}/csv")
async def download_results_csv(run_id: int):
    """Download analysis results as CSV"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, num_columns FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get analysis results
    cursor.execute('''
        SELECT side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
        WHERE run_id = ?
        ORDER BY side, uniqueness_score DESC
    ''', (run_id,))
    results = cursor.fetchall()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['Side', 'Columns', 'Total Rows', 'Unique Rows', 'Duplicate Rows', 
                     'Duplicate Count', 'Uniqueness Score (%)', 'Is Unique Key'])
    
    # Write data
    for row in results:
        writer.writerow([
            row[0], row[1], row[2], row[3], row[4], row[5], row[6],
            'Yes' if row[7] == 1 else 'No'
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"analysis_run_{run_id}_{run_info[0]}_{run_info[1]}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/download/{run_id}/excel")
async def download_results_excel(run_id: int):
    """Download analysis results as Excel"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, num_columns, timestamp FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get analysis results for both sides
    cursor.execute('''
        SELECT side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
        WHERE run_id = ?
        ORDER BY side, uniqueness_score DESC
    ''', (run_id,))
    results = cursor.fetchall()
    
    # Create DataFrame
    df = pd.DataFrame(results, columns=['Side', 'Columns', 'Total Rows', 'Unique Rows', 
                                        'Duplicate Rows', 'Duplicate Count', 'Uniqueness Score (%)', 'Is Unique Key'])
    df['Is Unique Key'] = df['Is Unique Key'].map({1: 'Yes', 0: 'No'})
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        # Summary sheet
        summary_df = pd.DataFrame({
            'Run ID': [run_id],
            'Timestamp': [run_info[3]],
            'File A': [run_info[0]],
            'File B': [run_info[1]],
            'Columns Analyzed': [run_info[2]]
        })
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Results sheet
        df.to_excel(writer, sheet_name='Results', index=False)
        
        # Side A only
        df_a = df[df['Side'] == 'A'].copy()
        if not df_a.empty:
            df_a.to_excel(writer, sheet_name='Side A', index=False)
        
        # Side B only
        df_b = df[df['Side'] == 'B'].copy()
        if not df_b.empty:
            df_b.to_excel(writer, sheet_name='Side B', index=False)
    
    output.seek(0)
    filename = f"analysis_run_{run_id}_{run_info[0]}_{run_info[1]}.xlsx"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/run/{run_id}", response_class=HTMLResponse)
async def get_run(request: Request, run_id: int, group: int = Query(None), page: int = Query(1, ge=1), per_page: int = Query(50, ge=10, le=500)):
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT timestamp, file_a, file_b, num_columns, file_a_rows, file_b_rows
            FROM runs
            WHERE run_id = ?
        ''', (run_id,))
        run_info = cursor.fetchone()

        if not run_info:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

        # Try to load the files to get column names
        file_a_path = os.path.join(script_dir, run_info[1])
        columns_list = []
        try:
            if os.path.exists(file_a_path):
                df_temp = pd.read_csv(file_a_path, nrows=0)
                columns_list = df_temp.columns.tolist()
        except:
            pass

        # Get all results and group by combination size
        cursor.execute('''
            SELECT columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
            FROM analysis_results
            WHERE run_id = ? AND side = 'A'
            ORDER BY uniqueness_score DESC, duplicate_count ASC
        ''', (run_id,))
        all_results_a = cursor.fetchall()
        
        cursor.execute('''
            SELECT columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
            FROM analysis_results
            WHERE run_id = ? AND side = 'B'
            ORDER BY uniqueness_score DESC, duplicate_count ASC
        ''', (run_id,))
        all_results_b = cursor.fetchall()
        
        # Check if results exist - if not, redirect to workflow page
        if not all_results_a and not all_results_b:
            # Check run status
            cursor.execute('SELECT status, error_message FROM runs WHERE run_id = ?', (run_id,))
            status_info = cursor.fetchone()
            if status_info:
                status, error = status_info
                if status in ['queued', 'running']:
                    # Still processing - redirect to workflow page
                    from fastapi.responses import RedirectResponse
                    return RedirectResponse(url=f"/workflow/{run_id}", status_code=303)
                elif status == 'failed':
                    raise HTTPException(status_code=500, detail=f"Analysis failed: {error or 'Unknown error'}")
            raise HTTPException(status_code=404, detail="No analysis results found for this run")
        
        # Group by combination size
        def group_by_combo_size(results):
            grouped = {}
            for r in results:
                combo_size = len(r[0].split(','))
                if combo_size not in grouped:
                    grouped[combo_size] = []
                grouped[combo_size].append({
                    'columns': r[0],
                    'total_rows': r[1],
                    'unique_rows': r[2],
                    'duplicate_rows': r[3],
                    'duplicate_count': r[4],
                    'uniqueness_score': r[5],
                    'is_unique_key': r[6]
                })
            return dict(sorted(grouped.items()))
        
        grouped_a = group_by_combo_size(all_results_a)
        grouped_b = group_by_combo_size(all_results_b)
        
        # If specific group requested, paginate within that group
        if group is not None and group in grouped_a:
            offset = (page - 1) * per_page
            results_a_group = grouped_a[group][offset:offset + per_page]
            results_b_group = grouped_b.get(group, [])[offset:offset + per_page]
            total_in_group_a = len(grouped_a[group])
            total_in_group_b = len(grouped_b.get(group, []))
        else:
            # Show all groups with limited results per group (first 10 of each)
            results_a_group = None
            results_b_group = None
            total_in_group_a = 0
            total_in_group_b = 0
        
        # Calculate group statistics
        group_stats = []
        for combo_size in sorted(set(list(grouped_a.keys()) + list(grouped_b.keys()))):
            count_a = len(grouped_a.get(combo_size, []))
            count_b = len(grouped_b.get(combo_size, []))
            unique_a = sum(1 for r in grouped_a.get(combo_size, []) if r['is_unique_key'] == 1)
            unique_b = sum(1 for r in grouped_b.get(combo_size, []) if r['is_unique_key'] == 1)
            group_stats.append({
                'size': combo_size,
                'count_a': count_a,
                'count_b': count_b,
                'unique_keys_a': unique_a,
                'unique_keys_b': unique_b
            })
        
        cursor.execute("SELECT run_id, timestamp, file_a, file_b, num_columns FROM runs ORDER BY timestamp DESC")
        runs = cursor.fetchall()
        run_list = [{"id": r[0], "label": f"Run {r[0]} - {r[1]} (Files: {r[2]}, {r[3]}, Columns: {r[4]})"} for r in runs]

        return templates.TemplateResponse("results.html", {
            "request": request,
            "runs": run_list,
            "run_id": run_id,
            "timestamp": run_info[0],
            "file_a": run_info[1],
            "file_b": run_info[2],
            "file_a_rows": run_info[4],
            "file_b_rows": run_info[5],
            "num_columns": run_info[3],
            "columns": columns_list,
            "grouped_a": grouped_a,
            "grouped_b": grouped_b,
            "group_stats": group_stats,
            "current_group": group,
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_in_group_a": total_in_group_a,
                "total_in_group_b": total_in_group_b,
                "total_pages": ((max(total_in_group_a, total_in_group_b) + per_page - 1) // per_page) if group else 0,
                "has_prev": page > 1,
                "has_next": page < ((max(total_in_group_a, total_in_group_b) + per_page - 1) // per_page) if group else False
            } if group else None
        })

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e) if str(e) else repr(e)
        raise HTTPException(status_code=500, detail=f"An error occurred: {error_msg}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

