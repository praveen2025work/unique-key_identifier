"""
File Comparator - Main Application
Refactored with modular design for better maintainability
"""
from fastapi import FastAPI, Form, HTTPException, Request, BackgroundTasks, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
import pandas as pd
import numpy as np
import os
from datetime import datetime
import uvicorn
import threading
import time
import io
import csv

# Import from modular files for better project design
from config import (
    SCRIPT_DIR, SUPPORTED_EXTENSIONS, MAX_ROWS_WARNING, 
    MAX_ROWS_HARD_LIMIT, MAX_COMBINATIONS, MEMORY_EFFICIENT_THRESHOLD,
    LARGE_FILE_THRESHOLD, SAMPLE_SIZE_FOR_LARGE_FILES
)
from database import conn, update_job_status, update_stage_status
from file_processing import detect_delimiter, get_file_stats, estimate_processing_time, read_data_file
from analysis import smart_discover_combinations, analyze_file_combinations
from result_generator import (
    generate_analysis_csv, generate_analysis_excel,
    generate_unique_records, generate_duplicate_records, generate_comparison_file,
    get_result_file_path
)
from data_quality import perform_data_quality_check, perform_single_file_quality_check

# Enterprise features
from audit_logger import audit_logger
from scheduler import job_scheduler
from notifications import notification_manager
from run_comparison import run_comparator

# Enhanced features - parallel processing and async jobs
from parallel_processor import process_large_files_parallel, ChunkedFileProcessor, ParallelComparator
from job_queue import job_queue, working_dir_manager, JobStatus
from export_manager import ExportManager

app = FastAPI(
    title="Unique Key Identifier - Enterprise Edition",
    description="Enterprise-grade data comparison and unique key identification tool",
    version="2.0.0"
)
templates = Jinja2Templates(directory=os.path.join(SCRIPT_DIR, "templates"))

# NOTE: Functions moved to modular files:
# - detect_delimiter, get_file_stats, estimate_processing_time, read_data_file -> file_processing.py
# - create_tables, update_job_status, update_stage_status -> database.py
# - smart_discover_combinations, analyze_file_combinations -> analysis.py

# Job processing lock
job_lock = threading.Lock()

def process_analysis_job(run_id, file_a_path, file_b_path, num_columns, max_rows_limit=0, specified_combinations=None, excluded_combinations=None, working_directory=None, data_quality_check=False):
    """Background job to process file analysis"""
    try:
        # Pre-check file sizes
        row_count_a, size_a = get_file_stats(file_a_path)
        row_count_b, size_b = get_file_stats(file_b_path)
        max_rows_available = max(row_count_a, row_count_b)
        
        # Determine if user specified a row limit
        if max_rows_limit > 0:
            # User specified limit - use it directly
            use_sampling = False
            rows_to_read = min(max_rows_limit, max_rows_available)
            read_mode = f"user-limited to {rows_to_read:,} rows"
        else:
            # Auto mode - use intelligent sampling for large files
            if max_rows_available > LARGE_FILE_THRESHOLD:
                use_sampling = True
                rows_to_read = None
                read_mode = f"intelligent-sampling ({SAMPLE_SIZE_FOR_LARGE_FILES:,} sample from {max_rows_available:,} rows)"
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
        if max_rows_limit > 0:
            update_stage_status(run_id, 'reading_files', 'in_progress', 
                              f'Loading data files ({read_mode})')
        elif use_sampling:
            update_stage_status(run_id, 'reading_files', 'in_progress', 
                              f'Loading large files ({max_rows_available:,} rows) with {read_mode} for memory efficiency')
        else:
            update_stage_status(run_id, 'reading_files', 'in_progress', 'Loading data files from disk')
        
        # Read files with appropriate limits
        if max_rows_limit > 0:
            # User specified limit - read first N rows
            df_a, delim_a = read_data_file(file_a_path, nrows=rows_to_read)
            df_b, delim_b = read_data_file(file_b_path, nrows=rows_to_read)
        else:
            # Auto mode - use sampling for large files
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
            import json
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
        
        update_stage_status(run_id, 'storing_results', 'completed', f'Saved {len(results_a) + len(results_b)} results to database')
        
        # Stage 6: Generating Result Files (Enterprise-grade with limits)
        update_job_status(run_id, stage='generating_files', progress=90)
        
        try:
            # Import configurations
            from config import SKIP_FILE_GENERATION_THRESHOLD, MAX_COMBINATIONS_TO_GENERATE
            
            # Check if files are too large for file generation
            max_source_rows = max(actual_rows_a, actual_rows_b)
            if max_source_rows > SKIP_FILE_GENERATION_THRESHOLD:
                print(f"⚠️  Files too large ({max_source_rows:,} rows) - Skipping detailed file generation")
                print(f"   Generating summary files only (threshold: {SKIP_FILE_GENERATION_THRESHOLD:,} rows)")
                update_stage_status(run_id, 'generating_files', 'in_progress', 
                                  f'Large files ({max_source_rows:,} rows) - generating summaries only')
                
                # Generate only summary files for large datasets
                generate_analysis_csv(run_id, working_directory)
                generate_analysis_excel(run_id, working_directory)
                
                update_stage_status(run_id, 'generating_files', 'completed', 
                                  f'Generated summary files (detailed files skipped for large dataset)')
            else:
                # Normal file generation for smaller datasets
                update_stage_status(run_id, 'generating_files', 'in_progress', 
                                  f'Generating result files ({max_source_rows:,} rows)')
                
                # Generate analysis summary files (always generated)
                generate_analysis_csv(run_id, working_directory)
                generate_analysis_excel(run_id, working_directory)
                
                # Generate files for top combinations (limited for performance)
                top_combinations_a = [r['columns'] for r in results_a[:MAX_COMBINATIONS_TO_GENERATE] 
                                    if r['unique_rows'] > 0 or r['duplicate_count'] > 0]
                top_combinations_b = [r['columns'] for r in results_b[:MAX_COMBINATIONS_TO_GENERATE] 
                                    if r['unique_rows'] > 0 or r['duplicate_count'] > 0]
                
                # Get unique set of columns across both sides
                all_top_combinations = list(set(top_combinations_a + top_combinations_b))
                
                files_generated = 2  # CSV and Excel already done
                files_skipped = 0
                
                print(f"📁 Generating files for {len(all_top_combinations[:MAX_COMBINATIONS_TO_GENERATE])} top combinations...")
                
                for idx, columns in enumerate(all_top_combinations[:MAX_COMBINATIONS_TO_GENERATE], 1):
                    print(f"   Processing combination {idx}/{min(len(all_top_combinations), MAX_COMBINATIONS_TO_GENERATE)}: {columns}")
                    
                    # Generate unique/duplicate files for each side
                    for side, results in [('A', results_a), ('B', results_b)]:
                        result = next((r for r in results if r['columns'] == columns), None)
                        if result:
                            # Only generate if there are records (and functions will check size limits)
                            if result['unique_rows'] > 0:
                                file_path = generate_unique_records(run_id, side, columns, file_a_path, file_b_path, working_directory)
                                if file_path:
                                    files_generated += 1
                                else:
                                    files_skipped += 1
                            
                            if result['duplicate_count'] > 0:
                                file_path = generate_duplicate_records(run_id, side, columns, file_a_path, file_b_path, working_directory)
                                if file_path:
                                    files_generated += 1
                                else:
                                    files_skipped += 1
                    
                    # Generate comparison file for this combination
                    file_path = generate_comparison_file(run_id, columns, file_a_path, file_b_path, working_directory)
                    if file_path:
                        files_generated += 1
                    else:
                        files_skipped += 1
                
                completion_msg = f'Generated {files_generated} files'
                if files_skipped > 0:
                    completion_msg += f' ({files_skipped} skipped due to size/timeout)'
                
                update_stage_status(run_id, 'generating_files', 'completed', completion_msg)
                print(f"✅ {completion_msg}")
                
        except Exception as file_gen_error:
            # Don't fail the whole job if file generation fails
            import traceback
            print(f"⚠️  Warning: Error during file generation: {str(file_gen_error)}")
            traceback.print_exc()
            update_stage_status(run_id, 'generating_files', 'completed', 'Summary files generated (some detailed files skipped)')
        
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

