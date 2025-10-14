"""
Unique Key Identifier - Comprehensive REST API
Complete backend implementation for file comparison and unique key analysis
"""
from fastapi import FastAPI, HTTPException, Form, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import pandas as pd
import os
import threading
from datetime import datetime
from typing import Optional
import json
from pathlib import Path
import io
import csv

# Import local modules
from config import (
    SCRIPT_DIR, SUPPORTED_EXTENSIONS, MAX_ROWS_WARNING,
    MAX_ROWS_HARD_LIMIT, MAX_COMBINATIONS, MEMORY_EFFICIENT_THRESHOLD,
    LARGE_FILE_THRESHOLD, SAMPLE_SIZE_FOR_LARGE_FILES,
    SKIP_FILE_GENERATION_THRESHOLD, MAX_COMBINATIONS_TO_GENERATE
)
from database import conn, update_job_status, update_stage_status, create_tables
from file_processing import detect_delimiter, get_file_stats, estimate_processing_time, read_data_file
from analysis import analyze_file_combinations
from data_quality import perform_data_quality_check, perform_single_file_quality_check
from result_generator import (
    generate_analysis_csv, generate_analysis_excel,
    generate_unique_records, generate_duplicate_records, generate_comparison_file,
    get_result_file_path
)
from audit_logger import audit_logger
from scheduler import job_scheduler
from notifications import notification_manager
from run_comparison import run_comparator
from parallel_processor import process_large_files_parallel, ChunkedFileProcessor, ParallelComparator
from job_queue import job_queue, working_dir_manager, JobStatus
from export_manager import ExportManager
from file_comparison import compare_files_by_columns, get_comparison_data, generate_comparison_summary

app = FastAPI(
    title="Unique Key Identifier API",
    description="Enterprise REST API for CSV file comparison and unique key identification",
    version="2.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
create_tables()

# Job processing lock
job_lock = threading.Lock()


def process_analysis_job(run_id, file_a_path, file_b_path, num_columns, max_rows_limit=0, 
                         specified_combinations=None, excluded_combinations=None, 
                         working_directory=None, data_quality_check=False):
    """Background job to process file analysis"""
    try:
        # Pre-check file sizes
        row_count_a, size_a = get_file_stats(file_a_path)
        row_count_b, size_b = get_file_stats(file_b_path)
        max_rows_available = max(row_count_a, row_count_b)
        
        # Determine if user specified a row limit
        if max_rows_limit > 0:
            use_sampling = False
            rows_to_read = min(max_rows_limit, max_rows_available)
            read_mode = f"user-limited to {rows_to_read:,} rows"
        else:
            if max_rows_available > LARGE_FILE_THRESHOLD:
                use_sampling = True
                rows_to_read = None
                read_mode = f"intelligent-sampling ({SAMPLE_SIZE_FOR_LARGE_FILES:,} sample)"
            elif max_rows_available > MEMORY_EFFICIENT_THRESHOLD:
                use_sampling = True
                rows_to_read = None
                read_mode = "auto-sampling"
            else:
                use_sampling = False
                rows_to_read = None
                read_mode = "full"
        
        # Stage 1: Reading Files
        update_job_status(run_id, status='running', stage='reading_files', progress=10)
        update_stage_status(run_id, 'reading_files', 'in_progress', f'Loading data files ({read_mode})')
        
        if max_rows_limit > 0:
            df_a, delim_a = read_data_file(file_a_path, nrows=rows_to_read)
            df_b, delim_b = read_data_file(file_b_path, nrows=rows_to_read)
        else:
            df_a, delim_a = read_data_file(file_a_path, sample_for_large=use_sampling)
            df_b, delim_b = read_data_file(file_b_path, sample_for_large=use_sampling)
        
        actual_rows_a = len(df_a)
        actual_rows_b = len(df_b)
        
        update_stage_status(run_id, 'reading_files', 'completed', f'Loaded {len(df_a)} and {len(df_b)} rows')
        update_job_status(run_id, progress=20)
        
        # Stage 1.5: Data Quality Check (if enabled)
        quality_results = None
        if data_quality_check:
            update_job_status(run_id, stage='data_quality_check', progress=22)
            update_stage_status(run_id, 'data_quality_check', 'in_progress', 'Analyzing column patterns and data types')
            
            file_a_name = os.path.basename(file_a_path)
            file_b_name = os.path.basename(file_b_path)
            quality_results = perform_data_quality_check(df_a, df_b, file_a_name, file_b_name)
            
            # Store quality results in database
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO data_quality_results 
                (run_id, quality_summary, quality_data)
                VALUES (?, ?, ?)
            ''', (run_id, 
                  quality_results['summary']['status_message'], 
                  json.dumps(quality_results)))
            conn.commit()
            
            status_icon = "✅" if quality_results['summary']['status'] == 'pass' else "⚠️"
            update_stage_status(run_id, 'data_quality_check', 'completed', 
                              f"{status_icon} {quality_results['summary']['status_message']}")
            update_job_status(run_id, progress=25)
        
        # Stage 2: Validating Data
        update_job_status(run_id, stage='validating_data', progress=30)
        update_stage_status(run_id, 'validating_data', 'in_progress', 'Checking column structure')
        
        if list(df_a.columns) != list(df_b.columns):
            raise ValueError("Files have different columns")
        if num_columns > len(df_a.columns):
            raise ValueError(f"Number of columns ({num_columns}) exceeds available columns ({len(df_a.columns)})")
        
        update_stage_status(run_id, 'validating_data', 'completed', f'Validated {len(df_a.columns)} columns')
        update_job_status(run_id, progress=35)
        
        # Stage 3: Analyzing File A
        update_job_status(run_id, stage='analyzing_file_a', progress=35)
        update_stage_status(run_id, 'analyzing_file_a', 'in_progress', 'Processing combinations for File A')
        
        results_a = analyze_file_combinations(df_a, num_columns, specified_combinations, excluded_combinations)
        
        update_stage_status(run_id, 'analyzing_file_a', 'completed', f'Analyzed {len(results_a)} combinations')
        update_job_status(run_id, progress=55)
        
        # Stage 4: Analyzing File B
        update_job_status(run_id, stage='analyzing_file_b', progress=60)
        update_stage_status(run_id, 'analyzing_file_b', 'in_progress', 'Processing combinations for File B')
        
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
        traceback.print_exc()
        update_job_status(run_id, status='error', error=error_msg)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE job_stages SET status = 'error', details = ?
            WHERE run_id = ? AND status = 'in_progress'
        ''', (error_msg, run_id))
        conn.commit()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }


