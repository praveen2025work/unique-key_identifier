"""
Result File Generator - Creates and manages cached result files
All analysis results are pre-generated and saved for offline access and better performance

Enterprise-grade features:
- Timeout handling for large file operations
- Memory-efficient processing with row limits
- Proper pandas DataFrame handling (no copy warnings)
- File size validation
- Comprehensive error handling and logging
"""
import os
import io
import csv
import pandas as pd
import signal
from datetime import datetime
from contextlib import contextmanager
from config import (
    SCRIPT_DIR, 
    MAX_FILE_GENERATION_ROWS, 
    SKIP_FILE_GENERATION_THRESHOLD,
    MAX_FILE_SIZE_MB,
    FILE_GENERATION_TIMEOUT,
    MAX_COMBINATIONS_TO_GENERATE
)
from database import conn
from file_processing import read_data_file, get_file_stats

# Results cache directory
RESULTS_DIR = os.path.join(SCRIPT_DIR, "results_cache")

# Timeout exception
class TimeoutError(Exception):
    pass

@contextmanager
def time_limit(seconds):
    """
    Cross-platform context manager to add timeout to operations
    Uses signal on Unix/Linux/Mac, threading on Windows
    """
    import platform
    import threading
    
    if platform.system() == 'Windows':
        # Windows doesn't support SIGALRM, use threading instead
        timer = None
        timed_out = [False]
        
        def timeout_handler():
            timed_out[0] = True
        
        timer = threading.Timer(seconds, timeout_handler)
        timer.daemon = True
        timer.start()
        
        try:
            yield
            if timed_out[0]:
                raise TimeoutError(f"Operation timed out after {seconds} seconds")
        finally:
            if timer:
                timer.cancel()
    else:
        # Unix/Linux/Mac - use signal
        def signal_handler(signum, frame):
            raise TimeoutError(f"Operation timed out after {seconds} seconds")
        
        old_handler = signal.signal(signal.SIGALRM, signal_handler)
        signal.alarm(seconds)
        try:
            yield
        finally:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)

def ensure_results_dir():
    """Ensure results cache directory exists"""
    os.makedirs(RESULTS_DIR, exist_ok=True)

def get_run_dir(run_id, working_directory=None):
    """
    Get directory for specific run results
    If working_directory is specified, create results subfolder there
    Otherwise use default results_cache directory
    """
    if working_directory:
        # Use working directory for results
        run_dir = os.path.join(working_directory, f"analysis_results_run_{run_id}")
    else:
        # Use default cache directory
        run_dir = os.path.join(RESULTS_DIR, f"run_{run_id}")
    
    os.makedirs(run_dir, exist_ok=True)
    return run_dir