# NOTE: smart_discover_combinations and analyze_file_combinations moved to analysis.py

@app.get("/", response_class=HTMLResponse)
async def get_form(request: Request):
    cursor = conn.cursor()
    cursor.execute("SELECT run_id, timestamp, file_a, file_b, num_columns FROM runs ORDER BY timestamp DESC")
    runs = cursor.fetchall()
    run_list = [{"id": r[0], "label": f"Run {r[0]} - {r[1]} (Files: {r[2]}, {r[3]}, Columns: {r[4]})"} for r in runs]
    return templates.TemplateResponse("index_modern.html", {"request": request, "runs": run_list})

@app.get("/data-quality", response_class=HTMLResponse)
async def data_quality_page(request: Request):
    """Standalone data quality check page"""
    return templates.TemplateResponse("data_quality.html", {"request": request})

@app.get("/parallel-comparison", response_class=HTMLResponse)
async def parallel_comparison_page(request: Request):
    """Parallel large file comparison page"""
    return templates.TemplateResponse("parallel_comparison.html", {"request": request})

@app.get("/api/preview-columns")
async def preview_columns(file_a: str, file_b: str, working_directory: str = Query(None)):
    """Preview columns from both files before analysis"""
    try:
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        work_dir = working_directory.strip() if working_directory else None
        
        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)
        
        # Determine base directory
        base_dir = work_dir if work_dir else SCRIPT_DIR
        
        # Validate directory if specified
        if work_dir and not os.path.isdir(base_dir):
            return JSONResponse({"error": f"Directory not found: {base_dir}"}, status_code=400)
        
        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)
        
        if not os.path.exists(file_a_path):
            return JSONResponse({"error": f"❌ File A not found: '{file_a_name}'. Please ensure the file is in the unique_key_identifier folder."}, status_code=404)
        if not os.path.exists(file_b_path):
            return JSONResponse({"error": f"❌ File B not found: '{file_b_name}'. Please ensure the file is in the unique_key_identifier folder."}, status_code=404)
        
        # Read just the headers (nrows=5 for fast loading)
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
                "error": f"❌ Files have different column structures. File A has {len(cols_a)} columns, File B has {len(cols_b)} columns.",
                "columns_a": cols_a,
                "columns_b": cols_b
            }, status_code=400)
        
        # Get basic stats efficiently
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
                "error": f"⚠️ Files too large! Maximum {MAX_ROWS_HARD_LIMIT:,} rows allowed. Your files have {max_rows:,} rows. Please filter or sample your data first.",
                "file_a_rows": row_count_a,
                "file_b_rows": row_count_b
            }, status_code=400)
        elif max_rows > LARGE_FILE_THRESHOLD:
            warnings.append(f"🚀 Very large files detected ({max_rows:,} rows). Analysis will use intelligent sampling with {SAMPLE_SIZE_FOR_LARGE_FILES:,} representative rows.")
            warnings.append(f"💡 This ensures fast processing while maintaining accuracy. Analysis may take 10-20 minutes.")
            warnings.append("📊 Tip: Results will be based on a statistically representative sample of your data.")
            performance_level = "very_large"
        elif max_rows > MAX_ROWS_WARNING:
            warnings.append(f"⚠️ Large files detected ({max_rows:,} rows). Analysis may take 2-5 minutes.")
            warnings.append("💡 Tip: Use INCLUDE combinations to specify exact columns instead of auto-discovery for faster processing.")
            performance_level = "warning"
        elif max_rows > MEMORY_EFFICIENT_THRESHOLD:
            warnings.append(f"📊 Medium-sized files ({max_rows:,} rows). Analysis will use sampling for efficiency.")
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
    expected_combinations: str = Form(None),
    excluded_combinations: str = Form(None),
    working_directory: str = Form(None),
    data_quality_check: bool = Form(False)
):
    """Start async analysis job and return run_id"""
    try:
        import traceback
        
        file_a_name = file_a.strip()
        file_b_name = file_b.strip()
        expected_combos = expected_combinations.strip() if expected_combinations else None
        excluded_combos = excluded_combinations.strip() if excluded_combinations else None
        work_dir = working_directory.strip() if working_directory else None

        if not file_a_name or not file_b_name:
            return JSONResponse({"error": "Please provide both file names"}, status_code=400)

        # Determine base directory
        base_dir = work_dir if work_dir else SCRIPT_DIR
        
        # Validate directory exists
        if work_dir and not os.path.isdir(base_dir):
            return JSONResponse({"error": f"Directory not found: {base_dir}"}, status_code=400)

        file_a_path = os.path.join(base_dir, file_a_name)
        file_b_path = os.path.join(base_dir, file_b_name)

        if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
            return JSONResponse({"error": "One or both files not found in unique_key_identifier directory"}, status_code=400)

        # Create new run record
        cursor = conn.cursor()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute('''
            INSERT INTO runs (timestamp, file_a, file_b, num_columns, status, current_stage, progress_percent, started_at, working_directory)
            VALUES (?, ?, ?, ?, 'queued', 'initializing', 0, ?, ?)
        ''', (timestamp, file_a_name, file_b_name, num_columns, timestamp, work_dir))
        run_id = cursor.lastrowid
        
        # Store run parameters for cloning
        cursor.execute('''
            INSERT OR REPLACE INTO run_parameters (run_id, max_rows, expected_combinations, excluded_combinations, working_directory, data_quality_check)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (run_id, max_rows, expected_combos or '', excluded_combos or '', work_dir or '', 1 if data_quality_check else 0))
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
            ('generating_files', 6 + stage_offset, 'pending')
        ])
        
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
                                 args=(run_id, file_a_path, file_b_path, num_columns, max_rows, parsed_combinations, parsed_exclusions, work_dir, data_quality_check))
        thread.daemon = True
        thread.start()
        
        return JSONResponse({"run_id": run_id, "status": "queued"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Server error: {str(e)}"}, status_code=500)

@app.post("/api/data-quality-check")
async def check_data_quality(
    file_a: str = Form(...),
    file_b: str = Form(...),
    working_directory: str = Form(None)
):
    """Standalone data quality check without full analysis"""
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
        
        if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
            return JSONResponse({"error": "One or both files not found"}, status_code=404)
        
        # Read files
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Perform quality check
        quality_results = perform_data_quality_check(df_a, df_b, file_a_name, file_b_name)
        
        return JSONResponse(quality_results)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error performing quality check: {str(e)}"}, status_code=500)

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

@app.get("/api/clone/{run_id}")
async def get_run_for_clone(run_id: int):
    """Get run parameters for cloning"""
    try:
        cursor = conn.cursor()
        
        # Ensure run_parameters table exists with data_quality_check column
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS run_parameters (
                run_id INTEGER PRIMARY KEY,
                max_rows INTEGER,
                expected_combinations TEXT,
                excluded_combinations TEXT,
                working_directory TEXT,
                data_quality_check INTEGER DEFAULT 0,
                FOREIGN KEY (run_id) REFERENCES runs(run_id)
            )
        ''')
        conn.commit()
        
        # Get basic run info
        cursor.execute('''
            SELECT file_a, file_b, num_columns FROM runs WHERE run_id = ?
        ''', (run_id,))
        run_info = cursor.fetchone()
        
        if not run_info:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Get run parameters (may not exist for old runs)
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
            "max_rows": params[0] if params else 0,
            "expected_combinations": params[1] if params and params[1] else "",
            "excluded_combinations": params[2] if params and params[2] else "",
            "working_directory": params[3] if params and params[3] else "",
            "data_quality_check": params[4] if params and len(params) > 4 else 0
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": f"Error cloning run: {str(e)}"}, status_code=500)

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
    """Download analysis results as CSV - serves pre-generated file if available"""
    # Check for pre-generated file first
    cached_file = get_result_file_path(run_id, 'analysis_csv')
    if cached_file and os.path.exists(cached_file):
        cursor = conn.cursor()
        cursor.execute('SELECT file_a, file_b FROM runs WHERE run_id = ?', (run_id,))
        run_info = cursor.fetchone()
        if run_info:
            filename = f"analysis_run_{run_id}_{run_info[0]}_{run_info[1]}.csv"
            return FileResponse(
                path=cached_file,
                media_type="text/csv",
                filename=filename
            )
    
    # Fallback: Generate on-demand if not cached
    cursor = conn.cursor()
    cursor.execute('SELECT file_a, file_b, num_columns FROM runs WHERE run_id = ?', (run_id,))
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