@app.get("/api/preview-columns")
async def preview_columns(
    file_a: str = Query(...),
    file_b: str = Query(...),
    working_directory: Optional[str] = Query(None),
    environment: Optional[str] = Query("default")
):
    """Preview columns and file information"""
    try:
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        work_dir = working_directory.strip() if working_directory else None
        
        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)
        
        # Determine base directory
        base_dir = work_dir if work_dir else SCRIPT_DIR
        
        if work_dir and not os.path.isdir(base_dir):
            return JSONResponse({"error": f"Directory not found: {base_dir}"}, status_code=400)
        
        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)
        
        if not os.path.exists(file_a_path):
            return JSONResponse({"error": f"File A not found: '{file_a_name}'"}, status_code=404)
        if not os.path.exists(file_b_path):
            return JSONResponse({"error": f"File B not found: '{file_b_name}'"}, status_code=404)
        
        # Read just the headers
        try:
            df_a, delim_a = read_data_file(file_a_path, nrows=5)
            df_b, delim_b = read_data_file(file_b_path, nrows=5)
        except pd.errors.EmptyDataError:
            return JSONResponse({"error": "One or both files are empty or invalid format"}, status_code=400)
        except Exception as csv_error:
            return JSONResponse({"error": f"Error reading data files: {str(csv_error)}"}, status_code=400)
        
        cols_a = df_a.columns.tolist()
        cols_b = df_b.columns.tolist()
        
        # Check if columns match
        if cols_a != cols_b:
            return JSONResponse({
                "error": f"Files have different column structures. File A has {len(cols_a)} columns, File B has {len(cols_b)} columns.",
                "columns_a": cols_a,
                "columns_b": cols_b
            }, status_code=400)
        
        # Get basic stats
        try:
            row_count_a, size_a = get_file_stats(file_a_path)
            row_count_b, size_b = get_file_stats(file_b_path)
        except Exception as count_error:
            return JSONResponse({"error": f"Error counting rows: {str(count_error)}"}, status_code=500)
        
        # Performance warnings
        warnings = []
        performance_level = "good"
        
        max_rows = max(row_count_a, row_count_b)
        if max_rows > MAX_ROWS_HARD_LIMIT:
            return JSONResponse({
                "error": f"Files too large! Maximum {MAX_ROWS_HARD_LIMIT:,} rows allowed. Your files have {max_rows:,} rows.",
                "file_a_rows": row_count_a,
                "file_b_rows": row_count_b
            }, status_code=400)
        elif max_rows > LARGE_FILE_THRESHOLD:
            warnings.append(f"Very large files detected ({max_rows:,} rows). Analysis will use intelligent sampling.")
            performance_level = "very_large"
        elif max_rows > MAX_ROWS_WARNING:
            warnings.append(f"Large files detected ({max_rows:,} rows). Analysis may take 2-5 minutes.")
            performance_level = "warning"
        elif max_rows > MEMORY_EFFICIENT_THRESHOLD:
            warnings.append(f"Medium-sized files ({max_rows:,} rows). Analysis will use sampling for efficiency.")
            performance_level = "medium"
        
        return JSONResponse({
            "columns": cols_a,
            "column_count": len(cols_a),
            "file_a_rows": row_count_a,
            "file_b_rows": row_count_b,
            "file_a_size_mb": round(size_a, 2) if size_a else None,
            "file_b_size_mb": round(size_b, 2) if size_b else None,
            "files_compatible": True,
            "warnings": warnings,
            "performance_level": performance_level,
            "estimated_time": estimate_processing_time(max_rows, len(cols_a))
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
    max_rows: int = Form(0),
    expected_combinations: str = Form(""),
    excluded_combinations: str = Form(""),
    working_directory: str = Form(""),
    data_quality_check: bool = Form(False),
    environment: str = Form("default")
):
    """Start async analysis job and return run_id"""
    try:
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        expected_combos = expected_combinations.strip() if expected_combinations else None
        excluded_combos = excluded_combinations.strip() if excluded_combinations else None
        work_dir = working_directory.strip() if working_directory else None

        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)

        # Determine base directory
        base_dir = work_dir if work_dir else SCRIPT_DIR
        
        if work_dir and not os.path.isdir(base_dir):
            return JSONResponse({"error": f"Directory not found: {base_dir}"}, status_code=400)

        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)

        if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
            return JSONResponse({"error": "One or both files not found"}, status_code=400)

        # Create new run record
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO runs (timestamp, file_a, file_b, num_columns, status, current_stage, progress_percent, started_at, working_directory, environment)
            VALUES (?, ?, ?, ?, 'queued', 'initializing', 0, ?, ?, ?)
        ''', (timestamp, file_a_name, file_b_name, num_columns, timestamp, work_dir, environment))
        run_id = cursor.lastrowid
        
        # Store run parameters
        cursor.execute('''
            INSERT OR REPLACE INTO run_parameters (run_id, max_rows, expected_combinations, excluded_combinations, working_directory, data_quality_check, environment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (run_id, max_rows, expected_combos or '', excluded_combos or '', work_dir or '', 1 if data_quality_check else 0, environment))
        conn.commit()
        
        # Create job stages - conditionally include data quality check
        stages = [
            ('reading_files', 1, 'pending'),
        ]
        
        if data_quality_check:
            stages.append(('data_quality_check', 2, 'pending'))
            stage_offset = 1
        else:
            stage_offset = 0
        
        stages.extend([
            ('validating_data', 2 + stage_offset, 'pending'),
            ('analyzing_file_a', 3 + stage_offset, 'pending'),
            ('analyzing_file_b', 4 + stage_offset, 'pending'),
            ('storing_results', 5 + stage_offset, 'pending'),
        ])
        
        for stage_name, order, status in stages:
            cursor.execute('''
                INSERT INTO job_stages (run_id, stage_name, stage_order, status)
                VALUES (?, ?, ?, ?)
            ''', (run_id, stage_name, order, status))
        
        conn.commit()
        
        # Parse combinations
        parsed_combinations = None
        if expected_combos:
            try:
                combo_list = []
                for line in expected_combos.split('\n'):
                    line = line.strip()
                    if not line:
                        continue
                    for combo_str in line.replace('|', ';').split(';'):
                        combo_str = combo_str.strip()
                        if combo_str:
                            cols = tuple([c.strip() for c in combo_str.split(',') if c.strip()])
                            if cols:
                                combo_list.append(cols)
                parsed_combinations = combo_list if combo_list else None
            except:
                pass
        
        parsed_exclusions = None
        if excluded_combos:
            try:
                exclusion_list = []
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
                pass
        
        # Start background processing
        thread = threading.Thread(target=process_analysis_job, 
                                 args=(run_id, file_a_path, file_b_path, num_columns, max_rows, parsed_combinations, parsed_exclusions, work_dir, data_quality_check))
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
        SELECT status, current_stage, progress_percent, error_message, file_a, file_b, num_columns, environment
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
        "environment": run_info[7],
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