def save_result_file(run_id, file_type, content, side=None, columns=None, extension='csv', working_directory=None):
    """
    Save a result file and register it in database
    
    Args:
        run_id: Analysis run ID
        file_type: Type of file (analysis_csv, analysis_excel, unique_records, duplicate_records, comparison)
        content: File content (bytes or string)
        side: Side identifier (A or B) if applicable
        columns: Column combination if applicable
        extension: File extension (csv, xlsx)
        working_directory: Custom directory for this run (optional)
    
    Returns:
        file_path: Path to saved file
    """
    ensure_results_dir()
    run_dir = get_run_dir(run_id, working_directory)
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if side and columns:
        cols_safe = columns.replace(',', '_').replace(' ', '')[:50]
        filename = f"{file_type}_side{side}_{cols_safe}_{timestamp}.{extension}"
    elif columns:
        cols_safe = columns.replace(',', '_').replace(' ', '')[:50]
        filename = f"{file_type}_{cols_safe}_{timestamp}.{extension}"
    else:
        filename = f"{file_type}_{timestamp}.{extension}"
    
    file_path = os.path.join(run_dir, filename)
    
    # Write file
    if isinstance(content, bytes):
        with open(file_path, 'wb') as f:
            f.write(content)
    else:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    # Get file size
    file_size = os.path.getsize(file_path)
    
    # Register in database
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO result_files (run_id, file_type, side, columns, file_path, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (run_id, file_type, side, columns, file_path, file_size, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    conn.commit()
    
    return file_path

def generate_analysis_csv(run_id, working_directory=None):
    """Generate CSV file with analysis results"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, num_columns FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        return None
    
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
    
    content = output.getvalue()
    return save_result_file(run_id, 'analysis_csv', content, extension='csv', working_directory=working_directory)

def generate_analysis_excel(run_id, working_directory=None):
    """Generate Excel file with analysis results"""
    cursor = conn.cursor()
    
    # Get run info
    cursor.execute('SELECT file_a, file_b, num_columns, timestamp FROM runs WHERE run_id = ?', (run_id,))
    run_info = cursor.fetchone()
    if not run_info:
        return None
    
    # Get analysis results
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
    
    content = output.getvalue()
    return save_result_file(run_id, 'analysis_excel', content, extension='xlsx', working_directory=working_directory)

def generate_unique_records(run_id, side, columns, file_a_path, file_b_path, working_directory=None):
    """
    Generate unique records file for a specific combination
    Enterprise-grade: With timeout, row limits, and proper error handling
    """
    file_name = file_a_path if side == 'A' else file_b_path
    
    try:
        # Check file size first - skip if too large
        row_count, file_size_mb = get_file_stats(file_name)
        if row_count > SKIP_FILE_GENERATION_THRESHOLD:
            print(f"⚠️  Skipping unique records generation for {side}/{columns}: File has {row_count:,} rows (threshold: {SKIP_FILE_GENERATION_THRESHOLD:,})")
            return None
        
        # Use timeout to prevent hanging
        with time_limit(FILE_GENERATION_TIMEOUT):
            # Load the file with row limit for large files
            max_rows = min(row_count, MAX_FILE_GENERATION_ROWS) if row_count > MAX_FILE_GENERATION_ROWS else None
            df, delimiter = read_data_file(file_name, nrows=max_rows)
            
            # Parse columns
            column_list = [col.strip() for col in columns.split(',')]
            
            # Find unique records
            grouped = df.groupby(column_list, sort=False, observed=True).size()
            unique_combinations = grouped[grouped == 1].index
            
            # Filter dataframe - Use .copy() to avoid SettingWithCopyWarning
            if len(column_list) == 1:
                unique_df = df[df[column_list[0]].isin(unique_combinations)].copy()
            else:
                mask = df.set_index(column_list).index.isin(unique_combinations)
                unique_df = df[mask].copy()
            
            # Check if we have any unique records
            if unique_df.empty:
                print(f"ℹ️  No unique records found for {side}/{columns}")
                return None
            
            unique_df = unique_df.reset_index(drop=True)
            
            # Create CSV and check size
            output = io.StringIO()
            unique_df.to_csv(output, index=False)
            content = output.getvalue()
            
            # Validate size
            size_mb = len(content.encode('utf-8')) / (1024 * 1024)
            if size_mb > MAX_FILE_SIZE_MB:
                print(f"⚠️  Unique records file too large ({size_mb:.1f}MB > {MAX_FILE_SIZE_MB}MB) for {side}/{columns}")
                return None
            
            print(f"✅ Generated unique records for {side}/{columns} ({len(unique_df):,} rows, {size_mb:.1f}MB)")
            return save_result_file(run_id, 'unique_records', content, side=side, columns=columns, extension='csv', working_directory=working_directory)
            
    except TimeoutError as e:
        print(f"⏱️  Timeout generating unique records for {side}/{columns}: {str(e)}")
        return None
    except Exception as e:
        import traceback
        print(f"❌ Error generating unique records for {side}/{columns}: {str(e)}")
        traceback.print_exc()
        return None

def generate_duplicate_records(run_id, side, columns, file_a_path, file_b_path, working_directory=None):
    """
    Generate duplicate records file for a specific combination
    Enterprise-grade: With timeout, row limits, and proper error handling
    """
    file_name = file_a_path if side == 'A' else file_b_path
    
    try:
        # Check file size first - skip if too large
        row_count, file_size_mb = get_file_stats(file_name)
        if row_count > SKIP_FILE_GENERATION_THRESHOLD:
            print(f"⚠️  Skipping duplicate records generation for {side}/{columns}: File has {row_count:,} rows (threshold: {SKIP_FILE_GENERATION_THRESHOLD:,})")
            return None
        
        # Use timeout to prevent hanging
        with time_limit(FILE_GENERATION_TIMEOUT):
            # Load the file with row limit for large files
            max_rows = min(row_count, MAX_FILE_GENERATION_ROWS) if row_count > MAX_FILE_GENERATION_ROWS else None
            df, delimiter = read_data_file(file_name, nrows=max_rows)
            
            # Parse columns
            column_list = [col.strip() for col in columns.split(',')]
            
            # Find duplicate records
            grouped = df.groupby(column_list, sort=False, observed=True).size()
            duplicate_combinations = grouped[grouped > 1].index
            
            # Filter dataframe - FIX: Use .copy() to avoid SettingWithCopyWarning
            if len(column_list) == 1:
                duplicate_df = df[df[column_list[0]].isin(duplicate_combinations)].copy()
            else:
                mask = df.set_index(column_list).index.isin(duplicate_combinations)
                duplicate_df = df[mask].copy()
            
            # Check if we have any duplicates
            if duplicate_df.empty:
                print(f"ℹ️  No duplicates found for {side}/{columns}")
                return None
            
            # Add occurrence count - FIX: Now safe because duplicate_df is an explicit copy
            if len(column_list) == 1:
                duplicate_df.loc[:, 'occurrence_count'] = duplicate_df[column_list[0]].map(grouped)
            else:
                duplicate_df.loc[:, 'occurrence_count'] = duplicate_df.set_index(column_list).index.map(grouped).values
            
            # Sort
            duplicate_df = duplicate_df.sort_values(['occurrence_count'] + column_list, ascending=[False] + [True]*len(column_list))
            duplicate_df = duplicate_df.reset_index(drop=True)
            
            # Check file size before saving
            output = io.StringIO()
            duplicate_df.to_csv(output, index=False)
            content = output.getvalue()
            
            # Validate size
            size_mb = len(content.encode('utf-8')) / (1024 * 1024)
            if size_mb > MAX_FILE_SIZE_MB:
                print(f"⚠️  Duplicate records file too large ({size_mb:.1f}MB > {MAX_FILE_SIZE_MB}MB) for {side}/{columns}")
                return None
            
            print(f"✅ Generated duplicate records for {side}/{columns} ({len(duplicate_df):,} rows, {size_mb:.1f}MB)")
            return save_result_file(run_id, 'duplicate_records', content, side=side, columns=columns, extension='csv', working_directory=working_directory)
            
    except TimeoutError as e:
        print(f"⏱️  Timeout generating duplicate records for {side}/{columns}: {str(e)}")
        return None
    except Exception as e:
        import traceback
        print(f"❌ Error generating duplicate records for {side}/{columns}: {str(e)}")
        traceback.print_exc()
        return None

def generate_comparison_file(run_id, columns, file_a_path, file_b_path, working_directory=None):
    """
    Generate comparison Excel file (matched, only A, only B)
    Enterprise-grade: With timeout, row limits, and proper error handling
    """
    try:
        # Check file sizes first
        row_count_a, size_a = get_file_stats(file_a_path)
        row_count_b, size_b = get_file_stats(file_b_path)
        max_rows = max(row_count_a, row_count_b)
        
        # Skip if files are too large
        if max_rows > SKIP_FILE_GENERATION_THRESHOLD:
            print(f"⚠️  Skipping comparison file for {columns}: Files have {max_rows:,} rows (threshold: {SKIP_FILE_GENERATION_THRESHOLD:,})")
            return None
        
        # Use timeout to prevent hanging
        with time_limit(FILE_GENERATION_TIMEOUT):
            # Load both files with row limits if necessary
            max_rows_limit = min(max_rows, MAX_FILE_GENERATION_ROWS) if max_rows > MAX_FILE_GENERATION_ROWS else None
            df_a, _ = read_data_file(file_a_path, nrows=max_rows_limit)
            df_b, _ = read_data_file(file_b_path, nrows=max_rows_limit)
            
            # Parse columns
            column_list = [col.strip() for col in columns.split(',')]
            
            # Create comparison keys
            df_a['_comparison_key'] = df_a[column_list].apply(lambda x: tuple(x), axis=1)
            df_b['_comparison_key'] = df_b[column_list].apply(lambda x: tuple(x), axis=1)
            
            # Get unique keys
            keys_a = set(df_a['_comparison_key'])
            keys_b = set(df_b['_comparison_key'])
            
            # Calculate intersections
            matched_keys = keys_a & keys_b
            only_a_keys = keys_a - keys_b
            only_b_keys = keys_b - keys_a
            
            # Filter dataframes - Use .copy() to avoid warnings
            df_matched_a = df_a[df_a['_comparison_key'].isin(matched_keys)].copy()
            df_matched_b = df_b[df_b['_comparison_key'].isin(matched_keys)].copy()
            df_only_a = df_a[df_a['_comparison_key'].isin(only_a_keys)].copy()
            df_only_b = df_b[df_b['_comparison_key'].isin(only_b_keys)].copy()
            
            # Remove comparison key
            for df in [df_matched_a, df_matched_b, df_only_a, df_only_b]:
                if '_comparison_key' in df.columns:
                    df.drop('_comparison_key', axis=1, inplace=True)
            
            # Sort
            for df in [df_matched_a, df_matched_b, df_only_a, df_only_b]:
                if not df.empty:
                    df.sort_values(column_list, inplace=True)
                    df.reset_index(drop=True, inplace=True)
            
            # Create Excel file
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
                
                # Write data sheets (limit rows to prevent huge files)
                if not df_matched_a.empty:
                    df_matched_a.head(MAX_FILE_GENERATION_ROWS).to_excel(writer, sheet_name='Matched_SideA', index=False)
                if not df_matched_b.empty:
                    df_matched_b.head(MAX_FILE_GENERATION_ROWS).to_excel(writer, sheet_name='Matched_SideB', index=False)
                if not df_only_a.empty:
                    df_only_a.head(MAX_FILE_GENERATION_ROWS).to_excel(writer, sheet_name='Only_In_SideA', index=False)
                if not df_only_b.empty:
                    df_only_b.head(MAX_FILE_GENERATION_ROWS).to_excel(writer, sheet_name='Only_In_SideB', index=False)
            
            content = output.getvalue()
            
            # Validate size
            size_mb = len(content) / (1024 * 1024)
            if size_mb > MAX_FILE_SIZE_MB:
                print(f"⚠️  Comparison file too large ({size_mb:.1f}MB > {MAX_FILE_SIZE_MB}MB) for {columns}")
                return None
            
            print(f"✅ Generated comparison file for {columns} ({size_mb:.1f}MB)")
            return save_result_file(run_id, 'comparison', content, columns=columns, extension='xlsx', working_directory=working_directory)
            
    except TimeoutError as e:
        print(f"⏱️  Timeout generating comparison file for {columns}: {str(e)}")
        return None
    except Exception as e:
        import traceback
        print(f"❌ Error generating comparison file for {columns}: {str(e)}")
        traceback.print_exc()
        return None

def get_result_file_path(run_id, file_type, side=None, columns=None):
    """Get path to a pre-generated result file"""
    cursor = conn.cursor()
    
    query = 'SELECT file_path FROM result_files WHERE run_id = ? AND file_type = ?'
    params = [run_id, file_type]
    
    if side:
        query += ' AND side = ?'
        params.append(side)
    
    if columns:
        query += ' AND columns = ?'
        params.append(columns)
    
    query += ' ORDER BY created_at DESC LIMIT 1'
    
    cursor.execute(query, params)
    result = cursor.fetchone()
    
    if result and os.path.exists(result[0]):
        return result[0]
    return None

def cleanup_old_runs(days_old=30):
    """Delete result files older than specified days"""
    import time
    from datetime import timedelta
    
    cutoff_time = time.time() - (days_old * 24 * 60 * 60)
    
    for run_dir in os.listdir(RESULTS_DIR):
        run_path = os.path.join(RESULTS_DIR, run_dir)
        if os.path.isdir(run_path):
            if os.path.getmtime(run_path) < cutoff_time:
                import shutil
                shutil.rmtree(run_path)
                print(f"Cleaned up old run: {run_dir}")