@app.get("/download/{run_id}/excel")
async def download_results_excel(run_id: int):
    """Download analysis results as Excel - serves pre-generated file if available"""
    # Check for pre-generated file first
    cached_file = get_result_file_path(run_id, 'analysis_excel')
    if cached_file and os.path.exists(cached_file):
        cursor = conn.cursor()
        cursor.execute('SELECT file_a, file_b FROM runs WHERE run_id = ?', (run_id,))
        run_info = cursor.fetchone()
        if run_info:
            filename = f"analysis_run_{run_id}_{run_info[0]}_{run_info[1]}.xlsx"
            return FileResponse(
                path=cached_file,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename=filename
            )
    
    # Fallback: Generate on-demand if not cached
    cursor = conn.cursor()
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

@app.get("/download/{run_id}/unique-records")
async def download_unique_records(run_id: int, side: str = Query(...), columns: str = Query(...)):
    """Download unique records for a specific column combination - serves pre-generated file if available"""
    # Check for pre-generated file first
    cached_file = get_result_file_path(run_id, 'unique_records', side=side, columns=columns)
    if cached_file and os.path.exists(cached_file):
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"unique_records_run_{run_id}_side_{side}_{columns_safe}.csv"
        return FileResponse(
            path=cached_file,
            media_type="text/csv",
            filename=filename
        )
    
    # Fallback: Generate on-demand if not cached
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, working_directory FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found in database")
    
    # Determine which file to load
    file_name = run_info[0] if side == 'A' else run_info[1]
    work_dir = run_info[2]
    base_dir = work_dir if work_dir else SCRIPT_DIR
    file_path = os.path.join(base_dir, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Source file not found: {file_name}")
    
    try:
        # Load the file
        df, delimiter = read_data_file(file_path)
        
        # Parse the columns
        column_list = [col.strip() for col in columns.split(',')]
        
        # Validate columns exist
        missing_cols = [col for col in column_list if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found: {', '.join(missing_cols)}")
        
        # Find unique records - records where the combination appears only once
        # Group by the specified columns and count occurrences
        grouped = df.groupby(column_list, sort=False, observed=True).size()
        
        # Get combinations that appear exactly once (unique records)
        unique_combinations = grouped[grouped == 1].index
        
        # Filter dataframe to get only unique records
        if len(column_list) == 1:
            # Single column case
            unique_df = df[df[column_list[0]].isin(unique_combinations)]
        else:
            # Multiple columns case - need to match tuples
            mask = df.set_index(column_list).index.isin(unique_combinations)
            unique_df = df[mask]
        
        # Reset index for clean output
        unique_df = unique_df.reset_index(drop=True)
        
        # Create CSV in memory
        output = io.StringIO()
        unique_df.to_csv(output, index=False)
        
        # Prepare response
        output.seek(0)
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"unique_records_run_{run_id}_side_{side}_{columns_safe}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting unique records: {str(e)}")

@app.get("/download/{run_id}/duplicate-records")
async def download_duplicate_records(run_id: int, side: str = Query(...), columns: str = Query(...)):
    """Download duplicate records for a specific column combination - serves pre-generated file if available"""
    # Check for pre-generated file first
    cached_file = get_result_file_path(run_id, 'duplicate_records', side=side, columns=columns)
    if cached_file and os.path.exists(cached_file):
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"duplicate_records_run_{run_id}_side_{side}_{columns_safe}.csv"
        return FileResponse(
            path=cached_file,
            media_type="text/csv",
            filename=filename
        )
    
    # Fallback: Generate on-demand if not cached
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, working_directory FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    # Determine which file to load
    file_name = run_info[0] if side == 'A' else run_info[1]
    work_dir = run_info[2]
    base_dir = work_dir if work_dir else SCRIPT_DIR
    file_path = os.path.join(base_dir, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Source file not found: {file_name}")
    
    try:
        # Load the file
        df, delimiter = read_data_file(file_path)
        
        # Parse the columns
        column_list = [col.strip() for col in columns.split(',')]
        
        # Validate columns exist
        missing_cols = [col for col in column_list if col not in df.columns]
        if missing_cols:
            raise HTTPException(status_code=400, detail=f"Columns not found: {', '.join(missing_cols)}")
        
        # Find duplicate records - records where the combination appears more than once
        grouped = df.groupby(column_list, sort=False, observed=True).size()
        
        # Get combinations that appear more than once (duplicate records)
        duplicate_combinations = grouped[grouped > 1].index
        
        # Filter dataframe to get only duplicate records
        if len(column_list) == 1:
            # Single column case
            duplicate_df = df[df[column_list[0]].isin(duplicate_combinations)]
        else:
            # Multiple columns case - need to match tuples
            mask = df.set_index(column_list).index.isin(duplicate_combinations)
            duplicate_df = df[mask]
        
        # Add a column showing the count of each combination
        if len(column_list) == 1:
            duplicate_df['occurrence_count'] = duplicate_df[column_list[0]].map(grouped)
        else:
            duplicate_df['occurrence_count'] = duplicate_df.set_index(column_list).index.map(grouped).values
        
        # Sort by occurrence count (descending) and then by the key columns
        duplicate_df = duplicate_df.sort_values(['occurrence_count'] + column_list, ascending=[False] + [True]*len(column_list))
        
        # Reset index for clean output
        duplicate_df = duplicate_df.reset_index(drop=True)
        
        # Create CSV in memory
        output = io.StringIO()
        duplicate_df.to_csv(output, index=False)
        
        # Prepare response
        output.seek(0)
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"duplicate_records_run_{run_id}_side_{side}_{columns_safe}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting duplicate records: {str(e)}")

@app.get("/api/comparison/{run_id}/data")
async def get_comparison_data(
    run_id: int, 
    columns: str = Query(...),
    category: str = Query(...),  # 'matched', 'only_a', 'only_b'
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """API endpoint to get paginated comparison data"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, working_directory FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    work_dir = run_info[2]
    base_dir = work_dir if work_dir else SCRIPT_DIR
    file_a_path = os.path.join(base_dir, run_info[0])
    file_b_path = os.path.join(base_dir, run_info[1])
    
    if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
        raise HTTPException(status_code=404, detail="Source files not found")
    
    try:
        # Load both files
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [col.strip() for col in columns.split(',')]
        
        # Create comparison keys
        df_a['_comparison_key'] = df_a[column_list].apply(lambda x: tuple(x), axis=1)
        df_b['_comparison_key'] = df_b[column_list].apply(lambda x: tuple(x), axis=1)
        
        # Get unique keys
        keys_a = set(df_a['_comparison_key'])
        keys_b = set(df_b['_comparison_key'])
        
        # Calculate intersections and differences
        matched_keys = keys_a & keys_b
        only_a_keys = keys_a - keys_b
        only_b_keys = keys_b - keys_a
        
        # Select the right dataset based on category
        if category == 'matched':
            df_filtered = df_a[df_a['_comparison_key'].isin(matched_keys)].copy()
        elif category == 'only_a':
            df_filtered = df_a[df_a['_comparison_key'].isin(only_a_keys)].copy()
        elif category == 'only_b':
            df_filtered = df_b[df_b['_comparison_key'].isin(only_b_keys)].copy()
        else:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        # Remove comparison key and sort
        df_filtered.drop('_comparison_key', axis=1, inplace=True)
        df_filtered = df_filtered.sort_values(column_list).reset_index(drop=True)
        
        # Get total count before pagination
        total_count = len(df_filtered)
        
        # Apply pagination
        df_page = df_filtered.iloc[offset:offset + limit]
        
        # Convert pandas data to native Python types for JSON serialization
        if not df_page.empty:
            # Replace NaN/NaT with None and convert to native types
            df_page = df_page.replace({pd.NaT: None, np.nan: None})
            records = df_page.astype(object).where(pd.notnull(df_page), None).to_dict('records')
        else:
            records = []
        
        return JSONResponse({
            "records": records,
            "total": int(total_count),
            "offset": int(offset),
            "limit": int(limit),
            "has_more": bool(offset + limit < total_count)
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching comparison data: {str(e)}")

@app.get("/comparison/{run_id}/view", response_class=HTMLResponse)
async def view_comparison(request: Request, run_id: int, columns: str = Query(...)):
    """View comparison results in browser with lazy loading"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, working_directory FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    work_dir = run_info[2]
    base_dir = work_dir if work_dir else SCRIPT_DIR
    file_a_path = os.path.join(base_dir, run_info[0])
    file_b_path = os.path.join(base_dir, run_info[1])
    
    if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
        raise HTTPException(status_code=404, detail="Source files not found")
    
    try:
        # Load both files for counts only
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [col.strip() for col in columns.split(',')]
        
        # Validate columns
        missing_a = [col for col in column_list if col not in df_a.columns]
        missing_b = [col for col in column_list if col not in df_b.columns]
        if missing_a or missing_b:
            raise HTTPException(status_code=400, detail="Columns not found in files")
        
        # Create comparison keys
        df_a['_comparison_key'] = df_a[column_list].apply(lambda x: tuple(x), axis=1)
        df_b['_comparison_key'] = df_b[column_list].apply(lambda x: tuple(x), axis=1)
        
        # Get unique keys
        keys_a = set(df_a['_comparison_key'])
        keys_b = set(df_b['_comparison_key'])
        
        # Calculate counts only (fast)
        matched_count = len(keys_a & keys_b)
        only_a_count = len(keys_a - keys_b)
        only_b_count = len(keys_b - keys_a)
        
        # Calculate match rate
        match_rate = round((matched_count / max(len(df_a), 1)) * 100, 2)
        
        # Get column names for the first record to display headers
        all_columns = df_a.columns.tolist()
        if '_comparison_key' in all_columns:
            all_columns.remove('_comparison_key')
        
        # Convert all values to native Python types to avoid JSON serialization issues
        return templates.TemplateResponse("comparison_view.html", {
            "request": request,
            "run_id": int(run_id),
            "columns": str(columns),
            "columns_display": columns.replace(',', ', '),
            "file_a": str(run_info[0]),
            "file_b": str(run_info[1]),
            "total_a": int(len(df_a)),
            "total_b": int(len(df_b)),
            "matched_count": int(matched_count),
            "only_a_count": int(only_a_count),
            "only_b_count": int(only_b_count),
            "match_rate": float(match_rate),
            "all_columns": [str(col) for col in all_columns]
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating comparison view: {str(e)}")

@app.get("/download/{run_id}/comparison")
async def download_comparison_files(run_id: int, columns: str = Query(...)):
    """Download comparison files - serves pre-generated file if available"""
    # Check for pre-generated file first
    cached_file = get_result_file_path(run_id, 'comparison', columns=columns)
    if cached_file and os.path.exists(cached_file):
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"comparison_run_{run_id}_{columns_safe}.xlsx"
        return FileResponse(
            path=cached_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=filename
        )
    
    # Fallback: Generate on-demand if not cached
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        raise HTTPException(status_code=404, detail="Run not found")
    
    file_a_path = os.path.join(SCRIPT_DIR, run_info[0])
    file_b_path = os.path.join(SCRIPT_DIR, run_info[1])
    
    if not os.path.exists(file_a_path) or not os.path.exists(file_b_path):
        raise HTTPException(status_code=404, detail="Source files not found")
    
    try:
        # Load both files
        df_a, _ = read_data_file(file_a_path)
        df_b, _ = read_data_file(file_b_path)
        
        # Parse columns
        column_list = [col.strip() for col in columns.split(',')]
        
        # Validate columns exist in both files
        missing_a = [col for col in column_list if col not in df_a.columns]
        missing_b = [col for col in column_list if col not in df_b.columns]
        if missing_a or missing_b:
            raise HTTPException(status_code=400, detail=f"Columns not found in files")
        
        # Create comparison keys for both dataframes
        # Use tuple of values as key for comparison
        df_a['_comparison_key'] = df_a[column_list].apply(lambda x: tuple(x), axis=1)
        df_b['_comparison_key'] = df_b[column_list].apply(lambda x: tuple(x), axis=1)
        
        # Get unique keys from each side
        keys_a = set(df_a['_comparison_key'])
        keys_b = set(df_b['_comparison_key'])
        
        # Calculate intersections and differences
        matched_keys = keys_a & keys_b  # Intersection
        only_a_keys = keys_a - keys_b   # Only in A
        only_b_keys = keys_b - keys_a   # Only in B
        
        # Filter dataframes based on keys
        df_matched_a = df_a[df_a['_comparison_key'].isin(matched_keys)].copy()
        df_matched_b = df_b[df_b['_comparison_key'].isin(matched_keys)].copy()
        df_only_a = df_a[df_a['_comparison_key'].isin(only_a_keys)].copy()
        df_only_b = df_b[df_b['_comparison_key'].isin(only_b_keys)].copy()
        
        # Remove comparison key column
        df_matched_a.drop('_comparison_key', axis=1, inplace=True)
        df_matched_b.drop('_comparison_key', axis=1, inplace=True)
        df_only_a.drop('_comparison_key', axis=1, inplace=True)
        df_only_b.drop('_comparison_key', axis=1, inplace=True)
        
        # Sort by the comparison columns for easier Excel review
        df_matched_a = df_matched_a.sort_values(column_list).reset_index(drop=True)
        df_matched_b = df_matched_b.sort_values(column_list).reset_index(drop=True)
        df_only_a = df_only_a.sort_values(column_list).reset_index(drop=True)
        df_only_b = df_only_b.sort_values(column_list).reset_index(drop=True)
        
        # Create Excel file with multiple sheets
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            # Summary sheet
            summary_df = pd.DataFrame({
                'Metric': [
                    'Total Records in Side A',
                    'Total Records in Side B',
                    'Matched Records (in both)',
                    'Only in Side A',
                    'Only in Side B',
                    'Match Rate (%)'
                ],
                'Count': [
                    len(df_a),
                    len(df_b),
                    len(df_matched_a),
                    len(df_only_a),
                    len(df_only_b),
                    round((len(df_matched_a) / max(len(df_a), 1)) * 100, 2)
                ]
            })
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Matched records (Side A perspective)
            if not df_matched_a.empty:
                df_matched_a.to_excel(writer, sheet_name='Matched_SideA', index=False)
            
            # Matched records (Side B perspective)
            if not df_matched_b.empty:
                df_matched_b.to_excel(writer, sheet_name='Matched_SideB', index=False)
            
            # Only in Side A
            if not df_only_a.empty:
                df_only_a.to_excel(writer, sheet_name='Only_In_SideA', index=False)
            
            # Only in Side B
            if not df_only_b.empty:
                df_only_b.to_excel(writer, sheet_name='Only_In_SideB', index=False)
            
            # Format the summary sheet
            workbook = writer.book
            worksheet = writer.sheets['Summary']
            
            # Add formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#667eea',
                'font_color': 'white',
                'border': 1
            })
            
            # Set column widths
            worksheet.set_column('A:A', 30)
            worksheet.set_column('B:B', 20)
        
        output.seek(0)
        columns_safe = columns.replace(',', '_').replace(' ', '')
        filename = f"comparison_run_{run_id}_{columns_safe}.xlsx"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating comparison: {str(e)}")

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

        # Get working directory for this run
        cursor.execute('SELECT working_directory FROM runs WHERE run_id = ?', (run_id,))
        dir_info = cursor.fetchone()
        work_dir = dir_info[0] if dir_info else None
        base_dir = work_dir if work_dir else SCRIPT_DIR
        
        # Try to load the files to get column names
        file_a_path = os.path.join(base_dir, run_info[1])
        columns_list = []
        try:
            if os.path.exists(file_a_path):
                df_temp, _ = read_data_file(file_a_path, nrows=0)
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

# ========================================
# ENTERPRISE API ENDPOINTS
# ========================================

@app.get("/api/audit-log")
async def get_audit_log(
    run_id: int = Query(None),
    user_id: str = Query(None),
    event_type: str = Query(None),
    limit: int = Query(100, le=1000)
):
    """Get audit log with filters"""
    try:
        logs = audit_logger.get_audit_trail(
            run_id=run_id,
            user_id=user_id,
            event_type=event_type,
            limit=limit
        )
        return JSONResponse({"audit_log": logs, "count": len(logs)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/compliance-report")
async def get_compliance_report(
    start_date: str = Query(...),
    end_date: str = Query(...)
):
    """Generate compliance report for audit purposes"""
    try:
        report = audit_logger.generate_compliance_report(start_date, end_date)
        return JSONResponse(report)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/scheduled-jobs")
async def create_scheduled_job(
    job_name: str = Form(...),
    file_a: str = Form(...),
    file_b: str = Form(...),
    num_columns: int = Form(...),
    schedule_type: str = Form(...),
    schedule_config: str = Form(...),
    description: str = Form(None),
    notification_emails: str = Form(None)
):
    """Create a new scheduled job"""
    try:
        import json
        config = json.loads(schedule_config)
        
        job_id = job_scheduler.create_scheduled_job(
            job_name=job_name,
            file_a=file_a,
            file_b=file_b,
            num_columns=num_columns,
            schedule_type=schedule_type,
            schedule_config=config,
            description=description,
            notification_emails=notification_emails
        )
        
        audit_logger.log_event('config_change', f'Created scheduled job: {job_name}')
        
        return JSONResponse({"job_id": job_id, "status": "created"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/scheduled-jobs")
async def list_scheduled_jobs():
    """List all scheduled jobs"""
    try:
        jobs = job_scheduler.get_all_jobs()
        return JSONResponse({"jobs": jobs, "count": len(jobs)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/scheduled-jobs/{job_id}/history")
async def get_job_history(job_id: int, limit: int = Query(50, le=500)):
    """Get execution history for a job"""
    try:
        history = job_scheduler.get_job_history(job_id, limit)
        return JSONResponse({"history": history, "count": len(history)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/scheduled-jobs/{job_id}/enable")
async def enable_job(job_id: int):
    """Enable a scheduled job"""
    try:
        job_scheduler.enable_job(job_id)
        return JSONResponse({"status": "enabled"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/scheduled-jobs/{job_id}/disable")
async def disable_job(job_id: int):
    """Disable a scheduled job"""
    try:
        job_scheduler.disable_job(job_id)
        return JSONResponse({"status": "disabled"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.delete("/api/scheduled-jobs/{job_id}")
async def delete_job(job_id: int):
    """Delete a scheduled job"""
    try:
        job_scheduler.delete_job(job_id)
        return JSONResponse({"status": "deleted"})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/compare-runs/{run_id_1}/{run_id_2}")
async def compare_runs(run_id_1: int, run_id_2: int):
    """Compare two analysis runs"""
    try:
        comparison = run_comparator.compare_runs(run_id_1, run_id_2)
        if not comparison:
            return JSONResponse({"error": "One or both runs not found"}, status_code=404)
        return JSONResponse(comparison)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/trends/{file_a}/{file_b}")
async def get_trends(file_a: str, file_b: str, days: int = Query(30, le=365)):
    """Get historical trends for specific files"""
    try:
        trend = run_comparator.get_historical_trend(file_a, file_b, days)
        return JSONResponse({"trends": trend, "count": len(trend)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/anomalies/{file_a}/{file_b}")
async def detect_anomalies(file_a: str, file_b: str):
    """Detect anomalies in run history"""
    try:
        anomalies = run_comparator.detect_anomalies(file_a, file_b)
        return JSONResponse({"anomalies": anomalies, "count": len(anomalies)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/trend-report/{file_a}/{file_b}")
async def get_trend_report(file_a: str, file_b: str, days: int = Query(30, le=365)):
    """Generate comprehensive trend report"""
    try:
        report = run_comparator.generate_trend_report(file_a, file_b, days)
        if not report:
            return JSONResponse({"error": "Insufficient data for report"}, status_code=404)
        return JSONResponse(report)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/notify/test")
async def test_notification(
    email: str = Form(None),
    webhook_url: str = Form(None)
):
    """Test notification configuration"""
    try:
        results = {}
        
        if email:
            success, error = notification_manager.send_email(
                email,
                "Test Notification - Unique Key Identifier",
                "This is a test email from your Unique Key Identifier Enterprise Edition.",
                "<h2>Test Notification</h2><p>Your email notifications are configured correctly!</p>"
            )
            results['email'] = {'success': success, 'error': error}
        
        if webhook_url:
            success, error = notification_manager.send_webhook(
                webhook_url,
                {'event': 'test', 'message': 'Test webhook notification'}
            )
            results['webhook'] = {'success': success, 'error': error}
        
        return JSONResponse(results)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/notification-history")
async def get_notification_history(run_id: int = Query(None), limit: int = Query(100, le=1000)):
    """Get notification history"""
    try:
        history = notification_manager.get_notification_history(run_id, limit)
        return JSONResponse({"history": history, "count": len(history)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/system/health")
async def system_health():
    """Get system health status"""
    try:
        import psutil
        
        health = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage_percent': psutil.disk_usage('/').percent,
            'timestamp': datetime.now().isoformat(),
            'status': 'healthy'
        }
        
        # Determine status
        if health['cpu_percent'] > 90 or health['memory_percent'] > 90:
            health['status'] = 'critical'
        elif health['cpu_percent'] > 70 or health['memory_percent'] > 70:
            health['status'] = 'warning'
        
        # Log to database
        audit_logger.log_system_health(
            cpu_percent=health['cpu_percent'],
            memory_percent=health['memory_percent'],
            disk_usage_percent=health['disk_usage_percent'],
            status=health['status']
        )
        
        return JSONResponse(health)
    except Exception as e:
        return JSONResponse({"error": str(e), "status": "unknown"}, status_code=500)

@app.get("/api/system/metrics")
async def system_metrics(hours: int = Query(24, le=168)):
    """Get system metrics history"""
    try:
        metrics = audit_logger.get_system_health_history(hours)
        return JSONResponse({"metrics": metrics, "count": len(metrics)})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# ========================================
# PARALLEL PROCESSING & ENHANCED COMPARISON
# ========================================

@app.post("/api/parallel-comparison/submit")
async def submit_parallel_comparison(
    file_a: str = Form(...),
    file_b: str = Form(...),
    key_columns: str = Form(...),
    chunk_size_mb: int = Form(50),
    max_workers: int = Form(None)
):
    """
    Submit a parallel comparison job for large files
    Returns job ID for tracking
    """
    try:
        # Parse key columns
        key_cols = [col.strip() for col in key_columns.split(',')]
        
        # Create file paths
        file_a_path = os.path.join(SCRIPT_DIR, file_a)
        file_b_path = os.path.join(SCRIPT_DIR, file_b)
        
        # Validate files exist
        if not os.path.exists(file_a_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_a}")
        if not os.path.exists(file_b_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_b}")
        
        # Create working directory
        run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        working_dir = working_dir_manager.create_run_directory(run_id, metadata={
            'file_a': file_a,
            'file_b': file_b,
            'key_columns': key_cols,
            'chunk_size_mb': chunk_size_mb,
            'max_workers': max_workers
        })
        
        # Define job callback
        def parallel_comparison_job(job_id, params):
            from file_processing import detect_delimiter
            
            # Detect delimiters
            delimiter_a = detect_delimiter(params['file_a_path'])
            delimiter_b = detect_delimiter(params['file_b_path'])
            
            # Progress callback
            def progress_callback(current, total, message):
                job_queue.update_job_progress(
                    job_id, 
                    int((current / max(total, 1)) * 100),
                    message
                )
            
            # Run parallel comparison
            results = process_large_files_parallel(
                file_a_path=params['file_a_path'],
                file_b_path=params['file_b_path'],
                key_columns=params['key_columns'],
                working_dir=params['working_dir'],
                delimiter_a=delimiter_a,
                delimiter_b=delimiter_b,
                chunk_size_mb=params['chunk_size_mb'],
                max_workers=params['max_workers'],
                progress_callback=progress_callback
            )
            
            # Export results
            export_mgr = ExportManager(params['working_dir'])
            
            # Export to CSV
            csv_files = export_mgr.export_comparison_to_csv(results)
            
            # Export to Excel
            excel_file = export_mgr.export_comparison_to_excel(results)
            
            # Export HTML report
            html_file = export_mgr.create_comparison_report_html(results)
            
            results['exports'] = {
                'csv_files': csv_files,
                'excel_file': excel_file,
                'html_report': html_file
            }
            
            return results
        
        # Submit job
        job_id = job_queue.submit_job(
            job_type='parallel_comparison',
            params={
                'file_a_path': file_a_path,
                'file_b_path': file_b_path,
                'key_columns': key_cols,
                'working_dir': working_dir,
                'chunk_size_mb': chunk_size_mb,
                'max_workers': max_workers
            },
            callback=parallel_comparison_job
        )
        
        audit_logger.log_event('parallel_comparison_submitted', 
                              f'Files: {file_a} vs {file_b}', 
                              user='system',
                              metadata={'job_id': job_id, 'run_id': run_id})
        
        return JSONResponse({
            'status': 'submitted',
            'job_id': job_id,
            'run_id': run_id,
            'working_dir': working_dir,
            'message': 'Parallel comparison job submitted successfully'
        })
        
    except Exception as e:
        audit_logger.log_event('parallel_comparison_error', str(e), 
                              status='error', user='system')
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/parallel-comparison/status/{job_id}")
async def get_parallel_comparison_status(job_id: str):
    """Get status of a parallel comparison job"""
    try:
        job_status = job_queue.get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return JSONResponse(job_status)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/parallel-comparison/result/{job_id}")
async def get_parallel_comparison_result(job_id: str):
    """Get results of a completed parallel comparison job"""
    try:
        job_status = job_queue.get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job_status['status'] != 'completed':
            return JSONResponse({
                'status': job_status['status'],
                'message': 'Job not yet completed'
            })
        
        # Get job result
        job = job_queue.jobs.get(job_id)
        if not job or not job.result:
            raise HTTPException(status_code=404, detail="Job result not found")
        
        return JSONResponse({
            'status': 'completed',
            'result': job.result
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/active")
async def get_active_jobs():
    """Get all currently active jobs"""
    try:
        active_jobs = job_queue.get_active_jobs()
        return JSONResponse({'jobs': active_jobs, 'count': len(active_jobs)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs/all")
async def get_all_jobs():
    """Get all jobs"""
    try:
        all_jobs = job_queue.get_all_jobs()
        return JSONResponse({'jobs': all_jobs, 'count': len(all_jobs)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a queued job"""
    try:
        success = job_queue.cancel_job(job_id)
        
        if success:
            audit_logger.log_event('job_cancelled', f'Job {job_id} cancelled', 
                                  user='system')
            return JSONResponse({'status': 'cancelled', 'job_id': job_id})
        else:
            return JSONResponse({
                'status': 'error',
                'message': 'Job cannot be cancelled (not queued or not found)'
            }, status_code=400)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runs/list")
async def list_runs(limit: int = Query(50, ge=1, le=200)):
    """List all runs with their working directories"""
    try:
        runs = working_dir_manager.list_runs(limit=limit)
        return JSONResponse({'runs': runs, 'count': len(runs)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runs/{run_id}/download/{file_type}")
async def download_run_file(run_id: str, file_type: str):
    """
    Download exported files from a run
    file_type: 'excel', 'html', 'summary_csv', etc.
    """
    try:
        # Get run directory
        run_dir = working_dir_manager.get_run_directory(run_id)
        
        if not run_dir:
            raise HTTPException(status_code=404, detail="Run not found")
        
        exports_dir = os.path.join(run_dir, 'exports')
        
        # Determine file to download
        if file_type == 'excel':
            # Find the most recent Excel file
            excel_files = [f for f in os.listdir(exports_dir) if f.endswith('.xlsx')]
            if not excel_files:
                raise HTTPException(status_code=404, detail="Excel file not found")
            file_path = os.path.join(exports_dir, sorted(excel_files)[-1])
            media_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            
        elif file_type == 'html':
            html_files = [f for f in os.listdir(exports_dir) if f.endswith('.html')]
            if not html_files:
                raise HTTPException(status_code=404, detail="HTML file not found")
            file_path = os.path.join(exports_dir, sorted(html_files)[-1])
            media_type = 'text/html'
            
        elif file_type == 'json':
            file_path = os.path.join(run_dir, 'comparison_results.json')
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail="JSON results not found")
            media_type = 'application/json'
            
        else:
            # Try to find CSV file
            file_path = os.path.join(exports_dir, f'{file_type}.csv')
            if not os.path.exists(file_path):
                raise HTTPException(status_code=404, detail=f"File not found: {file_type}")
            media_type = 'text/csv'
        
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=os.path.basename(file_path)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runs/{run_id}/records")
async def get_comparison_records(
    run_id: str,
    category: str = Query(..., regex="^(matched_a|matched_b|only_a|only_b|duplicates_a|duplicates_b)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=10, le=1000)
):
    """
    Get paginated comparison records for progressive UI loading
    category: matched_a, matched_b, only_a, only_b, duplicates_a, duplicates_b
    page: Page number (1-indexed)
    per_page: Records per page (10-1000)
    """
    try:
        # Get run directory
        run_dir = working_dir_manager.get_run_directory(run_id)
        
        if not run_dir:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Map category to file
        file_mapping = {
            'matched_a': 'matched_records_side_a.csv',
            'matched_b': 'matched_records_side_b.csv',
            'only_a': 'only_in_a_records.csv',
            'only_b': 'only_in_b_records.csv',
            'duplicates_a': 'duplicates_side_a.csv',
            'duplicates_b': 'duplicates_side_b.csv'
        }
        
        filename = file_mapping.get(category)
        if not filename:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        file_path = os.path.join(run_dir, filename)
        
        if not os.path.exists(file_path):
            # Return empty result if file doesn't exist
            return JSONResponse({
                'category': category,
                'page': page,
                'per_page': per_page,
                'total_records': 0,
                'total_pages': 0,
                'records': [],
                'columns': []
            })
        
        # Read CSV with pagination
        # First, count total rows
        with open(file_path, 'r') as f:
            total_records = sum(1 for _ in f) - 1  # Subtract header
        
        total_pages = (total_records + per_page - 1) // per_page
        
        # Read only the requested page
        skip_rows = (page - 1) * per_page
        df = pd.read_csv(file_path, skiprows=range(1, skip_rows + 1) if skip_rows > 0 else None, nrows=per_page)
        
        # Convert to JSON-friendly format
        records = df.to_dict('records')
        columns = df.columns.tolist()
        
        # Clean NaN values
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        return JSONResponse({
            'category': category,
            'page': page,
            'per_page': per_page,
            'total_records': total_records,
            'total_pages': total_pages,
            'records': records,
            'columns': columns
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/runs/{run_id}/comparison-viewer", response_class=HTMLResponse)
async def comparison_viewer(request: Request, run_id: str):
    """
    Progressive loading comparison viewer - doesn't crash on large datasets
    """
    try:
        # Get run directory and metadata
        run_dir = working_dir_manager.get_run_directory(run_id)
        
        if not run_dir:
            raise HTTPException(status_code=404, detail="Run not found")
        
        # Read metadata
        metadata_file = os.path.join(run_dir, 'metadata.json')
        if os.path.exists(metadata_file):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
        else:
            metadata = {'run_id': run_id}
        
        # Read summary
        summary_file = os.path.join(run_dir, 'comparison_summary.csv')
        if os.path.exists(summary_file):
            summary_df = pd.read_csv(summary_file)
            summary = summary_df.to_dict('records')[0] if len(summary_df) > 0 else {}
        else:
            summary = {}
        
        return templates.TemplateResponse("comparison_viewer.html", {
            "request": request,
            "run_id": run_id,
            "metadata": metadata,
            "summary": summary
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ========================================
# APPLICATION LIFECYCLE
# ========================================

@app.on_event("startup")
async def startup_event():
    """Initialize enterprise features on startup"""
    print("=" * 60)
    print("🚀 Unique Key Identifier - Enterprise Edition v2.0")
    print("=" * 60)
    
    # Start job scheduler
    job_scheduler.start_scheduler()
    
    # Log startup
    audit_logger.log_event('system_startup', 'Application started', status='success')
    
    print("✅ Enterprise features initialized")
    print("📊 Audit logging: ENABLED")
    print("⏰ Job scheduler: RUNNING")
    print("📧 Notifications: CONFIGURED")
    print("📈 Analytics: ENABLED")
    print("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("\n🛑 Shutting down...")
    
    # Stop job scheduler
    job_scheduler.stop_scheduler()
    
    # Log shutdown
    audit_logger.log_event('system_shutdown', 'Application stopped', status='success')
    
    print("✅ Graceful shutdown complete")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