@app.get("/api/runs")
async def get_runs(environment: Optional[str] = Query(None), limit: int = Query(50, le=200)):
    """Get list of all analysis runs"""
    cursor = conn.cursor()
    
    if environment:
        cursor.execute('''
            SELECT run_id, timestamp, file_a, file_b, num_columns, status, environment
            FROM runs WHERE environment = ?
            ORDER BY timestamp DESC LIMIT ?
        ''', (environment, limit))
    else:
        cursor.execute('''
            SELECT run_id, timestamp, file_a, file_b, num_columns, status, environment
            FROM runs
            ORDER BY timestamp DESC LIMIT ?
        ''', (limit,))
    
    runs = cursor.fetchall()
    return JSONResponse([{
        "id": r[0],
        "label": f"Run {r[0]} - {r[1]} (Files: {r[2]}, {r[3]}, Columns: {r[4]})",
        "timestamp": r[1],
        "file_a": r[2],
        "file_b": r[3],
        "num_columns": r[4],
        "status": r[5],
        "environment": r[6]
    } for r in runs])


@app.get("/api/run/{run_id}")
async def get_run_details(run_id: int):
    """Get detailed results for a specific run"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('''
        SELECT timestamp, file_a, file_b, num_columns, file_a_rows, file_b_rows, status, environment
        FROM runs WHERE run_id = ?
    ''', (run_id,))
    run_info = cursor.fetchone()
    
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Get results for both sides
    cursor.execute('''
        SELECT side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
        WHERE run_id = ?
        ORDER BY side, uniqueness_score DESC
    ''', (run_id,))
    results = cursor.fetchall()
    
    results_a = []
    results_b = []
    
    for r in results:
        result_obj = {
            'columns': r[1],
            'total_rows': r[2],
            'unique_rows': r[3],
            'duplicate_rows': r[4],
            'duplicate_count': r[5],
            'uniqueness_score': r[6],
            'is_unique_key': r[7] == 1
        }
        if r[0] == 'A':
            results_a.append(result_obj)
        else:
            results_b.append(result_obj)
    
    return JSONResponse({
        "run_id": run_id,
        "timestamp": run_info[0],
        "file_a": run_info[1],
        "file_b": run_info[2],
        "num_columns": run_info[3],
        "file_a_rows": run_info[4],
        "file_b_rows": run_info[5],
        "status": run_info[6],
        "environment": run_info[7],
        "results_a": results_a,
        "results_b": results_b,
        "summary": {
            "total_combinations": len(results_a),
            "unique_keys_a": len([r for r in results_a if r['is_unique_key']]),
            "unique_keys_b": len([r for r in results_b if r['is_unique_key']]),
            "best_score_a": results_a[0]['uniqueness_score'] if results_a else 0,
            "best_score_b": results_b[0]['uniqueness_score'] if results_b else 0
        }
    })


@app.get("/api/clone/{run_id}")
async def clone_run(run_id: int):
    """Get run configuration for cloning"""
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT file_a, file_b, num_columns, environment FROM runs WHERE run_id = ?
    ''', (run_id,))
    run_info = cursor.fetchone()
    
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    cursor.execute('''
        SELECT max_rows, expected_combinations, excluded_combinations, working_directory, data_quality_check
        FROM run_parameters WHERE run_id = ?
    ''', (run_id,))
    params = cursor.fetchone()
    
    return JSONResponse({
        "run_id": run_id,
        "file_a": run_info[0],
        "file_b": run_info[1],
        "num_columns": run_info[2],
        "environment": run_info[3],
        "max_rows": params[0] if params else 0,
        "expected_combinations": params[1] if params and params[1] else "",
        "excluded_combinations": params[2] if params and params[2] else "",
        "working_directory": params[3] if params and params[3] else "",
        "data_quality_check": params[4] if params and len(params) > 4 else 0
    })


@app.get("/api/download/{run_id}/csv")
async def download_csv(run_id: int):
    """Download analysis results as CSV"""
    cursor = conn.cursor()
    cursor.execute('SELECT file_a, file_b FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    cursor.execute('''
        SELECT side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
        WHERE run_id = ?
        ORDER BY side, uniqueness_score DESC
    ''', (run_id,))
    results = cursor.fetchall()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Side', 'Columns', 'Total Rows', 'Unique Rows', 'Duplicate Rows', 
                     'Duplicate Count', 'Uniqueness Score (%)', 'Is Unique Key'])
    
    for row in results:
        writer.writerow([
            row[0], row[1], row[2], row[3], row[4], row[5], row[6],
            'Yes' if row[7] == 1 else 'No'
        ])
    
    output.seek(0)
    filename = f"analysis_run_{run_id}_{run_info[0]}_{run_info[1]}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.get("/api/download/{run_id}/excel")
async def download_excel(run_id: int):
    """Download analysis results as Excel"""
    cursor = conn.cursor()
    cursor.execute('SELECT file_a, file_b, num_columns, timestamp FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    cursor.execute('''
        SELECT side, columns, total_rows, unique_rows, duplicate_rows, duplicate_count, uniqueness_score, is_unique_key
        FROM analysis_results
        WHERE run_id = ?
        ORDER BY side, uniqueness_score DESC
    ''', (run_id,))
    results = cursor.fetchall()
    
    df = pd.DataFrame(results, columns=['Side', 'Columns', 'Total Rows', 'Unique Rows', 
                                        'Duplicate Rows', 'Duplicate Count', 'Uniqueness Score (%)', 'Is Unique Key'])
    df['Is Unique Key'] = df['Is Unique Key'].map({1: 'Yes', 0: 'No'})
    
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


# Environment Management APIs
@app.get("/api/environments")
async def get_environments():
    """Get list of configured environments"""
    cursor = conn.cursor()
    cursor.execute('SELECT env_id, env_name, env_type, host, port, description FROM environments ORDER BY env_name')
    envs = cursor.fetchall()
    
    return JSONResponse([{
        "id": e[0],
        "name": e[1],
        "type": e[2],
        "host": e[3],
        "port": e[4],
        "description": e[5]
    } for e in envs])


@app.post("/api/environments")
async def create_environment(
    env_name: str = Form(...),
    env_type: str = Form(...),
    host: str = Form(""),
    port: int = Form(0),
    base_path: str = Form(""),
    description: str = Form("")
):
    """Create a new environment configuration"""
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        cursor.execute('''
            INSERT INTO environments (env_name, env_type, host, port, base_path, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (env_name, env_type, host, port, base_path, description, timestamp))
        conn.commit()
        
        return JSONResponse({"status": "success", "env_id": cursor.lastrowid})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/data-quality/{run_id}")
async def get_data_quality_results(run_id: int):
    """Get data quality results for a specific run"""
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT quality_summary, quality_data 
            FROM data_quality_results 
            WHERE run_id = ?
        ''', (run_id,))
        result = cursor.fetchone()
        
        if not result:
            return JSONResponse({"error": "No quality check data found for this run"}, status_code=404)
        
        import json
        quality_data = json.loads(result[1])
        return JSONResponse(quality_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error retrieving quality results: {str(e)}"}, status_code=500)


@app.get("/api/comparison/{run_id}/summary")
async def get_comparison_summary(run_id: int, columns: str = Query(...)):
    """Get comparison summary for specific columns"""
    try:
        # Get run info
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.file_a, r.file_b, COALESCE(rp.working_directory, r.working_directory, '') as work_dir
            FROM runs r
            LEFT JOIN run_parameters rp ON r.run_id = rp.run_id
            WHERE r.run_id = ?
        ''', (run_id,))
        run_info = cursor.fetchone()
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Run not found")
        
        file_a_name, file_b_name, work_dir = run_info
        
        # Determine file paths
        base_dir = work_dir if work_dir else SCRIPT_DIR
        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)
        
        # Read files
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [c.strip() for c in columns.split(',')]
        
        # Generate summary
        summary = generate_comparison_summary(df_a, df_b, column_list)
        summary['file_a'] = file_a_name
        summary['file_b'] = file_b_name
        
        return JSONResponse(summary)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error generating comparison: {str(e)}"}, status_code=500)


@app.get("/api/comparison/{run_id}/data")
async def get_comparison_data_api(
    run_id: int,
    columns: str = Query(...),
    category: str = Query(...),  # matched, only_a, only_b
    offset: int = Query(0),
    limit: int = Query(100)
):
    """Get paginated comparison data"""
    try:
        # Get run info
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.file_a, r.file_b, COALESCE(rp.working_directory, r.working_directory, '') as work_dir
            FROM runs r
            LEFT JOIN run_parameters rp ON r.run_id = rp.run_id
            WHERE r.run_id = ?
        ''', (run_id,))
        run_info = cursor.fetchone()
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Run not found")
        
        file_a_name, file_b_name, work_dir = run_info
        
        # Determine file paths
        base_dir = work_dir if work_dir else SCRIPT_DIR
        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)
        
        # Read files
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [c.strip() for c in columns.split(',')]
        
        # Compare files
        comparison_result = compare_files_by_columns(df_a, df_b, column_list)
        
        # Get paginated data
        data = get_comparison_data(comparison_result, category, offset, limit)
        
        return JSONResponse(data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error fetching comparison data: {str(e)}"}, status_code=500)


@app.get("/api/download/{run_id}/comparison")
async def download_comparison(run_id: int, columns: str = Query(...)):
    """Download file comparison data as Excel"""
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.file_a, r.file_b, rp.working_directory 
            FROM runs r
            LEFT JOIN run_parameters rp ON r.run_id = rp.run_id
            WHERE r.run_id = ?
        ''', (run_id,))
        run_info = cursor.fetchone()
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Run not found")
        
        file_a_name, file_b_name, work_dir = run_info
        
        # Read files
        base_dir = work_dir if work_dir else SCRIPT_DIR
        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)
        
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [c.strip() for c in columns.split(',')]
        
        # Compare files
        comparison_result = compare_files_by_columns(df_a, df_b, column_list)
        
        # Create Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Summary sheet
            summary_df = pd.DataFrame({
                'Metric': ['Match Rate', 'Matched Count', 'Only in A', 'Only in B', 'Total A', 'Total B'],
                'Value': [
                    f"{comparison_result['match_rate']}%",
                    comparison_result['matched_count'],
                    comparison_result['only_a_count'],
                    comparison_result['only_b_count'],
                    comparison_result['total_a'],
                    comparison_result['total_b']
                ]
            })
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Matched records
            if comparison_result['matched_keys']:
                matched_df = comparison_result['df_a_with_key'][
                    comparison_result['df_a_with_key']['_key'].isin(comparison_result['matched_keys'])
                ].drop(columns=['_key'])
                matched_df.to_excel(writer, sheet_name='Matched', index=False)
            
            # Only in A
            if comparison_result['only_a_keys']:
                only_a_df = comparison_result['df_a_with_key'][
                    comparison_result['df_a_with_key']['_key'].isin(comparison_result['only_a_keys'])
                ].drop(columns=['_key'])
                only_a_df.to_excel(writer, sheet_name='Only in A', index=False)
            
            # Only in B
            if comparison_result['only_b_keys']:
                only_b_df = comparison_result['df_b_with_key'][
                    comparison_result['df_b_with_key']['_key'].isin(comparison_result['only_b_keys'])
                ].drop(columns=['_key'])
                only_b_df.to_excel(writer, sheet_name='Only in B', index=False)
        
        output.seek(0)
        filename = f"comparison_run_{run_id}_{columns.replace(',', '_')}.xlsx"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error generating download: {str(e)}"}, status_code=500)


@app.on_event("startup")
async def startup_event():
    """Initialize enterprise features on startup"""
    print("=" * 60)
    print("🚀 Unique Key Identifier API v2.0 - Enterprise Edition")
    print("=" * 60)
    print("✅ Database initialized")
    print("🌐 CORS enabled for React frontend")
    print("📊 Ready to process analysis requests")
    print("🔧 Enterprise features loaded:")
    print("   - Data Quality Checking")
    print("   - File Comparison & Downloads")
    print("   - Result File Generation")
    print("   - Audit Logging")
    print("   - Job Scheduling")
    print("   - Notifications")
    print("   - Run Comparison")
    print("   - Parallel Processing")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\n🛑 Shutting down...")
    print("✅ Graceful shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
